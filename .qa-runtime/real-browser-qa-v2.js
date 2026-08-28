/*
 * DESIGN-021-FIX1 · REAL BROWSER QA OVER http://127.0.0.1 ORIGIN
 *
 * Launch a real Chromium (playwright build) headless via a .cmd wrapper
 * (the sandbox blocks Node child_process stdio pipes, but TCP CDP works,
 * as proven by the debug port being reachable). Connect to the running
 * browser over CDP-over-TCP, navigate to the BQA harness served from
 * http://127.0.0.1:8790, and run window.__OD_RUN_BROWSER_QA() for real.
 *
 * Outputs (in .qa-runtime/):
 *   real-browser-report.json      full __OD_RUN_BROWSER_QA() report
 *   real-browser-consolidated.js  window.__BQA_* hard assertions
 *   real-browser-stderr.log       Edge/Chrome stderr + console evidence
 *   real-browser-qa-390.png       full-panel screenshot @390
 *   real-browser-qa-430.png       full-panel screenshot @430
 *   real-browser-qa-evidence.json aggregate evidence (browser, version, counts)
 */
'use strict';
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const OUT_DIR = __dirname;
const CMD = path.join(OUT_DIR, 'launch-chrome-cdp.cmd');
const CHROME = 'C:/Users/Admin/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const TARGET = 'pasay-mini-app-bqa-390-430.html';
const BASE = 'http://127.0.0.1:8790';
const WS_MODULE = 'C:/Users/Admin/AppData/Roaming/Open Design/launcher/channels/stable/namespaces/release-stable-win/versions/0.21.0/payload/resources/app/node_modules/ws';
const WebSocket = require(WS_MODULE);
const VIEWPORTS = [390, 430];

function log(m) { console.log('[REAL-BQA] ' + m); }

function fetchJson(url, timeoutMs) {
  return new Promise(function (resolve, reject) {
    const req = http.get(url, { timeout: timeoutMs || 1200 }, function (res) {
      let d = '';
      res.on('data', function (c) { d += c; });
      res.on('end', function () {
        try { resolve(JSON.parse(d)); } catch (e) { reject(new Error('bad json: ' + d.substring(0, 120))); }
      });
    });
    req.on('error', reject);
    req.on('timeout', function () { req.destroy(new Error('timeout')); });
  });
}

function pollDebugPort(port, timeoutMs) {
  return new Promise(function (resolve) {
    const start = Date.now();
    (function attempt() {
      fetchJson('http://127.0.0.1:' + port + '/json/version', 900).then(resolve, function () {
        if (Date.now() - start > timeoutMs) { resolve(null); return; }
        setTimeout(attempt, 120);
      });
    })();
  });
}

async function collect(port, i) {
  const list = await fetchJson('http://127.0.0.1:' + port + '/json/list');
  return list.find(function (t) { return t.type === 'page'; });
}

async function runViewport(port, vw) {
  const ws = new WebSocket('ws://127.0.0.1:' + port + '/devtools/page/' + (await collect(port, 'n/a')).id, { perMessageDeflate: false, maxPayload: 256 * 1024 * 1024 });
  let nextId = 1;
  const pending = new Map();
  const events = [];
  const consoleLogs = [];
  const pageErrors = [];
  ws.on('message', function (raw) {
    let msg;
    try { msg = JSON.parse(raw.toString('utf8')); } catch (e) { return; }
    if (typeof msg.id === 'number' && pending.has(msg.id)) {
      const p = pending.get(msg.id); pending.delete(msg.id);
      if (msg.error) p.reject(new Error('CDP error: ' + JSON.stringify(msg.error)));
      else p.resolve(msg.result);
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      if (msg.params && msg.params.type === 'error') {
        const args = (msg.params.args || []).map(function (a) { return a.value || a.description || ''; }).join(' ');
        consoleLogs.push('[console.error] ' + args);
      }
    } else if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params && msg.params.exceptionDetails;
      if (d) pageErrors.push('[exception] ' + (d.text || '') + ' ' + (d.exception ? (d.exception.description || '') : ''));
    }
  });
  await new Promise(function (resolve, reject) { ws.once('open', resolve); ws.once('error', reject); setTimeout(function () { reject(new Error('ws open timeout')); }, 5000); });

  function send(method, params) {
    const id = nextId++;
    const p = new Promise(function (resolve, reject) { pending.set(id, { resolve: resolve, reject: reject }); });
    ws.send(JSON.stringify({ id: id, method: method, params: params || {} }));
    return p;
  }

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: vw, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: BASE + '/' + TARGET });
  /* Wait for the harness panel to finish mounting (its summary line flips
     away from "running…") */
  await new Promise(function (r) { setTimeout(r, 12000); });
  const status = await send('Runtime.evaluate', {
    expression: '({ hasRunner: typeof window.__OD_RUN_BROWSER_QA === "function", sum: (document.getElementById("__bqa_sum")||{textContent:""}).textContent, allpass: window.__BQA_ALLPASS, total: window.__BQA_TOTAL, pass: window.__BQA_PASS, hardAssert: window.__BQA_HARD_ASSERT, pageCount: window.__BQA_PAGE_COUNT, verify: window.__BQA_VERIFY || null })',
    returnByValue: true, awaitPromise: false
  });

  let safe = (status && status.result && status.result.value) ? status.result.value : null;
  /* Also grab the report itself */
  const repEval = await send('Runtime.evaluate', { expression: 'window.__OD_RUN_BROWSER_QA ? window.__OD_RUN_BROWSER_QA() : null', returnByValue: true, awaitPromise: false });
  let report = (repEval && repEval.result && repEval.result.value) || null;

  /* Screenshot (full panel) */
  let png = null;
  try {
    const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
    if (shot && shot.data) png = Buffer.from(shot.data, 'base64');
  } catch (e) { log('screenshot failed @' + vw + ': ' + e.message); }
  try { ws.close(); } catch (e) {}

  return { viewport: vw, status: safe, report: report, png: png, consoleLogs: consoleLogs, pageErrors: pageErrors };
}

async function main() {
  const port = 9400;
  fs.rmSync(path.join(OUT_DIR, 'real-browser-prof'), { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT_DIR, 'real-browser-prof'), { recursive: true });

  log('Launching Chrome headless on port ' + port);
  const errFile = path.join(OUT_DIR, 'real-browser-stderr.log');
  fs.rmSync(errFile, { force: true });
  const r = spawnSync('cmd', ['/c', path.join(OUT_DIR, 'launch-chrome-cdp.cmd'), 'about:blank', path.join(OUT_DIR, 'real-browser-prof'), String(port), '430', '900'], { encoding: 'utf8' });
  log('launch cmd exit=' + r.status + ' stdout=' + r.stdout.trim() + ' stderr=' + r.stderr.trim());

  const ver = await pollDebugPort(port, 15000);
  if (!ver) {
    log('DEBUG PORT NEVER CAME UP on ' + port);
    fs.writeFileSync(errFile, (r.stdout || '') + '\n' + (r.stderr || ''));
    process.exit(2);
  }
  log('Browser = ' + ver.Browser + ' ' + (ver['Protocol-Version'] || ''));

  const evidence = { browser: ver.Browser, version: ver['Browser-Version'] ? ver['Browser-Version'].split(' (')[0] : '', protocol: ver['Protocol-Version'], origin: BASE, target: TARGET, viewports: {}, allPass: true, timestamp: new Date().toISOString() };

  for (const vw of VIEWPORTS) {
    log('== viewport ' + vw + ' ==');
    let out;
    try { out = await runViewport(port, vw); }
    catch (e) {
      log('runViewport(' + vw + ') FAILED: ' + e.message);
      evidence.viewports[String(vw)] = { error: e.message };
      evidence.allPass = false;
      continue;
    }
    evidence.viewports[String(vw)] = {
      status: out.status,
      reportTotal: out.report ? out.report.summary.total : null,
      reportPass: out.report ? out.report.summary.pass : null,
      allPass: out.report ? out.report.allPass : false,
      hardAssertAllpass: out.status ? out.status.allpass : null,
      hardAssertTotal: out.status ? out.status.total : null,
      hardAssertPass: out.status ? out.status.pass : null,
      hardAssertPageCount: out.status ? out.status.pageCount : null,
      hardAssertVerify: out.status ? out.status.verify : null,
      consoleErrors: out.consoleLogs,
      pageExceptions: out.pageErrors
    };
    if (!out.report || !out.report.allPass || (out.status && out.status.allpass !== true)) {
      evidence.viewports[String(vw)].ok = false;
      evidence.allPass = false;
    } else {
      evidence.viewports[String(vw)].ok = true;
    }
    if (out.report) {
      fs.writeFileSync(path.join(OUT_DIR, 'real-browser-report-' + vw + '.json'), JSON.stringify(out.report, null, 2));
      log('wrote real-browser-report-' + vw + '.json');
    }
    if (out.png) {
      fs.writeFileSync(path.join(OUT_DIR, 'real-browser-qa-' + vw + '.png'), out.png);
      log('wrote real-browser-qa-' + vw + '.png (' + out.png.length + ' bytes)');
    }
    fs.appendFileSync(errFile, '\n--- vw=' + vw + ' console ---\n' + (out.consoleLogs || []).join('\n') + '\n--- page exceptions ---\n' + (out.pageErrors || []).join('\n') + '\n');
  }

  evidence.rows390 = evidence.viewports['390'] && evidence.viewports['390'].reportTotal;
  evidence.rows430 = evidence.viewports['430'] && evidence.viewports['430'].reportTotal;
  fs.writeFileSync(path.join(OUT_DIR, 'real-browser-qa-evidence.json'), JSON.stringify(evidence, null, 2));
  log('wrote real-browser-qa-evidence.json');
  log('final allPass=' + evidence.allPass);
  process.exit(evidence.allPass ? 0 : 1);
}

main().catch(function (e) { log('main threw: ' + e.stack); process.exit(2); });
/*
 * DESIGN-013 · BROWSER-QA-UNBLOCK
 * Real Windows Edge headless Browser QA at 390px and 430px.
 *
 * Path: launch Microsoft Edge --headless --remote-debugging-port=<p>; poll
 * http://127.0.0.1:<p>/json/version at 50 ms intervals (the debug listener is up
 * for ~5 s before Mojo/crashpad-init failures terminate Edge); once responding,
 * open a CDP target, navigate to pasay-mini-app.html, call the production
 * window.__OD_RUN_BROWSER_QA() and persist the auditable report.
 *
 * Output:
 *   .qa-runtime/edge-qa-390.json
 *   .qa-runtime/edge-qa-430.json
 *   .qa-runtime/edge-qa-summary.json
 *
 * Exit code:
 *   0 = all pages PASS at both viewports
 *   1 = at least one page FAIL
 *   2 = setup / launch error
 */
'use strict';
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const WebSocket = require('C:/Users/Admin/AppData/Roaming/Open Design/launcher/channels/stable/namespaces/release-stable-win/versions/0.21.0/payload/resources/app/node_modules/ws');

const WORKSPACE = path.resolve(__dirname, '..');
const TARGET_HTML = path.join(WORKSPACE, 'pasay-mini-app.html');
const OUT_DIR = __dirname;
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const VIEWPORTS = [390, 430];

function log(msg) { console.log('[edge-qa] ' + msg); }

async function pollDebugPort(port, timeoutMs = 6000) {
  const start = Date.now();
  let attempts = 0;
  while (Date.now() - start < timeoutMs) {
    attempts++;
    try {
      const r = await fetch('http://127.0.0.1:' + port + '/json/version');
      if (r.ok) { const j = await r.json(); log('Debug port ' + port + ' responded after ' + attempts + ' attempts (' + (Date.now()-start) + ' ms)'); return j; }
    } catch (_) { /* not ready */ }
    await new Promise(r => setTimeout(r, 50));
  }
  log('Debug port ' + port + ' did NOT respond after ' + attempts + ' attempts (' + timeoutMs + ' ms)');
  return null;
}

async function runForViewport(vw) {
  const port = 9500 + (vw === 430 ? 1 : 0);
  const userDataDir = path.join(OUT_DIR, 'edge-prof-' + vw);
  fs.rmSync(userDataDir, { recursive: true, force: true });
  fs.mkdirSync(userDataDir, { recursive: true });

  const args = [
    '--headless',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--no-first-run',
    '--no-default-browser-check',
    '--mute-audio',
    '--hide-scrollbars',
    '--disable-dev-shm-usage',
    '--disable-background-networking',
    '--disable-extensions',
    '--disable-component-update',
    '--disable-default-apps',
    '--disable-breakpad',
    '--disable-crash-reporter',
    '--disable-features=Crashpad,MojoIpcz,ImprovedGuestManagedIph',
    '--user-data-dir=' + userDataDir,
    '--window-size=' + vw + ',1000',
    '--remote-debugging-port=' + port,
    '--remote-allow-origins=*'
  ];
  log('Launching Edge on port ' + port + ' (' + EDGE + ') ...');
  log('args: ' + args.join(' '));
  const child = spawn(EDGE, args, { stdio: 'ignore', windowsHide: true });
  child.on('error', function (e) { log('spawn error: ' + e.message); });
  log('Child PID: ' + child.pid);

  /* Poll for debug port */
  const ver = await pollDebugPort(port, 6000);
  if (!ver) {
    try { spawnSync('taskkill', ['/pid', String(child.pid), '/f', '/t']); } catch (_) {}
    throw new Error('Edge debug port did not come up on ' + port);
  }
  const wsUrl = ver.webSocketDebuggerUrl;
  log('WS URL: ' + wsUrl + ' (browser=' + (ver.Browser || '?') + ')');

  const ws = new WebSocket(wsUrl, { perMessageDeflate: false, maxPayload: 256 * 1024 * 1024 });
  let nextId = 1;
  const pending = new Map();
  const events = [];
  ws.on('message', function (raw) {
    let msg;
    try { msg = JSON.parse(raw.toString('utf8')); } catch (e) { return; }
    if (typeof msg.id === 'number' && pending.has(msg.id)) {
      const p = pending.get(msg.id); pending.delete(msg.id);
      if (msg.error) p.reject(new Error('CDP error: ' + JSON.stringify(msg.error)));
      else p.resolve(msg.result);
    } else if (msg.method) {
      events.push(msg);
    }
  });
  await new Promise(function (resolve, reject) {
    ws.once('open', resolve);
    ws.once('error', reject);
    setTimeout(function () { reject(new Error('WS open timeout')); }, 5000);
  });
  log('WS connected. Events queued: ' + events.length);

  function send(method, params) {
    const id = nextId++;
    const p = new Promise(function (resolve, reject) { pending.set(id, { resolve: resolve, reject: reject }); });
    ws.send(JSON.stringify({ id: id, method: method, params: params || {} }));
    return p;
  }

  /* Create new target */
  const t1 = Date.now();
  const tgt = await send('Target.createTarget', { url: 'about:blank' });
  const targetId = tgt.targetId;
  const att = await send('Target.attachToTarget', { targetId: targetId, flatten: true });
  const sessionId = att.sessionId;
  log('Target ' + targetId + ' attached session=' + sessionId);

  function sendS(method, params) {
    const id = nextId++;
    const p = new Promise(function (resolve, reject) { pending.set(id, { resolve: resolve, reject: reject }); });
    ws.send(JSON.stringify({ sessionId: sessionId, id: id, method: method, params: params || {} }));
    return p;
  }

  await sendS('Page.enable');
  await sendS('Runtime.enable');
  await sendS('Network.enable');
  await sendS('Emulation.setDeviceMetricsOverride', {
    width: vw, height: 1000, deviceScaleFactor: 1, mobile: false
  });

  /* Navigate to file:// */
  const fileUri = 'file:///' + TARGET_HTML.replace(/\\/g, '/');
  log('Navigate to ' + fileUri);
  await sendS('Page.navigate', { url: fileUri });

  /* Wait for load + rAF cycles */
  log('Wait 9s for page load + rAF + QA');
  await new Promise(function (r) { setTimeout(r, 9000); });

  /* Execute the production QA */
  const evalR = await sendS('Runtime.evaluate', {
    expression: 'window.__OD_RUN_BROWSER_QA && window.__OD_RUN_BROWSER_QA()',
    returnByValue: true,
    awaitPromise: false,
    timeout: 30000
  });
  let report = null;
  if (evalR && evalR.result) {
    if (evalR.result.value) report = evalR.result.value;
    else if (evalR.result.exceptionDetails) log('QA eval exception: ' + JSON.stringify(evalR.result.exceptionDetails));
  }
  if (!report) {
    /* Fallback: stringify the global */
    const str = await sendS('Runtime.evaluate', {
      expression: 'JSON.stringify({hasQA: typeof window.__OD_RUN_BROWSER_QA, qaPanel: document.getElementById("__qa_sum") ? document.getElementById("__qa_sum").textContent : null, appHTMLLen: document.getElementById("app") ? document.getElementById("app").innerHTML.length : 0, scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, rows: document.querySelectorAll("#__qa_tb tr").length, allPass: window.__QA_ALLPASS, pass: window.__QA_PASS, total: window.__QA_TOTAL })',
      returnByValue: true
    });
    log('QA not callable; fallback snapshot: ' + (str && str.result && str.result.value));
  }

  try { await send('Target.closeTarget', { targetId: targetId }); } catch (_) {}
  try { ws.close(); } catch (_) {}
  try { spawnSync('taskkill', ['/pid', String(child.pid), '/f', '/t']); } catch (_) {}
  log('Done vw=' + vw + ' in ' + (Date.now() - t1) + 'ms');
  return report;
}

async function main() {
  if (!fs.existsSync(EDGE)) {
    log('Edge not found at ' + EDGE);
    process.exit(2);
  }
  const summary = { viewports: {}, allPass: true, targetFile: TARGET_HTML, browser: 'Microsoft Edge', browserVersion: '153.0.4234.6' };
  for (const vw of VIEWPORTS) {
    let report;
    try { report = await runForViewport(vw); }
    catch (e) { log('vw=' + vw + ' FAILED: ' + e.message); summary.viewports[vw] = { error: e.message }; summary.allPass = false; continue; }
    if (!report) { summary.viewports[vw] = { error: 'no report' }; summary.allPass = false; continue; }
    const file = path.join(OUT_DIR, 'edge-qa-' + vw + '.json');
    fs.writeFileSync(file, JSON.stringify(report, null, 2));
    log('Wrote ' + file);
    const entries = (report && report.viewports && report.viewports[String(vw)]) || [];
    const pass = entries.filter(function (e) { return e.ok; }).length;
    const total = entries.length;
    summary.viewports[vw] = { total: total, pass: pass, fail: total - pass, allPass: pass === total && total > 0 };
    log('Viewport ' + vw + 'px: ' + pass + '/' + total + ' PASS');
    if (!summary.viewports[vw].allPass) {
      summary.allPass = false;
      entries.filter(function (e) { return !e.ok; }).forEach(function (e) {
        log('  FAIL ' + e.page + ': leaks=' + JSON.stringify(e.leaks || []) + ' docOverflow=' + !!e.docOverflow + ' appOverflow=' + !!e.appOverflow + ' rectIssues=' + (e.rectIssues || []).length + ' overlap=' + e.overlap + ' primaryAction=' + !!e.primaryAction + ' bottomNavUsable=' + !!e.bottomNavUsable + (e.error ? ' error=' + e.error : ''));
      });
    }
  }
  summary.timestamp = new Date().toISOString();
  const sumFile = path.join(OUT_DIR, 'edge-qa-summary.json');
  fs.writeFileSync(sumFile, JSON.stringify(summary, null, 2));
  log('Wrote ' + sumFile);
  log('allPass=' + summary.allPass);
  process.exit(summary.allPass ? 0 : 1);
}

main().catch(function (e) { log('main threw: ' + e.message + '\n' + e.stack); process.exit(2); });
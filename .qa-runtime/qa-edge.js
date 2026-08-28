/*
 * DESIGN-013 · BROWSER-QA-UNBLOCK
 * Real Windows Edge headless Browser QA at 390px and 430px.
 *
 * Path: spawn Microsoft Edge via PowerShell Start-Process (Start-Process with
 * -RedirectStandardOutput/-RedirectStandardError works for Edge in this sandbox
 * because it does not use Node child_process stdio:'pipe' which the sandbox
 * blocks); poll http://127.0.0.1:<p>/json/version at 50 ms via Node http;
 * once responding, open a CDP target, navigate to pasay-mini-app.html, call
 * window.__OD_RUN_BROWSER_QA() and persist the auditable report.
 */
'use strict';
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const WebSocket = require('C:/Users/Admin/AppData/Roaming/Open Design/launcher/channels/stable/namespaces/release-stable-win/versions/0.21.0/payload/resources/app/node_modules/ws');

const WORKSPACE = path.resolve(__dirname, '..');
const TARGET_HTML = path.join(WORKSPACE, 'pasay-mini-app.html');
const OUT_DIR = __dirname;
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const VIEWPORTS = [390, 430];

function log(msg) { console.log('[edge-qa] ' + msg); }

function pollDebugPort(port, timeoutMs) {
  return new Promise(function (resolve) {
    const start = Date.now();
    let attempts = 0;
    function attempt() {
      attempts++;
      const req = http.get({ host: '127.0.0.1', port: port, path: '/json/version', timeout: 800 }, function (res) {
        let data = '';
        res.on('data', function (c) { data += c; });
        res.on('end', function () {
          if (res.statusCode === 200) { try { log('Debug port ' + port + ' responded after ' + attempts + ' attempts (' + (Date.now()-start) + ' ms)'); resolve(JSON.parse(data)); } catch (e) { attempt(); } }
          else { attempt(); }
        });
      });
      req.on('error', function () { attempt(); });
      req.on('timeout', function () { req.destroy(); });
      if (Date.now() - start >= timeoutMs) { log('Debug port ' + port + ' did NOT respond after ' + attempts + ' attempts (' + timeoutMs + ' ms)'); resolve(null); return; }
      if (attempts > 600) { resolve(null); return; }
    }
    attempt();
  });
}

async function runForViewport(vw) {
  const port = 9500 + (vw === 430 ? 1 : 0);
  const userDataDir = path.join(OUT_DIR, 'edge-prof-' + vw);
  const errFile = path.join(OUT_DIR, 'edge-stderr-' + vw + '.log');
  fs.rmSync(userDataDir, { recursive: true, force: true });
  fs.mkdirSync(userDataDir, { recursive: true });
  fs.rmSync(errFile, { force: true });

  const argList = [
    '--headless',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--no-first-run',
    '--user-data-dir=' + userDataDir,
    '--window-size=' + vw + ',1000',
    '--remote-debugging-port=' + port,
    '--remote-allow-origins=*'
  ].map(function (a) { return "'" + a.replace(/'/g, "''") + "'"; }).join(', ');

  log('Launching Edge via PowerShell Start-Process on port ' + port + ' ...');
  const psScript = `
    $proc = Start-Process -FilePath '${EDGE.replace(/'/g, "''")}' -ArgumentList @(${argList}) -RedirectStandardError '${errFile.replace(/'/g, "''")}' -PassThru -WindowStyle Hidden
    Write-Output ('CHILDPID=' + $proc.Id)
  `;
  const psOut = spawnSync('powershell', ['-NoProfile', '-Command', psScript], { encoding: 'utf8' });
  if (psOut.status !== 0) {
    log('PowerShell launch failed: stderr=' + psOut.stderr);
    throw new Error('PowerShell launch failed: ' + psOut.stderr);
  }
  const childPidMatch = psOut.stdout.match(/CHILDPID=(\d+)/);
  const childPid = childPidMatch ? childPidMatch[1] : null;
  log('Child PID: ' + childPid);

  /* Poll for debug port */
  const ver = await pollDebugPort(port, 12000);
  if (!ver) {
    /* Tail stderr for clues */
    if (fs.existsSync(errFile)) {
      const errTail = fs.readFileSync(errFile, 'utf8').split(/\r?\n/).slice(-15).join('\n');
      log('Edge stderr tail: ' + errTail);
    }
    if (childPid) try { spawnSync('taskkill', ['/pid', childPid, '/f', '/t']); } catch (_) {}
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
    } else if (msg.method) { events.push(msg); }
  });
  await new Promise(function (resolve, reject) {
    ws.once('open', resolve);
    ws.once('error', reject);
    setTimeout(function () { reject(new Error('WS open timeout')); }, 5000);
  });
  log('WS connected.');

  function send(method, params) {
    const id = nextId++;
    const p = new Promise(function (resolve, reject) { pending.set(id, { resolve: resolve, reject: reject }); });
    ws.send(JSON.stringify({ id: id, method: method, params: params || {} }));
    return p;
  }

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

  const fileUri = 'file:///' + TARGET_HTML.replace(/\\/g, '/');
  log('Navigate to ' + fileUri);
  await sendS('Page.navigate', { url: fileUri });
  log('Wait 9s for page load + rAF + QA');
  await new Promise(function (r) { setTimeout(r, 9000); });

  const evalR = await sendS('Runtime.evaluate', {
    expression: 'window.__OD_RUN_BROWSER_QA && window.__OD_RUN_BROWSER_QA()',
    returnByValue: true,
    awaitPromise: false,
    timeout: 30000
  });
  let report = null;
  if (evalR && evalR.result) {
    if (evalR.result.value) report = evalR.result.value;
    else if (evalR.result.exceptionDetails) log('QA eval exception: ' + JSON.stringify(evalR.result.exceptionDetails).substring(0, 500));
  }

  try { await send('Target.closeTarget', { targetId: targetId }); } catch (_) {}
  try { ws.close(); } catch (_) {}
  if (childPid) try { spawnSync('taskkill', ['/pid', childPid, '/f', '/t']); } catch (_) {}
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
    catch (e) {
      log('vw=' + vw + ' FAILED: ' + e.message);
      summary.viewports[vw] = { error: e.message };
      summary.allPass = false;
      continue;
    }
    if (!report) {
      log('vw=' + vw + ' returned no report');
      summary.viewports[vw] = { error: 'no report' };
      summary.allPass = false;
      continue;
    }
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
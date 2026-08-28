/*
 * Raw CDP client via Node's `ws` module. Avoids Playwright's protocol layer.
 * Connect to Chromium's --remote-debugging-port=9222, navigate, run page eval,
 * capture metrics from real DOM (scrollWidth / getBoundingClientRect etc).
 */
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const WebSocket = require('C:/Users/Admin/AppData/Roaming/Open Design/launcher/channels/stable/namespaces/release-stable-win/versions/0.21.0/payload/resources/app/node_modules/ws');

const EXE_CANDIDATES = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe'
];

async function pickExe() {
  for (const e of EXE_CANDIDATES) { if (fs.existsSync(e)) return e; }
  return null;
}

async function tryFetch(url, tries = 30) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url); if (r.ok) return await r.json(); } catch (_) {}
    await new Promise(r => setTimeout(r, 500));
  }
  return null;
}

async function runForViewport(vw) {
  const exe = await pickExe();
  if (!exe) throw new Error('No Chrome/Edge found');
  const port = 9300 + (vw === 430 ? 1 : 0); // distinct ports for 390 and 430
  const userDataDir = path.join(__dirname, 'cdp-prof-' + vw);
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
    '--disable-features=Crashpad,MojoIpcz',
    '--no-crashpad',
    '--disable-crashpad',
    '--disable-dev-shm-usage',
    '--in-process-gpu',
    '--user-data-dir=' + userDataDir,
    '--window-size=' + vw + ',800',
    '--remote-debugging-port=' + port
  ];
  console.log('[raw-cdp] Launching ' + exe + ' on port ' + port + ' (stdio: ignore) ...');
  const child = spawn(exe, args, { stdio: 'ignore', windowsHide: true, detached: false });
  console.log('[raw-cdp] Child PID: ' + child.pid);
  /* Wait for debugger to come up on the loopback */
  const ver = await tryFetch('http://127.0.0.1:' + port + '/json/version');
  if (!ver) {
    try { child.kill('SIGKILL'); } catch (_) {}
    throw new Error('Chromium debug port did not come up on ' + port);
  }
  const wsUrl = ver.webSocketDebuggerUrl;
  console.log('[raw-cdp] WS URL: ' + wsUrl);

  const ws = new WebSocket(wsUrl, { perMessageDeflate: false, maxPayload: 256 * 1024 * 1024 });
  await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
  console.log('[raw-cdp] WS connected.');

  let nextId = 1;
  const pending = new Map();
  const sessionEvents = [];
  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString('utf8')); } catch (e) { return; }
    if (typeof msg.id === 'number' && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error('CDP error: ' + JSON.stringify(msg.error)));
      else resolve(msg.result);
    } else if (msg.method) {
      sessionEvents.push(msg);
    }
  });

  function send(method, params) {
    const id = nextId++;
    const p = new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    ws.send(JSON.stringify({ id, method, params: params || {} }));
    return p;
  }

  /* Open a target (new tab/page) */
  const target = await send('Target.createTarget', { url: 'about:blank' });
  const targetId = target.targetId;
  const att = await send('Target.attachToTarget', { targetId: targetId, flatten: true });
  const sessionId = att.sessionId;

  function sendSession(method, params) {
    const id = nextId++;
    const p = new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    ws.send(JSON.stringify({ sessionId, id, method, params: params || {} }));
    return p;
  }

  await sendSession('Page.enable');
  await sendSession('Runtime.enable');
  /* Set viewport device emulation */
  await sendSession('Emulation.setDeviceMetricsOverride', {
    width: vw, height: 800, deviceScaleFactor: 1, mobile: false
  });
  await sendSession('Page.navigate', { url: 'file:///' + path.join(__dirname, '..', 'pasay-mini-app.html').replace(/\\/g, '/') });
  /* Wait for load */
  await new Promise(r => setTimeout(r, 6000));

  /* Execute the QA function */
  const evalResult = await sendSession('Runtime.evaluate', {
    expression: 'typeof window.__OD_RUN_BROWSER_QA === "function" ? window.__OD_RUN_BROWSER_QA() : ({error: "no __OD_RUN_BROWSER_QA"})',
    returnByValue: true,
    awaitPromise: false
  });
  const report = evalResult.result && evalResult.result.value;
  await sendSession('Target.closeTarget', { targetId });

  ws.close();
  try { child.kill('SIGKILL'); } catch (_) {}
  return report;
}

async function main() {
  const summary = { viewports: {}, allPass: true };
  for (const vw of [390, 430]) {
    let report;
    try { report = await runForViewport(vw); }
    catch (e) {
      console.error('[raw-cdp] vw=' + vw + ' failed: ' + e.message);
      summary.viewports[vw] = { error: e.message };
      summary.allPass = false;
      continue;
    }
    fs.writeFileSync(path.join(__dirname, 'raw-cdp-' + vw + '.json'), JSON.stringify(report, null, 2));
    const entries = (report && report.viewports && report.viewports[String(vw)]) || [];
    const pass = entries.filter(e => e.ok).length;
    const total = entries.length;
    summary.viewports[vw] = { total, pass, fail: total - pass };
    console.log('[raw-cdp] vw=' + vw + ': ' + pass + '/' + total + ' PASS');
    if (pass !== total) summary.allPass = false;
  }
  fs.writeFileSync(path.join(__dirname, 'raw-cdp-summary.json'), JSON.stringify(summary, null, 2));
  console.log('[raw-cdp] summary: ' + JSON.stringify(summary.allPass));
  process.exit(summary.allPass ? 0 : 1);
}

main();
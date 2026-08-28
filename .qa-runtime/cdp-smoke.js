'use strict';
/* Minimal CDP smoke test: spawn Chromium headless over TCP, connect via CDP,
   navigate to the served app, confirm __OD_RUN_BROWSER_QA is a function and #app exists. */
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const WORKSPACE = path.resolve(__dirname, '..');
const OUT_DIR = __dirname;

const EXE_CANDIDATES = [
  'C:/Users/Admin/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  'C:/Users/Admin/AppData/Local/ms-playwright/chromium-1208/chrome-win64/chrome.exe'
];
let exe = null;
for (const c of EXE_CANDIDATES) if (fs.existsSync(c)) { exe = c; break; }
if (!exe) { console.error('NO EXE'); process.exit(3); }

/* playwright-core from the CLI package */
const PW_CORE = 'C:/Users/Admin/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core';
let core;
try { core = require(PW_CORE); } catch (e) { console.error('NO PW CORE: ' + e.message); process.exit(3); }
const chromium = core.chromium;

const PORT = 9333;
const userDataDir = path.join(OUT_DIR, 'cdp-smoke-prof');
fs.mkdirSync(userDataDir, { recursive: true });

async function main() {
  const args = [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
    '--no-default-browser-check', '--disable-extensions', '--disable-background-networking',
    '--disable-dev-shm-usage', '--hide-scrollbars', '--mute-audio',
    '--window-size=430,800',
    '--user-data-dir=' + userDataDir,
    '--remote-debugging-port=' + PORT
  ];
  console.log('[smoke] spawning: ' + exe);
  const child = spawn(exe, args, { stdio: 'ignore', windowsHide: true });
  console.log('[smoke] CHILDPID=' + child.pid);

  let wsUrl = null;
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const resp = await fetch('http://127.0.0.1:' + PORT + '/json/version');
      if (resp.ok) { const j = await resp.json(); wsUrl = j.webSocketDebuggerUrl; break; }
    } catch (_) {}
  }
  if (!wsUrl) { console.error('[smoke] NO DEBUGGER'); try { child.kill('SIGTERM'); } catch(_){} process.exit(4); }

  const browser = await chromium.connectOverCDP(wsUrl);
  const ctx = await browser.newContext({ viewport: { width: 430, height: 800 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGE:' + (e.message||e)));
  page.on('console', m => { if (m.type()==='error') errors.push('CONSOLE:' + m.text()); });

  await page.goto('http://127.0.0.1:8790/pasay-mini-app.html', { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(e => { errors.push('GOTO:' + e.message); });

  await page.waitForFunction(() => typeof window.__OD_RUN_BROWSER_QA === 'function' && !!document.getElementById('app'), null, { timeout: 60000 }).catch(() => {
    const why = page.evaluate(() => JSON.stringify({
      hasQA: typeof window.__OD_RUN_BROWSER_QA,
      hasApp: !!document.getElementById('app'),
      title: document.title,
      href: location.href,
      bodySnippet: (document.body ? document.body.innerHTML.slice(0,200) : 'no body')
    }));
    why.then(s => errors.push('WAITFAIL body: ' + s));
  });

  const info = await page.evaluate(() => JSON.stringify({
    href: location.href,
    title: document.title,
    hasQA: typeof window.__OD_RUN_BROWSER_QA,
    hasApp: !!document.getElementById('app'),
    qaPages: (window.__OD_RUN_BROWSER_QA && typeof window.__OD_RUN_BROWSER_QA === 'function')
      ? (window.__OD_RUN_BROWSER_QA() && window.__OD_RUN_BROWSER_QA().pages ? window.__OD_RUN_BROWSER_QA().pages.length : (window.__OD_RUN_BROWSER_QA() && window.__OD_RUN_BROWSER_QA().viewports ? Object.keys(window.__OD_RUN_BROWSER_QA().viewports) : 'n/a')) : 'n/a'
  })).catch(e => 'EVAL_ERR:' + e.message);

  console.log('[smoke] INFO=' + info);
  console.log('[smoke] ERRORS=' + JSON.stringify(errors));
  await browser.close().catch(()=>{});
  try { child.kill('SIGTERM'); } catch(_){}
  process.exit(0);
}
main().catch(e => { console.error('[smoke] FATAL ' + e.message); process.exit(5); });
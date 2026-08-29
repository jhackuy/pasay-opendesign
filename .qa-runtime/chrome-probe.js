'use strict';
/* Feasibility probe v2: manual-spawn Chrome over TCP CDP with crashpad disabled,
   then connect via playwright-core connectOverCDP (TCP WS, not named pipe). */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('C:/Users/Admin/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9341;
const OUT = __dirname;
const ud = path.join(OUT, 'probe-prof');

(async function () {
  if (!fs.existsSync(CHROME)) { console.log('[probe] no chrome at ' + CHROME); process.exit(3); }
  const args = [
    '--headless=new','--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-first-run',
    '--mute-audio','--hide-scrollbars','--disable-dev-shm-usage','--disable-background-networking',
    '--disable-extensions','--disable-component-update','--disable-breakpad','--no-default-browser-check',
    '--disable-features=Crashpad',
    '--window-size=390,900','--user-data-dir='+ud,'--remote-debugging-port='+PORT
  ];
  const child = spawn(CHROME, args, { stdio: 'ignore', windowsHide: true });
  console.log('[probe] PID=' + child.pid);
  let wsUrl = null;
  for (let i=0;i<30;i++){ await new Promise(r=>setTimeout(r,500)); try { const r=await fetch('http://127.0.0.1:'+PORT+'/json/version'); if(r.ok){ const j=await r.json(); wsUrl=j.webSocketDebuggerUrl; break; } } catch(_){} }
  if (!wsUrl){ console.log('[probe] NO_DEBUGGER'); try{child.kill('SIGTERM');}catch(_){} process.exit(4); }
  console.log('[probe] WS=' + wsUrl);
  try {
    const browser = await chromium.connectOverCDP(wsUrl);
    console.log('[probe] CONNECT_OK ' + browser.version());
    const ctx = await browser.newContext({ viewport:{width:390,height:900}, deviceScaleFactor:1, isMobile:false });
    const page = await ctx.newPage();
    await page.goto('about:blank');
    console.log('[probe] NAV_OK');
    await ctx.close(); await browser.close();
    console.log('[probe] DONE');
    process.exit(0);
  } catch(e) {
    console.log('[probe] CONNECT_FAIL ' + (e&&e.message||e));
    try{child.kill('SIGTERM');}catch(_){}
    process.exit(5);
  }
})().catch(e=>{ console.log('[probe] FATAL '+(e&&e.message||e)); process.exit(6); });
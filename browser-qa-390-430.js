/* Real-browser 390/430 QA (BLOCKER 3) — spawns chromium with stdio:ignore + CDP websocket,
   so it works under the sandbox (piped-stdio spawn is blocked; ignore-stdio spawn is allowed). */
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');
const PW = require(path.join(os.tmpdir(), 'pwqa2', 'node_modules', 'playwright-core'));
const CHROME = 'C:\\Users\\Admin\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const htmlPath = path.resolve(__dirname, 'pasay-mini-app.html');

async function wait(fn, ms, tries) { for (let i = 0; i < (tries||30); i++) { try { const v = await fn(); if (v) return v; } catch (e) {} await new Promise(r => setTimeout(r, ms||300)); } return null; }

(async () => {
  const port = 9222 + Math.floor(Math.random() * 500);
  const profile = path.join(os.tmpdir(), 'cr-' + Date.now());
  const proc = spawn(CHROME, [
    '--headless', '--disable-gpu', '--no-sandbox', '--no-first-run',
    '--remote-debugging-port=' + port,
    '--user-data-dir=' + profile,
    'about:blank'
  ], { stdio: 'ignore', windowsHide: true, detached: false });
  const endpoint = await wait(async () => {
    const { chromium } = PW;
    const b = await chromium.connectOverCDP('http://127.0.0.1:' + port);
    return b;
  }, 500, 40);
  if (!endpoint) { try { proc.kill(); } catch(e){} throw new Error('CDP connect timeout'); }
  const browser = endpoint;
  const report = { viewports: {}, summary: {} };
  const pages = [
    ['home', '#/home'],
    ['props', '#/props'],
    ['prop-detail', '#/property/1608'],
    ['ops', '#/ops'],
    ['finance', '#/finance'],
    ['rent-detail', '#/rent/R-2026-06-1608'],
    ['repair-detail', '#/repair/REP-0001'],
    ['expense-detail', '#/expense/EXP-0006'],
    ['more', '#/more'],
    ['archive', '#/archive'],
    ['team', '#/team'],
    ['tenant', '#/tenant/PT-1'],
    ['setup', '#/setup']
  ];
  for (const vw of [390, 430]) {
    const ctx = await browser.newContext({ viewport: { width: vw, height: 844 } });
    const page = await ctx.newPage();
    const entries = [];
    for (const [name, hash] of pages) {
      try {
        await page.goto('file:///' + htmlPath.split('\\').join('/'));
        await page.evaluate((h) => { window.location.hash = h; }, hash);
        await page.waitForTimeout(140);
        const m = await page.evaluate(() => {
          const app = document.getElementById('app');
          const out = { leaks: [], docOverflow: false, appOverflow: false, primaryClipped: [], overlap: 0, bottomNav: false, touchTargets: 0, below44: 0, primaryAction: false };
          const html = app ? app.innerHTML : '';
          ["'+", 'zh ?', 'ic(', '${', 'undefined', '[object Object]'].forEach(t => { if (html.indexOf(t) !== -1) out.leaks.push(t); });
          if (/(^|[^A-Za-z0-9_])null([^A-Za-z0-9_]|$)/.test(html)) out.leaks.push('null');
          out.docOverflow = document.documentElement.scrollWidth > (window.innerWidth + 1);
          out.appOverflow = app && (app.scrollWidth > app.clientWidth + 1);
          const btns = Array.prototype.slice.call(document.querySelectorAll('.btn, .nav-i, .iconb, button'));
          btns.forEach(b => { const r = b.getBoundingClientRect(); if (r && r.height > 0 && r.height < 44) out.below44++; if (r && (r.right > window.innerWidth + 1 || r.left < -1)) out.primaryClipped.push(b.className || b.tagName); });
          out.touchTargets = btns.length;
          out.bottomNav = !!document.querySelector('nav.nav') && document.querySelectorAll('nav.nav .nav-i').length === 5;
          out.primaryAction = !!document.querySelector('.btn.btn-p, .btn-p');
          const topbar = document.querySelector('header.topbar'), main = document.querySelector('main.main');
          if (main && topbar) { const mr = main.getBoundingClientRect(), tr = topbar.getBoundingClientRect(); if (mr.top < tr.bottom - 1) out.overlap++; }
          return out;
        });
        entries.push({ page: name, ok: m.leaks.length === 0 && !m.docOverflow && !m.appOverflow && m.primaryClipped.length === 0 && m.overlap === 0 && m.bottomNav && m.primaryAction && m.below44 === 0, ...m });
      } catch (e) { entries.push({ page: name, ok: false, error: e && e.message ? e.message : String(e) }); }
    }
    report.viewports[String(vw)] = entries;
    await ctx.close();
  }
  const all = Object.values(report.viewports).flat();
  report.summary.total = all.length;
  report.summary.pass = all.filter(e => e.ok).length;
  report.summary.fail = all.filter(e => !e.ok);
  report.allPass = report.summary.pass === report.summary.total;
  require('fs').writeFileSync(path.resolve(__dirname, 'browser-qa-390-430.json'), JSON.stringify(report, null, 2));
  console.log('BROWSER_QA total=' + report.summary.total + ' pass=' + report.summary.pass + ' allPass=' + report.allPass);
  console.log('FAILS:', JSON.stringify(report.summary.fail.map(f => f.page + (f.error ? ':' + f.error : ''))));
  try { await browser.close(); } catch(e){}
  try { proc.kill(); } catch(e){}
  process.exit(report.allPass ? 0 : 1);
})().catch(e => { console.error('BROWSER_QA threw:', e && e.message ? e.message : e); process.exit(2); });

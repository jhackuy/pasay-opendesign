/* Real-browser 390/430 QA for DESIGN-013 RETURN FIX (BLOCKER 3).
   Drives actual Chromium via playwright-core, loads pasay-mini-app.html,
   iterates Issue#20 core pages at 390px + 430px, captures auditable metrics. */
const path = require('path');
const PW = require(path.join(process.env.TMPDIR || require('os').tmpdir(), 'pwqa2', 'node_modules', 'playwright-core'));
const CHROME = 'C:\\Users\\Admin\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
const htmlPath = path.resolve(__dirname, 'pasay-mini-app.html');

(async () => {
  const browser = await PW.chromium.launch({ executablePath: CHROME, headless: true, pipe: false, args: ['--no-sandbox', '--disable-gpu'] });
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
    const page = await browser.newPage({ viewport: { width: vw, height: 844 } });
    const entries = [];
    for (const [name, hash] of pages) {
      try {
        await page.goto('file:///' + htmlPath.split('\\').join('/'));
        await page.evaluate((h) => { window.location.hash = h; }, hash);
        await page.waitForTimeout(120);
        const m = await page.evaluate(() => {
          const app = document.getElementById('app');
          const out = { leaks: [], docOverflow: false, appOverflow: false, primaryClipped: [], overlap: 0, bottomNav: false, touchTargets: 0, below44: 0, primaryAction: false };
          const html = app ? app.innerHTML : '';
          ["'+", 'zh ?', 'ic(', '${', 'undefined', '[object Object]'].forEach(t => { if (html.indexOf(t) !== -1) out.leaks.push(t); });
          if (/(^|[^A-Za-z0-9_])null([^A-Za-z0-9_]|$)/.test(html)) out.leaks.push('null');
          out.docOverflow = document.documentElement.scrollWidth > (window.innerWidth + 1);
          out.appOverflow = app && (app.scrollWidth > app.clientWidth + 1);
          // primary action = .btn.btn-p (or .btn) visible
          const btns = Array.prototype.slice.call(document.querySelectorAll('.btn, .nav-i, .iconb, button'));
          btns.forEach(b => {
            const r = b.getBoundingClientRect();
            if (r && r.height > 0 && r.height < 44) out.below44++;
            if (r && (r.right > window.innerWidth + 1 || r.left < -1)) out.primaryClipped.push(b.className || b.tagName);
          });
          out.touchTargets = btns.length;
          out.bottomNav = !!document.querySelector('nav.nav') && document.querySelectorAll('nav.nav .nav-i').length === 5;
          out.primaryAction = !!document.querySelector('.btn.btn-p, .btn-p');
          // overlap: topbar vs primary action / nav
          const topbar = document.querySelector('header.topbar');
          const main = document.querySelector('main.main');
          if (main && topbar) {
            const mr = main.getBoundingClientRect(), tr = topbar.getBoundingClientRect();
            if (mr.top < tr.bottom - 1) out.overlap++;
          }
          return out;
        });
        entries.push({ page: name, ok: m.leaks.length === 0 && !m.docOverflow && !m.appOverflow && m.primaryClipped.length === 0 && m.overlap === 0 && m.bottomNav && m.primaryAction && m.below44 === 0, ...m });
      } catch (e) {
        entries.push({ page: name, ok: false, error: e && e.message ? e.message : String(e) });
      }
    }
    report.viewports[String(vw)] = entries;
    await page.close();
  }
  // summary
  const all = Object.values(report.viewports).flat();
  report.summary.total = all.length;
  report.summary.pass = all.filter(e => e.ok).length;
  report.summary.fail = all.filter(e => !e.ok);
  report.allPass = report.summary.pass === report.summary.total;
  await browser.close();
  require('fs').writeFileSync(path.resolve(__dirname, 'browser-qa-390-430.json'), JSON.stringify(report, null, 2));
  console.log('BROWSER_QA total=' + report.summary.total + ' pass=' + report.summary.pass + ' allPass=' + report.allPass);
  console.log('FAILS:', JSON.stringify(report.summary.fail.map(f => f.page + (f.error ? ':' + f.error : ''))));
  process.exit(report.allPass ? 0 : 1);
})().catch(e => { console.error('BROWSER_QA threw:', e && e.message ? e.message : e); process.exit(2); });

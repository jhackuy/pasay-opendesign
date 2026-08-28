/*
 * PASAY-TASK-013 · DESIGN-013 FREEZE BLOCKER · REAL BROWSER QA
 *
 * Runs window.__OD_RUN_BROWSER_QA() inside a real Chromium instance launched
 * via playwright-core, at viewport widths 390px and 430px, and saves the
 * auditable report (metrics captured with real scrollWidth / clientWidth /
 * getBoundingClientRect) to disk.
 *
 * Usage:
 *   node .qa-runtime/run-real-browser-qa.js
 *
 * Output:
 *   .qa-runtime/real-browser-qa-390.json
 *   .qa-runtime/real-browser-qa-430.json
 *   .qa-runtime/real-browser-qa-summary.json
 *
 * Exit code:
 *   0 = all pages PASS at both viewports
 *   1 = at least one page FAIL
 *   2 = setup error
 */
'use strict';

const path = require('path');
const fs = require('fs');

const WORKSPACE = path.resolve(__dirname, '..');
const OUT_DIR = __dirname;
const TARGET = path.join(WORKSPACE, 'pasay-mini-app.html');
const VIEWPORTS = [390, 430];

function log(msg) { console.log('[REAL-BROWSER-QA] ' + msg); }

async function runForViewport(chromium, vw) {
  log('Launching Chromium headless @ ' + vw + 'x800 ...');
  /* Pick an installed Chromium (the bundled default may be a version we don't have). */
  const candidates = [
    'C:/Users/Admin/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
    'C:/Users/Admin/AppData/Local/ms-playwright/chromium-1208/chrome-win64/chrome.exe'
  ];
  const fsLocal = require('fs');
  let exe = null;
  for (const c of candidates) { if (fsLocal.existsSync(c)) { exe = c; break; } }
  if (!exe) throw new Error('No installed Chromium found');
  log('Using Chromium executable: ' + exe);
  const browser = await chromium.launch({ headless: true, executablePath: exe });
  const ctx = await browser.newContext({ viewport: { width: vw, height: 800 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', function (err) { log('  page error @' + vw + ': ' + err.message); });
  page.on('console', function (msg) { if (msg.type() === 'error') log('  console.error @' + vw + ': ' + msg.text()); });

  const url = 'file:///' + TARGET.replace(/\\/g, '/');
  log('Goto ' + url);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  /* Wait until the harness is mounted and the QA is callable */
  await page.waitForFunction(function () { return typeof window.__OD_RUN_BROWSER_QA === 'function' && !!document.getElementById('app'); }, null, { timeout: 30000 });

  log('Calling window.__OD_RUN_BROWSER_QA() ...');
  const report = await page.evaluate(function () {
    return window.__OD_RUN_BROWSER_QA();
  });

  await browser.close();
  return report;
}

async function main() {
  let chromium;
  try {
    /* playwright-core is bundled inside @playwright/cli; resolve from there */
    const candidates = [
      'C:/Users/Admin/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core',
      path.join(process.env.APPDATA || '', 'npm', 'node_modules', '@playwright', 'cli', 'node_modules', 'playwright-core'),
      path.join(WORKSPACE, 'node_modules', 'playwright-core')
    ];
    for (const c of candidates) {
      try { if (fs.existsSync(path.join(c, 'package.json'))) { chromium = require(c).chromium; log('Loaded playwright-core from ' + c); break; } } catch (_) {}
    }
    if (!chromium) throw new Error('playwright-core not found in any known location');
  } catch (e) {
    console.error('[REAL-BROWSER-QA] setup error: ' + e.message);
    process.exit(2);
  }

  const summary = { viewports: {}, allPass: true };
  for (const vw of VIEWPORTS) {
    let report;
    try { report = await runForViewport(chromium, vw); }
    catch (e) { console.error('[REAL-BROWSER-QA] run failed @' + vw + ': ' + e.message); process.exit(2); }

    const file = path.join(OUT_DIR, 'real-browser-qa-' + vw + '.json');
    fs.writeFileSync(file, JSON.stringify(report, null, 2));
    log('Wrote ' + file);

    const vp = report && report.viewports ? report.viewports[String(vw)] : null;
    const passed = vp ? vp.filter(function (e) { return e.ok; }).length : 0;
    const total = vp ? vp.length : 0;
    summary.viewports[vw] = { total: total, passed: passed, failed: total - passed, allPass: passed === total && total > 0 };
    log('Viewport ' + vw + 'px: ' + passed + '/' + total + ' PASS');
    if (!summary.viewports[vw].allPass) {
      summary.allPass = false;
      if (vp) vp.filter(function (e) { return !e.ok; }).forEach(function (e) {
        log('  FAIL ' + e.page + ': leaks=' + (e.leaks || []).join(',') + ' docOverflow=' + !!e.docOverflow + ' appOverflow=' + !!e.appOverflow + ' rectIssues=' + (e.rectIssues || []).length + ' overlap=' + e.overlap + ' primaryAction=' + !!e.primaryAction + ' bottomNavUsable=' + !!e.bottomNavUsable + (e.error ? (' error=' + e.error) : ''));
      });
    }
  }

  summary.timestamp = new Date().toISOString();
  summary.targetFile = TARGET;
  const sumFile = path.join(OUT_DIR, 'real-browser-qa-summary.json');
  fs.writeFileSync(sumFile, JSON.stringify(summary, null, 2));
  log('Wrote ' + sumFile);

  if (!summary.allPass) { log('FAIL'); process.exit(1); }
  log('PASS');
  process.exit(0);
}

main();
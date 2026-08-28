/*
 * DESIGN-021-FIX1-WIN-REVIEW · Real-browser QA (Playwright channel=chrome)
 *
 * For each requested viewport (390x900, 430x900):
 *  - Launch real Chrome 151 (channel=chrome) via playwright-core.
 *  - Set device viewport to the requested width (height 900, DPR 1).
 *  - Navigate to http://127.0.0.1:8790/pasay-mini-app-bqa-390-430.html
 *  - Wait for the BQA harness panel to settle (window.__BQA_HARD_ASSERT defined).
 *  - Collect auditable evidence:
 *      typeof window.__OD_RUN_BROWSER_QA
 *      window.__BQA_ALLPASS, __BQA_TOTAL, __BQA_PASS, __BQA_HARD_ASSERT, __BQA_PAGE_COUNT
 *      report.summary.total, report.summary.pass, report.allPass
 *      consoleErrors, pageExceptions (CDP-level)
 *  - Take a PNG screenshot of the visible area.
 *  - Save individual report files.
 *
 * Output (in .qa-runtime/):
 *   real-browser-qa-evidence.json    aggregate (browser, version, evidence per viewport)
 *   real-browser-report-390.json     full __OD_RUN_BROWSER_QA() report @390
 *   real-browser-report-430.json     full __OD_RUN_BROWSER_QA() report @430
 *   real-browser-qa-390.png          screenshot @390
 *   real-browser-qa-430.png          screenshot @430
 *   real-browser-stderr.log          captured console errors + page exceptions
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('C:/Users/Admin/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const OUT_DIR = __dirname;
const BASE = 'http://127.0.0.1:8790';
const TARGET = 'pasay-mini-app-bqa-390-430.html';
const VIEWPORTS = [390, 430];
const HEIGHT = 900;
const LOG_FILE = path.join(OUT_DIR, 'real-browser-stderr.log');

function log(m) { console.log('[REAL-BQA-REVIEW] ' + m); }

async function runViewport(vw) {
  log('=== viewport ' + vw + 'x' + HEIGHT + ' ===');
  const browser = await chromium.launch({
    headless: true,
    channel: 'chrome',
    args: [
      '--no-sandbox',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--no-first-run',
      '--mute-audio',
      '--hide-scrollbars',
      '--disable-dev-shm-usage',
      '--disable-background-networking',
      '--disable-extensions',
      '--disable-component-update',
      '--disable-breakpad',
      '--no-default-browser-check',
      '--disable-features=Crashpad'
    ]
  });
  const ctx = await browser.newContext({
    viewport: { width: vw, height: HEIGHT },
    deviceScaleFactor: 1,
    isMobile: false
  });
  const page = await ctx.newPage();

  const consoleErrors = [];
  const pageExceptions = [];
  page.on('console', function (msg) {
    if (msg.type() === 'error') consoleErrors.push('[console.error] ' + msg.text());
  });
  page.on('pageerror', function (err) {
    pageExceptions.push('[pageerror] ' + (err && err.message ? err.message : String(err)));
  });

  log('  goto ' + BASE + '/' + TARGET);
  const resp = await page.goto(BASE + '/' + TARGET, { waitUntil: 'domcontentloaded', timeout: 60000 });
  log('  HTTP status: ' + resp.status());

  /* Wait for the BQA harness panel to finish. The panel flips window.__BQA_HARD_ASSERT
     after it has run window.__OD_RUN_BROWSER_QA() and rendered the table. */
  await page.waitForFunction(function () {
    return typeof window.__BQA_HARD_ASSERT !== 'undefined';
  }, null, { timeout: 60000 });

  // Give the panel a brief stabilization window so summary text is fully populated.
  await page.waitForTimeout(500);

  const status = await page.evaluate(function () {
    return {
      hasRunner: typeof window.__OD_RUN_BROWSER_QA === 'function',
      sum: (document.getElementById('__bqa_sum') ? document.getElementById('__bqa_sum').textContent : ''),
      allpass: window.__BQA_ALLPASS,
      total: window.__BQA_TOTAL,
      pass: window.__BQA_PASS,
      hardAssert: window.__BQA_HARD_ASSERT,
      pageCount: window.__BQA_PAGE_COUNT,
      verify: window.__BQA_VERIFY || null
    };
  });
  log('  status: ' + JSON.stringify({
    hasRunner: status.hasRunner,
    sum: status.sum,
    allpass: status.allpass,
    total: status.total,
    pass: status.pass,
    hardAssert: status.hardAssert,
    pageCount: status.pageCount
  }));

  let report = null;
  try {
    report = await page.evaluate(function () {
      return typeof window.__OD_RUN_BROWSER_QA === 'function' ? window.__OD_RUN_BROWSER_QA() : null;
    });
  } catch (e) {
    log('  __OD_RUN_BROWSER_QA() threw: ' + e.message);
  }

  const png = await page.screenshot({ fullPage: true });

  await ctx.close();
  await browser.close();

  return {
    viewport: vw,
    height: HEIGHT,
    httpStatus: resp.status(),
    status: status,
    report: report,
    consoleErrors: consoleErrors,
    pageExceptions: pageExceptions,
    png: png
  };
}

(async function main() {
  try { fs.unlinkSync(LOG_FILE); } catch (_) {}

  const evidence = {
    browser: 'Google Chrome 151 (channel=chrome, real launch via playwright-core)',
    playwright: 'playwright-core 1.63.0-alpha-2026-08-05',
    origin: BASE,
    target: TARGET,
    viewports: {},
    allPass: true,
    timestamp: new Date().toISOString()
  };

  for (const vw of VIEWPORTS) {
    let out;
    try { out = await runViewport(vw); }
    catch (e) {
      log('runViewport(' + vw + ') FAILED: ' + e.stack);
      evidence.viewports[String(vw)] = { error: e.message };
      evidence.allPass = false;
      continue;
    }

    const summary = out.report && out.report.summary ? out.report.summary : null;
    const hardAssert = out.status || null;

    evidence.viewports[String(vw)] = {
      httpStatus: out.httpStatus,
      viewport: out.viewport,
      height: out.height,
      typeofRunner: typeof window === 'undefined' ? null : (out.status && out.status.hasRunner ? 'function' : 'missing'),
      hasRunner: out.status && out.status.hasRunner === true,
      BQA_ALLPASS: out.status ? out.status.allpass : null,
      BQA_TOTAL: out.status ? out.status.total : null,
      BQA_PASS: out.status ? out.status.pass : null,
      BQA_HARD_ASSERT: out.status ? out.status.hardAssert : null,
      BQA_PAGE_COUNT: out.status ? out.status.pageCount : null,
      BQA_VERIFY: out.status ? out.status.verify : null,
      sumLine: out.status ? out.status.sum : null,
      reportTotal: summary ? summary.total : null,
      reportPass: summary ? summary.pass : null,
      reportAllPass: out.report ? out.report.allPass : false,
      consoleErrors: out.consoleErrors,
      pageExceptions: out.pageExceptions,
      ok: !!(out.report && out.report.allPass &&
             out.status && out.status.allpass === true &&
             out.status.hardAssert === true &&
             out.consoleErrors.length === 0 &&
             out.pageExceptions.length === 0)
    };

    const vp = evidence.viewports[String(vw)];
    if (!vp.ok) evidence.allPass = false;

    if (out.report) {
      fs.writeFileSync(path.join(OUT_DIR, 'real-browser-report-' + vw + '.json'), JSON.stringify(out.report, null, 2));
      log('  wrote real-browser-report-' + vw + '.json');
    }
    if (out.png) {
      fs.writeFileSync(path.join(OUT_DIR, 'real-browser-qa-' + vw + '.png'), out.png);
      log('  wrote real-browser-qa-' + vw + '.png (' + out.png.length + ' bytes)');
    }
    fs.appendFileSync(LOG_FILE,
      '\n--- vw=' + vw + ' ---\n' +
      'HTTP status: ' + out.httpStatus + '\n' +
      'typeof __OD_RUN_BROWSER_QA: ' + vp.hasRunner + '\n' +
      '__BQA_ALLPASS: ' + vp.BQA_ALLPASS + '\n' +
      '__BQA_TOTAL: ' + vp.BQA_TOTAL + '\n' +
      '__BQA_PASS: ' + vp.BQA_PASS + '\n' +
      '__BQA_HARD_ASSERT: ' + vp.BQA_HARD_ASSERT + '\n' +
      '__BQA_PAGE_COUNT: ' + vp.BQA_PAGE_COUNT + '\n' +
      'report.summary.total: ' + vp.reportTotal + '\n' +
      'report.summary.pass: ' + vp.reportPass + '\n' +
      'report.allPass: ' + vp.reportAllPass + '\n' +
      'sum: ' + vp.sumLine + '\n' +
      'console errors: ' + out.consoleErrors.length + '\n' +
      (out.consoleErrors.length ? out.consoleErrors.join('\n') + '\n' : '') +
      'page exceptions: ' + out.pageExceptions.length + '\n' +
      (out.pageExceptions.length ? out.pageExceptions.join('\n') + '\n' : '')
    );
  }

  evidence.rows390 = evidence.viewports['390'] && evidence.viewports['390'].reportTotal;
  evidence.rows430 = evidence.viewports['430'] && evidence.viewports['430'].reportTotal;
  evidence.expectedRows = 34;
  evidence.expectedPass = 34;

  fs.writeFileSync(path.join(OUT_DIR, 'real-browser-qa-evidence.json'), JSON.stringify(evidence, null, 2));
  log('wrote real-browser-qa-evidence.json');
  log('final allPass=' + evidence.allPass);
  process.exit(evidence.allPass ? 0 : 1);
})().catch(function (e) { log('main threw: ' + e.stack); process.exit(2); });
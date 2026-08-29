'use strict';
/* Feasibility probe: can real Chrome 151 (channel=chrome) launch here with the
   review-runner flags? Load about:blank, report version. */
const { chromium } = require('C:/Users/Admin/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');
(async function () {
  try {
    const browser = await chromium.launch({
      headless: true,
      channel: 'chrome',
      args: [
        '--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-first-run',
        '--mute-audio','--hide-scrollbars','--disable-dev-shm-usage','--disable-background-networking',
        '--disable-extensions','--disable-component-update','--disable-breakpad','--no-default-browser-check',
        '--disable-features=Crashpad'
      ]
    });
    const ver = browser.version();
    console.log('[probe] LAUNCH_OK version=' + ver);
    const ctx = await browser.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 1, isMobile: false });
    const page = await ctx.newPage();
    await page.goto('about:blank');
    console.log('[probe] NAV_OK title=' + JSON.stringify(await page.title()));
    await ctx.close();
    await browser.close();
    console.log('[probe] CLOSE_OK');
    process.exit(0);
  } catch (e) {
    console.log('[probe] LAUNCH_FAIL ' + (e && e.message ? e.message : String(e)));
    process.exit(1);
  }
})();
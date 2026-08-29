'use strict';
const { chromium } = require('C:/Users/Admin/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');
(async function () {
  try {
    const browser = await chromium.launch({
      headless: true, channel: 'chrome',
      args: ['--no-sandbox','--disable-gpu','--disable-software-rasterizer','--no-first-run',
        '--mute-audio','--hide-scrollbars','--disable-dev-shm-usage','--disable-background-networking',
        '--disable-extensions','--disable-component-update','--disable-breakpad','--no-default-browser-check',
        '--disable-features=Crashpad']
    });
    console.log('[probe] LAUNCH_OK ' + browser.version());
    const ctx = await browser.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 1, isMobile: false });
    const page = await ctx.newPage();
    await page.goto('about:blank');
    console.log('[probe] NAV_OK');
    await ctx.close(); await browser.close();
    console.log('[probe] DONE');
    process.exit(0);
  } catch (e) { console.log('[probe] FAIL ' + (e && e.message || e)); process.exit(1); }
})();
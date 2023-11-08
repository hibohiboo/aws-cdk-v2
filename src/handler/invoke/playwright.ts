import { Handler } from 'aws-lambda';
import { chromium } from 'playwright-core';
const sparticuzChromium = require('@sparticuz/chromium');
// Optional: If you'd like to use the legacy headless mode. "new" is the default.
sparticuzChromium.setHeadlessMode = true;
// Optional: If you'd like to disable webgl, true is the default.
sparticuzChromium.setGraphicsMode = false;

export const handler: Handler = async (event, context) => {
  let browser;
  try {
    const executablePath = await sparticuzChromium.executablePath();
    browser = await chromium.launch({
      args: sparticuzChromium.args,
      executablePath,
      headless: sparticuzChromium.headless,
    });

    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('https://talto.cc/');
    const locators = await page.locator('section ul li').all();
    const promises = locators.map(async (locator) => {
      const elment = await locator.elementHandle();
      const imgElement = await elment?.$('img');
      if (!imgElement) return;
      const alt = await imgElement.getAttribute('alt');
      if (!alt) return;
      console.log(alt);
    });
    await Promise.all(promises);
  } catch (e) {
    console.error(e);
  } finally {
    if (browser) await browser.close();
  }
};

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { injectTestMedia } from '../helpers';
import config from '../../playwright.config';

test.skip(!!process.env.CI, 'This test should not be run in CI environment');
// test.use({
//     headless: false,
//     launchOptions: {
//         args: [
//             ...(config.use?.launchOptions?.args ?? []),
//             '--auto-open-devtools-for-tabs'
//         ]
//     }
// });

async function setupAndWait(page: Page, baseURL: string) {
    await injectTestMedia(page, 'audio');
    await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(60 * 60 * 1000); // timeout from `playwright.config.ts` will stop this test
}

function getPageCountFromEnv() {
    const parsed = Number.parseInt(process.env.P ?? '1', 10);

    if (!Number.isFinite(parsed) || parsed < 1) {
        throw new Error(`Invalid P value: ${process.env.P}. It must be an integer >= 1.`);
    }

    return parsed;
}

test('dry run test', async ({ browser, baseURL }) => {
    if (!baseURL) {
        throw new Error("Missing baseURL");
    }

    const pageCount = getPageCountFromEnv();
    const pages = await Promise.all(
        Array.from({ length: pageCount }, () => browser.newPage())
    );

    await Promise.all(pages.map((page) => setupAndWait(page, baseURL)));
});
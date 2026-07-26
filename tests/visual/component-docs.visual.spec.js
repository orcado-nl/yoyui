const { expect, test } = require('@playwright/test');
const {
    assertPageHealth,
    componentRoutes,
    disableLongRunningIntervals,
    enableDarkMode,
    freezeDynamicContent,
    hideDocumentationChrome,
    isolateDocumentationPage,
    settleDocumentationContent,
    slugFromPath,
    waitForDocumentationPage
} = require('./helpers');

if (componentRoutes.length !== 94) {
    throw new Error(`Expected 94 component documentation routes, found ${componentRoutes.length}. Update the visual inventory deliberately when the menu changes.`);
}

test.describe('component documentation visual parity', () => {
    test.beforeEach(async ({ page }) => {
        await isolateDocumentationPage(page);
        await disableLongRunningIntervals(page);
    });

    for (const route of componentRoutes) {
        for (const colorScheme of ['light', 'dark']) {
            test(`${route.name} (${colorScheme})`, async ({ page }) => {
                const browserErrors = [];

                page.on('console', (message) => {
                    if (message.type() === 'error') {
                        browserErrors.push(message.text());
                    }
                });
                page.on('pageerror', (error) => browserErrors.push(error.message));

                await page.goto(`${route.path}/`, { waitUntil: 'domcontentloaded' });
                await waitForDocumentationPage(page, browserErrors);

                if (colorScheme === 'dark') {
                    await enableDarkMode(page);
                }

                await hideDocumentationChrome(page);
                await settleDocumentationContent(page);
                await freezeDynamicContent(page);
                await assertPageHealth(page, browserErrors);
                await expect(page.locator('.doc-main')).toHaveScreenshot(`${slugFromPath(route.path)}-${colorScheme}.png`, {
                    mask: route.path === '/calendar' ? [page.locator('.p-datepicker-inline')] : []
                });
            });
        }
    }
});

const { expect, test } = require('@playwright/test');
const {
    assertPageHealth,
    componentRoutes,
    disableLongRunningIntervals,
    enableVisualTestMode,
    freezeDynamicContent,
    hideDocumentationChrome,
    isolateDocumentationPage,
    navigateToDocumentationPage,
    settleDocumentationContent,
    slugFromPath,
    waitForChartCanvases
} = require('./helpers');

if (componentRoutes.length !== 94) {
    throw new Error(`Expected 94 component documentation routes, found ${componentRoutes.length}. Update the visual inventory deliberately when the menu changes.`);
}

test.describe('component documentation visual parity', () => {
    test.beforeEach(async ({ page }) => {
        await isolateDocumentationPage(page);
        await disableLongRunningIntervals(page);
        await enableVisualTestMode(page);
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

                await navigateToDocumentationPage(page, route.path, colorScheme, browserErrors);
                await hideDocumentationChrome(page);
                await settleDocumentationContent(page);
                await freezeDynamicContent(page);
                await waitForChartCanvases(page);
                await assertPageHealth(page, browserErrors);
                await expect(page.locator('.doc-main')).toHaveScreenshot(`${slugFromPath(route.path)}-${colorScheme}.png`, {
                    mask: route.path === '/calendar' ? [page.locator('.p-datepicker-inline')] : []
                });
            });
        }
    }
});

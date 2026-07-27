const menu = require('../../components/layout/menu.json');

const isActionableBrowserError = (message) => !message.startsWith('Warning: Each child in a list should have a unique "key" prop.');

const isolateDocumentationPage = (page) =>
    page.route('https://www.googletagmanager.com/**', (route) =>
        route.fulfill({
            body: '',
            contentType: 'application/javascript',
            status: 200
        })
    );

const collectComponentRoutes = () => {
    const componentGroup = menu.data.find((item) => item.name === 'Components');
    const routes = [];

    const visit = (items = []) => {
        for (const item of items) {
            if (item.to?.startsWith('/')) {
                routes.push({
                    name: item.name,
                    path: item.to
                });
            }

            visit(item.children);
        }
    };

    visit(componentGroup?.children);

    return routes;
};

const componentRoutes = collectComponentRoutes();

const disableLongRunningIntervals = (page) =>
    page.addInitScript(() => {
        const nativeSetInterval = window.setInterval;

        window.setInterval = (callback, delay, ...args) => {
            if (Number(delay) >= 1_000) {
                return -1;
            }

            return nativeSetInterval(callback, delay, ...args);
        };
    });

const waitForDocumentationPage = async (page, browserErrors = []) => {
    await page.waitForLoadState('domcontentloaded');

    try {
        await page.locator('.doc-main').waitFor({ state: 'visible', timeout: 15_000 });
    } catch (error) {
        const details = browserErrors.filter(isActionableBrowserError);

        throw new Error(`${error.message}${details.length > 0 ? `\nBrowser errors:\n${details.join('\n')}` : ''}`);
    }
    await page.evaluate(async () => {
        await document.fonts?.ready;

        await Promise.all(
            Array.from(document.images)
                .filter((image) => !image.complete)
                .map(
                    (image) =>
                        new Promise((resolve) => {
                            image.addEventListener('load', resolve, { once: true });
                            image.addEventListener('error', resolve, { once: true });
                        })
                )
        );
    });
};

const settleDocumentationContent = async (page) => {
    await page.evaluate(async () => {
        const step = Math.max(window.innerHeight * 0.8, 300);
        let previousHeight = 0;

        for (let position = 0, iterations = 0; position <= document.documentElement.scrollHeight && iterations < 150; position += step, iterations++) {
            window.scrollTo(0, position);
            await new Promise(requestAnimationFrame);

            const currentHeight = document.documentElement.scrollHeight;

            if (position + window.innerHeight >= currentHeight && currentHeight === previousHeight) {
                break;
            }

            previousHeight = currentHeight;
        }

        window.scrollTo(0, 0);
        await new Promise(requestAnimationFrame);
    });
    await page.waitForTimeout(250);
    await waitForDocumentationPage(page);
};

const freezeDynamicContent = async (page) => {
    await page.evaluate(() => {
        for (const media of document.querySelectorAll('audio, video')) {
            media.pause();
        }
    });
};

const hideDocumentationChrome = (page) =>
    page.addStyleTag({
        content: `
            .layout-config,
            .layout-footer,
            .layout-mask,
            .layout-news,
            .layout-sidebar,
            .layout-topbar {
                visibility: hidden !important;
            }
        `
    });

const enableDarkMode = async (page) => {
    const toggle = page.locator('.layout-topbar button').filter({ has: page.locator('.pi-sun') });

    await toggle.click();
    await page.locator('.layout-wrapper.layout-dark').waitFor({ state: 'visible' });
    await page.locator('link#theme-link[href*="-dark-"]').waitFor({ state: 'attached' });
    await page.waitForFunction(() => {
        const link = document.querySelector('link#theme-link');

        return link?.href.includes('-dark-') && link.sheet?.href === link.href;
    });
    await page.waitForTimeout(250);
};

const assertPageHealth = async (page, browserErrors) => {
    const health = await page.evaluate(() => {
        const brokenImages = Array.from(document.images)
            .filter((image) => image.complete && image.naturalWidth === 0)
            .map((image) => image.currentSrc || image.src);
        const overflowingElements = Array.from(document.querySelectorAll('body *'))
            .filter((element) => {
                const style = getComputedStyle(element);

                if (style.position === 'fixed' || style.position === 'absolute') {
                    return false;
                }

                return element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 1 && style.overflowX === 'visible';
            })
            .sort((left, right) => right.scrollWidth - right.clientWidth - (left.scrollWidth - left.clientWidth))
            .slice(0, 20)
            .map((element) => ({
                className: String(element.className),
                clientWidth: element.clientWidth,
                scrollWidth: element.scrollWidth,
                tagName: element.tagName
            }));
        const viewportWidth = document.documentElement.clientWidth;
        const outOfViewportElements = Array.from(document.querySelectorAll('.doc-main *'))
            .filter((element) => {
                const style = getComputedStyle(element);
                const bounds = element.getBoundingClientRect();

                return style.display !== 'none' && style.visibility !== 'hidden' && style.position !== 'fixed' && bounds.width > 0 && (bounds.left < -1 || bounds.right > viewportWidth + 1);
            })
            .slice(0, 30)
            .map((element) => {
                const bounds = element.getBoundingClientRect();
                const parent = element.parentElement;
                const parentBounds = parent?.getBoundingClientRect();

                return {
                    className: String(element.className),
                    left: Math.round(bounds.left),
                    parentClassName: parent ? String(parent.className) : '',
                    parentLeft: parentBounds ? Math.round(parentBounds.left) : null,
                    parentOverflowX: parent ? getComputedStyle(parent).overflowX : '',
                    parentRight: parentBounds ? Math.round(parentBounds.right) : null,
                    right: Math.round(bounds.right),
                    tagName: element.tagName,
                    width: Math.round(bounds.width)
                };
            });

        return {
            bodyClientWidth: document.body.clientWidth,
            bodyOverflowY: getComputedStyle(document.body).overflowY,
            bodyScrollWidth: document.body.scrollWidth,
            brokenImages,
            outOfViewportElements,
            overflowingElements
        };
    });

    if (health.bodyScrollWidth > health.bodyClientWidth + 1) {
        throw new Error(`Page has horizontal overflow: ${JSON.stringify(health)}`);
    }

    if (health.bodyOverflowY !== 'auto') {
        throw new Error(`Page unexpectedly disables vertical scrolling: ${JSON.stringify(health)}`);
    }

    if (health.brokenImages.length > 0) {
        throw new Error(`Page has broken images: ${health.brokenImages.join(', ')}`);
    }

    const actionableBrowserErrors = browserErrors.filter(isActionableBrowserError);

    if (actionableBrowserErrors.length > 0) {
        throw new Error(`Page logged browser errors:\n${actionableBrowserErrors.join('\n')}`);
    }

    return health;
};

const slugFromPath = (routePath) => routePath.replace(/^\/|\/$/g, '').replaceAll('/', '-');

module.exports = {
    assertPageHealth,
    componentRoutes,
    disableLongRunningIntervals,
    enableDarkMode,
    freezeDynamicContent,
    hideDocumentationChrome,
    isolateDocumentationPage,
    isActionableBrowserError,
    settleDocumentationContent,
    slugFromPath,
    waitForDocumentationPage
};

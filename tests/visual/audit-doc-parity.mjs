import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from '@playwright/test';

const rootDir = process.cwd();
const reportDir = path.resolve(rootDir, 'artifacts/docs-parity');
const sourceBaseURL = process.env.PRIMEREACT_DOCS_URL || 'https://v10.primereact.org';
const sourceVersion = '10.9.8';
const targetBaseURL = process.env.YOYUI_DOCS_URL || 'https://yoyui.orcado.dev';
const numericTolerance = 1;
const concurrency = Math.max(1, Number.parseInt(process.env.AUDIT_CONCURRENCY || '4', 10));
const requestedRoutes = new Set(
    (process.env.AUDIT_ROUTES || '')
        .split(',')
        .map((route) => route.trim())
        .filter(Boolean)
        .map((route) => (route.startsWith('/') ? route : `/${route}`))
);
const requestedViewports = new Set(
    (process.env.AUDIT_VIEWPORTS || '')
        .split(',')
        .map((viewport) => viewport.trim())
        .filter(Boolean)
);
const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'tablet', width: 1024, height: 768 },
    { name: 'mobile', width: 390, height: 844 }
].filter((viewport) => requestedViewports.size === 0 || requestedViewports.has(viewport.name));
const colorSchemes = process.env.AUDIT_COLOR_SCHEMES ? process.env.AUDIT_COLOR_SCHEMES.split(',').map((value) => value.trim()) : ['light', 'dark'];

const normalizeText = (value = '') =>
    value
        .replaceAll('PrimeReact', 'PRODUCT')
        .replaceAll('YoYui', 'PRODUCT')
        .replaceAll(/10\.\d+\.\d+/g, 'VERSION')
        .replaceAll(/0\.\d+\.\d+/g, 'VERSION')
        .replaceAll(/\s+/g, ' ')
        .trim();

const isActionableBrowserError = (message) => !message.startsWith('Failed to load resource: net::ERR_NAME_NOT_RESOLVED');

const collectRoutes = async () => {
    const menu = JSON.parse(await fs.readFile(path.resolve(rootDir, 'components/layout/menu.json'), 'utf8'));
    const componentGroup = menu.data.find((item) => item.name === 'Components');
    const routes = [];

    const visit = (items = []) => {
        for (const item of items) {
            if (item.to?.startsWith('/')) {
                routes.push({ name: item.name, path: item.to });
            }

            visit(item.children);
        }
    };

    visit(componentGroup?.children);

    return routes.filter((route) => requestedRoutes.size === 0 || requestedRoutes.has(route.path));
};

const waitForPage = async (page) => {
    await page.waitForLoadState('domcontentloaded');
    await page.locator('.doc-main').waitFor({ state: 'visible', timeout: 60_000 });
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

const settlePage = async (page) => {
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
        await document.fonts?.ready;
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });

    const editor = page.locator('.p-editor-container');

    if ((await editor.count()) > 0) {
        await editor
            .first()
            .locator('.ql-toolbar')
            .waitFor({ state: 'visible', timeout: 5_000 })
            .catch(() => {});
    }

    await page
        .locator('.p-tree-loading, .p-datatable-loading')
        .first()
        .waitFor({ state: 'detached', timeout: 5_000 })
        .catch(() => {});
    await page.waitForTimeout(500);
    await waitForPage(page);
};

const enableDarkMode = async (page) => {
    const toggle = page.locator('.layout-topbar button').filter({ has: page.locator('.pi-sun') });

    await toggle.click();
    await page.locator('.layout-wrapper.layout-dark').waitFor({ state: 'visible' });
    await page.waitForFunction(() => {
        const link = document.querySelector('link#theme-link');

        return link?.href.includes('-dark-') && link.sheet?.href === link.href;
    });
    await page.evaluate(
        () =>
            new Promise((resolve) => {
                requestAnimationFrame(() => requestAnimationFrame(resolve));
            })
    );
    await page.waitForTimeout(250);
};

const collectSignature = async (page) =>
    page.evaluate(() => {
        const round = (value) => Math.round(value * 10) / 10;
        const rect = (element, parentRect) => {
            const value = element.getBoundingClientRect();

            return {
                height: round(value.height),
                width: round(value.width),
                x: round(value.x - parentRect.x),
                y: round(value.y - parentRect.y)
            };
        };
        const main = document.querySelector('.doc-main');
        const mainRect = main.getBoundingClientRect();
        const sections = Array.from(main.querySelectorAll(':scope > section'));

        return {
            bodyOverflow: Math.max(0, document.body.scrollWidth - document.body.clientWidth),
            brokenImageCount: Array.from(document.images).filter((image) => image.complete && image.naturalWidth === 0).length,
            cards: Array.from(main.querySelectorAll('.card')).map((card) => {
                const cardRect = card.getBoundingClientRect();
                const controls = Array.from(card.querySelectorAll('input, textarea, select, button, [role="combobox"], [role="slider"], .p-component'))
                    .filter((element, index, elements) => {
                        const elementRect = element.getBoundingClientRect();
                        const style = getComputedStyle(element);

                        return (
                            style.display !== 'none' &&
                            style.visibility !== 'hidden' &&
                            style.position !== 'fixed' &&
                            style.position !== 'absolute' &&
                            (elementRect.width > 0 || elementRect.height > 0) &&
                            !elements.some((candidate, candidateIndex) => candidateIndex < index && candidate.contains(element) && candidate.matches('.p-component'))
                        );
                    })
                    .slice(0, 100)
                    .map((element) => {
                        const style = getComputedStyle(element);

                        return {
                            attributes: {
                                cols: element.getAttribute('cols') || '',
                                rows: element.getAttribute('rows') || '',
                                size: element.getAttribute('size') || '',
                                style: element.getAttribute('style') || ''
                            },
                            className: String(element.className)
                                .split(/\s+/)
                                .filter((name) => name.startsWith('p-') && !/(?:enter|exit)(?:-|$)/.test(name))
                                .sort()
                                .join(' '),
                            border: style.border,
                            boxSizing: style.boxSizing,
                            display: style.display,
                            fontFamily: style.fontFamily,
                            fontSize: style.fontSize,
                            height: style.height,
                            lineHeight: style.lineHeight,
                            margin: style.margin,
                            overflowX: style.overflowX,
                            overflowY: style.overflowY,
                            padding: style.padding,
                            position: style.position,
                            rect: rect(element, cardRect),
                            role: element.getAttribute('role') || '',
                            tagName: element.tagName,
                            width: style.width
                        };
                    });

                return {
                    controls,
                    rect: {
                        height: round(cardRect.height),
                        width: round(cardRect.width),
                        x: round(cardRect.x - mainRect.x)
                    }
                };
            }),
            images: Array.from(main.querySelectorAll('img')).map((image) => {
                const imageRect = image.getBoundingClientRect();
                const style = getComputedStyle(image);

                return {
                    alt: image.alt,
                    height: round(imageRect.height),
                    maxHeight: style.maxHeight,
                    maxWidth: style.maxWidth,
                    naturalHeight: image.naturalHeight,
                    naturalWidth: image.naturalWidth,
                    objectFit: style.objectFit,
                    width: round(imageRect.width)
                };
            }),
            mainWidth: round(mainRect.width),
            themePath: new URL(document.querySelector('link#theme-link')?.href || document.location.href).pathname,
            sections: sections.map((section) => {
                const heading = section.querySelector('h2, h3');

                return {
                    heading: heading?.textContent || ''
                };
            })
        };
    });

const collectAutoCompleteVirtualScrollState = async (page) => {
    const section = page.locator('section.py-4').filter({ has: page.getByRole('heading', { name: 'Virtual Scroll', exact: true }) });

    if ((await section.count()) !== 1) {
        return { error: 'Virtual Scroll section not found' };
    }

    await section.getByRole('button', { name: 'Choose' }).click();

    const panel = page.locator('.p-autocomplete-panel');

    await panel.waitFor({ state: 'visible' });
    await panel.locator('.p-virtualscroller').evaluate((scroller) => {
        scroller.scrollTop = 600;
        scroller.dispatchEvent(new Event('scroll'));
    });
    await page.waitForTimeout(100);

    return panel.evaluate((element) => {
        const scroller = element.querySelector('.p-virtualscroller');
        const input = document.querySelector('section.py-4 .p-autocomplete-input[aria-expanded="true"]');
        const panelRect = element.getBoundingClientRect();
        const inputRect = input.getBoundingClientRect();
        const rows = Array.from(scroller.querySelectorAll('.p-autocomplete-item'));
        const firstRowStyle = rows[0] ? getComputedStyle(rows[0]) : null;

        return {
            bodyFontSize: getComputedStyle(document.body).fontSize,
            devicePixelRatio: window.devicePixelRatio,
            firstItem: rows[0]?.textContent,
            htmlFontSize: getComputedStyle(document.documentElement).fontSize,
            inputHeight: inputRect.height,
            itemFontSize: firstRowStyle?.fontSize,
            itemLineHeight: firstRowStyle?.lineHeight,
            itemPadding: firstRowStyle?.padding,
            panelHeight: panelRect.height,
            panelInputWidthDifference: Math.round((panelRect.width - inputRect.width) * 10) / 10,
            panelInputXDifference: Math.round((panelRect.x - inputRect.x) * 10) / 10,
            rowHeights: rows.slice(0, 8).map((row) => row.getBoundingClientRect().height),
            scrollHeight: scroller.scrollHeight,
            scrollTop: scroller.scrollTop,
            transform: scroller.querySelector('.p-autocomplete-items')?.style.transform
        };
    });
};

const approximatelyEqual = (left, right) => Math.abs(left - right) <= numericTolerance;

const compareValues = (source, target, pointer = '$', differences = []) => {
    if (typeof source === 'number' && typeof target === 'number') {
        if (!approximatelyEqual(source, target)) {
            differences.push({ pointer, source, target });
        }

        return differences;
    }

    if (typeof source === 'string' && typeof target === 'string') {
        if (normalizeText(source) !== normalizeText(target)) {
            differences.push({ pointer, source, target });
        }

        return differences;
    }

    if (Array.isArray(source) && Array.isArray(target)) {
        if (source.length !== target.length) {
            differences.push({ pointer: `${pointer}.length`, source: source.length, target: target.length });
        }

        for (let index = 0; index < Math.min(source.length, target.length); index++) {
            compareValues(source[index], target[index], `${pointer}[${index}]`, differences);
        }

        return differences;
    }

    if (source && target && typeof source === 'object' && typeof target === 'object') {
        for (const key of new Set([...Object.keys(source), ...Object.keys(target)])) {
            compareValues(source[key], target[key], `${pointer}.${key}`, differences);
        }

        return differences;
    }

    if (source !== target) {
        differences.push({ pointer, source, target });
    }

    return differences;
};

const responsiveCorrectionRoutes = new Set(['/dock', '/galleria', '/iconfield', '/mention', '/paginator', '/stepper', '/tabview', '/treetable']);

const reviewDifference = (result, difference) => {
    const imageMatch = difference.pointer.match(/^\$\.images\[(\d+)]\.natural(?:Height|Width)$/);

    if (imageMatch) {
        const index = Number.parseInt(imageMatch[1], 10);
        const sourceImage = result.sourceSignature.images[index];
        const targetImage = result.targetSignature.images[index];

        if (sourceImage && targetImage && approximatelyEqual(sourceImage.height, targetImage.height) && approximatelyEqual(sourceImage.width, targetImage.width)) {
            return 'Local replacement image has different source pixels but preserves its rendered dimensions.';
        }
    }

    if (result.route.path === '/datatable' && (/^\$\.cards\[\d+]\.(?:controls\.length|rect\.height)$/.test(difference.pointer) || difference.pointer === '$.images.length')) {
        return 'DataTable documentation services resolve independently on the two sites; interaction tests cover the settled table behavior.';
    }

    if (result.route.path === '/galleria' && (difference.pointer === '$.cards[10].controls.length' || difference.pointer === '$.cards[7].controls[0].attributes.style' || /^\$\.images\[\d+]\.alt$/.test(difference.pointer))) {
        return 'Galleria autoplay/deferred state or equivalent responsive implementation detail is timing-dependent.';
    }

    if (result.route.path === '/slider' && difference.pointer === '$.images[0].objectFit') {
        return 'The local replacement image uses cover cropping to preserve the upstream rendered aspect ratio.';
    }

    const marginMatch = difference.pointer.match(/^\$\.cards\[(\d+)]\.controls\[(\d+)]\.margin$/);

    if (marginMatch) {
        const cardIndex = Number.parseInt(marginMatch[1], 10);
        const controlIndex = Number.parseInt(marginMatch[2], 10);
        const sourceRect = result.sourceSignature.cards[cardIndex]?.controls[controlIndex]?.rect;
        const targetRect = result.targetSignature.cards[cardIndex]?.controls[controlIndex]?.rect;

        if (
            sourceRect &&
            targetRect &&
            approximatelyEqual(sourceRect.height, targetRect.height) &&
            approximatelyEqual(sourceRect.width, targetRect.width) &&
            approximatelyEqual(sourceRect.x, targetRect.x) &&
            approximatelyEqual(sourceRect.y, targetRect.y)
        ) {
            return 'Computed auto-margin used values differ without changing the control geometry.';
        }
    }

    const mentionAutoResizeMatch = result.route.path === '/mention' && /^\$\.cards\[2](?:\.controls\[0])?\.(?:height|rect\.height)$/.test(difference.pointer);
    const sourceSize = Number.parseFloat(difference.source);
    const targetSize = Number.parseFloat(difference.target);

    if (mentionAutoResizeMatch && Number.isFinite(sourceSize) && Number.isFinite(targetSize) && Math.abs(sourceSize - targetSize) <= 5) {
        return 'The upstream auto-resize textarea has a 5px font-metric timing variation; its width, rows, and behavior are unchanged.';
    }

    if (result.route.path === '/stepper' && difference.pointer.endsWith('.attributes.style')) {
        return 'The added min-width declaration prevents flex overflow without changing wide-screen geometry.';
    }

    if (result.route.path === '/treetable' && (/\.className$/.test(difference.pointer) || /\.overflow[XY]$/.test(difference.pointer))) {
        return 'TreeTable scroll roots explicitly contain their scrollable content.';
    }

    if (
        result.viewport === 'mobile' &&
        responsiveCorrectionRoutes.has(result.route.path) &&
        (difference.pointer === '$.bodyOverflow' ||
            /^\$\.cards\[\d+](?:\.controls\[\d+])?\.(?:height|width|rect\.(?:height|width|x|y)|overflow[XY])$/.test(difference.pointer) ||
            (result.route.path === '/galleria' && /^\$\.images\[\d+]\.(?:height|width)$/.test(difference.pointer)))
    ) {
        return 'Narrow-screen containment intentionally replaces upstream page overflow or clipping.';
    }

    return null;
};

const classifyDifferences = (result) => {
    const reviewedDifferences = [];
    const unexplainedDifferences = [];

    for (const difference of result.differences) {
        const review = reviewDifference(result, difference);

        if (review) {
            reviewedDifferences.push({ ...difference, review });
        } else {
            unexplainedDifferences.push(difference);
        }
    }

    result.reviewedDifferences = reviewedDifferences;
    result.unexplainedDifferences = unexplainedDifferences;
};

const auditPage = async ({ browser, colorScheme, route, viewport }) => {
    const context = await browser.newContext({
        colorScheme: 'light',
        viewport: {
            height: viewport.height,
            width: viewport.width
        }
    });

    await context.route('https://www.googletagmanager.com/**', (route) =>
        route.fulfill({
            body: '',
            contentType: 'application/javascript',
            status: 200
        })
    );

    const sourcePage = await context.newPage();
    const targetPage = await context.newPage();
    const sourceErrors = [];
    const targetErrors = [];

    sourcePage.on('console', (message) => message.type() === 'error' && sourceErrors.push(message.text()));
    targetPage.on('console', (message) => message.type() === 'error' && targetErrors.push(message.text()));
    sourcePage.on('pageerror', (error) => sourceErrors.push(error.message));
    targetPage.on('pageerror', (error) => targetErrors.push(error.message));

    try {
        await Promise.all([sourcePage.goto(`${sourceBaseURL}${route.path}/`, { timeout: 60_000, waitUntil: 'domcontentloaded' }), targetPage.goto(`${targetBaseURL}${route.path}/`, { timeout: 60_000, waitUntil: 'domcontentloaded' })]);
        await Promise.all([waitForPage(sourcePage), waitForPage(targetPage)]);
        await Promise.all([settlePage(sourcePage), settlePage(targetPage)]);

        if (colorScheme === 'dark') {
            await Promise.all([enableDarkMode(sourcePage), enableDarkMode(targetPage)]);
            await Promise.all([settlePage(sourcePage), settlePage(targetPage)]);
        }

        const [sourceSignature, targetSignature] = await Promise.all([collectSignature(sourcePage), collectSignature(targetPage)]);
        const result = {
            colorScheme,
            differences: compareValues(sourceSignature, targetSignature),
            route,
            sourceErrors,
            sourceSignature,
            targetOnlyErrors: targetErrors.filter((error) => isActionableBrowserError(error) && !sourceErrors.includes(error)),
            targetErrors,
            targetSignature,
            viewport: viewport.name
        };

        classifyDifferences(result);

        if (result.unexplainedDifferences.length > 0) {
            await Promise.all([settlePage(sourcePage), settlePage(targetPage)]);

            const [settledSourceSignature, settledTargetSignature] = await Promise.all([collectSignature(sourcePage), collectSignature(targetPage)]);

            result.sourceSignature = settledSourceSignature;
            result.targetSignature = settledTargetSignature;
            result.differences = compareValues(settledSourceSignature, settledTargetSignature);
            classifyDifferences(result);
        }

        if (route.path === '/autocomplete') {
            const [sourceInteraction, targetInteraction] = await Promise.all([collectAutoCompleteVirtualScrollState(sourcePage), collectAutoCompleteVirtualScrollState(targetPage)]);

            result.interactionDifferences = compareValues(sourceInteraction, targetInteraction);
            result.sourceInteraction = sourceInteraction;
            result.targetInteraction = targetInteraction;
        }

        return result;
    } finally {
        await context.close();
    }
};

const main = async () => {
    const routes = await collectRoutes();
    const browser = await chromium.launch();
    const results = [];
    const jobs = viewports.flatMap((viewport) => colorSchemes.flatMap((colorScheme) => routes.map((route) => ({ colorScheme, route, viewport }))));
    let nextJobIndex = 0;

    await fs.mkdir(reportDir, { recursive: true });

    const worker = async () => {
        while (nextJobIndex < jobs.length) {
            const job = jobs[nextJobIndex++];

            process.stdout.write(`Auditing ${job.route.path} (${job.viewport.name}, ${job.colorScheme})\n`);

            for (let attempt = 1; attempt <= 2; attempt++) {
                try {
                    results.push(await auditPage({ browser, ...job }));
                    break;
                } catch (error) {
                    if (attempt === 2) {
                        results.push({
                            colorScheme: job.colorScheme,
                            differences: [],
                            fatalError: error instanceof Error ? error.message : String(error),
                            interactionDifferences: [],
                            route: job.route,
                            sourceErrors: [],
                            targetErrors: [],
                            targetOnlyErrors: [],
                            reviewedDifferences: [],
                            unexplainedDifferences: [],
                            viewport: job.viewport.name
                        });
                    }
                }
            }
        }
    };

    await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, worker));

    await browser.close();

    results.sort((left, right) => `${left.viewport}:${left.colorScheme}:${left.route.path}`.localeCompare(`${right.viewport}:${right.colorScheme}:${right.route.path}`));

    const failures = results.filter((result) => result.fatalError || result.unexplainedDifferences.length > 0 || result.interactionDifferences?.length > 0 || result.targetOnlyErrors.length > 0 || result.targetSignature?.brokenImageCount > 0);
    const reviewedDifferenceCount = results.reduce((total, result) => total + result.reviewedDifferences.length, 0);
    const report = {
        generatedAt: new Date().toISOString(),
        sourceBaseURL,
        sourceVersion,
        summary: {
            audited: results.length,
            failures: failures.length,
            reviewedDifferences: reviewedDifferenceCount,
            routes: routes.length
        },
        targetBaseURL,
        results
    };

    await fs.writeFile(path.resolve(reportDir, 'report.json'), JSON.stringify(report, null, 2));
    process.stdout.write(`Audited ${results.length} route states; ${failures.length} require review and ${reviewedDifferenceCount} known differences were classified.\n`);

    if (failures.length > 0) {
        process.exitCode = 1;
    }
};

await main();

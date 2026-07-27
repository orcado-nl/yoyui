const { expect, test } = require('@playwright/test');
const { disableLongRunningIntervals, isolateDocumentationPage, waitForDocumentationPage } = require('./helpers');

test.beforeEach(async ({ page }) => {
    await isolateDocumentationPage(page);
    await disableLongRunningIntervals(page);
});

const getSection = (page, heading) => page.locator('section.py-4').filter({ has: page.getByRole('heading', { name: heading, exact: true }) });
const getExampleCardById = (page, id) => page.locator(`#${id}`).locator('xpath=ancestor::*[self::h2 or self::h3 or self::h4][1]/following-sibling::div[contains(concat(" ", normalize-space(@class), " "), " card ")][1]');

test.describe('AutoComplete documentation interactions', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/autocomplete/', { waitUntil: 'domcontentloaded' });
        await waitForDocumentationPage(page);
    });

    test('virtual-scroll dropdown stays aligned while recycling rows', async ({ page }) => {
        const section = getSection(page, 'Virtual Scroll');
        const input = section.getByRole('combobox');
        const chooseButton = section.getByRole('button', { name: 'Choose' });

        await chooseButton.click();

        const panel = page.locator('.p-autocomplete-panel');
        const scroller = panel.locator('.p-virtualscroller');
        const firstItem = panel.getByRole('option', { name: 'Item #0' });

        await expect(panel).toBeVisible();
        await expect(firstItem).toBeVisible();

        const inputBox = await input.boundingBox();
        const panelBox = await panel.boundingBox();
        const firstItemBox = await firstItem.boundingBox();

        expect(inputBox).not.toBeNull();
        expect(panelBox).not.toBeNull();
        expect(firstItemBox).not.toBeNull();
        expect(Math.abs(panelBox.x - inputBox.x)).toBeLessThanOrEqual(1);
        expect(Math.abs(panelBox.width - inputBox.width)).toBeLessThanOrEqual(1);
        expect(panelBox.height).toBe(200);
        expect(firstItemBox.height).toBe(38);

        await scroller.evaluate((element) => {
            element.scrollTop = 600;
            element.dispatchEvent(new Event('scroll'));
        });

        await expect(panel.getByRole('option', { name: 'Item #12' })).toBeVisible();

        const recycledState = await scroller.evaluate((element) => {
            const content = element.querySelector('.p-autocomplete-items');
            const rows = Array.from(element.querySelectorAll('.p-autocomplete-item'));

            return {
                clientHeight: element.clientHeight,
                firstItem: rows[0]?.textContent,
                rowHeights: rows.slice(0, 8).map((row) => row.getBoundingClientRect().height),
                scrollHeight: element.scrollHeight,
                scrollTop: element.scrollTop,
                transform: content?.style.transform
            };
        });

        expect(recycledState).toMatchObject({
            clientHeight: 200,
            firstItem: 'Item #12',
            scrollTop: 600,
            transform: 'translate3d(0px, 456px, 0px)'
        });
        expect(recycledState.scrollHeight).toBeGreaterThan(3_000_000);
        expect(recycledState.rowHeights.every((height) => height === 38)).toBe(true);
    });

    test('filters, selects, closes, and reopens with keyboard controls', async ({ page }) => {
        const section = getSection(page, 'Virtual Scroll');
        const input = section.getByRole('combobox');
        const chooseButton = section.getByRole('button', { name: 'Choose' });
        const panel = page.locator('.p-autocomplete-panel');

        await input.fill('Item #1234');
        await expect(panel.getByRole('option', { name: 'Item #1234', exact: true })).toBeVisible();
        await input.press('ArrowDown');
        await input.press('Enter');

        await expect(input).toHaveValue('Item #1234');
        await expect(panel).toBeHidden();

        await chooseButton.click();
        await expect(panel).toBeVisible();
        await input.press('Escape');
        await expect(panel).toBeHidden();
    });
});

test.describe('VirtualScroller documentation interactions', () => {
    test('vertical scroller preserves item dimensions after a deep scroll', async ({ page }) => {
        await page.goto('/virtualscroller/', { waitUntil: 'domcontentloaded' });
        await waitForDocumentationPage(page);

        const section = getSection(page, 'Basic');
        const scroller = section.locator('.p-virtualscroller');

        await scroller.evaluate((element) => {
            element.scrollTop = 1_250;
            element.dispatchEvent(new Event('scroll'));
        });
        await page.waitForTimeout(100);

        const state = await scroller.evaluate((element) => {
            const items = Array.from(element.querySelectorAll('.p-virtualscroller-content > div'));

            return {
                clientHeight: element.clientHeight,
                firstItemText: items[0]?.textContent?.trim(),
                itemHeights: items.slice(0, 8).map((item) => item.getBoundingClientRect().height),
                scrollTop: element.scrollTop
            };
        });

        expect(state.scrollTop).toBe(1_250);
        expect(state.clientHeight).toBe(198);
        expect(state.itemHeights.length).toBeGreaterThan(0);
        expect(state.itemHeights.every((height) => height === 50)).toBe(true);
        expect(state.firstItemText).toMatch(/Item #/);
    });
});

test.describe('Calendar documentation migration parity', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/calendar/', { waitUntil: 'domcontentloaded' });
        await waitForDocumentationPage(page);
    });

    test('the long documentation page retains vertical scrolling', async ({ page }) => {
        const initialState = await page.evaluate(() => ({
            bodyOverflowY: getComputedStyle(document.body).overflowY,
            clientHeight: document.documentElement.clientHeight,
            scrollHeight: document.documentElement.scrollHeight,
            scrollY: window.scrollY
        }));

        expect(initialState.bodyOverflowY).toBe('auto');
        expect(initialState.scrollHeight).toBeGreaterThan(initialState.clientHeight);
        expect(initialState.scrollY).toBe(0);

        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    });

    test('icon inputs and triggers preserve the PrimeReact 10 compact geometry', async ({ page }) => {
        const section = getSection(page, 'Icon');
        const controls = section.locator('.card .p-calendar');

        await expect(controls).toHaveCount(3);
        await controls.first().scrollIntoViewIfNeeded();

        const geometry = await controls.evaluateAll((elements) => {
            const rounded = (value) => Math.round(value * 10) / 10;

            return elements.map((root) => {
                const input = root.querySelector('.p-inputtext');
                const trigger = root.querySelector('.p-datepicker-trigger');
                const icon = trigger?.querySelector('svg.p-icon, .pi-clock');

                if (!input || !trigger || !icon) {
                    throw new Error('Calendar icon example is missing an input, trigger, or icon');
                }

                const rootBox = root.getBoundingClientRect();
                const inputBox = input.getBoundingClientRect();
                const triggerBox = trigger.getBoundingClientRect();
                const iconBox = icon.getBoundingClientRect();

                return {
                    connectedEdgeGap: rounded(triggerBox.left - inputBox.right),
                    iconCenterXDifference: rounded(iconBox.left + iconBox.width / 2 - (triggerBox.left + triggerBox.width / 2)),
                    iconCenterYDifference: rounded(iconBox.top + iconBox.height / 2 - (triggerBox.top + triggerBox.height / 2)),
                    inputHeight: rounded(inputBox.height),
                    rootHeight: rounded(rootBox.height),
                    triggerHeight: rounded(triggerBox.height),
                    triggerWidth: rounded(triggerBox.width)
                };
            });
        });

        expect(await page.locator('html').evaluate((element) => getComputedStyle(element).fontSize)).toBe('14px');

        for (const control of geometry) {
            expect(control.rootHeight).toBeLessThanOrEqual(41);
            expect(Math.abs(control.inputHeight - control.triggerHeight)).toBeLessThanOrEqual(0.5);
            expect(Math.abs(control.rootHeight - control.triggerHeight)).toBeLessThanOrEqual(0.5);
            expect(Math.abs(control.triggerWidth - 42)).toBeLessThanOrEqual(0.5);
            expect(Math.abs(control.connectedEdgeGap)).toBeLessThanOrEqual(0.5);
            expect(Math.abs(control.iconCenterXDifference)).toBeLessThanOrEqual(0.5);
            expect(Math.abs(control.iconCenterYDifference)).toBeLessThanOrEqual(0.5);
        }
    });

    test('icon trigger opens an aligned popup without disabling page scrolling', async ({ page }) => {
        const section = getSection(page, 'Icon');
        const calendar = section.locator('.p-calendar').first();
        const trigger = calendar.locator('.p-datepicker-trigger');

        await calendar.scrollIntoViewIfNeeded();
        await trigger.click();

        const panel = page.locator('.p-datepicker:not(.p-datepicker-inline)');

        await expect(panel).toBeVisible();

        const calendarBox = await calendar.boundingBox();
        const panelBox = await panel.boundingBox();
        const viewport = page.viewportSize();
        const bodyOverflowY = await page.locator('body').evaluate((element) => getComputedStyle(element).overflowY);
        const verticalGap = Math.min(Math.abs(panelBox.y - (calendarBox.y + calendarBox.height)), Math.abs(panelBox.y + panelBox.height - calendarBox.y));

        expect(calendarBox).not.toBeNull();
        expect(panelBox).not.toBeNull();
        expect(viewport).not.toBeNull();
        expect(Math.abs(panelBox.x - calendarBox.x)).toBeLessThanOrEqual(1);
        expect(verticalGap).toBeLessThanOrEqual(1);
        expect(panelBox.x).toBeGreaterThanOrEqual(0);
        expect(panelBox.y).toBeGreaterThanOrEqual(0);
        expect(panelBox.x + panelBox.width).toBeLessThanOrEqual(viewport.width + 1);
        expect(panelBox.y + panelBox.height).toBeLessThanOrEqual(viewport.height + 1);
        expect(bodyOverflowY).toBe('auto');

        await page.keyboard.press('Escape');
        await expect(panel).toBeHidden();
    });
});

test.describe('selection overlay documentation interactions', () => {
    const overlayCases = [
        { control: '.p-dropdown', heading: 'Basic', panel: '.p-dropdown-panel', route: '/dropdown/' },
        { control: '.p-multiselect', heading: 'Basic', panel: '.p-multiselect-panel', route: '/multiselect/' },
        { control: '.p-treeselect', heading: 'Basic', panel: '.p-treeselect-panel', route: '/treeselect/' },
        { control: '.p-cascadeselect', heading: 'Basic', panel: 'div.p-cascadeselect-panel', route: '/cascadeselect/' }
    ];

    for (const overlayCase of overlayCases) {
        test(`${overlayCase.route} opens an anchored, viewport-contained panel`, async ({ page }) => {
            await page.goto(overlayCase.route, { waitUntil: 'domcontentloaded' });
            await waitForDocumentationPage(page);

            const section = getSection(page, overlayCase.heading);
            const control = section.locator(overlayCase.control);
            const panel = page.locator(overlayCase.panel);

            await control.click();
            await expect(panel).toBeVisible();

            const controlBox = await control.boundingBox();
            const panelBox = await panel.boundingBox();
            const viewport = page.viewportSize();

            expect(controlBox).not.toBeNull();
            expect(panelBox).not.toBeNull();
            expect(viewport).not.toBeNull();
            expect(Math.abs(panelBox.x - controlBox.x)).toBeLessThanOrEqual(1);
            expect(panelBox.x).toBeGreaterThanOrEqual(0);
            expect(panelBox.y).toBeGreaterThanOrEqual(0);
            expect(panelBox.x + panelBox.width).toBeLessThanOrEqual(viewport.width + 1);
            expect(panelBox.y + panelBox.height).toBeLessThanOrEqual(viewport.height + 1);

            await page.keyboard.press('Escape');
            await expect(panel).toBeHidden();
        });
    }
});

test.describe('dialog and popup documentation interactions', () => {
    test('dialog opens, remains in the viewport, and closes with Escape', async ({ page }) => {
        await page.goto('/dialog/', { waitUntil: 'domcontentloaded' });
        await waitForDocumentationPage(page);

        await getSection(page, 'Basic').getByRole('button', { name: 'Show' }).click();

        const dialog = page.getByRole('dialog', { name: 'Header' });

        await expect(dialog).toBeVisible();

        const box = await dialog.boundingBox();
        const viewport = page.viewportSize();

        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
        expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);

        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
    });

    test('overlay panel stays anchored to its trigger', async ({ page }) => {
        await page.goto('/overlaypanel/', { waitUntil: 'domcontentloaded' });
        await waitForDocumentationPage(page);

        const trigger = getSection(page, 'Basic').getByRole('button', { name: 'Image' });

        await trigger.evaluate((element) => element.scrollIntoView({ block: 'center' }));
        await trigger.click();

        const panel = page.locator('.p-overlaypanel');

        await expect(panel).toBeVisible();
        await expect(panel.getByRole('img', { name: 'Bamboo Watch' })).toBeVisible();

        const triggerBox = await trigger.boundingBox();
        const panelBox = await panel.boundingBox();
        const viewport = page.viewportSize();
        const verticalGap = Math.min(Math.abs(panelBox.y - (triggerBox.y + triggerBox.height)), Math.abs(panelBox.y + panelBox.height - triggerBox.y));

        expect(Math.abs(panelBox.x - triggerBox.x)).toBeLessThanOrEqual(Math.max(1, panelBox.width - triggerBox.width));
        expect(verticalGap).toBeLessThanOrEqual(15);
        expect(panelBox.x).toBeGreaterThanOrEqual(0);
        expect(panelBox.y).toBeGreaterThanOrEqual(0);
        expect(panelBox.x + panelBox.width).toBeLessThanOrEqual(viewport.width + 1);
        expect(panelBox.y + panelBox.height).toBeLessThanOrEqual(viewport.height + 1);
    });

    test('sidebar opens and closes without leaking blocked body scrolling', async ({ page }) => {
        await page.goto('/sidebar/', { waitUntil: 'domcontentloaded' });
        await waitForDocumentationPage(page);

        await getSection(page, 'Basic').locator('.card').first().locator('button.p-button').click();

        const sidebar = page.locator('.p-sidebar');

        await expect(sidebar).toBeVisible();
        await sidebar.getByRole('button', { name: 'Close' }).click();
        await expect(sidebar).toBeHidden();
        await expect(page.locator('body')).not.toHaveClass(/p-overflow-hidden/);
    });

    test('popup menu opens on the requested side and closes with Escape', async ({ page }) => {
        await page.goto('/menu/', { waitUntil: 'domcontentloaded' });
        await waitForDocumentationPage(page);

        await getSection(page, 'Popup').getByRole('button', { name: 'Show Left' }).click();

        const menu = page.locator('#popup_menu_left');

        await expect(menu).toBeVisible();
        await expect(menu.getByText('Refresh', { exact: true })).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(menu).toBeHidden();
    });
});

test.describe('data and media documentation interactions', () => {
    test('DataTable vertical scrolling retains its header and scroll position', async ({ page }) => {
        await page.goto('/datatable/', { waitUntil: 'domcontentloaded' });
        await waitForDocumentationPage(page);

        const section = getSection(page, 'Vertical');
        const wrapper = section.locator('.p-datatable-wrapper');

        await section.scrollIntoViewIfNeeded();
        await wrapper.waitFor({ state: 'visible' });
        await wrapper.evaluate((element) => {
            element.scrollTop = 250;
            element.dispatchEvent(new Event('scroll'));
        });

        await expect(section.locator('.p-datatable-thead')).toBeVisible();
        expect(await wrapper.evaluate((element) => element.scrollTop)).toBe(250);
    });

    test('DataTable pagination, row selection, and frozen columns remain interactive', async ({ page }) => {
        await page.goto('/datatable/', { waitUntil: 'domcontentloaded' });
        await waitForDocumentationPage(page);

        const paginatorCard = getExampleCardById(page, 'paginator_basic');
        const paginatorRows = paginatorCard.locator('.p-datatable-tbody > tr');

        await paginatorCard.scrollIntoViewIfNeeded();
        await expect(paginatorRows.first()).toBeVisible();
        const firstPageValue = await paginatorRows.first().locator('td').first().textContent();

        await paginatorCard.getByLabel('Next Page').click();
        await expect.poll(() => paginatorRows.first().locator('td').first().textContent()).not.toBe(firstPageValue);

        const selectionCard = getExampleCardById(page, 'single_row_selection');
        const selectedRow = selectionCard.locator('.p-datatable-tbody > tr').first();

        await selectionCard.scrollIntoViewIfNeeded();
        await selectedRow.click();
        await expect(selectedRow).toHaveAttribute('data-p-highlight', 'true');

        const frozenCard = getExampleCardById(page, 'frozen_columns');
        const frozenCell = frozenCard.locator('.p-frozen-column').first();
        const frozenWrapper = frozenCard.locator('.p-datatable-wrapper');

        await frozenCard.scrollIntoViewIfNeeded();
        await expect(frozenCell).toBeVisible();
        const initialFrozenBox = await frozenCell.boundingBox();

        await frozenWrapper.evaluate((element) => {
            element.scrollLeft = 500;
            element.dispatchEvent(new Event('scroll'));
        });

        const scrolledFrozenBox = await frozenCell.boundingBox();

        expect(Math.abs(scrolledFrozenBox.x - initialFrozenBox.x)).toBeLessThanOrEqual(1);
    });

    test('Carousel advances without changing its viewport dimensions', async ({ page }) => {
        await page.goto('/carousel/', { waitUntil: 'domcontentloaded' });
        await waitForDocumentationPage(page);

        const section = getSection(page, 'Basic');
        const viewport = section.locator('.p-carousel-items-content');
        const nextButton = section.locator('.p-carousel-next');
        const initialBox = await viewport.boundingBox();
        const initialTransform = await section.locator('.p-carousel-items-container').evaluate((element) => getComputedStyle(element).transform);

        await nextButton.click();

        await expect.poll(() => section.locator('.p-carousel-items-container').evaluate((element) => getComputedStyle(element).transform)).not.toBe(initialTransform);

        const updatedBox = await viewport.boundingBox();

        expect(Math.abs(updatedBox.width - initialBox.width)).toBeLessThanOrEqual(1);
        expect(Math.abs(updatedBox.height - initialBox.height)).toBeLessThanOrEqual(1);
    });

    test('Galleria thumbnail navigation changes the image without shifting its frame', async ({ page }) => {
        await page.goto('/galleria/', { waitUntil: 'domcontentloaded' });
        await waitForDocumentationPage(page);

        const section = getExampleCardById(page, 'basic');
        const frame = section.locator('.p-galleria-content');
        const mainImage = section.locator('.p-galleria-item img');
        const thumbnails = section.locator('.p-galleria-thumbnail-item');

        await section.scrollIntoViewIfNeeded();
        await expect(thumbnails.nth(1)).toBeVisible();
        const initialFrame = await frame.boundingBox();
        const initialSource = await mainImage.getAttribute('src');

        await thumbnails.nth(1).click();
        await expect(mainImage).not.toHaveAttribute('src', initialSource);

        const updatedFrame = await frame.boundingBox();

        expect(Math.abs(updatedFrame.width - initialFrame.width)).toBeLessThanOrEqual(1);
        expect(Math.abs(updatedFrame.height - initialFrame.height)).toBeLessThanOrEqual(1);
    });

    test('Image preview opens and exposes its transformation controls', async ({ page }) => {
        await page.goto('/image/', { waitUntil: 'domcontentloaded' });
        await waitForDocumentationPage(page);

        const section = getSection(page, 'Preview');

        await section.getByRole('button', { name: 'Zoom Image' }).click();

        const preview = page.locator('.p-image-mask');

        await expect(preview).toBeVisible();
        await expect(preview.locator('.p-image-toolbar')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(preview).toBeHidden();
    });

    test('Splitter resizing and FileUpload selection preserve usable control states', async ({ page }) => {
        await page.goto('/splitter/', { waitUntil: 'domcontentloaded' });
        await waitForDocumentationPage(page);

        const splitterSection = getExampleCardById(page, 'horizontal');
        const firstPanel = splitterSection.locator('.p-splitter-panel').first();
        const gutter = splitterSection.locator('.p-splitter-gutter');

        await splitterSection.scrollIntoViewIfNeeded();
        const initialPanel = await firstPanel.boundingBox();
        const gutterBox = await gutter.boundingBox();

        await page.mouse.move(gutterBox.x + gutterBox.width / 2, gutterBox.y + gutterBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(gutterBox.x + gutterBox.width / 2 + 40, gutterBox.y + gutterBox.height / 2, { steps: 5 });
        await page.mouse.up();
        await expect.poll(async () => (await firstPanel.boundingBox()).width).toBeGreaterThan(initialPanel.width + 20);

        await page.goto('/fileupload/', { waitUntil: 'domcontentloaded' });
        await waitForDocumentationPage(page);

        const uploadSection = getExampleCardById(page, 'advanced');
        const input = uploadSection.locator('input[type="file"]');
        const uploadButton = uploadSection.locator('.p-fileupload-buttonbar button').filter({ hasText: 'Upload' });
        const cancelButton = uploadSection.locator('.p-fileupload-buttonbar button').filter({ hasText: 'Cancel' });

        await uploadSection.scrollIntoViewIfNeeded();
        await expect(uploadButton).toBeDisabled();
        await expect(cancelButton).toBeDisabled();
        await input.setInputFiles({
            buffer: Buffer.from('visual parity'),
            mimeType: 'image/png',
            name: 'visual-parity.png'
        });

        await expect(uploadSection.getByText('visual-parity.png', { exact: true })).toBeVisible();
        await expect(uploadButton).toBeEnabled();
        await expect(cancelButton).toBeEnabled();
        await cancelButton.click();
        await expect(uploadSection.getByText('Drag and drop files to here to upload.')).toBeVisible();
    });
});

test.describe('panel and tooltip documentation interactions', () => {
    test('TabView and Accordion update their visible panels', async ({ page }) => {
        await page.goto('/tabview/', { waitUntil: 'domcontentloaded' });
        await waitForDocumentationPage(page);

        const tabSection = getSection(page, 'Basic');
        const secondTab = tabSection.getByRole('tab', { name: 'Header II', exact: true });

        await secondTab.click();
        await expect(secondTab).toHaveAttribute('aria-selected', 'true');

        await page.goto('/accordion/', { waitUntil: 'domcontentloaded' });
        await waitForDocumentationPage(page);

        const accordionSection = getSection(page, 'Basic');
        const secondHeader = accordionSection.getByRole('button', { name: 'Header II', exact: true });

        await secondHeader.click();
        await expect(secondHeader).toHaveAttribute('aria-expanded', 'true');
    });

    test('Tooltip appears on hover and stays inside the viewport', async ({ page }) => {
        await page.goto('/tooltip/', { waitUntil: 'domcontentloaded' });
        await waitForDocumentationPage(page);

        const target = getSection(page, 'Position').getByPlaceholder('Right');

        await target.hover();

        const tooltip = page.getByRole('tooltip');

        await expect(tooltip).toBeVisible();

        const box = await tooltip.boundingBox();
        const viewport = page.viewportSize();

        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
        expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
    });
});

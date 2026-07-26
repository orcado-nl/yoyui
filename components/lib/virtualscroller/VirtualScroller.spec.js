import '@testing-library/jest-dom';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { DomHandler } from '../utils/Utils';
import { VirtualScroller } from './VirtualScroller';

describe('VirtualScroller', () => {
    let getHeightSpy;
    let getWidthSpy;
    let isVisibleSpy;
    let getBoundingClientRect;
    let getComputedStyle;
    let offsetHeight;
    let offsetWidth;
    let scrollTo;

    beforeEach(() => {
        getHeightSpy = jest.spyOn(DomHandler, 'getHeight').mockReturnValue(200);
        getWidthSpy = jest.spyOn(DomHandler, 'getWidth').mockReturnValue(200);
        isVisibleSpy = jest.spyOn(DomHandler, 'isVisible').mockReturnValue(true);
        getComputedStyle = window.getComputedStyle;
        window.getComputedStyle = () => ({
            bottom: '0px',
            left: '0px',
            paddingBottom: '0px',
            paddingLeft: '0px',
            paddingRight: '0px',
            paddingTop: '0px',
            right: '0px',
            top: '0px'
        });
        offsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
        offsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
        Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => 200 });
        Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => 200 });
        getBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
        HTMLElement.prototype.getBoundingClientRect = () => ({
            bottom: 200,
            height: 200,
            left: 0,
            right: 200,
            top: 0,
            width: 200,
            x: 0,
            y: 0,
            toJSON: () => {}
        });
        scrollTo = HTMLElement.prototype.scrollTo;

        HTMLElement.prototype.scrollTo = function scrollToPosition(options) {
            this.scrollLeft = options.left || 0;
            this.scrollTop = options.top || 0;
        };
    });

    afterEach(() => {
        getHeightSpy.mockRestore();
        getWidthSpy.mockRestore();
        isVisibleSpy.mockRestore();
        window.getComputedStyle = getComputedStyle;
        Object.defineProperty(HTMLElement.prototype, 'offsetHeight', offsetHeight);
        Object.defineProperty(HTMLElement.prototype, 'offsetWidth', offsetWidth);
        HTMLElement.prototype.getBoundingClientRect = getBoundingClientRect;
        HTMLElement.prototype.scrollTo = scrollTo;
    });

    test('calculates a stable rendered range and scrolls to an item through its public ref', async () => {
        const ref = createRef();
        const items = Array.from({ length: 1_000 }, (_, index) => `Item #${index}`);
        const { container } = render(
            <VirtualScroller
                ref={ref}
                items={items}
                itemSize={50}
                itemTemplate={(item, options) => <div style={{ height: `${options.props.itemSize}px` }}>{item}</div>}
                scrollHeight="200px"
                scrollWidth="200px"
                style={{ height: '200px', width: '200px' }}
                unstyled
            />
        );
        const scroller = container.querySelector('.p-virtualscroller');

        await waitFor(() => expect(ref.current.getRenderedRange().viewport.last).toBeGreaterThan(0));

        act(() => ref.current.scrollToIndex(25));
        fireEvent.scroll(scroller);

        await waitFor(() => {
            const range = ref.current.getRenderedRange();

            expect(scroller.scrollTop).toBe(1_250);
            expect(range.viewport.first).toBe(25);
            expect(range.viewport.last).toBeGreaterThan(range.viewport.first);
        });
    });
});

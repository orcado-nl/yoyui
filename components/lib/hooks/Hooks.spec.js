import '@testing-library/jest-dom';
import { act, renderHook } from '@testing-library/react';
import { useCounter } from './useCounter';
import { useEventListener } from './useEventListener';
import { useIntersectionObserver } from './useIntersectionObserver';
import { useLocalStorage } from './useStorage';
import { useMatchMedia } from './useMatchMedia';

describe('hooks', () => {
    describe('useCounter', () => {
        test('applies partial options, boundaries and the initial reset value', () => {
            const { result } = renderHook(() => useCounter(2, { min: 1, max: 3 }));

            act(() => {
                result.current.decrement();
                result.current.decrement();
            });
            expect(result.current.count).toBe(1);

            act(() => {
                result.current.increment();
                result.current.increment();
                result.current.increment();
            });
            expect(result.current.count).toBe(3);

            act(() => result.current.reset());
            expect(result.current.count).toBe(2);
        });

        test('supports zero as a maximum', () => {
            const { result } = renderHook(() => useCounter(0, { max: 0 }));

            act(() => result.current.increment());

            expect(result.current.count).toBe(0);
        });
    });

    describe('useEventListener', () => {
        test('uses the latest listener without rebinding', () => {
            const callback = jest.fn();
            const { result, rerender } = renderHook(({ value }) => useEventListener({ type: 'click', listener: () => callback(value) }), {
                initialProps: { value: 'first' }
            });

            act(() => result.current[0]());
            document.dispatchEvent(new MouseEvent('click'));
            rerender({ value: 'second' });
            document.dispatchEvent(new MouseEvent('click'));

            expect(callback.mock.calls).toEqual([['first'], ['second']]);
        });

        test('moves an active listener to a changed target and cleans it up', () => {
            const firstTarget = document.createElement('div');
            const secondTarget = document.createElement('div');
            const callback = jest.fn();

            document.body.append(firstTarget, secondTarget);

            const { result, rerender, unmount } = renderHook(({ target }) => useEventListener({ target, type: 'click', listener: callback }), {
                initialProps: { target: firstTarget }
            });

            act(() => result.current[0]());
            rerender({ target: secondTarget });
            firstTarget.dispatchEvent(new MouseEvent('click'));
            secondTarget.dispatchEvent(new MouseEvent('click'));

            expect(callback).toHaveBeenCalledTimes(1);

            unmount();
            secondTarget.dispatchEvent(new MouseEvent('click'));
            expect(callback).toHaveBeenCalledTimes(1);

            firstTarget.remove();
            secondTarget.remove();
        });

        test('honors an explicit false when binding with overrides', () => {
            const target = document.createElement('div');
            const callback = jest.fn();
            const { result } = renderHook(() => useEventListener({ type: 'click', listener: callback }));

            act(() => result.current[0]({ target, when: false }));
            target.dispatchEvent(new MouseEvent('click'));

            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('useLocalStorage', () => {
        beforeEach(() => window.localStorage.clear());

        test('applies sequential functional updates and follows key changes', () => {
            const { result, rerender } = renderHook(({ storageKey }) => useLocalStorage(0, storageKey), {
                initialProps: { storageKey: 'first' }
            });

            act(() => {
                result.current[1]((value) => value + 1);
                result.current[1]((value) => value + 1);
            });

            expect(result.current[0]).toBe(2);
            expect(window.localStorage.getItem('first')).toBe('2');

            window.localStorage.setItem('second', '7');
            rerender({ storageKey: 'second' });
            expect(result.current[0]).toBe(7);
        });

        test('removes values that serialize to undefined', () => {
            const { result } = renderHook(() => useLocalStorage('value', 'key'));

            act(() => result.current[1](undefined));

            expect(result.current[0]).toBeUndefined();
            expect(window.localStorage.getItem('key')).toBeNull();
        });
    });

    describe('useIntersectionObserver', () => {
        test('does not recreate the observer after its default callback updates state', () => {
            let observerCallback;
            const disconnect = jest.fn();
            const observe = jest.fn();
            const originalIntersectionObserver = global.IntersectionObserver;

            global.IntersectionObserver = jest.fn((callback) => {
                observerCallback = callback;

                return { disconnect, observe };
            });

            const element = document.createElement('div');
            const ref = { current: element };
            const { result, unmount } = renderHook(() => useIntersectionObserver(ref, { threshold: [0, 0.5] }));

            act(() => observerCallback([{ isIntersecting: true }]));

            expect(result.current).toBe(true);
            expect(global.IntersectionObserver).toHaveBeenCalledTimes(1);
            expect(global.IntersectionObserver).toHaveBeenCalledWith(expect.any(Function), { root: null, rootMargin: undefined, threshold: [0, 0.5] });
            expect(observe).toHaveBeenCalledWith(element);

            unmount();
            expect(disconnect).toHaveBeenCalledTimes(1);
            global.IntersectionObserver = originalIntersectionObserver;
        });
    });

    describe('useMatchMedia', () => {
        test('tracks changes and removes the listener when disabled', () => {
            let changeListener;
            const removeEventListener = jest.fn();
            const originalMatchMedia = window.matchMedia;

            window.matchMedia = jest.fn(() => ({
                matches: true,
                addEventListener: jest.fn((type, listener) => {
                    changeListener = listener;
                }),
                removeEventListener
            }));

            const { result, rerender } = renderHook(({ when }) => useMatchMedia('(min-width: 1px)', when), {
                initialProps: { when: true }
            });

            expect(result.current).toBe(true);
            act(() => changeListener({ matches: false }));
            expect(result.current).toBe(false);

            rerender({ when: false });
            expect(removeEventListener).toHaveBeenCalledWith('change', changeListener);
            expect(result.current).toBe(false);

            window.matchMedia = originalMatchMedia;
        });
    });
});

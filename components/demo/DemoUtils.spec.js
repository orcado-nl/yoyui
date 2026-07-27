import { getDemoDelay, isVisualTestMode } from './DemoUtils';

const VISUAL_TEST_FLAG = '__YOYUI_VISUAL_TEST__';

describe('DemoUtils', () => {
    afterEach(() => {
        delete globalThis[VISUAL_TEST_FLAG];
    });

    test('uses the requested delay outside visual tests', () => {
        expect(isVisualTestMode()).toBe(false);
        expect(getDemoDelay(350)).toBe(350);
    });

    test('eliminates demo delays in visual-test mode', () => {
        globalThis[VISUAL_TEST_FLAG] = true;

        expect(isVisualTestMode()).toBe(true);
        expect(getDemoDelay(350)).toBe(0);
        expect(getDemoDelay(250, 1000)).toBe(0);
    });
});

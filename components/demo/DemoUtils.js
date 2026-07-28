const VISUAL_TEST_FLAG = '__YOYUI_VISUAL_TEST__';

export const isVisualTestMode = () => Boolean(globalThis[VISUAL_TEST_FLAG]);

export const getDemoDelay = (minimumDelay, maximumRandomDelay = 0) => {
    if (isVisualTestMode()) {
        return 0;
    }

    const randomDelay = maximumRandomDelay > 0 ? (globalThis.crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32) * maximumRandomDelay : 0;

    return minimumDelay + randomDelay;
};

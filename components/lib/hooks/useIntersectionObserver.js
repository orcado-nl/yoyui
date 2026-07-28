import * as React from 'react';

export const useIntersectionObserver = (ref, options = {}) => {
    const [isElementVisible, setIsElementVisible] = React.useState(false);
    const { root = null, rootMargin, threshold } = options;
    const isThresholdArray = Array.isArray(threshold);
    const thresholdKey = Array.isArray(threshold) ? threshold.join(',') : threshold;

    React.useEffect(() => {
        if (!ref.current || typeof IntersectionObserver === 'undefined') {
            return;
        }

        const observerThreshold = isThresholdArray ? (thresholdKey ? thresholdKey.split(',').map(Number) : []) : thresholdKey;
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsElementVisible(entry.isIntersecting);
            },
            { root, rootMargin, threshold: observerThreshold }
        );

        observer.observe(ref.current);

        return () => {
            observer.disconnect();
        };
    }, [isThresholdArray, ref, root, rootMargin, thresholdKey]);

    return isElementVisible;
};

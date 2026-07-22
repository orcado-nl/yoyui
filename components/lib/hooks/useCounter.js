import * as React from 'react';

export const useCounter = (initialValue = 0, options = {}) => {
    const [count, setCount] = React.useState(initialValue);
    const step = options.step ?? 1;

    const increment = () => {
        setCount((currentCount) => {
            const nextCount = currentCount + step;

            return options.max == null ? nextCount : Math.min(nextCount, options.max);
        });
    };

    const decrement = () => {
        setCount((currentCount) => {
            const nextCount = currentCount - step;

            return options.min == null ? nextCount : Math.max(nextCount, options.min);
        });
    };

    const reset = () => {
        setCount(initialValue);
    };

    return {
        count,
        increment,
        decrement,
        reset
    };
};

export default useCounter;

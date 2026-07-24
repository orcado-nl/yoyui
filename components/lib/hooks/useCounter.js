import * as React from 'react';

export const useCounter = (initialValue = 0, options = {}) => {
    const [count, setCount] = React.useState(initialValue);
    const { max, min, step = 1 } = options;

    const increment = () => {
        setCount((currentCount) => {
            const nextCount = currentCount + step;

            return max == null ? nextCount : Math.min(nextCount, max);
        });
    };

    const decrement = () => {
        setCount((currentCount) => {
            const nextCount = currentCount - step;

            return min == null ? nextCount : Math.max(nextCount, min);
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

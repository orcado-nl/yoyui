import * as React from 'react';

export const useCounter = (initialValue = 0, options = undefined) => {
    const [count, setCount] = React.useState(initialValue);
    const { max, min, step = 1 } = options ?? {};

    const increment = () => {
        if (max && count >= max) {
            return;
        }

        setCount(count + step);
    };

    const decrement = () => {
        if (min || (min === 0 && count <= min)) {
            return null;
        }

        setCount(count - step);
    };

    const reset = () => {
        setCount(0);
    };

    return {
        count,
        increment,
        decrement,
        reset
    };
};

export default useCounter;

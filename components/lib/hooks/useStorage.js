import * as React from 'react';
import { useEventListener } from './useEventListener';

/**
 * Hook to wrap around useState that stores the value in the browser local/session storage.
 *
 * @param {any} initialValue the initial value to store
 * @param {string} key the key to store the value in local/session storage
 * @param {string} storage either 'local' or 'session' for what type of storage
 * @returns a stateful value, and a function to update it.
 */
export const useStorage = (initialValue, key, storage = 'local') => {
    // Since the local storage API isn't available in server-rendering environments,
    // we check that typeof window !== 'undefined' to make SSR and SSG work properly.
    const storageAvailable = typeof window !== 'undefined';
    const [storedValue, setStoredValue] = React.useState(initialValue);
    const initialValueRef = React.useRef(initialValue);
    const storedValueRef = React.useRef(initialValue);

    initialValueRef.current = initialValue;

    const getStorage = React.useCallback(() => {
        if (!storageAvailable) {
            return null;
        }

        return storage === 'local' ? window.localStorage : window.sessionStorage;
    }, [storage, storageAvailable]);

    const updateStoredValue = React.useCallback((value) => {
        storedValueRef.current = value;
        setStoredValue(value);
    }, []);

    // subscribe to window storage event so changes in one tab to a stored value
    // are properly reflected in all tabs
    const [bindWindowStorageListener, unbindWindowStorageListener] = useEventListener({
        target: 'window',
        type: 'storage',
        listener: (event) => {
            const area = getStorage();

            if (event.storageArea === area && event.key === key) {
                try {
                    updateStoredValue(event.newValue ? JSON.parse(event.newValue) : undefined);
                } catch {
                    updateStoredValue(initialValueRef.current);
                }
            }
        }
    });

    const setValue = React.useCallback(
        (value) => {
            const area = getStorage();

            try {
                // Allow value to be a function so we have same API as useState
                const valueToStore = typeof value === 'function' ? value(storedValueRef.current) : value;
                const serializedValue = JSON.stringify(valueToStore);

                if (area) {
                    if (serializedValue === undefined) {
                        area.removeItem(key);
                    } else {
                        area.setItem(key, serializedValue);
                    }
                }

                updateStoredValue(valueToStore);
            } catch (error) {
                throw new Error(`PrimeReact useStorage: Failed to serialize the value at key: ${key}`, { cause: error });
            }
        },
        [getStorage, key, updateStoredValue]
    );

    React.useEffect(() => {
        const area = getStorage();

        if (!area) {
            updateStoredValue(initialValueRef.current);

            return;
        }

        try {
            const item = area.getItem(key);

            updateStoredValue(item ? JSON.parse(item) : initialValueRef.current);
        } catch (error) {
            console.warn(`PrimeReact useStorage: Failed to read the value at key: ${key}`, error); // eslint-disable-line no-console
            updateStoredValue(initialValueRef.current);
        }

        bindWindowStorageListener();

        return () => unbindWindowStorageListener();
    }, [bindWindowStorageListener, getStorage, key, unbindWindowStorageListener, updateStoredValue]);

    return [storedValue, setValue];
};

/**
 * Hook to wrap around useState that stores the value in the browser local storage.
 *
 * @param {any} initialValue the initial value to store
 * @param {string} key the key to store the value in local storage
 * @returns a stateful value, and a function to update it.
 */
export const useLocalStorage = (initialValue, key) => {
    return useStorage(initialValue, key, 'local');
};

/**
 * Hook to wrap around useState that stores the value in the browser session storage.
 *
 * @param {any} initialValue the initial value to store
 * @param {string} key the key to store the value in session storage
 * @returns a stateful value, and a function to update it.
 */
export const useSessionStorage = (initialValue, key) => {
    return useStorage(initialValue, key, 'session');
};

import * as React from 'react';

export const useMatchMedia = (query, when = true) => {
    const [matches, setMatches] = React.useState(false);

    React.useEffect(() => {
        if (!when || typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            setMatches(false);

            return;
        }

        const mediaQueryList = window.matchMedia(query);
        const handleChange = (event) => setMatches(event.matches);

        setMatches(mediaQueryList.matches);

        if (mediaQueryList.addEventListener) {
            mediaQueryList.addEventListener('change', handleChange);
        } else {
            mediaQueryList.addListener(handleChange);
        }

        return () => {
            if (mediaQueryList.removeEventListener) {
                mediaQueryList.removeEventListener('change', handleChange);
            } else {
                mediaQueryList.removeListener(handleChange);
            }
        };
    }, [query, when]);

    return matches;
};

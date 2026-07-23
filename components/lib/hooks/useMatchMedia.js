/* eslint-disable react-hooks/exhaustive-deps */
import * as React from 'react';

export const useMatchMedia = (query, when = true) => {
    const [matches, setMatches] = React.useState(false);
    const matchMedia = React.useRef(null);

    const handleChange = (e) => setMatches(e.matches);
    const bind = () => matchMedia.current?.addEventListener('change', handleChange);
    const unbind = () => matchMedia.current?.removeEventListener('change', handleChange) && (matchMedia.current = null);

    React.useEffect(() => {
        if (when) {
            matchMedia.current = window.matchMedia(query);
            setMatches(matchMedia.current.matches);

            bind();
        }

        return unbind;
    }, [query, when]);

    return matches;
};
/* eslint-enable */

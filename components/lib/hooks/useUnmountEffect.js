/* eslint-disable react-hooks/exhaustive-deps */
import * as React from 'react';

export const useUnmountEffect = (fn) => React.useEffect(() => fn, []);
/* eslint-enable */

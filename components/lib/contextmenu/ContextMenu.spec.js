import { render } from '@testing-library/react';
import React from 'react';
import { ContextMenu } from './ContextMenu';

describe('ContextMenu', () => {
    test('initializes its active item path as an empty collection in strict mode', () => {
        expect(() =>
            render(
                <React.StrictMode>
                    <ContextMenu model={[{ label: 'View' }]} />
                </React.StrictMode>
            )
        ).not.toThrow();
    });
});

import { fireEvent, render } from '@testing-library/react';
import { DeferredContent } from './DeferredContent';

describe('DeferredContent', () => {
    test('does not forward its component onLoad callback to the root element', () => {
        const onLoad = jest.fn();
        const { container } = render(<DeferredContent onLoad={onLoad}>Loaded</DeferredContent>);

        expect(onLoad).toHaveBeenCalledTimes(1);
        fireEvent.load(container.firstChild);
        expect(onLoad).toHaveBeenCalledTimes(1);
    });

    test('supports the legacy lowercase callback without forwarding it', () => {
        const onload = jest.fn();
        const { container } = render(<DeferredContent onload={onload}>Loaded</DeferredContent>);

        expect(onload).toHaveBeenCalledTimes(1);
        fireEvent.load(container.firstChild);
        expect(onload).toHaveBeenCalledTimes(1);
    });
});

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
});

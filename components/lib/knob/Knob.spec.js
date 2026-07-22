import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { Knob } from './Knob';

describe('Knob', () => {
    test('keeps a read-only knob out of the tab order and ignores keyboard changes', () => {
        const onChange = jest.fn();

        render(<Knob value={50} readOnly aria-label="Read-only value" onChange={onChange} unstyled />);

        const slider = screen.getByRole('slider', { name: 'Read-only value' });

        expect(slider).toHaveAttribute('tabindex', '-1');
        fireEvent.keyDown(slider, { code: 'ArrowUp' });
        expect(onChange).not.toHaveBeenCalled();
    });
});

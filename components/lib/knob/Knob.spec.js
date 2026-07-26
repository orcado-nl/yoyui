import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { Knob } from './Knob';

describe('Knob', () => {
    test('uses deterministic rounded coordinates for server-safe SVG paths', () => {
        const { container } = render(<Knob value={50} unstyled />);
        const paths = container.querySelectorAll('path');

        expect(paths[0]).toHaveAttribute('d', 'M 30 84.641016151378 A 40 40 0 1 1 70 84.641016151378');
        expect(paths[1].getAttribute('d')).not.toMatch(/\d{13,}\.\d|\.\d{13,}/);
    });

    test('keeps a read-only knob out of the tab order and ignores keyboard changes', () => {
        const onChange = jest.fn();

        render(<Knob value={50} readOnly aria-label="Read-only value" onChange={onChange} unstyled />);

        const slider = screen.getByRole('slider', { name: 'Read-only value' });

        expect(slider).toHaveAttribute('tabindex', '-1');
        fireEvent.keyDown(slider, { code: 'ArrowUp' });
        expect(onChange).not.toHaveBeenCalled();
    });
});

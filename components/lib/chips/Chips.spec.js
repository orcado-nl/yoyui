import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Chips } from './chips';

describe('Chips', () => {
    test('applies ariaLabelledBy to the listbox', () => {
        render(<Chips value={[]} ariaLabelledBy="chips-label" onChange={() => {}} unstyled />);

        expect(screen.getByRole('listbox')).toHaveAttribute('aria-labelledby', 'chips-label');
    });
});

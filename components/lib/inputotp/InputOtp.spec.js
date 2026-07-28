import '@testing-library/jest-dom';
import { fireEvent, render } from '@testing-library/react';
import { InputOtp } from './InputOtp';

describe('InputOtp', () => {
    test('supports the legacy lowercase read-only prop', () => {
        const onChange = jest.fn();
        const { container } = render(<InputOtp value="1234" readonly onChange={onChange} unstyled />);
        const inputs = container.querySelectorAll('input');

        expect(inputs).toHaveLength(4);

        inputs.forEach((input) => {
            expect(input).toHaveAttribute('readonly');
        });

        fireEvent.input(inputs[0], {
            target: { value: '9' },
            nativeEvent: { inputType: 'insertText' }
        });
        expect(onChange).not.toHaveBeenCalled();
    });
});

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { PrimeReactProvider } from '../api/Api';
import { MeterGroup } from './MeterGroup';

describe('MeterGroup', () => {
    test('uses an ARIA meter container without invoking the native meter layout', () => {
        render(
            <PrimeReactProvider>
                <MeterGroup
                    min={0}
                    max={100}
                    values={[
                        { color: '#34d399', label: 'Apps', value: 25 },
                        { color: '#fbbf24', label: 'Messages', value: 15 }
                    ]}
                />
            </PrimeReactProvider>
        );

        const meter = screen.getByRole('meter');

        expect(meter).toHaveClass('p-metergroup');
        expect(meter.tagName).toBe('DIV');
        expect(meter).toHaveAttribute('aria-valuemin', '0');
        expect(meter).toHaveAttribute('aria-valuemax', '100');
        expect(meter).toHaveAttribute('aria-valuenow', '40');
        expect(meter).toHaveTextContent('Apps (25%)');
        expect(meter).toHaveTextContent('Messages (15%)');
    });
});

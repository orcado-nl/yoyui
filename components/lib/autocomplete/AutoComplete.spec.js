import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { PrimeReactProvider } from '../api/Api';
import { AutoComplete } from './AutoComplete';

const items = Array.from({ length: 100 }, (_, index) => ({ label: `Item #${index}` }));

function ControlledAutoComplete({ virtual = false }) {
    const [value, setValue] = useState(null);
    const [suggestions, setSuggestions] = useState([]);

    return (
        <PrimeReactProvider value={{ unstyled: true }}>
            <AutoComplete
                value={value}
                suggestions={suggestions}
                completeMethod={({ query }) => {
                    const normalizedQuery = query.toLowerCase();

                    setSuggestions(items.filter((item) => item.label.toLowerCase().includes(normalizedQuery)));
                }}
                virtualScrollerOptions={virtual ? { itemSize: 38 } : undefined}
                field="label"
                dropdown
                onChange={(event) => setValue(event.value)}
            />
        </PrimeReactProvider>
    );
}

describe('AutoComplete', () => {
    test('opens from the dropdown button and supports keyboard selection', async () => {
        render(<ControlledAutoComplete />);

        const input = screen.getByRole('combobox');

        fireEvent.click(screen.getByRole('button', { name: 'Choose' }));

        await waitFor(() => expect(document.querySelector('[role="option"]')).toHaveTextContent('Item #0'));
        fireEvent.keyDown(input, { key: 'ArrowDown', keyCode: 40, which: 40 });
        fireEvent.keyDown(input, { key: 'Enter', keyCode: 13, which: 13 });

        await waitFor(() => expect(input).toHaveValue('Item #0'));
        expect(input).toHaveAttribute('aria-expanded', 'false');
    });

    test('uses VirtualScroller when virtualScrollerOptions are provided', async () => {
        const { container } = render(<ControlledAutoComplete virtual />);

        fireEvent.click(screen.getByRole('button', { name: 'Choose' }));

        const document = container.ownerDocument;

        await waitFor(() => expect(document.querySelector('[data-pc-name="virtualscroller"]')).toBeInTheDocument());
        const virtualScroller = document.querySelector('[data-pc-name="virtualscroller"]');

        expect(document.querySelector('[data-pc-section="panel"]')).toBeInTheDocument();
        expect(virtualScroller).toHaveAttribute('tabindex', '0');
    });
});

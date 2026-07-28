import { render, screen } from '@testing-library/react';
import { MegaMenu } from './MegaMenu';

describe('MegaMenu', () => {
    test('renders nested menu columns without serializing circular processed items', async () => {
        const model = [
            {
                label: 'Videos',
                items: [
                    [
                        {
                            label: 'Video 1',
                            items: [{ label: 'Video 1.1' }]
                        }
                    ]
                ]
            }
        ];

        render(<MegaMenu model={model} unstyled />);

        expect(await screen.findByText('Videos')).toBeTruthy();
        expect(screen.getByText('Video 1')).toBeTruthy();
        expect(screen.getByText('Video 1.1')).toBeTruthy();
    });
});

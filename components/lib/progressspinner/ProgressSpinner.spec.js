import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { ProgressSpinner } from './ProgressSpinner';

import { snapshot } from '../../test';

describe('ProgressSpinner', () => {
    test('renders a progress indicator', () => {
        const { getByRole } = render(<ProgressSpinner />);

        expect(getByRole('progressbar')).toBeInTheDocument();
    });
    snapshot(<ProgressSpinner />, 'default');
    snapshot(<ProgressSpinner strokeWidth="3" />, 'strokeWidth');
    snapshot(<ProgressSpinner fill="green" />, 'fill');
    snapshot(<ProgressSpinner animationDuration="5s" />, 'animationDuration');
});

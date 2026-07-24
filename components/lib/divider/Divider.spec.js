import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { Divider } from './Divider';

import { snapshot } from '../../test';

describe('Divider', () => {
    test('renders a separator', () => {
        const { getByRole } = render(<Divider />);

        expect(getByRole('separator')).toBeInTheDocument();
    });
    snapshot(<Divider />, 'default');
    snapshot(<Divider layout="horizontal" align="left" />, 'horizontal left');
    snapshot(<Divider layout="horizontal" align="right" />, 'horizontal right');
    snapshot(<Divider layout="horizontal" align="center" />, 'horizontal center');
    snapshot(<Divider layout="vertical" align="center" />, 'vertical center');
    snapshot(<Divider layout="vertical" align="top" />, 'vertical top');
    snapshot(<Divider layout="vertical" align="bottom" />, 'vertical bottom');
    snapshot(<Divider type="dashed" />, 'type dashed');
    snapshot(<Divider type="dotted" />, 'type dotted');
});

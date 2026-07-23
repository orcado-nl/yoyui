import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { Tag } from './Tag';

import { snapshot } from '../../test';

describe('Tag', () => {
    test('renders its value', () => {
        const { getByText } = render(<Tag value="Ready" />);

        expect(getByText('Ready')).toBeInTheDocument();
    });
    snapshot(<Tag />, 'default');
    snapshot(<Tag value={'jest'} />, 'value');
    snapshot(<Tag severity="success" />, 'sevrity success');
    snapshot(<Tag severity="info" />, 'sevrity info');
    snapshot(<Tag severity="warning" />, 'sevrity warning');
    snapshot(<Tag severity="danger" />, 'sevrity danger');
    snapshot(<Tag rounded />, 'rounded');
    snapshot(<Tag icon="pi pi-check" />, 'icon');
    snapshot(
        <Tag>
            <div>hello</div>
        </Tag>,
        'templating'
    );
});

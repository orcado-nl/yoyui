import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { Badge } from '../badge/Badge';
import { Avatar } from './Avatar';

import { snapshot } from '../../test';

describe('Avatar', () => {
    test('renders its label', () => {
        const { getByText } = render(<Avatar label="AV" />);

        expect(getByText('AV')).toBeInTheDocument();
    });
    snapshot(<Avatar />, 'default');
    snapshot(<Avatar label="P" />, 'label');
    snapshot(<Avatar icon="pi pi-search" />, 'icon');
    snapshot(<Avatar image="user.png" />, 'image');
    snapshot(<Avatar size="large" />, 'size large');
    snapshot(<Avatar size="xlarge" />, 'size xlarge');
    snapshot(<Avatar shape="square" />, 'shape square');
    snapshot(<Avatar size="cirle" />, 'shape cirle');
    snapshot(<Avatar>Content</Avatar>, 'templating');
    snapshot(
        <Avatar image="user.png" size="xlarge">
            <Badge value="4" severity="danger" />
        </Avatar>,
        'badge'
    );
});

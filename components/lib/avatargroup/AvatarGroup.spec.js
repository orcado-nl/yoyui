import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { Avatar } from '../avatar/Avatar';
import { AvatarGroup } from './AvatarGroup';

import { snapshot } from '../../test';

describe('AvatarGroup', () => {
    test('renders child avatars', () => {
        const { getByText } = render(
            <AvatarGroup>
                <Avatar label="AV" />
            </AvatarGroup>
        );

        expect(getByText('AV')).toBeInTheDocument();
    });
    snapshot(<AvatarGroup />, 'default');
    snapshot(
        <AvatarGroup>
            <Avatar label="P" />
            <Avatar icon="pi pi-search" />
            <Avatar image="user.png" />
            <Avatar label="+2" />
        </AvatarGroup>,
        'group'
    );
});

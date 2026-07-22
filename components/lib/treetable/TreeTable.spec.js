import { render } from '@testing-library/react';
import { Column } from '../column/Column';
import { TreeTable } from './TreeTable';

describe('TreeTable', () => {
    test('does not mutate nested input nodes while sorting', () => {
        const value = [
            {
                key: 'root',
                data: { name: 'Root' },
                children: [
                    { key: 'second', data: { name: 'Second' } },
                    { key: 'first', data: { name: 'First' } }
                ]
            }
        ];

        render(
            <TreeTable value={value} sortField="name" sortOrder={1} unstyled>
                <Column field="name" />
            </TreeTable>
        );

        expect(value[0].children.map((node) => node.key)).toEqual(['second', 'first']);
    });
});

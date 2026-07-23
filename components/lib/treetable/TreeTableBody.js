import * as React from 'react';
import { localeOption } from '../api/Api';
import { useMergeProps } from '../hooks/Hooks';
import { DomHandler, ObjectUtils } from '../utils/Utils';
import { TreeTableRow } from './TreeTableRow';
export const TreeTableBody = React.memo((props) => {
    const mergeProps = useMergeProps();
    const isSingleSelectionMode = props.selectionMode === 'single';
    const isMultipleSelectionMode = props.selectionMode === 'multiple';
    const { ptm, cx } = props.ptCallbacks;

    const getPTOptions = (key, options) => {
        return ptm(key, {
            hostName: props.hostName,
            ...options
        });
    };

    const flattenizeTree = (nodes) => {
        let rows = [];

        nodes = nodes || props.value;

        for (let node of nodes) {
            rows.push(node.key);

            if (isExpandedKey(node.key)) {
                rows = rows.concat(flattenizeTree(node.children));
            }
        }

        return rows;
    };

    const isExpandedKey = (key) => {
        return props.expandedKeys && !!props.expandedKeys[key];
    };

    const emitSelectionEvent = (callback, event, node) => {
        callback?.({
            originalEvent: event,
            node
        });
    };

    const createRangeSelection = (event, node) => {
        DomHandler.clearSelection();
        const flatKeys = flattenizeTree();
        const rowIndex = flatKeys.indexOf(node.key);
        const anchorRowIndex = flatKeys.findIndex((key) => props.selectionKeys[key]);
        const rangeStart = Math.min(rowIndex, anchorRowIndex);
        const rangeEnd = Math.max(rowIndex, anchorRowIndex);
        const selectionKeys = { ...props.selectionKeys };

        for (let index = rangeStart; index <= rangeEnd; index++) {
            selectionKeys[flatKeys[index]] = true;
        }

        return selectionKeys;
    };

    const createMetaSelection = (event, node, selected) => {
        const metaKey = event.metaKey || event.ctrlKey;

        if (selected && metaKey) {
            emitSelectionEvent(props.onUnselect, event, node);

            if (isSingleSelectionMode) {
                return null;
            }

            const selectionKeys = { ...props.selectionKeys };

            delete selectionKeys[node.key];

            return selectionKeys;
        }

        emitSelectionEvent(props.onSelect, event, node);

        if (isSingleSelectionMode) {
            return node.key;
        }

        const selectionKeys = metaKey && props.selectionKeys ? { ...props.selectionKeys } : {};

        selectionKeys[node.key] = true;

        return selectionKeys;
    };

    const createSingleSelection = (event, node, selected) => {
        emitSelectionEvent(selected ? props.onUnselect : props.onSelect, event, node);

        return selected ? null : node.key;
    };

    const createMultipleSelection = (event, node, selected) => {
        const selectionKeys = props.selectionKeys ? { ...props.selectionKeys } : {};

        if (selected) {
            delete selectionKeys[node.key];
            emitSelectionEvent(props.onUnselect, event, node);
        } else {
            selectionKeys[node.key] = true;
            emitSelectionEvent(props.onSelect, event, node);
        }

        return selectionKeys;
    };

    const createSelection = (event, node) => {
        const selected = isSelected(node);

        if (isMultipleSelectionMode && event.shiftKey) {
            return createRangeSelection(event, node);
        }

        if (props.metaKeySelection) {
            return createMetaSelection(event, node, selected);
        }

        return isSingleSelectionMode ? createSingleSelection(event, node, selected) : createMultipleSelection(event, node, selected);
    };

    const onRowClick = (event, node) => {
        if (props.onRowClick) {
            props.onRowClick({
                originalEvent: event,
                node: node
            });
        }

        const targetNode = event.target.nodeName;

        if (targetNode === 'INPUT' || targetNode === 'BUTTON' || targetNode === 'A' || DomHandler.getAttribute(event.target, 'data-pc-section') === 'columnresizer') {
            return;
        }

        if ((isSingleSelectionMode || isMultipleSelectionMode) && node.selectable !== false) {
            const selectionKeys = createSelection(event, node);

            props.onSelectionChange?.({
                originalEvent: event,
                value: selectionKeys
            });
        }
    };

    const isSelected = (node) => {
        if ((isSingleSelectionMode || isMultipleSelectionMode) && props.selectionKeys) {
            return isSingleSelectionMode ? props.selectionKeys === node.key : props.selectionKeys[node.key] !== undefined;
        }

        return false;
    };

    const createRow = (node, index) => {
        return (
            <TreeTableRow
                hostName={props.hostName}
                key={`${node.key || JSON.stringify(node.data)}_${index}`}
                level={0}
                rowIndex={index}
                ariaSetSize={props.value.length}
                ariaPosInSet={index + 1}
                selectOnEdit={props.selectOnEdit}
                node={node}
                originalOptions={props.originalOptions}
                checkboxIcon={props.checkboxIcon}
                columns={props.columns}
                expandedKeys={props.expandedKeys}
                onToggle={props.onToggle}
                togglerTemplate={props.togglerTemplate}
                onExpand={props.onExpand}
                onCollapse={props.onCollapse}
                selectionMode={props.selectionMode}
                selectionKeys={props.selectionKeys}
                onSelectionChange={props.onSelectionChange}
                metaKeySelection={props.metaKeySelection}
                onRowClick={onRowClick}
                onRowMouseEnter={props.onRowMouseEnter}
                onRowMouseLeave={props.onRowMouseLeave}
                onSelect={props.onSelect}
                onUnselect={props.onUnselect}
                propagateSelectionUp={props.propagateSelectionUp}
                propagateSelectionDown={props.propagateSelectionDown}
                rowClassName={props.rowClassName}
                contextMenuSelectionKey={props.contextMenuSelectionKey}
                onContextMenuSelectionChange={props.onContextMenuSelectionChange}
                onContextMenu={props.onContextMenu}
                ptCallbacks={props.ptCallbacks}
                metaData={props.metaData}
            />
        );
    };

    const createRows = () => {
        if (props.paginator && !props.lazy) {
            let rpp = props.rows || 0;
            let startIndex = props.first || 0;
            let endIndex = startIndex + rpp;
            let rows = [];

            for (let i = startIndex; i < endIndex; i++) {
                let rowData = props.value[i];

                if (rowData) {
                    rows.push(createRow(props.value[i]));
                } else {
                    break;
                }
            }

            return rows;
        }

        return props.value.map(createRow);
    };

    const createEmptyMessage = () => {
        const colSpan = props.columns ? props.columns.length : null;
        const content =
            ObjectUtils.getJSXElement(props.emptyMessage, {
                props: props.tableProps
            }) || localeOption('emptyMessage');
        const emptyMessageProps = mergeProps(
            {
                className: cx('emptyMessage')
            },
            getPTOptions('emptyMessage')
        );
        const emptyMessageCellProps = mergeProps(
            {
                colSpan
            },
            getPTOptions('emptyMessageCell')
        );

        return (
            <tr {...emptyMessageProps}>
                <td {...emptyMessageCellProps}>{content}</td>
            </tr>
        );
    };

    const content = props.value?.length ? createRows() : createEmptyMessage();
    const tbodyProps = mergeProps(
        {
            role: 'rowgroup',
            className: cx('tbody')
        },
        getPTOptions('tbody')
    );

    return <tbody {...tbodyProps}>{content}</tbody>;
});
TreeTableBody.displayName = 'TreeTableBody';

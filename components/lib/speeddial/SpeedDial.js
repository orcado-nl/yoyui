import { resolveConditional } from '../utils/ConditionalUtils';
import * as React from 'react';
import { PrimeReactContext } from '../api/Api';
import { Button } from '../button/Button';
import { useHandleStyle } from '../componentbase/ComponentBase';
import { ESC_KEY_HANDLING_PRIORITIES, useDisplayOrder, useEventListener, useGlobalOnEscapeKey, useMergeProps, useMountEffect, useUpdateEffect } from '../hooks/Hooks';
import { MinusIcon } from '../icons/minus';
import { PlusIcon } from '../icons/plus';
import { Ripple } from '../ripple/Ripple';
import { DomHandler, IconUtils, ObjectUtils, UniqueComponentId, classNames } from '../utils/Utils';
import { SpeedDialBase } from './SpeedDialBase';

export const SpeedDial = React.memo(
    React.forwardRef((inProps, ref) => {
        const [visibleState, setVisibleState] = React.useState(false);
        const [idState, setIdState] = React.useState(null);
        const [focused, setFocused] = React.useState(false);
        const [focusedOptionIndex, setFocusedOptionIndex] = React.useState(-1);
        const isItemClicked = React.useRef(false);
        const elementRef = React.useRef(null);
        const listRef = React.useRef(null);
        const mergeProps = useMergeProps();
        const context = React.useContext(PrimeReactContext);
        const props = SpeedDialBase.getProps(inProps, context);
        const visible = props.onVisibleChange ? props.visible : visibleState;
        const speedDialDisplayOrder = useDisplayOrder('speed-dial', visible);
        const metaData = { props, state: { visible } };
        const { ptm, cx, sx, isUnstyled } = SpeedDialBase.setMetaData(metaData);

        useHandleStyle(SpeedDialBase.css.styles, isUnstyled, { name: 'speeddial' });
        useGlobalOnEscapeKey({
            callback: () => {
                hide();
            },
            when: visible && speedDialDisplayOrder,
            priority: [ESC_KEY_HANDLING_PRIORITIES.SPEED_DIAL, speedDialDisplayOrder]
        });
        const [bindDocumentClickListener, unbindDocumentClickListener] = useEventListener({
            type: 'click',
            listener: (event) => {
                if (!isItemClicked.current && isOutsideClicked(event)) {
                    hide();
                }

                isItemClicked.current = false;
            },
            when: visibleState
        });

        const show = () => {
            props.onVisibleChange ? props.onVisibleChange(true) : setVisibleState(true);
            props.onShow?.();
        };

        const onFocus = () => {
            setFocused(true);
        };

        const onBlur = () => {
            setFocused(false);
            setFocusedOptionIndex(-1);
        };

        const hide = () => {
            props.onVisibleChange ? props.onVisibleChange(false) : setVisibleState(false);
            props.onHide?.();
        };

        const onClick = (e) => {
            visible ? hide() : show();
            props.onClick?.(e);
            isItemClicked.current = true;
        };

        const onItemClick = (e, item) => {
            item.command?.({ originalEvent: e, item });
            hide();
            isItemClicked.current = true;
            e.preventDefault();
        };

        const onKeyDown = (event) => {
            switch (event.code) {
                case 'ArrowDown':
                    onArrowDown(event);
                    break;
                case 'ArrowUp':
                    onArrowUp(event);
                    break;
                case 'ArrowLeft':
                    onArrowLeft(event);
                    break;
                case 'ArrowRight':
                    onArrowRight(event);
                    break;
                case 'Enter':
                case 'NumpadEnter':
                case 'Space':
                    onEnterKey(event);
                    break;
                case 'Escape':
                    onEscapeKey();
                    break;
                case 'Home':
                    onHomeKey(event);
                    break;
                case 'End':
                    onEndKey(event);
                    break;
                default:
                    break;
            }
        };

        const onTogglerKeydown = (event) => {
            switch (event.code) {
                case 'ArrowDown':
                case 'ArrowLeft':
                    onTogglerArrowDown(event);
                    break;
                case 'ArrowUp':
                case 'ArrowRight':
                    onTogglerArrowUp(event);
                    break;
                case 'Escape':
                    onEscapeKey();
                    break;
                default:
                    break;
            }
        };

        const onTogglerArrowUp = (event) => {
            setFocused(true);
            DomHandler.focus(listRef.current);
            show();
            navigatePrevItem(event);
            event.preventDefault();
        };

        const onTogglerArrowDown = (event) => {
            setFocused(true);
            DomHandler.focus(listRef.current);
            show();
            navigateNextItem(event);
            event.preventDefault();
        };

        const onEnterKey = (event) => {
            const items = DomHandler.find(elementRef.current, '[data-pc-section="menuitem"]');
            const itemIndex = [...items].findIndex((item) => item.id === focusedOptionIndex);

            onItemClick(event, props.model[itemIndex]);
            onBlur();
            const buttonEl = DomHandler.findSingle(elementRef.current, 'button');

            buttonEl && DomHandler.focus(buttonEl);
        };

        const onEscapeKey = () => {
            hide();
            const buttonEl = DomHandler.findSingle(elementRef.current, 'button');

            buttonEl && DomHandler.focus(buttonEl);
        };

        const onArrowUp = (event) => {
            let direction = props.direction;

            if (direction === 'up') {
                navigateNextItem(event);
            } else if (direction === 'down') {
                navigatePrevItem(event);
            } else {
                navigateNextItem(event);
            }
        };

        const onArrowDown = (event) => {
            let direction = props.direction;

            if (direction === 'up') {
                navigatePrevItem(event);
            } else if (direction === 'down') {
                navigateNextItem(event);
            } else {
                navigatePrevItem(event);
            }
        };

        const onArrowLeft = (event) => {
            let direction = props.direction;
            const leftValidDirections = ['left', 'up-right', 'down-left'];
            const rightValidDirections = ['right', 'up-left', 'down-right'];

            if (leftValidDirections.includes(direction)) {
                navigateNextItem(event);
            } else if (rightValidDirections.includes(direction)) {
                navigatePrevItem(event);
            } else {
                navigatePrevItem(event);
            }
        };

        const onArrowRight = (event) => {
            let direction = props.direction;
            const leftValidDirections = ['left', 'up-right', 'down-left'];
            const rightValidDirections = ['right', 'up-left', 'down-right'];

            if (leftValidDirections.includes(direction)) {
                navigatePrevItem(event);
            } else if (rightValidDirections.includes(direction)) {
                navigateNextItem(event);
            } else {
                navigateNextItem(event);
            }
        };

        const onEndKey = (event) => {
            event.preventDefault();
            setFocusedOptionIndex(-1);
            navigatePrevItem(event, -1);
        };

        const onHomeKey = (event) => {
            event.preventDefault();
            setFocusedOptionIndex(-1);
            navigateNextItem(event, -1);
        };

        const navigateNextItem = (event, index = null) => {
            const optionIndex = findNextOptionIndex(index || focusedOptionIndex);

            changeFocusedOptionIndex(optionIndex);
            event.preventDefault();
        };

        const navigatePrevItem = (event, index = null) => {
            const optionIndex = findPrevOptionIndex(index || focusedOptionIndex);

            changeFocusedOptionIndex(optionIndex);
            event.preventDefault();
        };

        const changeFocusedOptionIndex = (index) => {
            const items = DomHandler.find(elementRef.current, '[data-pc-section="menuitem"]');
            const filteredItems = [...items].filter((item) => !DomHandler.hasClass(DomHandler.findSingle(item, 'a'), 'p-disabled'));

            if (filteredItems[index]) {
                setFocusedOptionIndex(filteredItems[index].getAttribute('id'));
            }
        };

        const findPrevOptionIndex = (index) => {
            const items = DomHandler.find(elementRef.current, '[data-pc-section="menuitem"]');
            const filteredItems = [...items].filter((item) => !DomHandler.hasClass(DomHandler.findSingle(item, 'a'), 'p-disabled'));
            const newIndex = index === -1 ? filteredItems.at(-1).id : index;
            let matchedOptionIndex = filteredItems.findIndex((link) => link.getAttribute('id') === newIndex);

            matchedOptionIndex = index === -1 ? filteredItems.length - 1 : matchedOptionIndex - 1;

            return matchedOptionIndex;
        };

        const findNextOptionIndex = (index) => {
            const items = DomHandler.find(elementRef.current, '[data-pc-section="menuitem"]');
            const filteredItems = [...items].filter((item) => !DomHandler.hasClass(DomHandler.findSingle(item, 'a'), 'p-disabled'));
            const newIndex = index === -1 ? filteredItems[0].id : index;
            let matchedOptionIndex = filteredItems.findIndex((link) => link.getAttribute('id') === newIndex);

            matchedOptionIndex = index === -1 ? 0 : matchedOptionIndex + 1;

            return matchedOptionIndex;
        };

        const isOutsideClicked = (event) => {
            return elementRef.current && !(elementRef.current.isSameNode(event.target) || elementRef.current.contains(event.target));
        };

        const isItemActive = (id) => {
            return focusedOptionIndex === id;
        };

        const focusedOptionId = () => {
            return focusedOptionIndex !== -1 ? focusedOptionIndex : null;
        };

        const calculateTransitionDelay = (index) => {
            const length = props.model.length;

            return (visible ? index : length - index - 1) * props.transitionDelay;
        };

        const calculatePointStyle = (index) => {
            const type = props.type;

            if (type === 'linear') return {};

            const length = props.model.length;
            const radius = props.radius || length * 20;
            const steps = { circle: (2 * Math.PI) / length, 'semi-circle': Math.PI / (length - 1), 'quarter-circle': Math.PI / (2 * (length - 1)) };
            const step = steps[type];
            const x = `calc(${radius * Math.cos(step * index)}px + var(--item-diff-x, 0px))`;
            const y = `calc(${radius * Math.sin(step * index)}px + var(--item-diff-y, 0px))`;

            if (type === 'circle') return { left: x, top: y };

            const directionalStyles = {
                'semi-circle': { up: { left: x, bottom: y }, down: { left: x, top: y }, left: { right: y, top: x }, right: { left: y, top: x } },
                'quarter-circle': { 'up-left': { right: x, bottom: y }, 'up-right': { left: x, bottom: y }, 'down-left': { right: y, top: x }, 'down-right': { left: y, top: x } }
            };

            return directionalStyles[type]?.[props.direction] || {};
        };

        const getItemStyle = (index) => {
            const transitionDelay = calculateTransitionDelay(index);
            const pointStyle = calculatePointStyle(index);

            return { transitionDelay: `${transitionDelay}ms`, ...pointStyle };
        };

        useMountEffect(() => {
            if (props.type !== 'linear') {
                const button = DomHandler.findSingle(elementRef.current, '.p-speeddial-button');
                const firstItem = DomHandler.findSingle(listRef.current, '.p-speeddial-item');

                if (button && firstItem) {
                    const wDiff = Math.abs(button.offsetWidth - firstItem.offsetWidth);
                    const hDiff = Math.abs(button.offsetHeight - firstItem.offsetHeight);

                    listRef.current.style.setProperty('--item-diff-x', `${wDiff / 2}px`);
                    listRef.current.style.setProperty('--item-diff-y', `${hDiff / 2}px`);
                }
            }
        });
        useUpdateEffect(() => {
            if (visibleState) {
                props.hideOnClickOutside && bindDocumentClickListener();
            }

            return () => {
                props.hideOnClickOutside && unbindDocumentClickListener();
            };
        }, [visibleState]);
        React.useImperativeHandle(ref, () => ({ props, show, hide, getElement: () => elementRef.current }));

        const createItem = (item, index) => {
            if (item.visible === false) {
                return null;
            }

            const { disabled, icon: _icon, label, template, url, target, className: _itemClassName, style: _itemStyle } = item;
            const contentClassName = classNames('p-speeddial-action', { 'p-disabled': disabled });
            const iconClassName = classNames('p-speeddial-action-icon', _icon);
            const actionIconProps = mergeProps({ className: cx('actionIcon') }, ptm('actionIcon'));
            const actionProps = mergeProps(
                {
                    href: url || '#',
                    role: 'menuitem',
                    className: classNames(_itemClassName, cx('action', { disabled })),
                    'aria-label': item.label,
                    style: _itemStyle,
                    target: target,
                    tabIndex: '-1',
                    'data-pr-tooltip': label,
                    onClick: (e) => onItemClick(e, item)
                },
                ptm('action')
            );
            const icon = IconUtils.getJSXIcon(_icon, { ...actionIconProps }, { props });
            let content = (
                <a {...actionProps}>
                    {icon}
                    <Ripple />
                </a>
            );

            if (template) {
                const defaultContentOptions = { onClick: (e) => onItemClick(e, item), className: contentClassName, iconClassName, element: content, props, visible };

                content = ObjectUtils.getJSXElement(template, item, defaultContentOptions);
            }

            const menuItemProps = mergeProps({ id: `${idState}_${index}`, className: cx('menuitem', { active: isItemActive(`${idState}_${index}`) }), style: getItemStyle(index), role: 'menuitem' }, ptm('menuitem'));

            return (
                <li {...menuItemProps} key={`${idState}_${index}`}>
                    {content}
                </li>
            );
        };

        const createItems = () => {
            return props.model ? props.model.map(createItem) : null;
        };

        const createList = () => {
            const items = createItems();
            const menuProps = mergeProps({ ref: listRef, className: cx('menu'), style: sx('menu'), role: 'menu', tabIndex: '-1', onFocus, onKeyDown, onBlur, 'aria-activedescendant': focused ? focusedOptionId() : undefined }, ptm('menu'));

            return <ul {...menuProps}>{items}</ul>;
        };

        const createButton = () => {
            const showIconVisible = (!visible && !!props.showIcon) || !props.hideIcon;
            const hideIconVisible = visible && !!props.hideIcon;
            const className = classNames('p-speeddial-button p-button-rounded', { 'p-speeddial-rotate': props.rotateAnimation && !props.hideIcon }, props.buttonClassName);
            const iconClassName = classNames({ [`${props.showIcon}`]: (!visible && !!props.showIcon) || !props.hideIcon, [`${props.hideIcon}`]: visible && !!props.hideIcon });
            const icon = showIconVisible
                ? props.showIcon || <PlusIcon />
                : resolveConditional(
                      hideIconVisible,
                      () => props.hideIcon || <MinusIcon />,
                      () => null
                  );
            const toggleIcon = IconUtils.getJSXIcon(icon, undefined, { props, visible });
            const buttonProps = mergeProps({
                type: 'button',
                style: props.buttonStyle,
                className: classNames(props.buttonClassName, cx('button')),
                icon: toggleIcon,
                onClick: (e) => onClick(e),
                disabled: props.disabled,
                onKeyDown: onTogglerKeydown,
                'aria-label': props['aria-label'],
                'aria-expanded': visible,
                'aria-haspopup': true,
                'aria-controls': getAriaControls,
                'aria-labelledby': props.ariaLabelledby,
                pt: ptm('button'),
                unstyled: props.unstyled,
                __parentMetadata: { parent: metaData }
            });
            const content = <Button {...buttonProps} />;

            if (props.buttonTemplate) {
                const defaultContentOptions = { onClick, className, iconClassName, element: content, props, visible };

                return ObjectUtils.getJSXElement(props.buttonTemplate, defaultContentOptions);
            }

            return content;
        };

        const getAriaControls = () => {
            let ariaControls = '';

            for (let index = 0; index < props.model.length; index++) {
                ariaControls = ariaControls + `${idState}_${index} `;
            }

            return ariaControls.trim();
        };

        const createMask = () => {
            if (props.mask) {
                const maskProps = mergeProps({ className: classNames(props.maskClassName, cx('mask', { visible })), style: props.maskStyle }, ptm('mask'));

                return <div {...maskProps} />;
            }

            return null;
        };

        React.useEffect(() => {
            setIdState(props.id || UniqueComponentId());
        }, [props.id]);
        const button = createButton();
        const list = createList();
        const mask = createMask();
        const rootProps = mergeProps(
            {
                className: classNames(props.className, cx('root', { visible })),
                style: { ...props.style, ...sx('root') },
                id: idState
            },
            SpeedDialBase.getOtherProps(props),
            ptm('root')
        );

        return (
            <React.Fragment>
                <div ref={elementRef} {...rootProps}>
                    {button}
                    {list}
                </div>
                {mask}
            </React.Fragment>
        );
    })
);

SpeedDial.displayName = 'SpeedDial';

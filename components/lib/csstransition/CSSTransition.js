import * as React from 'react';
import { CSSTransition as ReactCSSTransition } from 'react-transition-group';
import { useUpdateEffect } from '../hooks/Hooks';
import { ObjectUtils } from '../utils/Utils';
import { CSSTransitionBase } from './CSSTransitionBase';
import { PrimeReactConfig, PrimeReactContext } from '../api/Api';

export const CSSTransition = React.forwardRef((inProps, ref) => {
    const props = CSSTransitionBase.getProps(inProps);
    const context = React.useContext(PrimeReactContext);

    const disabled = props.disabled || props.options?.disabled || (context && !context.cssTransition) || !PrimeReactConfig.cssTransition;

    const onEnter = (node, isAppearing) => {
        props.onEnter?.(node, isAppearing); // component
        props.options?.onEnter?.(node, isAppearing); // user option
    };

    const onEntering = (node, isAppearing) => {
        props.onEntering?.(node, isAppearing); // component
        props.options?.onEntering?.(node, isAppearing); // user option
    };

    const onEntered = (node, isAppearing) => {
        props.onEntered?.(node, isAppearing); // component
        props.options?.onEntered?.(node, isAppearing); // user option
    };

    const onExit = (node) => {
        props.onExit?.(node); // component
        props.options?.onExit?.(node); // user option
    };

    const onExiting = (node) => {
        props.onExiting?.(node); // component
        props.options?.onExiting?.(node); // user option
    };

    const onExited = (node) => {
        props.onExited?.(node); // component
        props.options?.onExited?.(node); // user option
    };

    useUpdateEffect(() => {
        if (disabled) {
            // no animation
            const node = ObjectUtils.getRefElement(props.nodeRef);

            if (props.in) {
                onEnter(node, true);
                onEntering(node, true);
                onEntered(node, true);
            } else {
                onExit(node);
                onExiting(node);
                onExited(node);
            }
        }
    }, [props.in]);

    if (disabled) {
        return props.in ? props.children : null;
    }

    const immutableProps = { nodeRef: props.nodeRef, in: props.in, appear: props.appear, onEnter: onEnter, onEntering: onEntering, onEntered: onEntered, onExit: onExit, onExiting: onExiting, onExited: onExited };
    const mutableProps = { classNames: props.classNames, timeout: props.timeout, unmountOnExit: props.unmountOnExit };
    const mergedProps = { ...mutableProps, ...props.options, ...immutableProps };

    return <ReactCSSTransition {...mergedProps}>{props.children}</ReactCSSTransition>;
});

CSSTransition.displayName = 'CSSTransition';

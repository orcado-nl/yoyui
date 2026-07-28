import * as React from 'react';
import ReactDOM from 'react-dom';
import { PrimeReactContext, PrimeReactConfig } from '../api/Api';
import { useMountEffect, useUnmountEffect, useUpdateEffect } from '../hooks/Hooks';
import { DomHandler, ObjectUtils } from '../utils/Utils';
import { PortalBase } from './PortalBase';

export const Portal = React.memo((inProps) => {
    const props = PortalBase.getProps(inProps);
    const context = React.useContext(PrimeReactContext);

    const [mountedState, setMountedState] = React.useState(props.visible && DomHandler.isClient());

    useMountEffect(() => {
        if (DomHandler.isClient() && !mountedState) {
            setMountedState(true);
            props.onMounted?.();
        }
    });

    useUpdateEffect(() => {
        props.onMounted?.();
    }, [mountedState]);

    useUnmountEffect(() => {
        props.onUnmounted?.();
    });

    const element = props.element || props.children;

    if (element && mountedState) {
        let appendTo = props.appendTo || context?.appendTo || PrimeReactConfig.appendTo;

        if (ObjectUtils.isFunction(appendTo)) {
            appendTo = appendTo();
        }

        if (!appendTo) {
            appendTo = document.body;
        }

        return appendTo === 'self' ? element : ReactDOM.createPortal(element, appendTo);
    }

    return null;
});

Portal.displayName = 'Portal';

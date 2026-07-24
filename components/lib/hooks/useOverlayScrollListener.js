import * as React from 'react';
import { PrimeReactContext, PrimeReactConfig } from '../api/Api';
import { DomHandler, ObjectUtils } from '../utils/Utils';

export const useOverlayScrollListener = ({ target, listener, options, when = true }) => {
    const context = React.useContext(PrimeReactContext);
    const targetRef = React.useRef(null);
    const listenerRef = React.useRef(listener);
    const hideOnScroll = context ? context.hideOverlaysOnDocumentScrolling : PrimeReactConfig.hideOverlaysOnDocumentScrolling;
    const configRef = React.useRef({ target, options, when, hideOnScroll });
    const registrationRef = React.useRef(null);

    listenerRef.current = listener;
    configRef.current = { target, options, when, hideOnScroll };

    const unbind = React.useCallback(() => {
        const registration = registrationRef.current;

        if (registration) {
            registration.nodes.forEach((node) => node.removeEventListener('scroll', registration.listener, registration.options));
            registrationRef.current = null;
        }
    }, []);

    const bind = React.useCallback(
        (bindOptions = {}) => {
            const config = configRef.current;
            const hasTargetOverride = ObjectUtils.isNotEmpty(bindOptions.target);
            const shouldBind = Object.prototype.hasOwnProperty.call(bindOptions, 'when') ? bindOptions.when : config.when;

            if (hasTargetOverride) {
                unbind();
                targetRef.current = shouldBind ? DomHandler.getTargetElement(bindOptions.target) : null;
            } else if (!targetRef.current && shouldBind) {
                targetRef.current = DomHandler.getTargetElement(config.target);
            }

            if (!shouldBind || registrationRef.current || !targetRef.current) {
                return;
            }

            const nodes = DomHandler.getScrollableParents(targetRef.current);

            if (!nodes.some((node) => node === document.body || node === window)) {
                nodes.push(config.hideOnScroll ? window : document.body);
            }

            const eventListener = (event) => listenerRef.current?.(event);
            const registration = {
                nodes,
                listener: eventListener,
                options: config.options,
                hideOnScroll: config.hideOnScroll
            };

            registration.nodes.forEach((node) => node.addEventListener('scroll', registration.listener, registration.options));
            registrationRef.current = registration;
        },
        [unbind]
    );

    React.useEffect(() => {
        const nextTarget = when ? DomHandler.getTargetElement(target) : null;
        const targetChanged = targetRef.current !== nextTarget;
        const wasBound = !!registrationRef.current;

        if (targetChanged || !when) {
            unbind();
            targetRef.current = nextTarget;

            if (targetChanged && wasBound && when) {
                bind();
            }
        }
    }, [bind, target, unbind, when]);

    React.useEffect(() => {
        const registration = registrationRef.current;
        const configChanged = registration && (registration.options !== options || registration.hideOnScroll !== hideOnScroll);

        if (configChanged) {
            unbind();

            if (when) {
                bind();
            }
        }
    }, [bind, hideOnScroll, options, unbind, when]);

    React.useEffect(() => unbind, [unbind]);

    return [bind, unbind];
};

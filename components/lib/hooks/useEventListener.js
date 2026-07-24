import * as React from 'react';
import { DomHandler, ObjectUtils } from '../utils/Utils';

export const useEventListener = ({ target = 'document', type, listener, options, when = true }) => {
    const targetRef = React.useRef(null);
    const listenerRef = React.useRef(listener);
    const configRef = React.useRef({ target, type, options, when });
    const registrationRef = React.useRef(null);

    listenerRef.current = listener;
    configRef.current = { target, type, options, when };

    const unbind = React.useCallback(() => {
        const registration = registrationRef.current;

        if (registration) {
            registration.target.removeEventListener(registration.type, registration.listener, registration.options);
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

            const eventListener = (event) => listenerRef.current?.(event);
            const registration = {
                target: targetRef.current,
                type: config.type,
                listener: eventListener,
                options: config.options
            };

            registration.target.addEventListener(registration.type, registration.listener, registration.options);
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

        if (registration && (registration.type !== type || registration.options !== options)) {
            unbind();

            if (when) {
                bind();
            }
        }
    }, [bind, options, type, unbind, when]);

    React.useEffect(() => unbind, [unbind]);

    return [bind, unbind];
};

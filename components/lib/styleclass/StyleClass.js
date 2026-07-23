import * as React from 'react';
import { PrimeReactContext } from '../api/Api';
import { useEventListener, useMountEffect, useUnmountEffect, useUpdateEffect } from '../hooks/Hooks';
import { DomHandler, ObjectUtils } from '../utils/Utils';
import { StyleClassBase } from './StyleClassBase';
export const StyleClass = React.forwardRef((inProps, ref) => {
    const context = React.useContext(PrimeReactContext);
    const props = StyleClassBase.getProps(inProps, context);
    const targetRef = React.useRef(null);
    const animating = React.useRef(false);
    const elementRef = React.useRef(null);
    const [bindTargetEnterListener, unbindTargetEnterListener] = useEventListener({
        type: 'animationend',
        listener: () => {
            DomHandler.removeClass(targetRef.current, props.enterActiveClassName);

            if (props.enterToClassName) {
                DomHandler.addClass(targetRef.current, props.enterToClassName);
            }

            unbindTargetEnterListener();

            if (props.enterActiveClassName === 'slidedown') {
                targetRef.current.style.maxHeight = '';
            }

            animating.current = false;
        }
    });
    const [bindTargetLeaveListener, unbindTargetLeaveListener] = useEventListener({
        type: 'animationend',
        listener: () => {
            DomHandler.removeClass(targetRef.current, props.leaveActiveClassName);

            if (props.leaveToClassName) {
                DomHandler.addClass(targetRef.current, props.leaveToClassName);
            }

            unbindTargetLeaveListener();
            animating.current = false;
        }
    });
    const [bindDocumentClickListener, unbindDocumentClickListener] = useEventListener({
        type: 'click',
        listener: (event) => {
            if (!isVisible(targetRef.current) || getComputedStyle(targetRef.current).getPropertyValue('position') === 'static') {
                unbindDocumentClickListener();
            } else if (isOutsideClick(event)) {
                leave();
            }
        },
        when: props.hideOnOutsideClick
    });
    const [bindClickListener, unbindClickListener] = useEventListener({
        type: 'click',
        listener: () => {
            targetRef.current = resolveTarget();

            if (props.toggleClassName) {
                if (DomHandler.hasClass(targetRef.current, props.toggleClassName)) {
                    DomHandler.removeClass(targetRef.current, props.toggleClassName);
                } else {
                    DomHandler.addClass(targetRef.current, props.toggleClassName);
                }
            } else {
                DomHandler.isVisible(targetRef.current) ? leave() : enter();
            }
        }
    });

    const enter = () => {
        const runComplexBranch1 = () => {
            if (!animating.current) {
                animating.current = true;

                if (props.enterActiveClassName === 'slidedown') {
                    targetRef.current.style.height = '0px';
                    DomHandler.removeClass(targetRef.current, 'hidden');
                    targetRef.current.style.maxHeight = targetRef.current.scrollHeight + 'px';
                    DomHandler.addClass(targetRef.current, 'hidden');
                    targetRef.current.style.height = '';
                }

                DomHandler.addClass(targetRef.current, props.enterActiveClassName);

                // enterClassName will be deprecated, use enterFromClassName
                if (props.enterClassName) {
                    DomHandler.removeClass(targetRef.current, props.enterClassName);
                }

                if (props.enterFromClassName) {
                    DomHandler.removeClass(targetRef.current, props.enterFromClassName);
                }

                bindTargetEnterListener({
                    target: targetRef.current
                });
            }
        };

        const runComplexBranch3 = () => {
            // enterClassName will be deprecated, use enterFromClassName
            if (props.enterClassName) {
                DomHandler.removeClass(targetRef.current, props.enterClassName);
            }

            if (props.enterFromClassName) {
                DomHandler.removeClass(targetRef.current, props.enterFromClassName);
            }

            if (props.enterToClassName) {
                DomHandler.addClass(targetRef.current, props.enterToClassName);
            }
        };

        if (props.enterActiveClassName) {
            runComplexBranch1();
        } else {
            runComplexBranch3();
        }

        bindDocumentClickListener({
            target: elementRef.current?.ownerDocument
        });
    };

    const leave = () => {
        const runComplexBranch4 = () => {
            if (!animating.current) {
                animating.current = true;
                DomHandler.addClass(targetRef.current, props.leaveActiveClassName);

                // leaveClassName will be deprecated, use leaveFromClassName
                if (props.leaveClassName) {
                    DomHandler.removeClass(targetRef.current, props.leaveClassName);
                }

                if (props.leaveFromClassName) {
                    DomHandler.removeClass(targetRef.current, props.leaveFromClassName);
                }

                bindTargetLeaveListener({
                    target: targetRef.current
                });
            }
        };

        const runComplexBranch6 = () => {
            // leaveClassName will be deprecated, use leaveFromClassName
            if (props.leaveClassName) {
                DomHandler.removeClass(targetRef.current, props.leaveClassName);
            }

            if (props.leaveFromClassName) {
                DomHandler.removeClass(targetRef.current, props.leaveFromClassName);
            }

            if (props.leaveToClassName) {
                DomHandler.addClass(targetRef.current, props.leaveToClassName);
            }
        };

        if (props.leaveActiveClassName) {
            runComplexBranch4();
        } else {
            runComplexBranch6();
        }

        if (props.hideOnOutsideClick) {
            unbindDocumentClickListener();
        }
    };

    const resolveTarget = () => {
        if (targetRef.current) {
            return targetRef.current;
        }

        switch (props.selector) {
            case '@next':
                return elementRef.current?.nextElementSibling;
            case '@prev':
                return elementRef.current?.previousElementSibling;
            case '@parent':
                return elementRef.current?.parentElement;
            case '@grandparent':
                return elementRef.current?.parentElement.parentElement;
            default:
                return document.querySelector(props.selector);
        }
    };

    const init = () => {
        Promise.resolve().then(() => {
            elementRef.current = ObjectUtils.getRefElement(props.nodeRef);
            bindClickListener({
                target: elementRef.current
            });
        });
    };

    const destroy = () => {
        unbindClickListener();
        unbindDocumentClickListener();
        targetRef.current = null;
    };

    const isVisible = (target) => {
        return target && target.offsetParent !== null;
    };

    const isOutsideClick = (event) => {
        return !elementRef.current.isSameNode(event.target) && !elementRef.current.contains(event.target) && !targetRef.current.contains(event.target);
    };

    React.useImperativeHandle(ref, () => ({
        props,
        getElement: () => elementRef.current,
        getTarget: () => targetRef.current
    }));
    useMountEffect(() => {
        init();
    });
    useUpdateEffect(() => {
        init();

        return () => {
            unbindClickListener();
        };
    });
    useUnmountEffect(() => {
        destroy();
    });

    return props.children;
});
StyleClass.displayName = 'StyleClass';

import React, { useState, useEffect, useRef } from 'react';
import { getDemoDelay, isVisualTestMode } from './DemoUtils';

const DeferredDemo = ({ options, children, onLoad }) => {
    const [visible, setVisible] = useState(false);

    const timeoutRef = useRef(null);
    const observerRef = useRef(null);
    const elementRef = useRef(null);

    useEffect(() => {
        if (isVisualTestMode()) {
            const element = elementRef.current;

            const activate = () => {
                setVisible(true);
                onLoad();
            };

            element?.addEventListener('yoyui:activate-deferred-demo', activate, { once: true });

            return () => element?.removeEventListener('yoyui:activate-deferred-demo', activate);
        }

        const handleIntersection = ([entry]) => {
            clearTimeout(timeoutRef.current);

            if (entry.isIntersecting) {
                timeoutRef.current = setTimeout(() => {
                    setVisible(true);
                    observerRef.current.unobserve(elementRef.current);
                    onLoad();
                }, getDemoDelay(350));
            }
        };

        observerRef.current = new IntersectionObserver(handleIntersection, options);

        if (elementRef.current) {
            observerRef.current.observe(elementRef.current);
        }

        return () => {
            if (!visible && elementRef.current) {
                observerRef.current.unobserve(elementRef.current); // eslint-disable-line react-hooks/exhaustive-deps
            }

            clearTimeout(timeoutRef.current);
        };
    }, [visible, onLoad, options]);

    return (
        <>
            {!visible && (
                <div ref={elementRef} className="card">
                    <div className="deferred-demo-loading" />
                </div>
            )}
            {visible && children}
        </>
    );
};

export default DeferredDemo;

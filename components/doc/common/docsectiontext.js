import { useRouter } from 'next/router';
import React from 'react';

export function DocSectionText(props) {
    const { id, label, level = 2, children } = props;
    const router = useRouter();

    const onClick = (event) => {
        const parentElement = event.currentTarget.parentElement;
        const hash = window.location.hash.substring(1);

        hash === id && event.preventDefault();

        setTimeout(() => {
            parentElement.scrollIntoView({ block: 'start' });
        }, 0);
    };

    const content = (
        <>
            {label}
            <a href={router.basePath + router.pathname + '#' + id} target="_self" id={id} onClick={onClick}>
                #
            </a>
        </>
    );

    const renderTitle = (titleProps) => {
        return React.createElement(`h${level}`, { className: 'doc-section-label' }, titleProps.children);
    };

    return (
        <>
            {renderTitle({ children: content })}
            <div className="doc-section-description">{children}</div>
        </>
    );
}

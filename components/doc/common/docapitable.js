import { resolveConditional } from '../../lib/utils/ConditionalUtils';
import { ObjectUtils, classNames } from '@/components/lib/utils/Utils';
import { useRouter } from 'next/router';
import React, { useContext } from 'react';
import AppContentContext from '../../layout/appcontentcontext';
import { DocSectionText } from './docsectiontext';

function handleSonarNested1Callback(
    createContent,

    _v,
    i
) {
    return (
        <div className="doc-option-params" key={_v?.id ?? _v?.key ?? _v?.name ?? _v?.label ?? _v?.value ?? _v?.href ?? _v?.src ?? _v?.field ?? JSON.stringify(_v)}>
            <span className="doc-option-parameter-name">{_v.name}: </span>
            <span className="doc-option-parameter-type">{createContent(_v.type)}</span>
            <br />
        </div>
    );
}

function handleSonarNested2(appContentContext, v, createContent, k, d) {
    return (
        <div className={classNames('doc-option-default', { 'doc-option-dark': appContentContext.darkMode, 'doc-option-light': !appContentContext.darkMode })}>
            {resolveConditional(ObjectUtils.isEmpty(v), handleSonarNested1.bind(null), () => createContent(v, k === 'name', d.deprecated))}
        </div>
    );
}

function handleSonarNested3(k, createContent, v, d, appContentContext) {
    return resolveConditional(
        k === 'type',
        () => <span className="doc-option-type">{createContent(v, k === 'name', d.deprecated)}</span>,
        () =>
            resolveConditional(
                k === 'returnType',
                () => <div className={classNames('doc-option-returnType', { 'doc-option-dark': appContentContext.darkMode, 'doc-option-light': !appContentContext.darkMode })}>{createContent(v, k === 'name', d.deprecated)}</div>,

                () =>
                    resolveConditional(
                        k === 'description' || k === 'values',
                        () => <span className="doc-option-description">{v}</span>,
                        () => createContent(v, k === 'name', d.deprecated)
                    )
            )
    );
}

function handleSonarNested1() {
    return 'null';
}

const DocApiTable = (props) => {
    const appContentContext = useContext(AppContentContext);
    const { id, data, name, description, allowLink = true } = props;
    const isPT = id.startsWith('pt.');
    const router = useRouter();

    if (ObjectUtils.isNotEmpty(data)) {
        const headers = Object.keys(data[0]);

        const onClick = (id, behavior) => {
            const element = document.getElementById(id);

            element?.parentElement.scrollIntoView({ block: 'start', behavior });
        };

        const createContent = (value, isLinkableOption, deprecated) => {
            if (allowLink && value) {
                const splitedValues = value.split('|');

                return splitedValues.map((sValue, i) => {
                    if (sValue.includes(name)) {
                        const matchedIndex = sValue.indexOf(name);
                        let val = sValue.substring(matchedIndex);
                        const boundaryIndex = [...val].findIndex((character) => '[]<>'.includes(character));

                        if (boundaryIndex !== -1) {
                            val = val.slice(0, boundaryIndex);
                        }

                        val = val.trim();
                        const apiValue = val === `${name}Props` ? 'props' : val;
                        const apiId = name === val ? `api.${name}` : `api.${name}.${apiValue}`;

                        return (
                            <React.Fragment key={sValue?.id ?? sValue?.key ?? sValue?.name ?? sValue?.label ?? sValue?.value ?? sValue?.href ?? sValue?.src ?? sValue?.field ?? JSON.stringify(sValue)}>
                                {i !== 0 ? '|' : ''}
                                <a href={router.basePath + router.pathname + `#${apiId}`} target="_self" onClick={() => onClick(apiId, 'smooth')}>
                                    {sValue}
                                </a>
                            </React.Fragment>
                        );
                    }

                    return (
                        <React.Fragment key={sValue?.id ?? sValue?.key ?? sValue?.name ?? sValue?.label ?? sValue?.value ?? sValue?.href ?? sValue?.src ?? sValue?.field ?? JSON.stringify(sValue)}>
                            {i !== 0 ? '|' : ''}
                            {isLinkableOption ? (
                                <span id={id + '.' + sValue} className={classNames('doc-option-name', { 'line-through cursor-pointer': !!deprecated })} title={deprecated}>
                                    {sValue}
                                    <a href={router.basePath + router.pathname + `#${id + '.' + sValue}`} target="_self" onClick={() => onClick(id + '.' + sValue)} className="doc-option-link">
                                        <i className="pi pi-link" />
                                    </a>
                                </span>
                            ) : (
                                sValue
                            )}
                        </React.Fragment>
                    );
                });
            }

            const val = value?.includes('": "') ? value.replaceAll(/['"]+/g, '').replaceAll(/\.,/gm, '.') : value;

            return isLinkableOption ? (
                <span id={id + '.' + val} className={classNames('doc-option-name', { 'line-through cursor-pointer': !!deprecated })} title={deprecated}>
                    {val}
                    <a href={router.basePath + router.pathname + `#${id + '.' + val}`} target="_self" onClick={() => onClick(id + '.' + val)} className="doc-option-link">
                        <i className="pi pi-link" />
                    </a>
                </span>
            ) : (
                val
            );
        };

        const createTBody = () => {
            return data.map((d, i) => {
                if (isPT) {
                    const { value, label, description } = d;

                    return (
                        <tr key={d?.id ?? d?.key ?? d?.name ?? d?.label ?? d?.value ?? d?.href ?? d?.src ?? d?.field ?? JSON.stringify(d)}>
                            <td>{value}</td>
                            <td>{label}</td>
                            <td>{description}</td>
                        </tr>
                    );
                }

                return (
                    <tr key={d?.id ?? d?.key ?? d?.name ?? d?.label ?? d?.value ?? d?.href ?? d?.src ?? d?.field ?? JSON.stringify(d)}>
                        {Object.entries(d).map(
                            ([k, v], index) =>
                                k !== 'readonly' &&
                                k !== 'optional' &&
                                k !== 'deprecated' && (
                                    <td key={k}>
                                        {k === 'parameters'
                                            ? v.map(handleSonarNested1Callback.bind(null, createContent))
                                            : resolveConditional(k === 'default', handleSonarNested2.bind(null, appContentContext, v, createContent, k, d), handleSonarNested3.bind(null, k, createContent, v, d, appContentContext))}
                                    </td>
                                )
                        )}
                    </tr>
                );
            });
        };

        const createTHead = () => {
            return isPT ? (
                <tr>
                    {headers.map((h) => (
                        <th key={h}>{h}</th>
                    ))}
                </tr>
            ) : (
                <tr>{headers.map((h) => h !== 'readonly' && h !== 'optional' && h !== 'deprecated' && <th key={h}>{h}</th>)}</tr>
            );
        };

        const thead = createTHead();
        const tbody = createTBody();

        return (
            <React.Fragment key={id}>
                <DocSectionText {...props}>
                    <p>{description}</p>
                </DocSectionText>
                <div className="doc-tablewrapper">
                    <table className="doc-table">
                        <thead>{thead}</thead>
                        <tbody>{tbody}</tbody>
                    </table>
                </div>
            </React.Fragment>
        );
    }

    return null;
};

export default DocApiTable;

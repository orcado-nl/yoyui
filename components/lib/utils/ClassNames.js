function resolveClassNames(value) {
    if (!value) return [];

    const type = typeof value;

    if (type === 'string' || type === 'number') return [value];
    if (Array.isArray(value)) return value.flatMap(resolveClassNames);
    if (type === 'object')
        return Object.entries(value)
            .filter(([, enabled]) => enabled)
            .map(([className]) => className);

    return [];
}

export function classNames(...args) {
    return args.flatMap(resolveClassNames).join(' ').trim();
}

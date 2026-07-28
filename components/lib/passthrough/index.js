export const usePassThrough = (pt1 = {}, pt2 = {}, options = undefined) => {
    const secondArgumentIsOptions = options === undefined && ('mergeSections' in pt2 || 'mergeProps' in pt2 || 'classNameMergeFunction' in pt2);
    const resolvedPt2 = secondArgumentIsOptions ? {} : pt2;
    const { mergeSections = true, mergeProps = false, classNameMergeFunction } = secondArgumentIsOptions ? pt2 : options || {};

    return {
        _usept: {
            mergeSections,
            mergeProps,
            classNameMergeFunction
        },
        originalValue: pt1,
        value: { ...pt1, ...resolvedPt2 }
    };
};

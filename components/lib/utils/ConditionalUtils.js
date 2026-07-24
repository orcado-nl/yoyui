/**
 * Lazily resolves a conditional value. This keeps chained conditions readable
 * without evaluating the branch that was not selected.
 */
export function resolveConditional(condition, whenTrue, whenFalse) {
    return condition ? whenTrue() : whenFalse();
}

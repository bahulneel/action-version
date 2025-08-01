/**
 * Base result from a tactic execution.
 * Only reports what happened - doesn't dictate strategy behavior.
 */
export interface TacticResult<T = any, C = any> {
    applied: boolean;
    success: boolean;
    result?: T;
    context?: Partial<C>;
    message?: string;
}
/**
 * Interface that all tactics must implement.
 */
export interface Tactic<T, C> {
    name: string;
    assess(context: C): boolean;
    attempt(context: C): Promise<TacticResult<T, C>>;
}
/**
 * Interface for a tactical plan.
 */
export interface TacticalPlanInterface<T, C> {
    description?: string | undefined;
    execute(context: C): Promise<T>;
}
//# sourceMappingURL=tactics.d.ts.map
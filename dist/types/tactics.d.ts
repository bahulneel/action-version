/**
 * Base result from a tactic execution.
 * Only reports what happened - doesn't dictate strategy behavior.
 */
export interface TacticResult<T = unknown, C = unknown> {
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
 * Result from maneuver execution.
 * Provides a consistent interface regardless of maneuver type.
 */
export interface ManeuverResult<T, C = unknown> {
    success: boolean;
    result?: T;
    context?: Partial<C>;
    message?: string;
    tacticResults?: Array<{
        tacticName: string;
        success: boolean;
        result?: unknown;
        message?: string;
    }>;
}
/**
 * Maneuver: orchestrates tactics to satisfy a goal.
 */
export interface Maneuver<T, C> {
    name: string;
    description?: string;
    execute(context: C): Promise<ManeuverResult<T, C>>;
}
//# sourceMappingURL=tactics.d.ts.map
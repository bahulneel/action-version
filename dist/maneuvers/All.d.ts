import type { ManeuverResult, Tactic } from '@types';
/**
 * All maneuver: runs all applicable tactics and collects results.
 * Useful when you need to aggregate outputs from multiple tactics.
 * Returns a ManeuverResult with an array of individual results.
 */
export declare class AllManeuver<T, C> {
    private readonly tactics;
    readonly name: string;
    readonly description?: string;
    constructor(tactics: Tactic<T, C>[], name: string, description?: string);
    /**
     * Execute all applicable tactics and collect results.
     */
    execute(context: C): Promise<ManeuverResult<T[], C>>;
    private executeTactic;
}
//# sourceMappingURL=All.d.ts.map
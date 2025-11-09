import type { Tactic, TacticResult, Maneuver } from '@types';
/**
 * A tactical wrapper around a maneuver.
 * Allows Maneuvers to participate as Tactics in larger tactical structures.
 */
export declare class PlanTactic<T, C> implements Tactic<T, C> {
    private maneuver;
    readonly name: string;
    constructor(maneuver: Maneuver<T, C>);
    /**
     * Assess if this plan tactic is applicable.
     */
    assess(_context: C): boolean;
    /**
     * Attempt this plan tactic by executing the underlying maneuver.
     */
    attempt(context: C): Promise<TacticResult<T, C>>;
}
//# sourceMappingURL=PlanTactic.d.ts.map
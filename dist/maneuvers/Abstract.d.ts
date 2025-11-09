import type { Tactic, Maneuver as ManeuverInterface, TacticResult, ManeuverResult } from '@types';
/**
 * Abstract base class for all maneuver types.
 * Defines the common interface and structure for executing tactics.
 */
export declare abstract class AbstractManeuver<T, C> implements ManeuverInterface<T, C> {
    protected readonly tactics: Tactic<T, C>[];
    readonly name: string;
    readonly description?: string;
    constructor(tactics: Tactic<T, C>[], name: string, description?: string);
    /**
     * Execute this maneuver according to its execution strategy.
     * Must be implemented by concrete maneuver types.
     */
    abstract execute(context: C): Promise<ManeuverResult<T, C>>;
    /**
     * Helper to execute a single tactic and handle its result.
     */
    protected executeTactic(tactic: Tactic<T, C>, context: C): Promise<TacticResult<T, C>>;
}
//# sourceMappingURL=Abstract.d.ts.map
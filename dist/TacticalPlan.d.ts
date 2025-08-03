import type { Tactic, TacticalPlanInterface } from './types/tactics.js';
/**
 * A tactical plan - coordinates the execution of an ordered sequence of tactics.
 */
export declare class TacticalPlan<T, C> implements TacticalPlanInterface<T, C> {
    private tactics;
    readonly description?: string | undefined;
    private failureLog;
    constructor(tactics: Tactic<T, C>[], description?: string);
    /**
     * Execute this tactical plan.
     */
    execute(context: C): Promise<T>;
}
//# sourceMappingURL=TacticalPlan.d.ts.map
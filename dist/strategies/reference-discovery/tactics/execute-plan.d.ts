import type { Tactic, TacticResult } from '../../../types/tactics.js';
import type { ReferencePointResult } from '../../../types/index.js';
import type { ReferenceDiscoveryContext } from './types.js';
import { TacticalPlan } from '../../../TacticalPlan.js';
/**
 * ExecutePlanTactic - Executes a tactical plan as a single tactic.
 *
 * This enables composition where a plan (sequence of tactics) can be treated
 * as a tactic itself, allowing for nested and composable tactical strategies.
 */
export declare class ExecutePlanTactic implements Tactic<ReferencePointResult, ReferenceDiscoveryContext> {
    private readonly plan;
    private readonly tacticName;
    constructor(plan: TacticalPlan<ReferencePointResult, ReferenceDiscoveryContext>, name?: string);
    get name(): string;
    assess(_context: ReferenceDiscoveryContext): boolean;
    attempt(context: ReferenceDiscoveryContext): Promise<TacticResult<ReferencePointResult, ReferenceDiscoveryContext>>;
}
//# sourceMappingURL=execute-plan.d.ts.map
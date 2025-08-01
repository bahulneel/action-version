import { TacticalPlan } from '../../TacticalPlan.js';
import type { ReferencePointResult } from '../../types/index.js';
import type { ReferenceDiscoveryContext } from './tactics/types.js';
/**
 * Reference Discovery Tactics - Tactical plans for different scenarios.
 *
 * This module provides pre-configured tactical plans for reference discovery:
 * - Different workflows use different tactical arrangements
 * - Tactical execution order is explicit and configurable
 * - Plans are composable and testable
 */
export declare class ReferenceDiscoveryTactics {
    /**
     * Branch-based reference discovery plan.
     *
     * Order: MergeBase -> LastVersionCommit
     *
     * This tries to find the merge base first (most accurate for branch workflows),
     * but falls back to finding the last version change commit if merge base fails.
     */
    static branchBased(): TacticalPlan<ReferencePointResult, ReferenceDiscoveryContext>;
    /**
     * Tag-based reference discovery plan.
     *
     * For now, this just uses the version commit tactic since tag-based
     * discovery is still handled in the main DiscoveryService.
     * In the future, we could create a TagBasedTactic.
     */
    static tagBased(): TacticalPlan<ReferencePointResult, ReferenceDiscoveryContext>;
}
//# sourceMappingURL=tactics.d.ts.map
import { MergeBaseTactic } from './tactics/merge-base.js'
import { LastVersionCommitTactic } from './tactics/last-version-commit.js'
import { DiffBasedVersionCommitTactic } from './tactics/diff-based-version-commit.js'
import { ExecutePlanTactic } from './tactics/execute-plan.js'
import { TacticalPlan } from '../../TacticalPlan.js'
import type { ReferencePointResult } from '../../types/index.js'
import type { ReferenceDiscoveryContext } from './tactics/types.js'

/**
 * Reference Discovery Tactics - Tactical plans for different scenarios.
 *
 * This module provides pre-configured tactical plans for reference discovery:
 * - Different workflows use different tactical arrangements
 * - Tactical execution order is explicit and configurable
 * - Plans are composable and testable
 */
export class ReferenceDiscoveryTactics {
  /**
   * Branch-based reference discovery plan.
   *
   * Order: MergeBase -> LastVersionCommit
   *
   * This tries to find the merge base first (most accurate for branch workflows),
   * but falls back to finding the last version change commit if merge base fails.
   */
  public static branchBased(): TacticalPlan<ReferencePointResult, ReferenceDiscoveryContext> {
    return new TacticalPlan(
      [new MergeBaseTactic(), new LastVersionCommitTactic()],
      'Branch-based reference discovery: MergeBase -> LastVersionCommit'
    )
  }

  /**
   * Tag-based reference discovery plan.
   *
   * For now, this just uses the version commit tactic since tag-based
   * discovery is still handled in the main DiscoveryService.
   * In the future, we could create a TagBasedTactic.
   */
  public static tagBased(): TacticalPlan<ReferencePointResult, ReferenceDiscoveryContext> {
    return new TacticalPlan(
      [new LastVersionCommitTactic()],
      'Tag-based reference discovery: LastVersionCommit only'
    )
  }

  /**
   * Composed version commit discovery plan.
   *
   * Uses both the efficient -L approach and the thorough diff-based approach.
   * This provides the best of both worlds: speed and reliability.
   */
  public static composedVersionCommit(): TacticalPlan<
    ReferencePointResult,
    ReferenceDiscoveryContext
  > {
    return new TacticalPlan(
      [new LastVersionCommitTactic(), new DiffBasedVersionCommitTactic()],
      'Composed version commit discovery: LastVersionCommit -> DiffBasedVersionCommit'
    )
  }

  /**
   * Create a plan that can be executed as a tactic.
   *
   * This enables composition where plans can be nested and reused.
   */
  public static createExecutablePlan(
    plan: TacticalPlan<ReferencePointResult, ReferenceDiscoveryContext>,
    name?: string
  ): ExecutePlanTactic {
    return new ExecutePlanTactic(plan, name)
  }
}

import * as core from '@actions/core'
import type { Tactic, TacticResult } from '../../../types/tactics.js'
import type { ReferencePointResult } from '../../../types/index.js'
import type { ReferenceDiscoveryContext } from './types.js'
import { TacticalPlan } from '../../../TacticalPlan.js'

/**
 * ExecutePlanTactic - Executes a tactical plan as a single tactic.
 *
 * This enables composition where a plan (sequence of tactics) can be treated
 * as a tactic itself, allowing for nested and composable tactical strategies.
 */
export class ExecutePlanTactic implements Tactic<ReferencePointResult, ReferenceDiscoveryContext> {
  private readonly plan: TacticalPlan<ReferencePointResult, ReferenceDiscoveryContext>
  private readonly tacticName: string

  constructor(plan: TacticalPlan<ReferencePointResult, ReferenceDiscoveryContext>, name?: string) {
    this.plan = plan
    this.tacticName = name || `ExecutePlan(${plan.description})`
  }

  public get name(): string {
    return this.tacticName
  }

  public assess(_context: ReferenceDiscoveryContext): boolean {
    // A plan is always applicable - it will handle its own tactic assessment
    return true
  }

  public async attempt(
    context: ReferenceDiscoveryContext
  ): Promise<TacticResult<ReferencePointResult, ReferenceDiscoveryContext>> {
    try {
      core.debug(`🎯 Executing plan as tactic: ${this.plan.description}`)

      const result = await this.plan.execute(context)

      return {
        applied: true,
        success: true,
        result: result,
        message: `Plan executed successfully`,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        applied: true,
        success: false,
        message: `Plan execution error: ${errorMessage}`,
      }
    }
  }
}

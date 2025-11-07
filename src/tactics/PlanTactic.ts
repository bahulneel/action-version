import * as core from '@actions/core'
import type { Tactic, TacticResult, TacticalPlanInterface } from '../types/tactics.js'

/**
 * A tactical wrapper around a tactical plan.
 * Allows TacticalPlans to participate as Tactics in larger tactical structures.
 */
export class PlanTactic<T, C> implements Tactic<T, C> {
  public readonly name: string

  constructor(private plan: TacticalPlanInterface<T, C>) {
    this.name = `${this.plan.name}Tactic`
  }

  /**
   * Assess if this plan tactic is applicable.
   */
  public assess(_context: C): boolean {
    // A plan tactic is always applicable - the plan itself will handle tactic assessment
    return true
  }

  /**
   * Attempt this plan tactic by executing the underlying plan.
   */
  public async attempt(context: C): Promise<TacticResult<T, C>> {
    try {
      core.debug(`🎯 Attempting plan tactic: ${this.name}`)

      const result = await this.plan.execute(context)

      return {
        applied: true,
        success: true,
        result,
        message: `Plan executed successfully`,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      core.debug(`❌ ${this.name}: Error - ${errorMessage}`)

      return {
        applied: true,
        success: false,
        message: `Plan execution failed: ${errorMessage}`,
      }
    }
  }
}

import * as core from '@actions/core'
import type { Tactic, TacticalPlanInterface } from './types/tactics.js'

/**
 * A tactical plan - coordinates the execution of an ordered sequence of tactics.
 */
export class TacticalPlan<T, C> implements TacticalPlanInterface<T, C> {
  public readonly description?: string | undefined

  constructor(private tactics: Tactic<T, C>[], description?: string) {
    this.description = description
  }

  /**
   * Execute this tactical plan.
   */
  public async execute(context: C): Promise<T> {
    if (this.tactics.length === 0) {
      throw new Error('No tactics in this plan')
    }

    core.info(`🎯 Executing tactical plan with ${this.tactics.length} tactics`)
    if (this.description) {
      core.debug(`📋 Plan: ${this.description}`)
    }

    for (const tactic of this.tactics) {
      core.debug(`🎯 Executing tactic: ${tactic.name}`)

      // Assess if this tactic is applicable
      if (!tactic.assess(context)) {
        core.debug(`⏭️ ${tactic.name}: Not applicable to this context`)
        continue
      }

      try {
        const result = await tactic.attempt(context)

        // Update context with any new information
        if (result.context && typeof context === 'object' && context !== null) {
          Object.assign(context, result.context)
        }

        if (result.applied && result.success && result.result) {
          core.info(`✅ ${tactic.name}: ${result.message || 'Success'}`)
          return result.result
        } else if (result.applied && !result.success) {
          core.debug(`❌ ${tactic.name}: ${result.message || 'Failed'}`)
        } else {
          core.debug(`⏭️ ${tactic.name}: ${result.message || 'Not applied'}`)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        core.debug(`❌ ${tactic.name}: Error - ${errorMessage}`)
        // Continue to next tactic on error
      }
    }

    throw new Error(`All ${this.tactics.length} tactics in plan exhausted`)
  }
}

import * as core from '@actions/core'
import type { Tactic, TacticResult, Maneuver } from '@types'

/**
 * A tactical wrapper around a maneuver.
 * Allows Maneuvers to participate as Tactics in larger tactical structures.
 */
export class PlanTactic<T, C> implements Tactic<T, C> {
  public readonly name: string

  constructor(private maneuver: Maneuver<T, C>) {
    this.name = `${this.maneuver.name}Tactic`
  }

  /**
   * Assess if this plan tactic is applicable.
   */
  public assess(_context: C): boolean {
    // A plan tactic is always applicable - the maneuver itself will handle tactic assessment
    return true
  }

  /**
   * Attempt this plan tactic by executing the underlying maneuver.
   */
  public async attempt(context: C): Promise<TacticResult<T, C>> {
    try {
      core.debug(`🎯 Attempting plan tactic: ${this.name}`)

      const maneuverResult = await this.maneuver.execute(context)

      if (maneuverResult.success && maneuverResult.result) {
        return {
          applied: true,
          success: true,
          result: maneuverResult.result,
          ...(maneuverResult.context !== undefined && { context: maneuverResult.context }),
          ...(maneuverResult.message !== undefined && {
            message: maneuverResult.message || `Maneuver executed successfully`,
          }),
        }
      } else {
        return {
          applied: true,
          success: false,
          message: maneuverResult.message || `Maneuver execution failed`,
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      core.debug(`❌ ${this.name}: Error - ${errorMessage}`)

      return {
        applied: true,
        success: false,
        message: `Maneuver execution failed: ${errorMessage}`,
      }
    }
  }
}

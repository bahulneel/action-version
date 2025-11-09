import * as core from '@actions/core'
import type { ManeuverResult, Tactic, TacticResult } from '@types'

/**
 * All maneuver: runs all applicable tactics and collects results.
 * Useful when you need to aggregate outputs from multiple tactics.
 * Returns a ManeuverResult with an array of individual results.
 */
export class AllManeuver<T, C> {
  public readonly name: string
  public readonly description?: string

  constructor(private readonly tactics: Tactic<T, C>[], name: string, description?: string) {
    this.name = name
    if (description) {
      this.description = description
    }
  }
  /**
   * Execute all applicable tactics and collect results.
   */
  public async execute(context: C): Promise<ManeuverResult<T[], C>> {
    if (this.tactics.length === 0) {
      return {
        success: false,
        message: `Maneuver '${this.name}': No tactics provided`,
      }
    }

    core.info(`🎯 Executing maneuver '${this.name}' (all) with ${this.tactics.length} tactics`)
    if (this.description) {
      core.debug(`📋 ${this.description}`)
    }

    const results: T[] = []
    const tacticResults: Array<{
      tacticName: string
      success: boolean
      result?: T
      message?: string
    }> = []

    for (const tactic of this.tactics) {
      core.debug(`🎯 Executing tactic: ${tactic.name}`)

      const result = await this.executeTactic(tactic, context)

      const tacticResultEntry = {
        tacticName: tactic.name,
        success: result.success,
        ...(result.result !== undefined && { result: result.result }),
        ...(result.message !== undefined && { message: result.message }),
      }
      tacticResults.push(tacticResultEntry)

      if (result.applied && result.success && result.result) {
        core.info(`✅ ${tactic.name}: ${result.message || 'Success'}`)
        results.push(result.result)
      } else if (result.applied && !result.success) {
        core.debug(`❌ ${tactic.name}: ${result.message || 'Failed'}`)
      } else {
        core.debug(`⏭️ ${tactic.name}: ${result.message || 'Not applied'}`)
      }
    }

    const allSucceeded = tacticResults.every((r) => r.success)
    const anySucceeded = tacticResults.some((r) => r.success)

    return {
      success: anySucceeded,
      result: results,
      message: allSucceeded
        ? `All tactics succeeded`
        : anySucceeded
        ? `Some tactics succeeded (${results.length}/${this.tactics.length})`
        : `All tactics failed`,
      tacticResults,
    }
  }

  private async executeTactic(tactic: Tactic<T, C>, context: C): Promise<TacticResult<T, C>> {
    // Assess if this tactic is applicable
    if (!tactic.assess(context)) {
      return {
        applied: false,
        success: false,
        message: 'Not applicable to this context',
      }
    }

    try {
      const result = await tactic.attempt(context)

      // Update context with any new information
      if (result.context && typeof context === 'object' && context !== null) {
        Object.assign(context, result.context)
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        applied: true,
        success: false,
        message: `Error: ${errorMessage}`,
      }
    }
  }
}

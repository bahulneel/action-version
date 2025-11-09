import * as core from '@actions/core'
import type { ManeuverResult } from '@types'
import { AbstractManeuver } from './Abstract.js'

/**
 * Any maneuver: runs first matching (assessed) tactic.
 * Does not retry on failure - uses assessment to choose the right tactic upfront.
 */
export class AnyManeuver<T, C> extends AbstractManeuver<T, C> {
  /**
   * Execute the first tactic that assesses as applicable.
   */
  public async execute(context: C): Promise<ManeuverResult<T, C>> {
    if (this.tactics.length === 0) {
      return {
        success: false,
        message: `Maneuver '${this.name}': No tactics provided`,
      }
    }

    core.info(`🎯 Executing maneuver '${this.name}' (any) with ${this.tactics.length} tactics`)
    if (this.description) {
      core.debug(`📋 ${this.description}`)
    }

    const tacticResults: Array<{ tacticName: string; success: boolean; result?: T; message?: string }> = []

    for (const tactic of this.tactics) {
      core.debug(`🎯 Assessing tactic: ${tactic.name}`)

      const result = await this.executeTactic(tactic, context)

      const tacticResultEntry = {
        tacticName: tactic.name,
        success: result.success,
        ...(result.result !== undefined && { result: result.result }),
        ...(result.message !== undefined && { message: result.message }),
      }
      tacticResults.push(tacticResultEntry)

      if (result.applied) {
        if (result.success && result.result) {
          core.info(`✅ ${tactic.name}: ${result.message || 'Success'}`)
          return {
            success: true,
            result: result.result,
            ...(result.context !== undefined && { context: result.context }),
            ...(result.message !== undefined && { message: result.message }),
            tacticResults,
          }
        } else {
          return {
            success: false,
            message: `Maneuver '${this.name}': Tactic '${tactic.name}' failed: ${result.message}`,
            tacticResults,
          }
        }
      }
    }

    return {
      success: false,
      message: `Maneuver '${this.name}': No applicable tactics found`,
      tacticResults,
    }
  }
}


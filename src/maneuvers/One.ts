import * as core from '@actions/core'
import type { ManeuverResult } from '@types'
import { AbstractManeuver } from './Abstract.js'

/**
 * One maneuver: runs tactics in sequence, returns on first success.
 * If a tactic fails, tries the next one (fallback behavior).
 */
export class OneManeuver<T, C> extends AbstractManeuver<T, C> {
  /**
   * Execute tactics in sequence until one succeeds.
   */
  public async execute(context: C): Promise<ManeuverResult<T, C>> {
    if (this.tactics.length === 0) {
      return {
        success: false,
        message: `Maneuver '${this.name}': No tactics provided`,
      }
    }

    core.info(`🎯 Executing maneuver '${this.name}' (one) with ${this.tactics.length} tactics`)
    if (this.description) {
      core.debug(`📋 ${this.description}`)
    }

    const tacticResults: Array<{ tacticName: string; success: boolean; result?: T; message?: string }> = []

    for (const tactic of this.tactics) {
      core.debug(`🎯 Trying tactic: ${tactic.name}`)

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
        return {
          success: true,
          result: result.result,
          ...(result.context !== undefined && { context: result.context }),
          ...(result.message !== undefined && { message: result.message }),
          tacticResults,
        }
      } else if (result.applied && !result.success) {
        core.debug(`❌ ${tactic.name}: ${result.message || 'Failed'} - trying next`)
      } else {
        core.debug(`⏭️ ${tactic.name}: ${result.message || 'Not applied'}`)
      }
    }

    return {
      success: false,
      message: `Maneuver '${this.name}': All ${this.tactics.length} tactics exhausted`,
      tacticResults,
    }
  }
}


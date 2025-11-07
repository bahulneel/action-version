import type { Tactic, TacticResult } from '../../../types/tactics.js'
import type { BumpType } from '../../../types/index.js'

export interface VersionContext {
  version: string
}

/**
 * GuessBumpTypeTactic - Guess bump type based on version patterns.
 */
export class GuessBumpTypeTactic implements Tactic<BumpType, VersionContext> {
  public readonly name = 'GuessBumpType'

  public assess(context: VersionContext): boolean {
    return Boolean(context.version)
  }

  public async attempt(context: VersionContext): Promise<TacticResult<BumpType, VersionContext>> {
    try {
      let bumpType: BumpType = 'patch'

      if (context.version.endsWith('.0.0')) {
        bumpType = 'major'
      } else if (context.version.endsWith('.0')) {
        bumpType = 'minor'
      }

      return {
        applied: true,
        success: true,
        result: bumpType,
        message: `Guessed bump type: ${bumpType}`,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        applied: true,
        success: false,
        message: `Failed to guess bump type: ${errorMessage}`,
      }
    }
  }
}

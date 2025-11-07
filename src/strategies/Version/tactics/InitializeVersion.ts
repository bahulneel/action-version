import * as semver from 'semver'
import type { Tactic, TacticResult } from '../../../types/tactics.js'

export interface VersionInitContext {
  version?: string
}

/**
 * InitializeVersionTactic - Initialize version if missing or invalid.
 */
export class InitializeVersionTactic implements Tactic<string, VersionInitContext> {
  public readonly name = 'InitializeVersion'

  public assess(context: VersionInitContext): boolean {
    return context.version === undefined || !semver.valid(context.version)
  }

  public async attempt(
    context: VersionInitContext
  ): Promise<TacticResult<string, VersionInitContext>> {
    try {
      const initializedVersion = semver.coerce(context.version)?.toString() ?? '0.0.0'

      return {
        applied: true,
        success: true,
        result: initializedVersion,
        message: `Initialized version: ${initializedVersion}`,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        applied: true,
        success: false,
        message: `Failed to initialize version: ${errorMessage}`,
      }
    }
  }
}

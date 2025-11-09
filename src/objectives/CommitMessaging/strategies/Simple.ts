import type {
  CommitMessagingGoals,
  CommitMessagingConfig,
  CommitInfo,
  FormatVersionContext,
  FormatDependencyContext,
  StrategyOf,
} from '@types'
import { parseCommits } from '../maneuvers/parse-commits.js'

/**
 * Simple commit messaging strategy.
 * Uses basic formatting without conventional commit requirements.
 */
export class Simple implements StrategyOf<CommitMessagingGoals> {
  readonly name = 'simple'
  readonly description = 'Simple commit format'

  constructor(_config: CommitMessagingConfig) {}

  public async parseCommits(logEntries: unknown[], sinceRef?: string): Promise<CommitInfo[]> {
    // Use parseCommits maneuver (same fallback chain as conventional)
    const result = await parseCommits.execute({
      logEntries,
      ...(sinceRef !== undefined && { sinceRef }),
    })

    if (result.success && result.result) {
      return result.result
    }

    // Return empty array if all tactics fail
    return []
  }

  public async formatVersion(context: FormatVersionContext): Promise<string> {
    const prefix = context.packageName === 'root' ? '' : `[${context.packageName}] `
    return `${prefix}Bump version to ${context.version}`
  }

  public async formatDependency(context: FormatDependencyContext): Promise<string> {
    const prefix = context.packageName === 'root' ? '' : `[${context.packageName}] `
    return `${prefix}Update ${context.depName} to ${context.depVersion}`
  }
}

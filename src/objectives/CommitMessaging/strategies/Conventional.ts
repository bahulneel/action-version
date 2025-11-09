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
 * Conventional commit messaging strategy.
 * Uses conventional commit format for parsing and formatting.
 */
export class Conventional implements StrategyOf<CommitMessagingGoals> {
  readonly name = 'conventional'
  readonly description = 'Conventional commit format'

  constructor(_config: CommitMessagingConfig) {}

  public async parseCommits(logEntries: unknown[], sinceRef?: string): Promise<CommitInfo[]> {
    // Use parseCommits maneuver (tries conventional, falls back to best guess)
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
    const scope = context.packageName === 'root' ? '' : `(${context.packageName})`
    return `chore${scope}: bump to ${context.version}`
  }

  public async formatDependency(context: FormatDependencyContext): Promise<string> {
    const scope = context.packageName === 'root' ? '' : `(${context.packageName})`
    return `chore${scope}: update ${context.depName} to ${context.depVersion}`
  }
}

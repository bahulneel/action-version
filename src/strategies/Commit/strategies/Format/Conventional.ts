import type {
  FormatCommitStrategy,
  FormatVersionContext,
  FormatDependencyContext,
} from '../../../../types/strategies/commit.js'

/**
 * Conventional commit format strategy.
 * Uses conventional commit format for commit messages.
 */
export class Conventional implements FormatCommitStrategy {
  public readonly name = 'conventional'

  public async formatVersion(context: FormatVersionContext): Promise<string> {
    const scope = context.packageName === 'root' ? '' : `(${context.packageName})`
    return `chore${scope}: bump to ${context.version}`
  }

  public async formatDependency(context: FormatDependencyContext): Promise<string> {
    const scope = context.packageName === 'root' ? '' : `(${context.packageName})`
    return `chore${scope}: update ${context.depName} to ${context.depVersion}`
  }
}

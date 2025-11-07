import type { Config } from '../../types/config.js'
import type {
  CommitStrategy,
  ParseCommitsContext,
  FormatVersionContext,
  FormatDependencyContext,
} from '../../types/strategies/commit.js'
import type { CommitInfo } from '../../types/index.js'
import { TacticalPlan } from '../../tactics/TacticalPlan.js'
import { ObjectiveTactic } from '../../tactics/ObjectiveTactic.js'
import { ConventionalCommitTactic } from './tactics/ConventionalCommit.js'
import { BestGuessCommitTactic } from './tactics/BestGuessCommit.js'
import { Format } from './strategies/Format.js'

/**
 * Composite commit strategy that combines parsing and formatting.
 * Uses tactical plans for parsing and sub-objectives for formatting.
 */
export class Strategy implements CommitStrategy {
  public readonly name = 'commit'
  private parsingPlan: TacticalPlan<CommitInfo[], ParseCommitsContext>
  private formatVersionPlan: TacticalPlan<string, FormatVersionContext>
  private formatDependencyPlan: TacticalPlan<string, FormatDependencyContext>

  constructor(config: Config) {
    // Parsing plan with tactics
    this.parsingPlan = new TacticalPlan(
      [new ConventionalCommitTactic(), new BestGuessCommitTactic()],
      'CommitParsing',
      'Parse commits using conventional or heuristic tactics'
    )

    // Format version plan with objective tactic
    this.formatVersionPlan = new TacticalPlan(
      [new ObjectiveTactic(Format, config, 'formatVersion', 'FormatVersion')],
      'FormatVersion',
      'Format version commit messages'
    )

    // Format dependency plan with objective tactic
    this.formatDependencyPlan = new TacticalPlan(
      [new ObjectiveTactic(Format, config, 'formatDependency', 'FormatDependency')],
      'FormatDependency',
      'Format dependency commit messages'
    )
  }

  public async parseCommits(context: ParseCommitsContext): Promise<CommitInfo[]> {
    return await this.parsingPlan.execute(context)
  }

  public formatVersion(context: FormatVersionContext): Promise<string> {
    return this.formatVersionPlan.execute(context)
  }

  public formatDependency(context: FormatDependencyContext): Promise<string> {
    return this.formatDependencyPlan.execute(context)
  }
}

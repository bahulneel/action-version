import * as core from '@actions/core'
import type { ActionConfiguration, StrategyOf } from '@types'
import type { MainGoals } from '../../../types/goals/main.js'
import type { VcsGoals } from '../../../types/goals/vcs.js'
import type { SummaryOutputGoals } from '../../../types/goals/summary.js'
import { vcsObjective } from '../../Vcs/objective.js'
import { summaryOutput } from '../../SummaryOutput/objective.js'
import type { VersionBumpResults } from '../../../types/core.js'

/**
 * Do-nothing action strategy.
 * Performs no versioning operations.
 */
export class DoNothingAction implements StrategyOf<MainGoals> {
  readonly name = 'do-nothing-action'
  readonly description = 'Do-nothing action (no versioning operations)'

  // Goals resolved in constructor (initialization)
  private readonly vcs: VcsGoals
  private readonly summaryOutputGoals: SummaryOutputGoals

  constructor(private readonly config: ActionConfiguration) {
    // Resolve sub-objective goals in constructor (initialization)
    this.vcs = vcsObjective.strategise(config)
    this.summaryOutputGoals = summaryOutput.strategise(config)
  }

  public async performAction(): Promise<import('../../../types/goals/main.js').MainActionResult> {
    core.info('⏭️  Do-nothing strategy: No versioning operations to perform')

    const emptyResults: VersionBumpResults = {
      bumped: {},
      testFailures: [],
      totalPackages: 0,
      releasePackages: 0,
      prereleasePackages: 0,
      finalizedPackages: 0,
      hasBumped: false,
    }

    // Setup VCS (may still need to setup git even if no changes)
    const gitSetup = await this.vcs.setup({
      shouldCreateBranch: this.config.shouldCreateBranch,
      branchTemplate: this.config.branchTemplate,
    })

    // Generate summary even for do-nothing
    await this.summaryOutputGoals.generateSummary(emptyResults, this.config)

    return {
      results: emptyResults,
      gitSetup,
    }
  }
}

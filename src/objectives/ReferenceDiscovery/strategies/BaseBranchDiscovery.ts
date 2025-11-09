import * as core from '@actions/core'
import type {
  ReferenceGoals,
  ReferenceDiscoveryConfig,
  ReferencePointResult,
  ReferenceDiscoveryContext,
} from '../../../types/index.js'
import type { StrategyOf } from '../../../types/strategy.js'
import { MergeBaseTactic } from '../tactics/MergeBase.js'
import simpleGit from 'simple-git'

const git = simpleGit()

/**
 * Branch-based discovery strategy.
 * Finds the merge base between the active branch and the base branch.
 */
export class BaseBranchDiscovery implements StrategyOf<ReferenceGoals> {
  readonly name = 'base-branch-discovery'
  readonly description = 'Find reference point based on merge base with base branch'

  constructor(_config: ReferenceDiscoveryConfig) {}

  public async findReferencePoint(
    baseBranch: string | undefined,
    activeBranch: string
  ): Promise<ReferencePointResult> {
    if (!baseBranch) {
      throw new Error('BaseBranchDiscovery requires a baseBranch')
    }

    const currentBranch = await this.getCurrentBranch()
    const context: ReferenceDiscoveryContext = {
      baseBranch,
      activeBranch,
      currentBranch,
      packageJsonPath: 'package.json',
    }

    // Use MergeBaseTactic to find the reference point
    const tactic = new MergeBaseTactic()
    const result = await tactic.attempt(context)

    if (result.success && result.result) {
      core.info(
        `🎯 Branch reference: commit=${result.result.referenceCommit.substring(0, 8)}, version=${
          result.result.referenceVersion
        }, finalize=${result.result.shouldFinalizeVersions}`
      )
      return result.result
    }

    // Fallback error
    throw new Error(`Failed to find merge base with ${baseBranch}: ${result.message}`)
  }

  private async getCurrentBranch(): Promise<string> {
    try {
      const branch = await git.branch()
      return branch.current
    } catch (error) {
      // Fallback to environment variables
      return process.env?.GITHUB_HEAD_REF || process.env?.GITHUB_REF_NAME || 'main'
    }
  }
}

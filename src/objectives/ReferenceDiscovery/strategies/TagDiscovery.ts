import * as core from '@actions/core'
import type {
  ReferenceGoals,
  ReferenceDiscoveryConfig,
  ReferencePointResult,
  ReferenceDiscoveryContext,
} from '../../../types/index.js'
import type { StrategyOf } from '../../../types/strategy.js'
import { HighestVersionTagTactic } from '../tactics/HighestVersionTag.js'
import simpleGit from 'simple-git'

const git = simpleGit()

/**
 * Tag-based discovery strategy.
 * Finds the highest semantic version tag as the reference point.
 */
export class TagDiscovery implements StrategyOf<ReferenceGoals> {
  readonly name = 'tag-discovery'
  readonly description = 'Find reference point based on highest semantic version tag'

  constructor(_config: ReferenceDiscoveryConfig) {}

  public async findReferencePoint(
    baseBranch: string | undefined,
    activeBranch: string
  ): Promise<ReferencePointResult> {
    const currentBranch = await this.getCurrentBranch()
    const context: ReferenceDiscoveryContext = {
      ...(baseBranch !== undefined && { baseBranch }),
      activeBranch,
      currentBranch,
      packageJsonPath: 'package.json',
    }

    // Use HighestVersionTagTactic to find the reference point
    const tactic = new HighestVersionTagTactic()
    const result = await tactic.attempt(context)

    if (result.success && result.result) {
      core.info(
        `🎯 Tag reference: commit=${result.result.referenceCommit.substring(0, 8)}, version=${
          result.result.referenceVersion
        }`
      )
      return result.result
    }

    // No tags found, fallback to initial commit
    core.info('📦 No tags found, using initial commit as reference')
    const referenceCommit = await this.findInitialCommit()

    return {
      referenceCommit,
      referenceVersion: '0.0.0',
      shouldFinalizeVersions: false,
      shouldForceBump: true, // Force bump from initial state
    }
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

  private async findInitialCommit(): Promise<string> {
    try {
      const log = await git.log({ maxCount: 1000 })
      const commits = log.all

      if (commits.length > 0) {
        return commits[commits.length - 1]!.hash
      }

      return 'HEAD'
    } catch (error) {
      core.warning('Failed to find initial commit, using HEAD')
      return 'HEAD'
    }
  }
}

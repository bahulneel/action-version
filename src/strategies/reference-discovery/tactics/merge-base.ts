import * as core from '@actions/core'
import { simpleGit } from 'simple-git'
import type { Tactic, TacticResult } from '../../../types/tactics.js'
import type { ReferencePointResult } from '../../../types/index.js'
import type { ReferenceDiscoveryContext } from './types.js'
import { TacticConfig } from '../../../utils/tactic-config.js'

const git = simpleGit()

/**
 * MergeBaseTactic - Uses git merge-base to find the common ancestor between current branch and base branch.
 *
 * This tactic is context-aware:
 * - Only executes if baseBranch is provided
 * - Attempts to fetch remote branches if needed
 * - Provides detailed context about branch availability
 * - Gracefully handles cases where merge-base fails
 */
export class MergeBaseTactic implements Tactic<ReferencePointResult, ReferenceDiscoveryContext> {
  public get name(): string {
    return 'MergeBase'
  }

  public assess(context: ReferenceDiscoveryContext): boolean {
    return !!context.baseBranch
  }

  public async attempt(
    context: ReferenceDiscoveryContext
  ): Promise<TacticResult<ReferencePointResult, ReferenceDiscoveryContext>> {
    if (!context.baseBranch) {
      return {
        applied: false,
        success: false,
        message: 'No base branch provided',
      }
    }

    try {
      // Ensure we have git info
      if (!context.gitInfo) {
        context.gitInfo = await this.gatherGitInfo(context)
      }

      const remoteBaseBranch = context.baseBranch.includes('/')
        ? context.baseBranch
        : `origin/${context.baseBranch}`

      // Try to fetch the base branch if we haven't seen it
      if (!context.gitInfo.availableBranches?.includes(remoteBaseBranch)) {
        try {
          await git.fetch('origin', context.baseBranch.replace('origin/', ''))
          core.debug(`Fetched ${context.baseBranch} from origin`)

          // Update git info after fetch
          context.gitInfo = await this.gatherGitInfo(context)
        } catch (fetchError) {
          core.warning(`Failed to fetch ${context.baseBranch}: ${fetchError}`)
          return {
            applied: true,
            success: false,
            message: `Failed to fetch base branch: ${fetchError}`,
            context: { gitInfo: context.gitInfo || undefined },
          }
        }
      }

      // Find merge base between remote base branch and HEAD
      const mergeBase = await this.commonCommit(remoteBaseBranch, 'HEAD')

      if (!mergeBase) {
        return {
          applied: true,
          success: false,
          message: `No common ancestor found between ${context.currentBranch} and ${remoteBaseBranch}`,
          ...(context.gitInfo && { context: { gitInfo: context.gitInfo } }),
        }
      }

      // Get version at the merge base commit
      const referenceVersion = (await this.getVersionAtCommit(mergeBase)) || '0.0.0'
      const shouldFinalizeVersions = context.currentBranch === context.baseBranch
      const shouldForceBump = !shouldFinalizeVersions && context.activeBranch !== context.baseBranch

      return {
        applied: true,
        success: true,
        result: {
          referenceCommit: mergeBase,
          referenceVersion,
          shouldFinalizeVersions,
          shouldForceBump,
        },
        message: `Found merge base: ${mergeBase.substring(0, 8)} (version: ${referenceVersion})`,
        ...(context.gitInfo && { context: { gitInfo: context.gitInfo } }),
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        applied: true,
        success: false,
        message: `Merge base command failed: ${errorMessage}`,
        ...(context.gitInfo && { context: { gitInfo: context.gitInfo } }),
      }
    }
  }

  private async gatherGitInfo(_context: ReferenceDiscoveryContext) {
    try {
      const branches = await git.branch(['-a'])
      return {
        availableBranches: branches.all,
        remoteExists: branches.all.some((b) => b.includes('origin/')),
      }
    } catch (error) {
      core.debug(`Failed to gather git info: ${error}`)
      return {
        availableBranches: [],
        remoteExists: false,
      }
    }
  }

  private async commonCommit(base: string, target: string): Promise<string | null> {
    try {
      core.debug(`Running: git merge-base ${base} ${target}`)
      const mergeBaseOutput = await git.raw(['merge-base', base, target])
      const mergeBase = mergeBaseOutput.trim()
      core.debug(`Merge base output: "${mergeBase}"`)
      return mergeBase || null
    } catch (error) {
      core.debug(`Failed to find common commit between ${base} and ${target}: ${error}`)
      return null
    }
  }

  private async getVersionAtCommit(commit: string): Promise<string | null> {
    try {
      const packageJsonPath = 'package.json'
      const fileContent = await git.show([`${commit}:${packageJsonPath}`])
      const packageJson = JSON.parse(fileContent)
      return packageJson.version || null
    } catch (error) {
      core.debug(`Failed to get version at commit ${commit}: ${error}`)
      return null
    }
  }
}

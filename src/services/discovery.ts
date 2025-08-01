import * as core from '@actions/core'
import simpleGit from 'simple-git'
import type { ReferencePointResult } from '../types/index.js'

const git = simpleGit()

/**
 * Service responsible for discovering git reference points and version information.
 * Handles tag-based and branch-based reference point strategies.
 */
export class DiscoveryService {
  /**
   * Determine the reference point for version comparison.
   */
  public async determineReferencePoint(
    baseBranch: string | undefined,
    activeBranch: string
  ): Promise<ReferencePointResult> {
    if (baseBranch) {
      return await this.findBranchBasedReference(baseBranch, activeBranch)
    } else {
      return await this.findTagBasedReference()
    }
  }

  /**
   * Find reference point based on branch comparison.
   */
  private async findBranchBasedReference(
    baseBranch: string,
    activeBranch: string
  ): Promise<ReferencePointResult> {
    core.info(`🔍 Using branch-based reference: ${baseBranch}`)

    try {
      // Check if we're on the base branch (finalization scenario)
      const currentBranch = await this.getCurrentBranch()
      const shouldFinalizeVersions = currentBranch === baseBranch

      // Find the merge base (last common ancestor) between current branch and base branch
      const mergeBase = await git.raw(['merge-base', currentBranch, baseBranch])
      const referenceCommit = mergeBase.trim()

      // Get version at that commit
      const referenceVersion = (await this.getVersionAtCommit(referenceCommit)) || '0.0.0'

      // Check if we should force bump based on branch state
      const shouldForceBump = !shouldFinalizeVersions && activeBranch !== baseBranch

      core.debug(
        `Branch reference: commit=${referenceCommit}, version=${referenceVersion}, finalize=${shouldFinalizeVersions}`
      )

      return {
        referenceCommit,
        referenceVersion,
        shouldFinalizeVersions,
        shouldForceBump,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      core.warning(`Failed to find branch-based reference: ${errorMessage}`)

      // Fallback to tag-based reference
      return await this.findTagBasedReference()
    }
  }

  /**
   * Find reference point based on latest git tag.
   */
  private async findTagBasedReference(): Promise<ReferencePointResult> {
    core.info('🔍 Using tag-based reference')

    try {
      // Get latest tag
      const tags = await git.tags(['--sort=-v:refname'])
      const latestTag = tags.latest

      if (latestTag) {
        const referenceCommit = await git.revparse([latestTag])
        const referenceVersion = latestTag.replace(/^v/, '') // Remove 'v' prefix if present

        core.debug(
          `Tag reference: tag=${latestTag}, commit=${referenceCommit}, version=${referenceVersion}`
        )

        return {
          referenceCommit,
          referenceVersion,
          shouldFinalizeVersions: false,
          shouldForceBump: false,
        }
      } else {
        // No tags found, use initial commit
        core.info('📦 No tags found, using initial commit as reference')

        const referenceCommit = await this.findInitialCommit()

        return {
          referenceCommit,
          referenceVersion: '0.0.0',
          shouldFinalizeVersions: false,
          shouldForceBump: true, // Force bump from initial state
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      core.error(`Failed to find tag-based reference: ${errorMessage}`)
      throw new Error(`Reference point discovery failed: ${errorMessage}`)
    }
  }

  /**
   * Find the last non-merge commit on a branch.
   */
  private async findLastNonMergeCommit(branch: string): Promise<string> {
    try {
      const log = await git.log({
        from: branch,
        maxCount: 100, // Look at last 100 commits
      })

      // Find first non-merge commit
      for (const commit of log.all) {
        if (!commit.message.startsWith('Merge ')) {
          return commit.hash
        }
      }

      // Fallback to latest commit if no non-merge found
      return log.latest?.hash || 'HEAD'
    } catch (error) {
      core.warning(`Failed to find last non-merge commit on ${branch}, using HEAD`)
      return 'HEAD'
    }
  }

  /**
   * Get the current branch name.
   */
  private async getCurrentBranch(): Promise<string> {
    try {
      const branch = await git.branch()
      return branch.current
    } catch (error) {
      // Fallback to environment variables
      return process.env?.GITHUB_HEAD_REF || process.env?.GITHUB_REF_NAME || 'main'
    }
  }

  /**
   * Get package version at a specific commit.
   */
  private async getVersionAtCommit(commitRef: string): Promise<string | null> {
    try {
      const packageJsonContent = await git.show([`${commitRef}:package.json`])
      const packageJson = JSON.parse(packageJsonContent)
      return packageJson.version || null
    } catch (error) {
      core.debug(`Failed to get version at commit ${commitRef}: ${error}`)
      return null
    }
  }

  /**
   * Find the initial commit of the repository.
   */
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

  /**
   * Find the last version change commit for a specific package.
   */
  public async findLastVersionChangeCommit(packageJsonPath: string): Promise<string | null> {
    try {
      const log = await git.log({
        file: packageJsonPath,
        maxCount: 50,
      })

      // Look for commits that actually changed the version
      for (const commit of log.all) {
        try {
          const diff = await git.diff([`${commit.hash}~1..${commit.hash}`, '--', packageJsonPath])
          if (diff.includes('"version":')) {
            return commit.hash
          }
        } catch {
          // Ignore errors for individual commits
        }
      }

      return null
    } catch (error) {
      core.debug(`Failed to find last version change for ${packageJsonPath}: ${error}`)
      return null
    }
  }
}

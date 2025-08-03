import * as core from '@actions/core'
import simpleGit from 'simple-git'
import type { ReferencePointResult } from '../types/index.js'
import { ReferenceDiscoveryTactics } from '../strategies/reference-discovery/tactics.js'
import type { ReferenceDiscoveryContext } from '../strategies/reference-discovery/tactics/types.js'

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
   * Find reference point based on branch comparison using tactical system.
   */
  private async findBranchBasedReference(
    baseBranch: string,
    activeBranch: string
  ): Promise<ReferencePointResult> {
    core.info(`🔍 Using branch-based reference: ${baseBranch}`)

    // Get current branch for context
    const currentBranch = await this.getCurrentBranch()

    // Build context for tactics
    const context: ReferenceDiscoveryContext = {
      baseBranch,
      activeBranch,
      currentBranch,
      packageJsonPath: 'package.json',
    }

    // Execute branch-based tactical plan
    const tacticalPlan = ReferenceDiscoveryTactics.branchBased()

    try {
      const result = await tacticalPlan.execute(context)

      core.info(
        `🎯 Reference: commit=${result.referenceCommit.substring(0, 8)}, version=${
          result.referenceVersion
        }, finalize=${result.shouldFinalizeVersions}`
      )

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      core.error(`❌ Version bump failed: ${errorMessage}`)
      throw new Error(errorMessage)
    }
  }

  /**
   * Find reference point based on latest git tag.
   */
  private async findTagBasedReference(): Promise<ReferencePointResult> {
    core.info('🔍 Using tag-based reference')

    try {
      // First ensure we have all tags
      try {
        await git.fetch(['--tags'])
        core.debug('Fetched all tags from remote')
      } catch (fetchError) {
        core.warning(`Failed to fetch tags: ${fetchError}`)
      }

      // Get latest tag
      const tags = await git.tags(['--sort=-v:refname'])
      const latestTag = tags.latest

      // Debug: Log all available tags
      core.debug(`All tags found: ${tags.all.join(', ')}`)
      core.debug(`Latest tag: ${latestTag || 'none'}`)

      if (latestTag) {
        const referenceCommit = await git.revparse([latestTag])
        const referenceVersion = latestTag.replace(/^v/, '') // Remove 'v' prefix if present

        if (!referenceCommit || !referenceCommit.trim()) {
          throw new Error(`Failed to resolve commit for tag ${latestTag}`)
        }

        core.info(
          `Tag reference: tag=${latestTag}, commit=${referenceCommit.trim()}, version=${referenceVersion}`
        )

        return {
          referenceCommit: referenceCommit.trim(),
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
  public async getVersionAtCommit(commitRef: string): Promise<string | null> {
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

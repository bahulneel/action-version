import * as core from '@actions/core'
import simpleGit from 'simple-git'
import type { ReferencePointResult, ActionConfiguration } from '@types'
import { referenceDiscovery } from '../objectives/index.js'

const git = simpleGit()

/**
 * Service responsible for discovering git reference points and version information.
 * Uses the ReferenceDiscovery objective to select appropriate strategy.
 */
export class DiscoveryService {
  constructor(private readonly config: ActionConfiguration) {}

  /**
   * Determine the reference point for version comparison.
   */
  public async determineReferencePoint(
    baseBranch: string | undefined,
    activeBranch: string
  ): Promise<ReferencePointResult> {
    // Use the ReferenceDiscovery objective
    const strategy = referenceDiscovery.strategise(this.config)
    return await strategy.findReferencePoint(baseBranch, activeBranch)
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

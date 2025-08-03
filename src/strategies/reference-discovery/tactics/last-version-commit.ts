import * as core from '@actions/core'
import { simpleGit } from 'simple-git'
import type { Tactic, TacticResult } from '../../../types/tactics.js'
import type { ReferencePointResult } from '../../../types/index.js'
import type { ReferenceDiscoveryContext } from './types.js'

const git = simpleGit()

/**
 * LastVersionCommitTactic - Finds the last commit that changed the version field in package.json.
 *
 * This tactic is highly reliable because:
 * - It directly finds the last release point
 * - Works regardless of branch structure
 * - Independent of merge-base issues
 * - Can work across force-pushes and branch recreations
 */
export class LastVersionCommitTactic
  implements Tactic<ReferencePointResult, ReferenceDiscoveryContext>
{
  public get name(): string {
    return 'LastVersionCommit'
  }

  public assess(_context: ReferenceDiscoveryContext): boolean {
    // This tactic is always applicable
    return true
  }

  public async attempt(
    context: ReferenceDiscoveryContext
  ): Promise<TacticResult<ReferencePointResult, ReferenceDiscoveryContext>> {
    const packageJsonPath = context.packageJsonPath || 'package.json'

    try {
      const versionCommit = await this.findLastVersionChangeCommit(packageJsonPath)

      if (!versionCommit) {
        return {
          applied: true,
          success: false,
          message: `No version change commits found in ${packageJsonPath}`,
        }
      }

      const referenceVersion = (await this.getVersionAtCommit(versionCommit)) || '0.0.0'
      const shouldFinalizeVersions = context.currentBranch === context.baseBranch

      return {
        applied: true,
        success: true,
        result: {
          referenceCommit: versionCommit,
          referenceVersion,
          shouldFinalizeVersions,
          shouldForceBump: false, // Don't force bump when using version commit
        },
        message: `Found last version commit: ${versionCommit.substring(
          0,
          8
        )} (version: ${referenceVersion})`,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        applied: true,
        success: false,
        message: `Failed to find version commit: ${errorMessage}`,
      }
    }
  }

  private async findLastVersionChangeCommit(packageJsonPath: string): Promise<string | null> {
    try {
      // Use git log -L to directly track version field changes
      // This is much more efficient than scanning all commits
      const logOutput = await git.raw([
        'log',
        '-L',
        `/"version":/,+1:${packageJsonPath}`,
        '--max-count=1',
      ])

      if (!logOutput.trim()) {
        core.debug(`No version changes found in ${packageJsonPath}`)
        return null
      }

      // Parse the commit hash from the diff output
      // Format: <commit-hash>\ndiff --git a/package.json b/package.json
      const lines = logOutput.trim().split('\n')
      const firstLine = lines[0]

      // Extract commit hash from first line (should be 40 chars)
      if (firstLine && firstLine.match(/^[a-f0-9]{40}$/)) {
        const commitHash = firstLine
        core.debug(`Found version change in commit: ${commitHash.substring(0, 8)}`)
        return commitHash
      }

      return null
    } catch (error) {
      core.debug(`Failed to find last version change for ${packageJsonPath} using -L: ${error}`)

      // Fallback to the old method if -L fails for any reason
      return this.findLastVersionChangeCommitFallback(packageJsonPath)
    }
  }

  private async findLastVersionChangeCommitFallback(
    packageJsonPath: string
  ): Promise<string | null> {
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
            core.debug(`Found version change in commit: ${commit.hash} - ${commit.message}`)
            return commit.hash
          }
        } catch {
          // Ignore errors for individual commits (might be initial commit)
        }
      }

      return null
    } catch (error) {
      core.debug(`Failed to find last version change for ${packageJsonPath}: ${error}`)
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

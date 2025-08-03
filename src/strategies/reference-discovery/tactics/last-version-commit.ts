import * as core from '@actions/core'
import { simpleGit } from 'simple-git'
import type { Tactic, TacticResult } from '../../../types/tactics.js'
import type { ReferencePointResult } from '../../../types/index.js'
import type { ReferenceDiscoveryContext } from './types.js'
import { TacticConfig } from '../../../utils/tactic-config.js'

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
      const tacticOptions = TacticConfig.getTacticOptions(this.name, {
        maxCount: 'number',
      })
      const maxCount = tacticOptions.maxCount || 1

      const gitCommand = ['log', '-L', `/version/,+1:${packageJsonPath}`, `--max-count=${maxCount}`]
      core.debug(`Executing git command: ${gitCommand.join(' ')}`)

      const logOutput = await git.raw(gitCommand)

      if (logOutput.trim()) {
        core.debug(`Git log output (first 200 chars): ${logOutput.substring(0, 200)}`)

        // Parse the commit hash from the diff output
        // Format: <commit-hash>\ndiff --git a/package.json b/package.json
        const lines = logOutput.trim().split('\n')
        const firstLine = lines[0]

        core.debug(`First line: "${firstLine}"`)

        // Extract commit hash from first line (should be 40 chars)
        if (firstLine && firstLine.match(/^[a-f0-9]{40}$/)) {
          const commitHash = firstLine
          core.debug(`Found version change in commit: ${commitHash.substring(0, 8)}`)
          return commitHash
        }

        core.debug(`First line does not match commit hash pattern`)
      } else {
        core.debug(`No version changes found in ${packageJsonPath} using -L`)
      }

      return null
    } catch (error) {
      core.debug(`-L approach failed: ${error}`)
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

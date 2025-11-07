import * as core from '@actions/core'
import { simpleGit } from 'simple-git'
import type { Tactic, TacticResult } from '../../../../types/tactics.js'
import type { ReferencePointResult } from '../../../../types/index.js'
import type { ReferenceDiscoveryContext } from './types.js'

const git = simpleGit()

/**
 * DiffBasedVersionCommitTactic - Traditional approach to finding version changes.
 * 
 * This tactic uses git log to find commits that touched package.json,
 * then checks each commit's diff to see if it changed the version field.
 * It's more thorough but slower than the -L approach.
 */
export class DiffBasedVersionCommitTactic
  implements Tactic<ReferencePointResult, ReferenceDiscoveryContext>
{
  public get name(): string {
    return 'DiffBasedVersionCommit'
  }

  public assess(_context: ReferenceDiscoveryContext): boolean {
    // This tactic is always applicable as a fallback
    return true
  }

  public async attempt(
    context: ReferenceDiscoveryContext
  ): Promise<TacticResult<ReferencePointResult, ReferenceDiscoveryContext>> {
    const packageJsonPath = context.packageJsonPath || 'package.json'

    try {
      core.debug(`Using fallback method to find version changes in ${packageJsonPath}`)

      const log = await git.log({
        file: packageJsonPath,
        maxCount: 50,
      })

      core.debug(`Found ${log.all.length} commits that touched ${packageJsonPath}`)

      // Look for commits that actually changed the version
      for (const commit of log.all) {
        try {
          core.debug(`Checking commit ${commit.hash.substring(0, 8)} for version changes`)
          const diff = await git.diff([`${commit.hash}~1..${commit.hash}`, '--', packageJsonPath])
          if (diff.includes('"version":')) {
            core.debug(`Found version change in commit: ${commit.hash} - ${commit.message}`)

            const referenceVersion = (await this.getVersionAtCommit(commit.hash)) || '0.0.0'
            const shouldFinalizeVersions = context.currentBranch === context.baseBranch

            return {
              applied: true,
              success: true,
              result: {
                referenceCommit: commit.hash,
                referenceVersion,
                shouldFinalizeVersions,
                shouldForceBump: false, // Don't force bump when using version commit
              },
              message: `Found last version commit: ${commit.hash.substring(
                0,
                8
              )} (version: ${referenceVersion})`,
            }
          }
        } catch (error) {
          core.debug(`Error checking commit ${commit.hash.substring(0, 8)}: ${error}`)
          // Ignore errors for individual commits (might be initial commit)
        }
      }

      core.debug(`No version changes found in any commits`)
      return {
        applied: true,
        success: false,
        message: `No version change commits found in ${packageJsonPath}`,
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

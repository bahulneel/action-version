import * as core from '@actions/core'
import simpleGit from 'simple-git'
import type { Tactic, TacticResult } from '../../../../types/tactics.js'
import type { ReferencePointResult } from '../../../../types/index.js'
import type { ReferenceDiscoveryContext } from './types.js'

const git = simpleGit()

/**
 * Most recent tag tactic.
 * Finds the most recently created git tag.
 */
export class MostRecentTagTactic
  implements Tactic<ReferencePointResult, ReferenceDiscoveryContext>
{
  public readonly name = 'MostRecentTag'

  public assess(_context: ReferenceDiscoveryContext): boolean {
    // Always applicable - git tags command should work
    return true
  }

  public async attempt(
    _context: ReferenceDiscoveryContext
  ): Promise<TacticResult<ReferencePointResult, ReferenceDiscoveryContext>> {
    try {
      core.debug(`[${this.name}] Finding most recent tag`)

      const tags = await git.tags(['--sort=-creatordate'])
      const latestTag = tags.latest

      if (!latestTag) {
        return {
          applied: true,
          success: false,
          message: 'No tags found in repository',
        }
      }

      // Get the commit hash for this tag
      const commitHash = await git.revparse([latestTag])

      // Extract version from tag (remove 'v' prefix if present)
      const version = latestTag.replace(/^v/, '')

      core.debug(`[${this.name}] Found most recent tag: ${latestTag} (${version})`)

      return {
        applied: true,
        success: true,
        result: {
          referenceCommit: commitHash,
          referenceVersion: version,
          shouldFinalizeVersions: false,
          shouldForceBump: false,
        },
        message: `Most recent tag: ${latestTag}`,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        applied: true,
        success: false,
        message: `Failed to find most recent tag: ${errorMessage}`,
      }
    }
  }
}

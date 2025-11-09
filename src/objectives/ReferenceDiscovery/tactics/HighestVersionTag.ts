import * as core from '@actions/core'
import * as semver from 'semver'
import simpleGit from 'simple-git'
import type {
  Tactic,
  TacticResult,
  ReferencePointResult,
  ReferenceDiscoveryContext,
} from '../../../types/index.js'

const git = simpleGit()

export class HighestVersionTagTactic
  implements Tactic<ReferencePointResult, ReferenceDiscoveryContext>
{
  public readonly name = 'HighestVersionTag'

  public assess(_context: ReferenceDiscoveryContext): boolean {
    return true
  }

  public async attempt(
    _context: ReferenceDiscoveryContext
  ): Promise<TacticResult<ReferencePointResult, ReferenceDiscoveryContext>> {
    try {
      core.debug(`[${this.name}] Finding highest version tag`)

      const tags = await git.tags()
      const allTags = tags.all

      if (!allTags || allTags.length === 0) {
        return {
          applied: true,
          success: false,
          message: 'No tags found in repository',
        }
      }

      const versionTags = allTags
        .map((tag) => ({
          tag,
          version: tag.replace(/^v/, ''),
          semver: semver.coerce(tag.replace(/^v/, '')),
        }))
        .filter(({ semver: sv }) => sv !== null)
        .sort((a, b) => semver.rcompare(a.semver!, b.semver!))

      if (versionTags.length === 0) {
        return {
          applied: true,
          success: false,
          message: 'No valid semantic version tags found',
        }
      }

      const highestVersionTag = versionTags[0]!
      const commitHash = await git.revparse([highestVersionTag.tag])

      core.debug(
        `[${this.name}] Found highest version tag: ${highestVersionTag.tag} (${highestVersionTag.version})`
      )

      return {
        applied: true,
        success: true,
        result: {
          referenceCommit: commitHash,
          referenceVersion: highestVersionTag.version,
          shouldFinalizeVersions: false,
          shouldForceBump: false,
        },
        message: `Highest version tag: ${highestVersionTag.tag}`,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        applied: true,
        success: false,
        message: `Failed to find highest version tag: ${errorMessage}`,
      }
    }
  }
}

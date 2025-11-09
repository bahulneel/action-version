import * as core from '@actions/core'
import * as semver from 'semver'
import type { BumpType, VersioningGoals, VersioningConfig } from '../../../types/index.js'
import type { StrategyOf } from '../../../types/strategy.js'

/**
 * Semver versioning strategy.
 * Implements semantic versioning with support for regular releases, prereleases, and finalization.
 */
export class Semver implements StrategyOf<VersioningGoals> {
  readonly name = 'semver'
  readonly description = 'Semantic versioning with prerelease support'

  constructor(private readonly config: VersioningConfig) {}

  /**
   * Bump version based on commit signals and strategy policy.
   */
  public bumpVersion(
    currentVersion: string,
    commitBasedBump: BumpType | null,
    historicalBump: BumpType | null
  ): string | null {
    const approach = this.config.approach

    // Delegate to appropriate sub-strategy
    switch (approach) {
      case 'do-nothing':
        return this.doNothingBump(currentVersion, commitBasedBump, historicalBump)
      case 'apply-bump':
        return this.applyBump(currentVersion, commitBasedBump, historicalBump)
      case 'pre-release':
        return this.preReleaseBump(currentVersion, commitBasedBump, historicalBump)
      default:
        core.warning(`Unknown versioning approach: ${approach}`)
        return null
    }
  }

  /**
   * Compare two semantic versions.
   * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
   */
  public compareVersion(v1: string, v2: string): number {
    const coerced1 = semver.coerce(v1)?.toString() ?? '0.0.0'
    const coerced2 = semver.coerce(v2)?.toString() ?? '0.0.0'

    if (semver.lt(coerced1, coerced2)) return -1
    if (semver.gt(coerced1, coerced2)) return 1
    return 0
  }

  /**
   * Do-nothing approach: always skip bumps.
   */
  private doNothingBump(
    _currentVersion: string,
    _commitBasedBump: BumpType | null,
    _historicalBump: BumpType | null
  ): string | null {
    core.debug(`Strategy 'do-nothing': Skipping bump`)
    return null
  }

  /**
   * Apply-bump approach: perform normal semantic version increments.
   */
  private applyBump(
    currentVersion: string,
    commitBasedBump: BumpType | null,
    _historicalBump: BumpType | null
  ): string | null {
    if (!commitBasedBump || !['major', 'minor', 'patch'].includes(commitBasedBump)) {
      core.debug(`Strategy 'apply-bump': No valid bump type provided: ${commitBasedBump}`)
      return null
    }

    const current = semver.coerce(currentVersion)?.toString() ?? '0.0.0'
    const nextVersion = semver.inc(current, commitBasedBump)

    if (!nextVersion) {
      core.warning(
        `Strategy 'apply-bump': Failed to increment version ${current} with ${commitBasedBump}`
      )
      return null
    }

    core.debug(`Strategy 'apply-bump': Normal semver bump ${current} → ${nextVersion}`)
    return nextVersion
  }

  /**
   * Pre-release approach: create or increment prerelease versions.
   */
  private preReleaseBump(
    currentVersion: string,
    commitBasedBump: BumpType | null,
    _historicalBump: BumpType | null
  ): string | null {
    if (!commitBasedBump || !['major', 'minor', 'patch'].includes(commitBasedBump)) {
      core.debug(`Strategy 'pre-release': No valid bump type provided: ${commitBasedBump}`)
      return null
    }

    const current = semver.coerce(currentVersion)?.toString() ?? '0.0.0'

    if (semver.prerelease(current)) {
      // Already a prerelease version, increment the prerelease number
      const nextVersion = semver.inc(current, 'prerelease')
      if (!nextVersion) {
        core.warning(`Strategy 'pre-release': Failed to increment prerelease ${current}`)
        return null
      }

      core.debug(`Strategy 'pre-release': Increment prerelease ${current} → ${nextVersion}`)
      return nextVersion // 1.2.0-1 → 1.2.0-2
    } else {
      // First time: apply bump then make prerelease starting at 1
      const bumped = semver.inc(current, commitBasedBump)
      if (!bumped) {
        core.warning(`Strategy 'pre-release': Failed to bump ${current} with ${commitBasedBump}`)
        return null
      }

      // Create prerelease starting at 1
      const nextVersion = `${bumped}-1`
      if (!semver.valid(nextVersion)) {
        core.warning(`Strategy 'pre-release': Failed to create valid prerelease ${nextVersion}`)
        return null
      }

      core.debug(`Strategy 'pre-release': First prerelease ${current} → ${bumped} → ${nextVersion}`)
      return nextVersion // 1.1.0 → 1.2.0 → 1.2.0-1
    }
  }
}

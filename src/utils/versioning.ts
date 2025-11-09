import * as semver from 'semver'
import type { BumpType, StrategyName } from '@types'

/**
 * Get the next version based on current version, bump type, and strategy.
 */
export function getNextVersion(
  currentVersion: string,
  commitBasedBump: BumpType | null,
  _historicalBump: BumpType | null,
  strategy: StrategyName
): string | null {
  const current = semver.coerce(currentVersion)?.toString() ?? '0.0.0'
  
  // Handle do-nothing strategy
  if (strategy === 'do-nothing') {
    return null
  }
  
  // Handle pre-release strategy
  if (strategy === 'pre-release' && commitBasedBump && ['major', 'minor', 'patch'].includes(commitBasedBump)) {
    if (semver.prerelease(current)) {
      return semver.inc(current, 'prerelease')
    } else {
      const bumped = semver.inc(current, commitBasedBump as semver.ReleaseType)
      return bumped ? `${bumped}-1` : null
    }
  }
  
  // Handle apply-bump strategy
  if (commitBasedBump && ['major', 'minor', 'patch'].includes(commitBasedBump)) {
    return semver.inc(current, commitBasedBump as semver.ReleaseType)
  }
  
  return null
}


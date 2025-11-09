import * as semver from 'semver'
import type { BumpType } from '@types'

/**
 * Calculate the bump type between two versions.
 */
export function calculateBumpType(fromVersion: string, toVersion: string): BumpType | null {
  const from = semver.coerce(fromVersion)?.toString() ?? '0.0.0'
  const to = semver.coerce(toVersion)?.toString() ?? '0.0.0'

  if (semver.eq(from, to)) return null
  
  const diff = semver.diff(from, to)
  
  if (!diff) return null
  
  if (diff.includes('major')) return 'major'
  if (diff.includes('minor')) return 'minor'
  if (diff.includes('patch')) return 'patch'
  if (diff.includes('prerelease')) return 'prerelease'
  
  return null
}

/**
 * Finalize a prerelease version by removing the prerelease suffix.
 */
export function finalizeVersion(version: string): string {
  const parsed = semver.parse(version)
  if (!parsed) return version
  
  if (parsed.prerelease.length > 0) {
    return `${parsed.major}.${parsed.minor}.${parsed.patch}`
  }
  
  return version
}

/**
 * Get the most significant bump type from an array of bump types.
 */
export function getMostSignificantBumpType(bumpTypes: readonly (BumpType | null)[]): BumpType | null {
  const priority: Record<BumpType, number> = {
    major: 4,
    minor: 3,
    patch: 2,
    prerelease: 1,
    release: 0,
  }

  let mostSignificant: BumpType | null = null
  let highestPriority = -1

  for (const bumpType of bumpTypes) {
    if (bumpType && priority[bumpType] > highestPriority) {
      mostSignificant = bumpType
      highestPriority = priority[bumpType]
    }
  }

  return mostSignificant
}

/**
 * Initialize a version if it's missing or invalid.
 */
export function initializeVersion(version: string | undefined): string {
  if (!version) return '0.0.0'
  
  const coerced = semver.coerce(version)
  return coerced?.toString() ?? '0.0.0'
}


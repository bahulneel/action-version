import type { BumpType } from '../index.js'
import type { Strategy } from '../strategy.js'

/**
 * Version bump strategy interface.
 * Handles different approaches to version bumping based on commit analysis.
 */
export interface VersionBump extends Strategy {
  execute(
    currentVersion: string,
    commitBasedBump: BumpType | null,
    historicalBump: BumpType | null
  ): string | null
}

// Backwards-compatible alias for legacy naming used across factory and base classes
export type VersionBumpStrategy = VersionBump

/**
 * Configuration for version bump strategy selection.
 */
export interface VersionBumpConfig {
  readonly strategy: 'do-nothing' | 'apply-bump' | 'pre-release'
}

import type { BumpType } from '../index.js'

/**
 * Version bump strategy interface.
 * Handles different approaches to version bumping based on commit analysis.
 */
export interface VersionBump {
  readonly name: string
  execute(
    currentVersion: string,
    commitBasedBump: BumpType | null,
    historicalBump: BumpType | null
  ): string | null
}

/**
 * Configuration for version bump strategy selection.
 */
export interface VersionBumpConfig {
  readonly strategy: 'do-nothing' | 'apply-bump' | 'pre-release'
}

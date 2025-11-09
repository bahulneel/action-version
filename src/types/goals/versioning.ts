import type { BumpType } from '../index.js'

/**
 * Goals for versioning objective.
 */
export interface VersioningGoals {
  bumpVersion(
    currentVersion: string,
    commitBasedBump: BumpType | null,
    historicalBump: BumpType | null
  ): string | null
  compareVersion(v1: string, v2: string): number // -1 | 0 | 1
}

/**
 * Configuration for versioning strategy selection.
 */
export interface VersioningConfig {
  readonly approach: 'do-nothing' | 'apply-bump' | 'pre-release'
}





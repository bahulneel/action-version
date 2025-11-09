import type { ReferencePointResult } from '../index.js'

/**
 * Goals for reference discovery objective.
 */
export interface ReferenceGoals {
  findReferencePoint(baseBranch: string | undefined, activeBranch: string): Promise<ReferencePointResult>
}

/**
 * Context information for reference discovery tactics.
 * Tactics can read from and write to context to share information.
 */
export interface ReferenceDiscoveryContext {
  baseBranch?: string
  activeBranch: string
  currentBranch: string
  packageJsonPath?: string
  // Configuration options for tactics
  lookbackCommits?: number
  // Shared state that tactics can use to communicate
  attemptedStrategies?: string[]
  lastError?: string
  gitInfo?: {
    availableBranches?: string[]
    availableTags?: string[]
    remoteExists?: boolean
  }
}

/**
 * Configuration for reference discovery strategy selection.
 */
export interface ReferenceDiscoveryConfig {
  readonly kind: 'tag' | 'base-branch'
  readonly baseBranch?: string
}





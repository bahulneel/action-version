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

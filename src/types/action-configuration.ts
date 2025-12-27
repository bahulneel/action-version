// Action configuration interface used by runtime services and strategies

import type { BranchCleanupStrategyType, StrategyName } from './core.js'

export interface ActionConfiguration {
  readonly commitMsgTemplate: string
  readonly depCommitMsgTemplate: string
  readonly shouldCreateBranch: boolean
  readonly branchTemplate: string
  readonly templateRegex: RegExp
  readonly branchCleanup: BranchCleanupStrategyType
  readonly baseBranch: string | undefined
  readonly strategy: StrategyName
  readonly activeBranch: string
  readonly tagPrereleases: boolean
  readonly mergebaseLookbackCommits?: number
  readonly lastversioncommitMaxCount?: number
  /** Release mode flag - when true, bypasses flow matching and forces release branch creation */
  readonly release?: boolean
}




export * from './reference/branch-cleanup.js'
import type { ReferencePointResult } from '../index.js'

/**
 * Discovery strategy interface.
 * Handles different approaches to finding version reference points.
 */
export interface Discovery {
  readonly name: string
  findReferencePoint(
    baseBranch: string | undefined,
    activeBranch: string
  ): Promise<ReferencePointResult>
}

/**
 * Configuration for discovery strategy selection.
 */
export interface DiscoveryConfig {
  readonly strategy: 'tag' | 'base-branch'
  readonly baseBranch?: string
}

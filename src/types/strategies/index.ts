/**
 * Strategy framework types and interfaces.
 *
 * This module exports all strategy interfaces and related types.
 */

/**
 * Base interface that all strategies must implement.
 */
export interface Strategy {
  readonly name: string
}

export type { VersionInterface, VersionConfig } from './version.js'
export type { PackageInterface, PackageConfig } from './package.js'
export type { BranchCleanupInterface, BranchCleanupConfig } from './reference/branch-cleanup.js'
export type { OutputInterface, OutputConfig } from './output.js'
export type { CommitInterface, CommitConfig } from './commit.js'
export type { ReferenceInterface, ReferenceConfig } from './reference.js'

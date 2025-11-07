import type { BumpType, CommitInfo } from '../index.js'
import type { Strategy } from '../strategy.js'

/**
 * Context for parsing commit messages.
 */
export interface ParseCommitsContext {
  logEntries: any[]
  sinceRef?: string
}

/**
 * Context for formatting version commit messages.
 */
export interface FormatVersionContext {
  packageName: string
  version: string
  bumpType: BumpType
}

/**
 * Context for formatting dependency commit messages.
 */
export interface FormatDependencyContext {
  packageName: string
  depName: string
  depVersion: string
}

/**
 * Parsing strategy interface.
 * Handles parsing existing commit messages.
 */
export interface ParseCommitStrategy extends Strategy {
  parseCommits(context: ParseCommitsContext): Promise<CommitInfo[]>
}

/**
 * Formatting strategy interface.
 * Handles formatting new commit messages.
 */
export interface FormatCommitStrategy extends Strategy {
  formatVersion(context: FormatVersionContext): Promise<string>
  formatDependency(context: FormatDependencyContext): Promise<string>
}

/**
 * Complete commit strategy interface.
 * Composition of parsing and formatting strategies.
 */
export interface CommitStrategy extends ParseCommitStrategy, FormatCommitStrategy {}

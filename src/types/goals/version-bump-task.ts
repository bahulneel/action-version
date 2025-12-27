import type { PackageJson } from '../index.js'
import type { Package } from '../../domain/package.js'
import type { VersionBumpResults } from '../core.js'
import type { GitSetupResult } from '../index.js'

/**
 * Goals for VersionBumpTask objective.
 * This is the main task that orchestrates the complete version bump process.
 */
export interface VersionBumpTaskGoals {
  execute(context: VersionBumpTaskContext): Promise<VersionBumpTaskResult>
}

/**
 * Context for executing the version bump task.
 */
export interface VersionBumpTaskContext {
  packages: Package[]
  rootPkg: PackageJson
}

/**
 * Result of executing the version bump task.
 */
export interface VersionBumpTaskResult {
  results: VersionBumpResults
  gitSetup: GitSetupResult
}

import type { PackageJson } from '../index.js'
import type { Package } from '../../domain/package.js'
import type { VersionBumpResults } from '../core.js'
import type { GitSetupResult } from '../index.js'

/**
 * Goals for Main objective.
 * This is the entry point for the action once configuration is grounded.
 * Determines what maneuver to perform (release, version bump, sync, etc.)
 */
export interface MainGoals {
  performAction(context?: MainActionContext): Promise<MainActionResult>
}

/**
 * Context for performing the main action.
 */
export interface MainActionContext {
  packages: Package[]
  rootPkg: PackageJson
}

/**
 * Result of performing the main action.
 */
export interface MainActionResult {
  results: VersionBumpResults
  gitSetup: GitSetupResult
}

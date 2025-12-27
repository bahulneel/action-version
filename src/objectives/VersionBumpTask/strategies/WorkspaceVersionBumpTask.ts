import * as core from '@actions/core'
import semver from 'semver'
import simpleGit from 'simple-git'
import type { ActionConfiguration, StrategyOf } from '@types'
import type { VersionBumpTaskGoals } from '../../../types/goals/version-bump-task.js'
import type { PackageJson } from '../../../types/index.js'
import type { VersionBumpResults } from '../../../types/core.js'
import type { VcsGoals } from '../../../types/goals/vcs.js'
import type { ReferenceGoals } from '../../../types/goals/reference.js'
import type { SummaryOutputGoals } from '../../../types/goals/summary.js'
import { Package } from '../../../domain/package.js'
import { vcsObjective } from '../../Vcs/objective.js'
import { referenceDiscovery } from '../../ReferenceDiscovery/objective.js'
import { summaryOutput } from '../../SummaryOutput/objective.js'
import { versionBumping } from '../../VersionBumping/objective.js'
import { DiscoveryService } from '../../../services/discovery.js'

const git = simpleGit()

/**
 * Workspace version bump task strategy.
 * NOTE: This is deprecated in favor of Main objective strategies.
 * Orchestrates the complete version bump process.
 */
export class WorkspaceVersionBumpTask implements StrategyOf<VersionBumpTaskGoals> {
  readonly name = 'workspace-version-bump-task'
  readonly description = 'Workspace-wide version bump task orchestrator'

  // Goals resolved in constructor (initialization)
  private readonly vcs: VcsGoals
  private readonly referenceDiscoveryGoals?: ReferenceGoals
  private readonly summaryOutputGoals: SummaryOutputGoals

  constructor(private readonly config: ActionConfiguration) {
    // Resolve sub-objective goals in constructor (initialization)
    this.vcs = vcsObjective.strategise(config)
    
    if (!config.baseBranch || config.strategy === 'pre-release') {
      this.referenceDiscoveryGoals = referenceDiscovery.strategise(config)
    }
    
    this.summaryOutputGoals = summaryOutput.strategise(config)
  }

  public async execute(context: { packages: Package[]; rootPkg: PackageJson }): Promise<{
    results: VersionBumpResults
    gitSetup: import('../../../types/index.js').GitSetupResult
  }> {
    // Step 1: Setup VCS
    const gitSetup = await this.vcs.setup({
      shouldCreateBranch: this.config.shouldCreateBranch,
      branchTemplate: this.config.branchTemplate,
    })

    // Step 2: Process workspace using VersionBumping objective
    const versionBumpingStrategy = versionBumping.strategise(this.config)

    // Determine reference point using ReferenceDiscovery if available
    let referencePoint
    if (this.referenceDiscoveryGoals) {
      referencePoint = await this.referenceDiscoveryGoals.findReferencePoint(
        this.config.baseBranch,
        this.config.activeBranch
      )
    } else {
      // Fallback: use DiscoveryService if referenceDiscovery not available
      const discoveryService = new DiscoveryService(this.config)
      referencePoint = await discoveryService.determineReferencePoint(
        this.config.baseBranch,
        this.config.activeBranch
      )
    }

    // Process workspace
    const results = await versionBumpingStrategy.processWorkspace(
      context.packages,
      context.rootPkg,
      referencePoint,
      this.config
    )

    // Step 3: Handle tagging (if not creating branch)
    if (!this.config.shouldCreateBranch) {
      const rootPackageName = context.rootPkg.name || 'root'
      const currentVersion = results.bumped[rootPackageName]?.version || context.rootPkg.version
      const isPrerelease = currentVersion.includes('-')

      // Only tag if this is a new version (greater than latest tag)
      const shouldTag = await this.shouldCreateTag(
        currentVersion,
        isPrerelease,
        this.config.tagPrereleases
      )
      if (shouldTag) {
        await this.vcs.tagVersion(currentVersion, isPrerelease, true)
      }
    }

    // Step 4: Generate summary using SummaryOutput strategy
    await this.summaryOutputGoals.generateSummary(results, this.config)

    return {
      results,
      gitSetup,
    }
  }

  /**
   * Determine if we should create a tag for the current version.
   */
  private async shouldCreateTag(
    currentVersion: string,
    isPrerelease: boolean,
    tagPrereleases: boolean
  ): Promise<boolean> {
    try {
      // Get latest tag
      const tags = await git.tags(['--sort=-v:refname'])
      const latestTag = tags.latest

      if (!latestTag) {
        // No tags exist, so this is the first version
        return !isPrerelease || tagPrereleases
      }

      // Compare current version with latest tag
      const latestVersion = latestTag.replace(/^v/, '')

      if (semver.gt(currentVersion, latestVersion)) {
        // Current version is greater than latest tag
        return !isPrerelease || tagPrereleases
      }

      return false
    } catch (error) {
      core.warning(`Failed to check if should create tag: ${error}`)
      return false
    }
  }
}

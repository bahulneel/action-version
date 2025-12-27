import * as core from '@actions/core'
import semver from 'semver'
import simpleGit from 'simple-git'
import type { ActionConfiguration, StrategyOf } from '@types'
import type { MainGoals } from '../../../types/goals/main.js'
import type { VcsGoals } from '../../../types/goals/vcs.js'
import type { ReferenceGoals } from '../../../types/goals/reference.js'
import type { SummaryOutputGoals } from '../../../types/goals/summary.js'
import { vcsObjective } from '../../Vcs/objective.js'
import { referenceDiscovery } from '../../ReferenceDiscovery/objective.js'
import { summaryOutput } from '../../SummaryOutput/objective.js'
import { versionBumping } from '../../VersionBumping/objective.js'
import { DiscoveryService } from '../../../services/discovery.js'

const git = simpleGit()

/**
 * Version bump action strategy.
 * Performs normal version bumping based on conventional commits.
 */
export class VersionBumpAction implements StrategyOf<MainGoals> {
  name = 'version-bump-action'
  description = 'Version bump action (pre-release, apply-bump)'

  // Goals resolved in constructor (initialization)
  private readonly vcs: VcsGoals
  private readonly referenceDiscoveryGoals?: ReferenceGoals
  private readonly summaryOutputGoals?: SummaryOutputGoals

  constructor(private readonly config: ActionConfiguration) {
    // Resolve sub-objective goals in constructor (initialization)
    this.vcs = vcsObjective.strategise(config)

    // Resolve optional goals if needed
    if (!config.baseBranch || config.strategy === 'pre-release') {
      this.referenceDiscoveryGoals = referenceDiscovery.strategise(config)
    }

    this.summaryOutputGoals = summaryOutput.strategise(config)
  }

  public async performAction(context?: import('../../../types/goals/main.js').MainActionContext): Promise<import('../../../types/goals/main.js').MainActionResult> {
    if (!context) {
      throw new Error('VersionBumpAction requires context with packages and rootPkg')
    }

    // Step 1: Setup VCS
    const gitSetup = await this.vcs.setup({
      shouldCreateBranch: this.config.shouldCreateBranch,
      branchTemplate: this.config.branchTemplate,
    })

    // Step 2: Determine reference point
    const referencePoint = await this.determineReferencePoint()

    // Step 3: Process workspace using VersionBumping objective
    const versionBumpingStrategy = versionBumping.strategise(this.config)

    const results = await versionBumpingStrategy.processWorkspace(
      context.packages,
      context.rootPkg,
      referencePoint,
      this.config
    )

    // Step 4: Handle tagging (if not creating branch)
    if (!this.config.shouldCreateBranch) {
      const rootPackageName = context.rootPkg.name || 'root'
      const currentVersion = results.bumped[rootPackageName]?.version || context.rootPkg.version
      const isPrerelease = currentVersion.includes('-')

      const shouldTag = await this.shouldCreateTag(currentVersion, isPrerelease, this.config.tagPrereleases)
      if (shouldTag) {
        await this.vcs.tagVersion(currentVersion, isPrerelease, true)
      }
    }

    // Step 5: Generate summary
    if (this.summaryOutputGoals) {
      await this.summaryOutputGoals.generateSummary(results, this.config)
    }

    return {
      results,
      gitSetup,
    }
  }

  private async determineReferencePoint() {
    if (this.referenceDiscoveryGoals) {
      return await this.referenceDiscoveryGoals.findReferencePoint(
        this.config.baseBranch,
        this.config.activeBranch
      )
    }
    // Fallback: use DiscoveryService
    const discoveryService = new DiscoveryService(this.config)
    return await discoveryService.determineReferencePoint(
      this.config.baseBranch,
      this.config.activeBranch
    )
  }

  private async shouldCreateTag(
    currentVersion: string,
    isPrerelease: boolean,
    tagPrereleases: boolean
  ): Promise<boolean> {
    try {
      const tags = await git.tags(['--sort=-v:refname'])
      const latestTag = tags.latest

      if (!latestTag) {
        return !isPrerelease || tagPrereleases
      }

      const latestVersion = latestTag.replace(/^v/, '')
      if (semver.gt(currentVersion, latestVersion)) {
        return !isPrerelease || tagPrereleases
      }

      return false
    } catch (error) {
      core.warning(`Failed to check if should create tag: ${error}`)
      return false
    }
  }
}

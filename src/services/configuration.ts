import * as core from '@actions/core'
import type { ActionConfiguration } from '../types/index.js'
import type { ConfigAdapter } from '../types/config.js'
import { validateConfiguration } from '../utils/validation.js'

/**
 * Service responsible for parsing and validating action configuration.
 * Handles GitHub Actions inputs and provides validated configuration objects.
 */
export class ConfigurationService {
  constructor(private readonly adapter: ConfigAdapter) {}

  /**
   * Parse configuration from GitHub Actions inputs.
   */
  public async parseConfiguration(): Promise<ActionConfiguration> {
    const rawConfig = this.parseRawInputs()
    const validatedConfig = validateConfiguration(rawConfig)

    this.logConfiguration(validatedConfig)
    this.validateStrategyCompatibility(validatedConfig)

    return validatedConfig
  }

  /**
   * Parse raw inputs from GitHub Actions.
   */
  private parseRawInputs(): Partial<ActionConfiguration> {
    const result: any = {
      shouldCreateBranch: this.adapter.readBoolean('create_branch') || false,
      tagPrereleases: this.adapter.readBoolean('tag_prereleases') || false,
    }

    const commitTemplate = this.adapter.readString('commit_template')
    if (commitTemplate) result.commitMsgTemplate = commitTemplate

    const depCommitTemplate = this.adapter.readString('dependency_commit_template')
    if (depCommitTemplate) result.depCommitMsgTemplate = depCommitTemplate

    const branchTemplate = this.adapter.readString('branch_template')
    if (branchTemplate) result.branchTemplate = branchTemplate

    const branchCleanup = this.adapter.readString('branch_cleanup')
    if (branchCleanup) result.branchCleanup = branchCleanup as any

    const baseBranch = this.adapter.readString('base')
    if (baseBranch) result.baseBranch = baseBranch

    const strategy = this.adapter.readString('strategy')
    if (strategy) result.strategy = strategy as any

    const activeBranch = this.adapter.readString('branch')
    if (activeBranch) result.activeBranch = activeBranch

    // Parse tactic-specific configuration
    const mergebaseLookback = this.adapter.readNumber('tactic_mergebase_lookbackcommits')
    if (mergebaseLookback !== undefined) {
      result.mergebaseLookbackCommits = mergebaseLookback
    }

    const lastversioncommitMaxCount = this.adapter.readNumber('tactic_lastversioncommit_maxcount')
    if (lastversioncommitMaxCount !== undefined) {
      result.lastversioncommitMaxCount = lastversioncommitMaxCount
    }

    return result
  }

  /**
   * Log the final configuration for debugging.
   */
  private logConfiguration(config: ActionConfiguration): void {
    core.startGroup('📋 Configuration')
    core.info(`Strategy: ${config.strategy}`)
    core.info(`Active branch: ${config.activeBranch}`)
    core.info(`Base branch: ${config.baseBranch || 'none'}`)
    core.info(`Tag prereleases: ${config.tagPrereleases}`)
    core.info(`Create branch: ${config.shouldCreateBranch}`)
    core.info(`Branch template: ${config.branchTemplate}`)
    core.info(`Branch cleanup: ${config.branchCleanup}`)
    core.info(`Commit template: ${config.commitMsgTemplate}`)
    core.info(`Dependency commit template: ${config.depCommitMsgTemplate}`)

    // Log tactic-specific configuration
    if (config.mergebaseLookbackCommits) {
      core.info(`MergeBase lookback commits: ${config.mergebaseLookbackCommits}`)
    }
    if (config.lastversioncommitMaxCount) {
      core.info(`LastVersionCommit max count: ${config.lastversioncommitMaxCount}`)
    }
    core.endGroup()
  }

  /**
   * Validate strategy compatibility and log warnings.
   */
  private validateStrategyCompatibility(config: ActionConfiguration): void {
    // Check version bump strategy availability
    const availableStrategies = ['do-nothing', 'apply-bump', 'pre-release'] as const
    if (!availableStrategies.includes(config.strategy)) {
      throw new Error(
        `Invalid strategy: ${config.strategy}. Available: ${availableStrategies.join(', ')}`
      )
    }

    // Check branch cleanup strategy availability
    const availableCleanupStrategies = ['keep', 'prune', 'semantic'] as const
    if (!availableCleanupStrategies.includes(config.branchCleanup)) {
      throw new Error(
        `Invalid branch cleanup strategy: ${
          config.branchCleanup
        }. Available: ${availableCleanupStrategies.join(', ')}`
      )
    }

    // Warn about potential issues
    if (config.strategy === 'pre-release' && !config.baseBranch) {
      core.warning(
        'Using pre-release strategy without base branch - prerelease finalization will not be available'
      )
    }

    if (config.shouldCreateBranch && !config.baseBranch) {
      core.warning('Creating branch without base branch specified - using "main" as default')
    }
  }
}

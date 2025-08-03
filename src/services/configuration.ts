import * as core from '@actions/core'
import type { ActionConfiguration } from '../types/index.js'
import { validateConfiguration } from '../utils/validation.js'
import { VersionBumpStrategyFactory } from '../strategies/version-bump/factory.js'
import { BranchCleanupStrategyFactory } from '../strategies/branch-cleanup/factory.js'

/**
 * Service responsible for parsing and validating action configuration.
 * Handles GitHub Actions inputs and provides validated configuration objects.
 */
export class ConfigurationService {
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
      shouldCreateBranch: this.safeGetBooleanInput('create_branch', false),
      tagPrereleases: this.safeGetBooleanInput('tag_prereleases', false),
    }

    const commitTemplate = core.getInput('commit_template')
    if (commitTemplate) result.commitMsgTemplate = commitTemplate

    const depCommitTemplate = core.getInput('dependency_commit_template')
    if (depCommitTemplate) result.depCommitMsgTemplate = depCommitTemplate

    const branchTemplate = core.getInput('branch_template')
    if (branchTemplate) result.branchTemplate = branchTemplate

    const branchCleanup = core.getInput('branch_cleanup')
    if (branchCleanup) result.branchCleanup = branchCleanup as any

    const baseBranch = core.getInput('base')
    if (baseBranch) result.baseBranch = baseBranch

    const strategy = core.getInput('strategy')
    if (strategy) result.strategy = strategy as any

    const activeBranch = core.getInput('branch')
    if (activeBranch) result.activeBranch = activeBranch

    // Parse tactic-specific configuration
    const mergebaseLookback = core.getInput('tactic_mergebase_lookbackcommits')
    if (mergebaseLookback) {
      const lookbackValue = parseInt(mergebaseLookback, 10)
      if (!isNaN(lookbackValue)) {
        result.mergebaseLookbackCommits = lookbackValue
      }
    }

    const lastversioncommitMaxCount = core.getInput('tactic_lastversioncommit_maxcount')
    if (lastversioncommitMaxCount) {
      const maxCountValue = parseInt(lastversioncommitMaxCount, 10)
      if (!isNaN(maxCountValue)) {
        result.lastversioncommitMaxCount = maxCountValue
      }
    }

    return result
  }

  /**
   * Safely parse boolean input with fallback to default.
   */
  private safeGetBooleanInput(input: string, defaultValue: boolean): boolean {
    try {
      const value = core.getInput(input)
      if (!value) return defaultValue
      return core.getBooleanInput(input)
    } catch {
      return defaultValue
    }
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
    const availableStrategies = VersionBumpStrategyFactory.getAvailableStrategies()
    if (!availableStrategies.includes(config.strategy)) {
      throw new Error(
        `Invalid strategy: ${config.strategy}. Available: ${availableStrategies.join(', ')}`
      )
    }

    // Check branch cleanup strategy availability
    const availableCleanupStrategies = BranchCleanupStrategyFactory.getAvailableStrategies()
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

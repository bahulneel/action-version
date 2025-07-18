import * as core from '@actions/core';
import type { ActionConfiguration } from '../types/index.js';
import { validateConfiguration } from '../utils/validation.js';
import { VersionBumpStrategyFactory } from '../strategies/version-bump/factory.js';
import { BranchCleanupStrategyFactory } from '../strategies/branch-cleanup/factory.js';

/**
 * Service responsible for parsing and validating action configuration.
 * Handles GitHub Actions inputs and provides validated configuration objects.
 */
export class ConfigurationService {
  /**
   * Parse configuration from GitHub Actions inputs.
   */
  public async parseConfiguration(): Promise<ActionConfiguration> {
    const rawConfig = this.parseRawInputs();
    const validatedConfig = validateConfiguration(rawConfig);
    
    this.logConfiguration(validatedConfig);
    this.validateStrategyCompatibility(validatedConfig);
    
    return validatedConfig;
  }

  /**
   * Parse raw inputs from GitHub Actions.
   */
  private parseRawInputs(): Partial<ActionConfiguration> {
    return {
      commitMsgTemplate: core.getInput('commit_template') || undefined,
      depCommitMsgTemplate: core.getInput('dependency_commit_template') || undefined,
      shouldCreateBranch: this.safeGetBooleanInput('create_branch', false),
      branchTemplate: core.getInput('branch_template') || undefined,
      branchCleanup: core.getInput('branch_cleanup') as any || undefined,
      baseBranch: core.getInput('base') || undefined,
      strategy: core.getInput('strategy') as any || undefined,
      activeBranch: core.getInput('branch') || undefined,
      tagPrereleases: this.safeGetBooleanInput('tag_prereleases', false),
    };
  }

  /**
   * Safely parse boolean input with fallback to default.
   */
  private safeGetBooleanInput(input: string, defaultValue: boolean): boolean {
    try {
      const value = core.getInput(input);
      if (!value) return defaultValue;
      return core.getBooleanInput(input);
    } catch {
      return defaultValue;
    }
  }

  /**
   * Log the final configuration for debugging.
   */
  private logConfiguration(config: ActionConfiguration): void {
    core.startGroup('📋 Configuration');
    core.info(`Strategy: ${config.strategy}`);
    core.info(`Active branch: ${config.activeBranch}`);
    core.info(`Base branch: ${config.baseBranch || 'none'}`);
    core.info(`Tag prereleases: ${config.tagPrereleases}`);
    core.info(`Create branch: ${config.shouldCreateBranch}`);
    core.info(`Branch template: ${config.branchTemplate}`);
    core.info(`Branch cleanup: ${config.branchCleanup}`);
    core.info(`Commit template: ${config.commitMsgTemplate}`);
    core.info(`Dependency commit template: ${config.depCommitMsgTemplate}`);
    core.endGroup();
  }

  /**
   * Validate strategy compatibility and log warnings.
   */
  private validateStrategyCompatibility(config: ActionConfiguration): void {
    // Check version bump strategy availability
    const availableStrategies = VersionBumpStrategyFactory.getAvailableStrategies();
    if (!availableStrategies.includes(config.strategy)) {
      throw new Error(`Invalid strategy: ${config.strategy}. Available: ${availableStrategies.join(', ')}`);
    }

    // Check branch cleanup strategy availability
    const availableCleanupStrategies = BranchCleanupStrategyFactory.getAvailableStrategies();
    if (!availableCleanupStrategies.includes(config.branchCleanup)) {
      throw new Error(`Invalid branch cleanup strategy: ${config.branchCleanup}. Available: ${availableCleanupStrategies.join(', ')}`);
    }

    // Warn about potential issues
    if (config.strategy === 'pre-release' && !config.baseBranch) {
      core.warning('Using pre-release strategy without base branch - prerelease finalization will not be available');
    }

    if (config.shouldCreateBranch && !config.baseBranch) {
      core.warning('Creating branch without base branch specified - using "main" as default');
    }
  }
}
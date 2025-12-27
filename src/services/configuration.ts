import * as core from '@actions/core'
import type { ActionConfiguration } from '../types/index.js'
import type { ConfigAdapter } from '../types/config.js'
import { validateConfiguration } from '../utils/validation.js'
import {
  readVersioningConfig,
  validateVersioningConfig,
  mergeConfigWithPresets,
} from '../utils/config-loader.js'
import { ConfigTranslator } from './config-translator.js'
import { modelInference } from '../objectives/ModelInference/objective.js'
import { createConfigPR, outputConfigToSummary } from '../utils/config-pr-creator.js'
import { matchFlow, type GitHubContext } from '../utils/flow-matcher.js'
import type { VersioningConfig as ModelVersioningConfig } from '../types/versioning-config.js'

/**
 * Service responsible for parsing and validating action configuration.
 * Handles GitHub Actions inputs and provides validated configuration objects.
 */
export class ConfigurationService {
  constructor(private readonly adapter: ConfigAdapter) {}

  /**
   * Parse configuration from GitHub Actions inputs or .versioning.yml file.
   * Follows phase-based pattern with contextual inference.
   */
  public async parseConfiguration(): Promise<ActionConfiguration> {
    // Step 1: Check for .versioning.yml (fail-fast)
    const modelConfig = await readVersioningConfig()

    if (!modelConfig) {
      // File missing: infer model, create PR, then fail
      await this.handleMissingConfig()
      throw new Error(
        '.versioning.yml file is required. The action has attempted to create a PR with an inferred configuration. Please review and merge the PR, or create .versioning.yml manually.'
      )
    }

    // Step 2: Apply presets to versioning
    validateVersioningConfig(modelConfig)
    const mergedConfig = await mergeConfigWithPresets(modelConfig)

    // Step 3: Get GitHub context
    const gitHubContext = this.getGitHubContext()

    // Step 4: Infer missing required model info || fail
    const completeModelConfig = await this.inferMissingModelInfo(mergedConfig, gitHubContext)

    // Step 5: Parse action inputs (behavior-driven overrides) - includes release flag
    const rawInputs = this.parseRawInputs()

    // Step 6: versioning + event + inputs => config (translator uses objectives to determine behavior)
    const translator = new ConfigTranslator()
    let actionConfig = await translator.translateToActionConfig(
      completeModelConfig,
      gitHubContext,
      rawInputs
    )

    // Step 7: config + env/param => final config (merge any remaining overrides)
    actionConfig = this.mergeInputsOverConfig(actionConfig, rawInputs)

    // Step 8: Validate final configuration
    const validatedConfig = validateConfiguration(actionConfig)

    this.logConfiguration(validatedConfig)
    this.validateStrategyCompatibility(validatedConfig)

    // Step 9: Return configuration (strategies resolve their own dependencies in constructors)
    return validatedConfig
  }

  /**
   * Handle missing .versioning.yml: infer model, create PR, then fail.
   */
  private async handleMissingConfig(): Promise<void> {
    core.info('📋 .versioning.yml not found, attempting to infer configuration...')

    try {
      // Infer model using ModelInference objective
      const inferenceStrategy = modelInference.strategise({})
      const inferredPreset = await inferenceStrategy.inferPreset()
      const inferredConfig = await inferenceStrategy.generateInferredConfig(inferredPreset)

      core.info(`✅ Inferred preset: ${inferredPreset}`)

      // Attempt to create PR with inferred config
      const prUrl = await createConfigPR(inferredConfig)

      if (prUrl) {
        core.info(`✅ Created PR with inferred configuration: ${prUrl}`)
        core.error(
          `.versioning.yml file is required. A PR has been created with an inferred configuration: ${prUrl}\nPlease review and merge the PR to enable model-driven versioning.`
        )
      } else {
        // PR creation failed, output to summary instead
        core.warning('Failed to create PR, outputting config to action summary')
        await outputConfigToSummary(inferredConfig)
        core.error(
          '.versioning.yml file is required. An inferred configuration has been output to the action summary.\nPlease add a .versioning.yml file to your repository root.'
        )
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      core.error(`Failed to infer configuration: ${errorMessage}`)
      core.error(
        '.versioning.yml file is required. Please create one in your repository root. See documentation for details.'
      )
    }
  }

  /**
   * Get GitHub context from environment variables.
   */
  private getGitHubContext(): GitHubContext {
    const ref = process.env.GITHUB_REF || ''
    // GITHUB_REF format: refs/heads/branch-name or refs/pull/123/merge
    const currentBranch = ref.replace(/^refs\/(heads|pull\/\d+\/merge)\//, '') || 'main'

    const eventType = process.env.GITHUB_EVENT_NAME

    // For PR events, target branch is in GITHUB_BASE_REF
    const targetBranch = process.env.GITHUB_BASE_REF

    return {
      currentBranch,
      eventType,
      targetBranch,
    }
  }

  /**
   * Merge action inputs over model-driven config (inputs override).
   */
  private mergeInputsOverConfig(
    modelConfig: ActionConfiguration,
    inputs: Partial<ActionConfiguration>
  ): ActionConfiguration {
    return {
      ...modelConfig,
      ...inputs, // Inputs override model config
    }
  }

  /**
   * Parse raw inputs from GitHub Actions.
   */
  private parseRawInputs(): Partial<ActionConfiguration> {
    const result: any = {
      shouldCreateBranch: this.adapter.readBoolean('create_branch') || false,
      tagPrereleases: this.adapter.readBoolean('tag_prereleases') || false,
      release: this.adapter.readBoolean('release') || false,
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
    const availableStrategies = [
      'do-nothing',
      'apply-bump',
      'pre-release',
      'finalize',
      'sync',
    ] as const
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


  /**
   * Infer missing required model info contextually using objectives.
   * Uses objectives (ModelInference, ReferenceDiscovery) for contextual inference.
   * Uses adapters (BranchProtection) for external service queries if needed.
   */
  private async inferMissingModelInfo(
    modelConfig: ModelVersioningConfig,
    gitHubContext: GitHubContext
  ): Promise<ModelVersioningConfig> {
    core.info('🔍 Inferring missing required model information...')

    let inferredConfig = { ...modelConfig }

    // Check if we have flows
    if (!inferredConfig.flows || inferredConfig.flows.length === 0) {
      core.info('📋 No flows found, attempting to infer from repository structure...')
      try {
        const inferenceStrategy = modelInference.strategise({})
        const inferredPreset = await inferenceStrategy.inferPreset()
        const inferredFlowConfig = await inferenceStrategy.generateInferredConfig(inferredPreset)

        // Merge inferred flows with existing config
        if (inferredFlowConfig.flows) {
          inferredConfig.flows = inferredFlowConfig.flows
          core.info(`✅ Inferred flows from preset: ${inferredPreset}`)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        throw new Error(`Failed to infer flows from repository structure: ${errorMessage}`)
      }
    }

    // Check if we can match a flow for current context
    const matchedFlow = inferredConfig.flows
      ? matchFlow(inferredConfig.flows, gitHubContext)
      : null

    if (!matchedFlow) {
      core.warning(
        `No matching flow found for branch ${gitHubContext.currentBranch}, will use defaults`
      )
      // Don't fail here - ConfigTranslator will handle defaults
      return inferredConfig
    }

    // Check if baseBranch is missing and needs inference
    // Only infer if the flow requires a base branch but doesn't specify one
    if (
      matchedFlow.versioning &&
      matchedFlow.versioning !== 'finalize' &&
      !matchedFlow.base &&
      matchedFlow.from !== matchedFlow.to
    ) {
      // Flow needs a base branch but doesn't specify one
      core.info('📋 Base branch missing in flow, attempting to infer...')
      try {
        // Try to infer base branch by checking common branch patterns
        // For now, we'll use a simple heuristic: if on a feature branch, base is likely 'develop' or 'main'
        // This is a simplified inference - in practice, this should be handled by a proper inference objective
        const inferredBaseBranch = this.inferBaseBranchFromContext(gitHubContext)
        
        if (inferredBaseBranch) {
          // Update the flow with inferred base branch
          const updatedFlows = inferredConfig.flows?.map((flow) => {
            if (flow.name === matchedFlow.name) {
              return { ...flow, base: inferredBaseBranch }
            }
            return flow
          })

          if (updatedFlows) {
            inferredConfig.flows = updatedFlows
            core.info(`✅ Inferred base branch: ${inferredBaseBranch}`)
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        core.warning(`Failed to infer base branch: ${errorMessage}`)
        // Don't fail - will use default 'main' in ConfigTranslator
      }
    }

    // Check for missing branch protection metadata (if needed)
    // This is handled by ConfigTranslator using BranchProtection adapter, so we don't need to infer it here
    // But we can validate that branch metadata exists for key branches if needed

    core.info('✅ Model inference complete')
    return inferredConfig
  }

  /**
   * Infer base branch from GitHub context using simple heuristics.
   * This is a simplified approach - proper inference should use an objective.
   */
  private inferBaseBranchFromContext(gitHubContext: GitHubContext): string | undefined {
    const currentBranch = gitHubContext.currentBranch
    
    // Simple heuristics: if on feature branch, likely base is develop or main
    if (currentBranch.startsWith('feature/') || currentBranch.startsWith('feat/')) {
      return 'develop'
    }
    
    // If on hotfix branch, likely base is main
    if (currentBranch.startsWith('hotfix/')) {
      return 'main'
    }
    
    // Default: can't infer
    return undefined
  }

}

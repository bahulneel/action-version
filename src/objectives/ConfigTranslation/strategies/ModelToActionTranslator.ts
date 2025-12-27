import * as core from '@actions/core'
import type { ActionConfiguration, StrategyOf } from '@types'
import type { ConfigTranslationGoals } from '../../../types/goals/config-translation.js'
import type { VersioningConfig as ModelVersioningConfig, Flow } from '../../../types/versioning-config.js'
import { matchFlow, type GitHubContext } from '../../../utils/flow-matcher.js'
import { BranchProtection } from '../../../adapters/GitHub/BranchProtection.js'
import type { ConfigTranslationConfig } from '../objective.js'

/**
 * Model to action translator strategy.
 * Translates model-driven configuration to behavior-driven ActionConfiguration.
 * Handles all translation logic including release mode and flow matching.
 */
export class ModelToActionTranslator implements StrategyOf<ConfigTranslationGoals> {
  readonly name = 'model-to-action-translator'
  readonly description = 'Translates model config to action config'

  private readonly branchProtection: BranchProtection

  constructor(_config: ConfigTranslationConfig) {
    this.branchProtection = new BranchProtection()
  }

  public async translateModelToAction(
    modelConfig: ModelVersioningConfig | null,
    gitHubContext: GitHubContext,
    rawInputs: Partial<ActionConfiguration>
  ): Promise<ActionConfiguration> {
    // Check if release mode is requested (this is data, not behavior determination)
    const isReleaseMode = rawInputs.release === true

    if (isReleaseMode) {
      // Release mode: determine behavior from config data
      core.info('🚀 Release mode: Determining release branch creation behavior')
      return await this.getReleaseModeConfig(modelConfig, gitHubContext, rawInputs)
    }

    // Normal mode: use flow matching
    // Step 1: Match flow to current context
    const matchedFlow = modelConfig?.flows ? matchFlow(modelConfig.flows, gitHubContext) : null

    if (!matchedFlow) {
      core.warning(
        `No matching flow found for branch ${gitHubContext.currentBranch}, using defaults`
      )
      return this.getDefaultConfig(gitHubContext, rawInputs)
    }

    core.info(
      `Matched flow: ${matchedFlow.name} (from: ${matchedFlow.from}, to: ${matchedFlow.to})`
    )

    // Step 2: Extract versioning strategy from flow
    const strategy = this.extractStrategy(matchedFlow)

    // Step 3: Extract base branch
    // For sync flows (no versioning), use 'from' as the source branch
    // For other flows, use 'base' field or default to 'main'
    let baseBranch: string | undefined
    if (!matchedFlow.versioning && matchedFlow.from && matchedFlow.to) {
      // This is a sync flow: current branch is 'to', source is 'from'
      baseBranch = matchedFlow.from
    } else {
      baseBranch = matchedFlow.base || 'main'
    }

    // Step 4: Determine create_branch from branch protection
    // Use target branch from flow if available, otherwise use current branch
    const targetBranch = matchedFlow.to || gitHubContext.currentBranch
    const isProtected = await this.branchProtection.isBranchProtected(targetBranch)
    // Also check branch metadata for override
    const branchMetadata = modelConfig?.branches?.[targetBranch] || modelConfig?.branches?.['*']
    const shouldCreateBranch = branchMetadata?.protected ?? isProtected

    // Step 5: Determine tag prereleases from flow (tags are an event, not branch property)
    // Flow tags take precedence over branch metadata (for backward compatibility)
    const tagPrereleases = matchedFlow.tags ?? branchMetadata?.tags ?? false

    // Step 6: Build ActionConfiguration
    const actionConfig: ActionConfiguration = {
      commitMsgTemplate:
        rawInputs.commitMsgTemplate ||
        'chore(release): bump ${package} to ${version} (${bumpType})',
      depCommitMsgTemplate:
        rawInputs.depCommitMsgTemplate ||
        'chore(deps): update ${depPackage} to ${depVersion} in ${package} (patch)',
      shouldCreateBranch,
      branchTemplate: rawInputs.branchTemplate || 'release/${version}',
      templateRegex: new RegExp('release/(?<version>\\S+)'),
      branchCleanup: (rawInputs.branchCleanup as any) || 'keep',
      baseBranch,
      strategy,
      activeBranch: gitHubContext.currentBranch,
      tagPrereleases,
      ...(rawInputs.release !== undefined && { release: rawInputs.release }),
      ...(rawInputs.mergebaseLookbackCommits !== undefined && {
        mergebaseLookbackCommits: rawInputs.mergebaseLookbackCommits,
      }),
      ...(rawInputs.lastversioncommitMaxCount !== undefined && {
        lastversioncommitMaxCount: rawInputs.lastversioncommitMaxCount,
      }),
    }

    core.info(
      `Translated config: strategy=${strategy}, base=${baseBranch}, create_branch=${shouldCreateBranch}`
    )

    return actionConfig
  }

  /**
   * Get configuration for release mode.
   * Determines behavior from config data.
   */
  private async getReleaseModeConfig(
    modelConfig: ModelVersioningConfig | null,
    gitHubContext: GitHubContext,
    rawInputs: Partial<ActionConfiguration>
  ): Promise<ActionConfiguration> {
    // Determine behavior from config data
    // Release mode behavior: finalize strategy, create branch, use release/* template
    let tagPrereleases = false

    if (modelConfig) {
      // Check if release/* branches should have tags (from model config)
      const releaseBranchMetadata = modelConfig.branches?.['release/*']
      tagPrereleases = releaseBranchMetadata?.tags ?? false
    }

    // Build config using determined behavior
    const config: ActionConfiguration = {
      commitMsgTemplate:
        rawInputs.commitMsgTemplate ||
        'chore(release): bump ${package} to ${version} (${bumpType})',
      depCommitMsgTemplate:
        rawInputs.depCommitMsgTemplate ||
        'chore(deps): update ${depPackage} to ${depVersion} in ${package} (patch)',
      shouldCreateBranch: true, // Release mode always creates branch
      branchTemplate: rawInputs.branchTemplate || 'release/${version}',
      templateRegex: new RegExp('release/(?<version>\\S+)'),
      branchCleanup: (rawInputs.branchCleanup as any) || 'keep',
      baseBranch: rawInputs.baseBranch || gitHubContext.currentBranch,
      strategy: 'finalize', // Release mode uses finalize strategy
      activeBranch: gitHubContext.currentBranch,
      tagPrereleases: rawInputs.tagPrereleases ?? tagPrereleases,
      release: true,
      ...(rawInputs.mergebaseLookbackCommits !== undefined && {
        mergebaseLookbackCommits: rawInputs.mergebaseLookbackCommits,
      }),
      ...(rawInputs.lastversioncommitMaxCount !== undefined && {
        lastversioncommitMaxCount: rawInputs.lastversioncommitMaxCount,
      }),
    }

    core.info(
      'Release mode config: strategy=finalize, create_branch=true, branch_template=release/${version}'
    )

    return config
  }

  /**
   * Extract versioning strategy from flow.
   */
  private extractStrategy(flow: Flow): ActionConfiguration['strategy'] {
    if (!flow.versioning) {
      // No versioning specified: check if this is a sync flow
      // Sync flows have both 'from' and 'to' specified (syncing from source to target)
      if (flow.from && flow.to) {
        return 'sync'
      }
      // Otherwise, use do-nothing
      return 'do-nothing'
    }

    switch (flow.versioning) {
      case 'pre-release':
        return 'pre-release'
      case 'finalize':
        return 'finalize'
      default:
        core.warning(`Unknown versioning strategy: ${flow.versioning}, defaulting to do-nothing`)
        return 'do-nothing'
    }
  }

  /**
   * Get default ActionConfiguration when no flow matches.
   */
  private getDefaultConfig(
    gitHubContext: GitHubContext,
    rawInputs: Partial<ActionConfiguration>
  ): ActionConfiguration {
    return {
      commitMsgTemplate:
        rawInputs.commitMsgTemplate ||
        'chore(release): bump ${package} to ${version} (${bumpType})',
      depCommitMsgTemplate:
        rawInputs.depCommitMsgTemplate ||
        'chore(deps): update ${depPackage} to ${depVersion} in ${package} (patch)',
      shouldCreateBranch: false,
      branchTemplate: rawInputs.branchTemplate || 'release/${version}',
      templateRegex: new RegExp('release/(?<version>\\S+)'),
      branchCleanup: (rawInputs.branchCleanup as any) || 'keep',
      baseBranch: undefined,
      strategy: 'do-nothing',
      activeBranch: gitHubContext.currentBranch,
      tagPrereleases: false,
      ...(rawInputs.release !== undefined && { release: rawInputs.release }),
      ...(rawInputs.mergebaseLookbackCommits !== undefined && {
        mergebaseLookbackCommits: rawInputs.mergebaseLookbackCommits,
      }),
      ...(rawInputs.lastversioncommitMaxCount !== undefined && {
        lastversioncommitMaxCount: rawInputs.lastversioncommitMaxCount,
      }),
    }
  }
}

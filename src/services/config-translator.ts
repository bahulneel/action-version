import * as core from '@actions/core'
import type { ActionConfiguration } from '../types/index.js'
import type { VersioningConfig as ModelVersioningConfig, Flow } from '../types/versioning-config.js'
import { matchFlow, type GitHubContext } from '../utils/flow-matcher.js'
import { BranchProtection } from '../adapters/GitHub/BranchProtection.js'

/**
 * Translate model-driven configuration to behavior-driven ActionConfiguration.
 */
export class ConfigTranslator {
  private readonly branchProtection = new BranchProtection()

  /**
   * Convert model config to ActionConfiguration based on current GitHub context.
   */
  async translateToActionConfig(
    modelConfig: ModelVersioningConfig,
    gitHubContext: GitHubContext
  ): Promise<ActionConfiguration> {
    // Step 1: Match flow to current context
    const matchedFlow = modelConfig.flows
      ? matchFlow(modelConfig.flows, gitHubContext)
      : null

    if (!matchedFlow) {
      core.warning(`No matching flow found for branch ${gitHubContext.currentBranch}, using defaults`)
      return this.getDefaultConfig(gitHubContext)
    }

    core.info(`Matched flow: ${matchedFlow.name} (from: ${matchedFlow.from}, to: ${matchedFlow.to})`)

    // Step 2: Extract versioning strategy from flow
    const strategy = this.extractStrategy(matchedFlow)

    // Step 3: Extract base branch
    const baseBranch = matchedFlow.base || 'main'

    // Step 4: Determine create_branch from branch protection
    // Use target branch from flow if available, otherwise use current branch
    const targetBranch = matchedFlow.to || gitHubContext.currentBranch
    const isProtected = await this.branchProtection.isBranchProtected(targetBranch)
    // Also check branch metadata for override
    const branchMetadata = modelConfig.branches?.[targetBranch] || modelConfig.branches?.['*']
    const shouldCreateBranch = branchMetadata?.protected ?? isProtected

    // Step 5: Determine tag prereleases from branch metadata
    const tagPrereleases = branchMetadata?.tags ?? false

    // Step 6: Build ActionConfiguration
    const config: ActionConfiguration = {
      commitMsgTemplate: 'chore(release): bump ${package} to ${version} (${bumpType})',
      depCommitMsgTemplate: 'chore(deps): update ${depPackage} to ${depVersion} in ${package} (patch)',
      shouldCreateBranch,
      branchTemplate: 'release/${version}',
      templateRegex: new RegExp('release/(?<version>\\S+)'),
      branchCleanup: 'keep',
      baseBranch,
      strategy,
      activeBranch: gitHubContext.currentBranch,
      tagPrereleases,
    }

    core.info(`Translated config: strategy=${strategy}, base=${baseBranch}, create_branch=${shouldCreateBranch}`)

    return config
  }

  /**
   * Extract versioning strategy from flow.
   */
  private extractStrategy(flow: Flow): ActionConfiguration['strategy'] {
    if (!flow.versioning) {
      // No versioning specified means do-nothing (for sync operations)
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
  private getDefaultConfig(gitHubContext: GitHubContext): ActionConfiguration {
    return {
      commitMsgTemplate: 'chore(release): bump ${package} to ${version} (${bumpType})',
      depCommitMsgTemplate: 'chore(deps): update ${depPackage} to ${depVersion} in ${package} (patch)',
      shouldCreateBranch: false,
      branchTemplate: 'release/${version}',
      templateRegex: new RegExp('release/(?<version>\\S+)'),
      branchCleanup: 'keep',
      baseBranch: undefined,
      strategy: 'do-nothing',
      activeBranch: gitHubContext.currentBranch,
      tagPrereleases: false,
    }
  }
}

import * as core from '@actions/core'
import simpleGit from 'simple-git'
import type { StrategyOf } from '../../../types/index.js'
import type { ModelInferenceGoals } from '../../../types/goals/model-inference.js'
import type { PresetName, VersioningConfig as ModelVersioningConfig } from '../../../types/versioning-config.js'

const git = simpleGit()

/**
 * Git-based inference strategy.
 * Analyzes repository structure (branches) to infer the most likely preset.
 */
export class GitBasedInference implements StrategyOf<ModelInferenceGoals> {
  readonly name = 'git-based-inference'
  readonly description = 'Infer preset from git branch structure'

  /**
   * Infer the most likely preset by analyzing branch structure.
   */
  async inferPreset(): Promise<PresetName> {
    try {
      const branches = await git.branchLocal()

      // Check for Git Flow indicators
      const hasDevelop = branches.all.includes('develop')
      const hasReleaseBranches = branches.all.some((branch) => branch.startsWith('release/'))

      // Check for GitLab Flow indicators (environment branches)
      const hasPreProd = branches.all.includes('pre-prod')
      const hasProd = branches.all.includes('prod')

      if (hasDevelop && hasReleaseBranches) {
        core.info('Inferred preset: gitflow (found develop and release/* branches)')
        return 'gitflow'
      }

      if (hasReleaseBranches && !hasDevelop) {
        core.info('Inferred preset: release-branches (found release/* branches, no develop)')
        return 'release-branches'
      }

      if (hasPreProd || hasProd) {
        core.info('Inferred preset: gitlab-flow (found environment branches)')
        return 'gitlab-flow'
      }

      if (hasDevelop) {
        core.info('Inferred preset: gitflow (found develop branch)')
        return 'gitflow'
      }

      // Default to github-flow for simple repositories
      core.info('Inferred preset: github-flow (default for simple repositories)')
      return 'github-flow'
    } catch (error) {
      core.warning(`Failed to infer preset from git structure: ${error}`)
      // Default fallback
      return 'github-flow'
    }
  }

  /**
   * Generate a VersioningConfig based on the inferred preset.
   * This creates a minimal config with just the preset.
   */
  async generateInferredConfig(preset: PresetName): Promise<ModelVersioningConfig> {
    return {
      presets: [preset],
    }
  }
}

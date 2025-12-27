import { promises as fs } from 'fs'
import * as path from 'path'
import * as core from '@actions/core'
import yaml from 'js-yaml'
import type { VersioningConfig as ModelVersioningConfig, PresetName } from '../types/versioning-config.js'
import { loadAndComposePresets } from './preset-loader.js'

/**
 * Read and parse .versioning.yml from repository root.
 * Returns null if file doesn't exist.
 */
export async function readVersioningConfig(): Promise<ModelVersioningConfig | null> {
  try {
    const configPath = path.join(process.cwd(), '.versioning.yml')

    core.debug(`Reading versioning config: ${configPath}`)
    const content = await fs.readFile(configPath, 'utf-8')
    const config = yaml.load(content) as ModelVersioningConfig

    if (!config) {
      core.warning('.versioning.yml is empty')
      return null
    }

    core.debug('Successfully loaded .versioning.yml')
    return config
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      // File doesn't exist - this is expected, return null
      core.debug('.versioning.yml not found')
      return null
    }

    // Other errors should be logged
    const errorMessage = error instanceof Error ? error.message : String(error)
    core.warning(`Failed to read .versioning.yml: ${errorMessage}`)
    return null
  }
}

/**
 * Validate versioning configuration schema.
 */
export function validateVersioningConfig(config: ModelVersioningConfig): void {
  // Validate presets if present
  if (config.presets) {
    const validPresets: PresetName[] = ['gitflow', 'github-flow', 'trunk-based', 'release-branches', 'gitlab-flow']
    for (const preset of config.presets) {
      if (!validPresets.includes(preset)) {
        throw new Error(`Invalid preset name: ${preset}. Valid presets: ${validPresets.join(', ')}`)
      }
    }
  }

  // Validate flows if present
  if (config.flows) {
    for (const flow of config.flows) {
      if (!flow.name || !flow.from || !flow.to) {
        throw new Error(`Flow is missing required fields (name, from, to): ${JSON.stringify(flow)}`)
      }

      if (flow.versioning && !['pre-release', 'finalize'].includes(flow.versioning)) {
        throw new Error(`Invalid versioning strategy: ${flow.versioning}. Valid: pre-release, finalize`)
      }
    }
  }

  // Validate branches if present (structure validation)
  if (config.branches) {
    for (const [pattern, metadata] of Object.entries(config.branches)) {
      if (metadata && typeof metadata === 'object') {
        // Metadata can have protected (boolean) and tags (boolean)
        if ('protected' in metadata && typeof metadata.protected !== 'boolean') {
          throw new Error(`Branch ${pattern}: protected must be boolean`)
        }
        if ('tags' in metadata && typeof metadata.tags !== 'boolean') {
          throw new Error(`Branch ${pattern}: tags must be boolean`)
        }
      }
    }
  }
}

/**
 * Merge config with presets: compose presets first, then apply local config overrides.
 */
export async function mergeConfigWithPresets(config: ModelVersioningConfig): Promise<ModelVersioningConfig> {
  let merged: ModelVersioningConfig = {
    branches: {},
    flows: [],
  }

  // Step 1: Compose presets if specified
  if (config.presets && config.presets.length > 0) {
    core.debug(`Composing presets: ${config.presets.join(', ')}`)
    merged = await loadAndComposePresets(config.presets)
  }

  // Step 2: Apply local config overrides (deep merge for branches, array merge for flows)
  if (config.branches) {
    merged.branches = { ...merged.branches, ...config.branches }
  }

  if (config.flows) {
    // Flows from local config are added to preset flows
    merged.flows = [...(merged.flows || []), ...config.flows]
  }

  // Preserve presets array if present (for reference)
  if (config.presets) {
    merged.presets = config.presets
  }

  return merged
}

import { promises as fs } from 'fs'
import * as path from 'path'
import * as core from '@actions/core'
import yaml from 'js-yaml'
import type { VersioningConfig as ModelVersioningConfig, PresetName } from '../types/versioning-config.js'

/**
 * Load a preset configuration from a YAML file.
 */
export async function loadPreset(name: PresetName): Promise<ModelVersioningConfig | null> {
  try {
    // Presets are in presets/ directory at repository root
    const presetPath = path.join(process.cwd(), 'presets', `${name}.yml`)

    core.debug(`Loading preset: ${presetPath}`)
    const content = await fs.readFile(presetPath, 'utf-8')
    const preset = yaml.load(content) as ModelVersioningConfig

    if (!preset) {
      core.warning(`Preset ${name} loaded but is empty`)
      return null
    }

    core.debug(`Successfully loaded preset: ${name}`)
    return preset
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    core.warning(`Failed to load preset ${name}: ${errorMessage}`)
    return null
  }
}

/**
 * Compose multiple presets by merging them in order.
 * Later presets override earlier ones, and local config overrides all presets.
 */
export function composePresets(presets: ModelVersioningConfig[]): ModelVersioningConfig {
  const composed: ModelVersioningConfig = {
    branches: {},
    flows: [],
  }

  for (const preset of presets) {
    // Merge branches (deep merge)
    if (preset.branches) {
      composed.branches = { ...composed.branches, ...preset.branches }
    }

    // Merge flows (array concatenation)
    if (preset.flows) {
      composed.flows = [...(composed.flows || []), ...preset.flows]
    }
  }

  return composed
}

/**
 * Get list of available preset names by scanning the presets directory.
 */
export async function getAvailablePresets(): Promise<PresetName[]> {
  try {
    const presetsDir = path.join(process.cwd(), 'presets')

    const files = await fs.readdir(presetsDir)
    const presetNames: PresetName[] = []

    for (const file of files) {
      if (file.endsWith('.yml') || file.endsWith('.yaml')) {
        const name = file.replace(/\.(yml|yaml)$/, '') as PresetName
        // Validate it's a known preset name
        if (['gitflow', 'github-flow', 'trunk-based', 'release-branches', 'gitlab-flow'].includes(name)) {
          presetNames.push(name)
        }
      }
    }

    return presetNames
  } catch (error) {
    core.debug(`Failed to scan presets directory: ${error}`)
    return []
  }
}

/**
 * Load and compose multiple presets by name.
 */
export async function loadAndComposePresets(presetNames: PresetName[]): Promise<ModelVersioningConfig> {
  const loadedPresets: ModelVersioningConfig[] = []

  for (const name of presetNames) {
    const preset = await loadPreset(name)
    if (preset) {
      loadedPresets.push(preset)
    } else {
      core.warning(`Preset ${name} could not be loaded, skipping`)
    }
  }

  return composePresets(loadedPresets)
}

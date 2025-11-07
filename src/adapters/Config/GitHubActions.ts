import * as core from '@actions/core'
import type { Config } from '../../types/index.js'

/**
 * GitHub Actions config adapter implementation.
 * Reads configuration from GitHub Actions inputs.
 */
export class GitHubActions implements Config {
  readString(key: string): string | undefined {
    const value = core.getInput(key)
    return value || undefined
  }

  readBoolean(key: string): boolean {
    try {
      return core.getBooleanInput(key)
    } catch {
      return false
    }
  }

  readNumber(key: string): number | undefined {
    const value = core.getInput(key)
    if (!value) return undefined

    const parsed = parseInt(value, 10)
    return isNaN(parsed) ? undefined : parsed
  }
}

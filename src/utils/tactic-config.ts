import * as core from '@actions/core'

/**
 * Utility for parsing tactic-specific configuration from GitHub Actions inputs.
 * Uses the pattern {tactic_name}_{option_name} for input names.
 */
export class TacticConfig {
  /**
   * Get tactic-specific configuration options.
   * @param tacticName The name of the tactic (e.g., 'MergeBase', 'LastVersionCommit')
   * @param options Object defining the expected options and their types
   * @returns Object with parsed configuration values
   */
  public static getTacticOptions<T extends Record<string, any>>(
    tacticName: string,
    options: Record<keyof T, 'string' | 'number' | 'boolean'>
  ): T {
    const result = {} as T

    for (const [optionName, optionType] of Object.entries(options)) {
      const inputName = `tactic_${tacticName.toLowerCase()}_${optionName.toLowerCase()}`
      const value = core.getInput(inputName)

      if (value !== '') {
        switch (optionType) {
          case 'string':
            result[optionName as keyof T] = value as T[keyof T]
            break
          case 'number':
            const numValue = parseInt(value, 10)
            if (!isNaN(numValue)) {
              result[optionName as keyof T] = numValue as T[keyof T]
            } else {
              core.warning(`Invalid number value for ${inputName}: ${value}`)
            }
            break
          case 'boolean':
            result[optionName as keyof T] = (value === 'true' || value === '1') as T[keyof T]
            break
        }
      }
    }

    return result
  }

  /**
   * Get a single tactic option value.
   * @param tacticName The name of the tactic
   * @param optionName The name of the option
   * @param defaultValue Default value if not set
   * @returns The option value or default
   */
  public static getTacticOption<T>(tacticName: string, optionName: string, defaultValue: T): T {
    const inputName = `tactic_${tacticName.toLowerCase()}_${optionName.toLowerCase()}`
    const value = core.getInput(inputName)

    if (value === '') {
      return defaultValue
    }

    if (typeof defaultValue === 'number') {
      const numValue = parseInt(value, 10)
      return (isNaN(numValue) ? defaultValue : numValue) as T
    }

    if (typeof defaultValue === 'boolean') {
      return (value === 'true' || value === '1' ? true : false) as T
    }

    return value as T
  }
}

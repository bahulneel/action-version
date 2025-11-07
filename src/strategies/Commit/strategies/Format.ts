import type { Objective } from '../../../types/objectives.js'
import type { Config } from '../../../types/config.js'
import type { FormatCommitStrategy } from '../../../types/strategies/commit.js'
import { Template } from './Format/Template.js'
import { Conventional } from './Format/Conventional.js'

/**
 * Format sub-objective - resolves Format strategies based on configuration.
 */
export class Format {
  static strategise(config: Config): FormatCommitStrategy {
    switch (config.commitFormat) {
      case 'conventional':
        return new Conventional()
      case 'template':
        return new Template(config.commitMsgTemplate, config.depCommitMsgTemplate)
      default:
        throw new Error(`Unknown commit format: ${config.commitFormat}`)
    }
  }
}

Format satisfies Objective<Config, FormatCommitStrategy>

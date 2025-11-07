import type { Objective } from '../types/objectives.js'
import type { Config } from '../types/config.js'
import type { CommitStrategy } from '../types/strategies/commit.js'
import { Strategy } from './Commit/Strategy.js'

/**
 * Commit objective - resolves Commit strategies based on configuration.
 */
export class Commit {
  static strategise(config: Config): CommitStrategy {
    return new Strategy(config)
  }
}

Commit satisfies Objective<Config, CommitStrategy>

import type { Objective, Config, CommitStrategy } from '../types/index.js'
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

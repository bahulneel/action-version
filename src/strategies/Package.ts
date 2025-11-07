import type { Objective } from '../types/objectives.js'
import type { Config } from '../types/config.js'
import type { PackageStrategy } from '../types/strategies/package.js'

/**
 * Package objective - resolves Package strategies based on configuration.
 */
export class Package {
  static strategise(config: Config): PackageStrategy {
    // Detect package manager from environment (package-lock.json, yarn.lock, pnpm-lock.yaml)
    // TODO: Implement actual detection logic and import strategy classes
    throw new Error('Package manager detection not yet implemented')
  }
}

Package satisfies Objective<Config, PackageStrategy>

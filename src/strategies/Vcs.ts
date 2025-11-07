import type { VcsInterface, VcsConfig } from '../types/index.js'
import { Strategy } from './Vcs/Strategy.js'

/**
 * Vcs objective - resolves VCS strategies (e.g., Git) based on configuration.
 */
export class Vcs {
  static strategise(config: VcsConfig): VcsInterface {
    // For now we only support Git; future kinds can branch here.
    return new Strategy(config)
  }
}

Vcs satisfies import('../types/objectives.js').Objective<VcsConfig, VcsInterface>



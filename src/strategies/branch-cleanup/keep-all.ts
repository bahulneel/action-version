import * as core from '@actions/core';
import type { GitBranches, BumpType } from '../../types/index.js';
import { BaseBranchCleanupStrategy } from './base.js';

/**
 * Keep-all strategy that preserves all version branches.
 * This is the safest option as it doesn't delete any branches.
 */
export class KeepAllBranchesStrategy extends BaseBranchCleanupStrategy {
  constructor() {
    super('keep');
  }

  public async execute(
    branches: GitBranches,
    versionedBranch: string,
    templateRegex: RegExp,
    rootBump: BumpType
  ): Promise<void> {
    core.info(`[root] Branch cleanup strategy: ${this.name} - keeping all branches`);
    // Intentionally empty - keep all branches
  }
}
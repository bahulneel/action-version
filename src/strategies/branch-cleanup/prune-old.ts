import * as core from '@actions/core';
import simpleGit from 'simple-git';
import type { GitBranches, BumpType } from '../../types/index.js';
import { BaseBranchCleanupStrategy } from './base.js';

const git = simpleGit();

/**
 * Prune-old strategy that removes all old version branches except the current one.
 * This keeps the workspace clean by removing outdated version branches.
 */
export class PruneOldBranchesStrategy extends BaseBranchCleanupStrategy {
  constructor() {
    super('prune');
  }

  public async execute(
    branches: GitBranches,
    versionedBranch: string,
    templateRegex: RegExp,
    _rootBump: BumpType
  ): Promise<void> {
    core.info(`[root] Branch cleanup strategy: ${this.name} - removing old branches`);

    const cleanupPromises = branches.all
      .filter(branch => branch.replace('origin/', '') !== versionedBranch)
      .filter(branch => this.isVersionBranch(branch, templateRegex))
      .map(branch => this.deleteBranchSafely(branch));

    await Promise.allSettled(cleanupPromises);
  }

  private isVersionBranch(branch: string, templateRegex: RegExp): boolean {
    const match = branch.match(templateRegex);
    return Boolean(match?.groups?.version);
  }

  private async deleteBranchSafely(branch: string): Promise<void> {
    try {
      core.info(`[root] Deleting old branch ${branch}`);
      await git.deleteLocalBranch(branch, true);
      core.debug(`[root] Successfully deleted branch ${branch}`);
    } catch (error) {
      core.warning(`[root] Failed to delete branch ${branch}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
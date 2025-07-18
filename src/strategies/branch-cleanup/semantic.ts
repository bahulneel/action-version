import * as core from '@actions/core';
import simpleGit from 'simple-git';
import type { GitBranches, BumpType } from '../../types/index.js';
import { BaseBranchCleanupStrategy } from './base.js';
import { guessBumpType } from '../../utils/version.js';

const git = simpleGit();

/**
 * Semantic strategy that keeps only branches with different bump types.
 * This allows multiple major/minor/patch branches to coexist while cleaning up duplicates.
 */
export class SemanticBranchesStrategy extends BaseBranchCleanupStrategy {
  constructor() {
    super('semantic');
  }

  public async execute(
    branches: GitBranches,
    versionedBranch: string,
    templateRegex: RegExp,
    rootBump: BumpType
  ): Promise<void> {
    core.info(`[root] Branch cleanup strategy: ${this.name} - keeping same bump type only`);

    const cleanupPromises = branches.all
      .filter(branch => branch.replace('origin/', '') !== versionedBranch)
      .filter(branch => this.shouldDeleteBranch(branch, templateRegex, rootBump))
      .map(branch => this.deleteBranchSafely(branch));

    await Promise.allSettled(cleanupPromises);
  }

  private shouldDeleteBranch(branch: string, templateRegex: RegExp, rootBump: BumpType): boolean {
    const match = branch.match(templateRegex);
    const version = match?.groups?.version;
    
    if (!version) {
      return false; // Not a version branch
    }

    const bumpType = guessBumpType(version);
    
    if (bumpType !== rootBump) {
      return false; // Keep different bump types
    }

    return true; // Delete same bump type
  }

  private async deleteBranchSafely(branch: string): Promise<void> {
    try {
      const match = branch.match(/(?<version>\d+\.\d+\.\d+)/);
      const version = match?.groups?.version;
      const bumpType = version ? guessBumpType(version) : 'unknown';
      
      core.info(`[root] Deleting same-type branch ${branch} (${bumpType})`);
      await git.deleteLocalBranch(branch, true);
      core.debug(`[root] Successfully deleted branch ${branch}`);
    } catch (error) {
      core.warning(`[root] Failed to delete branch ${branch}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
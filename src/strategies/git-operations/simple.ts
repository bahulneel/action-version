import * as core from '@actions/core';
import simpleGit from 'simple-git';
import path from 'node:path';
import type { BumpType } from '../../types/index.js';
import { BaseGitOperationStrategy } from './base.js';

const git = simpleGit();

/**
 * Simple git strategy that uses minimal commit messages
 * and basic git operations for version management.
 */
export class SimpleGitStrategy extends BaseGitOperationStrategy {
  constructor() {
    super('simple');
  }

  public async commitVersionChange(
    packageDir: string,
    packageName: string,
    version: string,
    _bumpType: BumpType,
    _template: string
  ): Promise<void> {
    const commitMessage = `Bump ${packageName} to ${version}`;

    try {
      await git.add(path.join(packageDir, 'package.json'));
      await git.commit(commitMessage);
      
      core.info(`[${packageName}] Committed version change: ${commitMessage}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      core.error(`[${packageName}] Failed to commit version change: ${errorMessage}`);
      throw new Error(`Failed to commit version change for ${packageName}: ${errorMessage}`);
    }
  }

  public async commitDependencyUpdate(
    packageDir: string,
    packageName: string,
    depName: string,
    _depVersion: string,
    _template: string
  ): Promise<void> {
    const commitMessage = `Update ${depName} in ${packageName}`;

    try {
      await git.add(path.join(packageDir, 'package.json'));
      await git.commit(commitMessage);
      
      core.info(`[${packageName}] Committed dependency update: ${commitMessage}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      core.error(`[${packageName}] Failed to commit dependency update: ${errorMessage}`);
      throw new Error(`Failed to commit dependency update for ${packageName}: ${errorMessage}`);
    }
  }

  public async tagVersion(
    version: string,
    _isPrerelease: boolean,
    shouldTag: boolean
  ): Promise<void> {
    if (!shouldTag) {
      core.debug(`[git] Skipping tag creation for ${version}`);
      return;
    }

    const tagName = `v${version}`;

    try {
      await git.addTag(tagName);
      core.info(`[git] Created tag ${tagName}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      core.warning(`[git] Failed to create tag ${tagName}: ${errorMessage}`);
      // Don't throw here - tag creation failure shouldn't fail the entire process
    }
  }
}
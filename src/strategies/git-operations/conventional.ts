import * as core from '@actions/core';
import simpleGit from 'simple-git';
import type { BumpType } from '../../types/index.js';
import { BaseGitOperationStrategy } from './base.js';
import { interpolateTemplate } from '../../utils/template.js';

/**
 * Conventional git strategy that uses conventional commit messages
 * and follows standard git practices for version management.
 */
export class ConventionalGitStrategy extends BaseGitOperationStrategy {
  constructor() {
    super('conventional');
  }

  public async commitVersionChange(
    packageDir: string,
    packageName: string,
    version: string,
    bumpType: BumpType,
    template: string
  ): Promise<void> {
    const git = simpleGit(packageDir);
    
    // Template the commit message
    const message = interpolateTemplate(template, {
      packageName,
      version,
      bumpType
    });

    await git.add('package.json');
    await git.commit(message);
    
    core.info(`[${packageName}] Committed version change: ${version}`);
  }

  public async commitDependencyUpdate(
    packageDir: string,
    packageName: string,
    depName: string,
    depVersion: string,
    template: string
  ): Promise<void> {
    const git = simpleGit(packageDir);
    
    // Template the commit message  
    const message = interpolateTemplate(template, {
      packageName,
      dependencyName: depName,
      dependencyVersion: depVersion
    });

    await git.add('package.json');
    await git.commit(message);

    core.info(`[${packageName}] Committed dependency update: ${depName}@${depVersion}`);
  }

  public async tagVersion(
    version: string,
    isPrerelease: boolean,
    shouldTag: boolean
  ): Promise<void> {
    if (!shouldTag) {
      core.info(`[root] Skipping tag creation for ${version}`);
      return;
    }

    const git = simpleGit(process.cwd());
    const tagName = `v${version}`;
    const tagMessage = `chore(release): ${version}`;

    try {
      // Create annotated tag with message
      await git.tag([tagName, '-a', '-m', tagMessage]);
      core.info(`[root] Created ${isPrerelease ? 'prerelease ' : ''}tag: ${tagName}`);
    } catch (error) {
      core.error(`Failed to create tag ${tagName}: ${error}`);
      throw error;
    }
  }
}
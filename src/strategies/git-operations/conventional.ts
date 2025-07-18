import * as core from '@actions/core';
import simpleGit from 'simple-git';
import path from 'node:path';
import type { BumpType } from '../../types/index.js';
import { BaseGitOperationStrategy } from './base.js';
import { interpolateTemplate } from '../../utils/template.js';

const git = simpleGit();

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
    const relativePath = path.relative(process.cwd(), packageDir) || '.';
    const commitMessage = interpolateTemplate(template, {
      package: packageName,
      version,
      bumpType,
    });

    try {
      await git.add(path.join(packageDir, 'package.json'));
      await git.commit(commitMessage, undefined, {
        '--allow-empty': null,
      });
      
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
    depVersion: string,
    template: string
  ): Promise<void> {
    const relativePath = path.relative(process.cwd(), packageDir) || '.';
    const commitMessage = interpolateTemplate(template, {
      package: packageName,
      depPackage: depName,
      depVersion,
    });

    try {
      await git.add(path.join(packageDir, 'package.json'));
      await git.commit(commitMessage, undefined, {
        '--allow-empty': null,
      });
      
      core.info(`[${packageName}] Committed dependency update: ${commitMessage}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      core.error(`[${packageName}] Failed to commit dependency update: ${errorMessage}`);
      throw new Error(`Failed to commit dependency update for ${packageName}: ${errorMessage}`);
    }
  }

  public async tagVersion(
    version: string,
    isPrerelease: boolean,
    shouldTag: boolean
  ): Promise<void> {
    if (!shouldTag) {
      core.debug(`[git] Skipping tag creation for ${version} (shouldTag=${shouldTag})`);
      return;
    }

    if (isPrerelease && !shouldTag) {
      core.debug(`[git] Skipping prerelease tag for ${version}`);
      return;
    }

    const tagName = `v${version}`;
    const tagMessage = isPrerelease 
      ? `Pre-release version ${version}`
      : `Release version ${version}`;

    try {
      await git.addTag(tagName, undefined, {
        '-a': null,
        '-m': tagMessage,
      });
      
      core.info(`[git] Created tag ${tagName}: ${tagMessage}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      core.warning(`[git] Failed to create tag ${tagName}: ${errorMessage}`);
      // Don't throw here - tag creation failure shouldn't fail the entire process
    }
  }
}
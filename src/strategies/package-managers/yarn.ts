import * as core from '@actions/core';
import { execSync } from 'node:child_process';
import { access } from 'node:fs/promises';
import path from 'node:path';
import type { TestResult } from '../../types/index.js';
import { BasePackageManagerStrategy } from './base.js';

/**
 * Yarn package manager strategy.
 * Handles Yarn-specific operations and commands.
 */
export class YarnPackageManagerStrategy extends BasePackageManagerStrategy {
  constructor() {
    super('yarn');
  }

  public isAvailable(): boolean {
    try {
      // Check if yarn.lock exists
      const yarnLockPath = path.join(process.cwd(), 'yarn.lock');
      access(yarnLockPath).then(() => true).catch(() => false);
      
      // Check if yarn command is available
      execSync('yarn --version', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  public async test(packageDir: string): Promise<TestResult> {
    try {
      core.debug(`[yarn] Running tests in ${packageDir}`);
      
      const result = execSync('yarn test', {
        cwd: packageDir,
        stdio: 'pipe',
        encoding: 'utf-8',
        timeout: 60000, // 1 minute timeout
      });

      core.debug(`[yarn] Test output: ${result}`);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      core.debug(`[yarn] Test failed: ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  public async install(packageDir: string): Promise<void> {
    try {
      core.info(`[yarn] Installing dependencies in ${packageDir}`);
      
      execSync('yarn install --frozen-lockfile', {
        cwd: packageDir,
        stdio: 'inherit',
        timeout: 300000, // 5 minute timeout
      });

      core.info(`[yarn] Dependencies installed successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      core.error(`[yarn] Failed to install dependencies: ${errorMessage}`);
      throw new Error(`Yarn install failed: ${errorMessage}`);
    }
  }
}
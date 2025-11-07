import * as core from '@actions/core';
import { execSync } from 'node:child_process';
import { access } from 'node:fs/promises';
import path from 'node:path';
import type { TestResult } from '../../types/index.js';
import type { PackageManager } from '../../types/strategies/package.js';

/**
 * PNPM package manager strategy.
 * Handles PNPM-specific operations and commands.
 */
export class PnpmPackageManagerStrategy implements PackageManager {
  public readonly name = 'pnpm' as const;
  public readonly description?: string = 'PNPM package manager strategy';

  public isAvailable(): boolean {
    try {
      // Check if pnpm-lock.yaml exists
      const pnpmLockPath = path.join(process.cwd(), 'pnpm-lock.yaml');
      access(pnpmLockPath).then(() => true).catch(() => false);
      
      // Check if pnpm command is available
      execSync('pnpm --version', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  public async test(packageDir: string): Promise<TestResult> {
    try {
      core.debug(`[pnpm] Running tests in ${packageDir}`);
      
      const result = execSync('pnpm test', {
        cwd: packageDir,
        stdio: 'pipe',
        encoding: 'utf-8',
        timeout: 60000, // 1 minute timeout
      });

      core.debug(`[pnpm] Test output: ${result}`);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      core.debug(`[pnpm] Test failed: ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  public async install(packageDir: string): Promise<void> {
    try {
      core.info(`[pnpm] Installing dependencies in ${packageDir}`);
      
      execSync('pnpm install --frozen-lockfile', {
        cwd: packageDir,
        stdio: 'inherit',
        timeout: 300000, // 5 minute timeout
      });

      core.info(`[pnpm] Dependencies installed successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      core.error(`[pnpm] Failed to install dependencies: ${errorMessage}`);
      throw new Error(`PNPM install failed: ${errorMessage}`);
    }
  }
}
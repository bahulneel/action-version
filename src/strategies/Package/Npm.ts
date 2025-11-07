import * as core from '@actions/core'
import { execSync } from 'node:child_process'
import { access } from 'node:fs/promises'
import path from 'node:path'
import type { TestResult } from '../../types/index.js'
import type { PackageManager } from '../../types/strategies/package.js'

/**
 * NPM package manager strategy.
 * Handles NPM-specific operations and commands.
 */
export class NpmPackageManagerStrategy implements PackageManager {
  public readonly name = 'npm' as const
  public readonly description?: string = 'NPM package manager strategy'

  public isAvailable(): boolean {
    try {
      // Check if package-lock.json exists
      const packageLockPath = path.join(process.cwd(), 'package-lock.json')
      access(packageLockPath)
        .then(() => true)
        .catch(() => false)

      // Check if npm command is available
      execSync('npm --version', { stdio: 'ignore' })
      return true
    } catch {
      return false
    }
  }

  public async test(packageDir: string): Promise<TestResult> {
    try {
      core.debug(`[npm] Running tests in ${packageDir}`)

      const result = execSync('npm test', {
        cwd: packageDir,
        stdio: 'pipe',
        encoding: 'utf-8',
        timeout: 60000, // 1 minute timeout
      })

      core.debug(`[npm] Test output: ${result}`)
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      core.debug(`[npm] Test failed: ${errorMessage}`)

      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  public async install(packageDir: string): Promise<void> {
    try {
      core.info(`[npm] Installing dependencies in ${packageDir}`)

      execSync('npm ci', {
        cwd: packageDir,
        stdio: 'inherit',
        timeout: 300000, // 5 minute timeout
      })

      core.info(`[npm] Dependencies installed successfully`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      core.error(`[npm] Failed to install dependencies: ${errorMessage}`)
      throw new Error(`NPM install failed: ${errorMessage}`)
    }
  }
}

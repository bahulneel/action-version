import 'source-map-support/register'
import * as core from '@actions/core'
import type {
  ActionConfiguration,
  GitOperationStrategy,
  PackageManagerStrategy,
} from './types/index.js'
import { findRootPackage, createWorkspacePackages } from './utils/workspace.js'
import { ConfigurationService } from './services/configuration.js'
import { VersionBumpService } from './services/version-bump.js'
import { SummaryService } from './services/summary.js'
import { SimpleGit } from './adapters/Git/SimpleGit.js'
import { interpolateTemplate } from './utils/template.js'
import { access } from 'node:fs/promises'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { Vcs } from './strategies/Vcs.js'

/**
 * Main application class that orchestrates the version bump process.
 * Follows clean architecture principles with proper separation of concerns.
 */
class VersionBumpApplication {
  private exitCode = 0
  private outputBranch: string | undefined
  private tempRef: string | undefined
  private branchTemplate: string | undefined
  private hasBumped = false
  private readonly git = new SimpleGit()

  /**
   * Run the complete version bump process.
   */
  public async run(): Promise<void> {
    try {
      core.info('🚀 Starting version bump action...')

      // Step 1: Parse and validate configuration
      const config = await this.parseConfiguration()
      core.info(
        `📋 Configuration loaded: strategy=${config.strategy}, base=${config.baseBranch || 'none'}`
      )

      // Step 2: Setup VCS via strategy (leverages SetupGit tactic)
      const vcs = Vcs.strategise(config)
      const gitSetup = await vcs.setup({
        shouldCreateBranch: config.shouldCreateBranch,
        branchTemplate: config.branchTemplate,
      })
      this.tempRef = gitSetup.tempRef
      this.branchTemplate = gitSetup.branchTemplate

      // Step 3: Load root package and initialize services
      const { pkg: rootPkg } = await findRootPackage()
      const packageManager = await this.detectPackageManager()
      const gitStrategy = vcs as unknown as GitOperationStrategy

      core.info(`📦 Package manager: ${packageManager.name}`)
      core.info(`🔧 Git strategy: ${gitStrategy.name}`)

      // Step 4: Initialize services
      const versionBumpService = new VersionBumpService(gitStrategy, packageManager)
      const summaryService = new SummaryService()

      // Step 5: Discover and process packages
      const packages = await createWorkspacePackages(rootPkg)
      core.info(`📁 Discovered ${packages.length} packages`)

      // Step 6: Execute version bump process
      const results = await versionBumpService.processWorkspace(packages, rootPkg, config)

      this.hasBumped = results.hasBumped

      // Step 7: Create tag for root package if version is greater than latest tag and we're not branching
      if (!config.shouldCreateBranch) {
        const rootPackageName = rootPkg.name || 'root'
        const currentVersion = results.bumped[rootPackageName]?.version || rootPkg.version
        const isPrerelease = currentVersion.includes('-')

        // Only tag if this is a new version (greater than latest tag)
        const shouldTag = await this.shouldCreateTag(
          currentVersion,
          isPrerelease,
          config.tagPrereleases
        )
        if (shouldTag) {
          await gitStrategy.tagVersion(currentVersion, isPrerelease, true)
        }
      }

      // Step 8: Generate comprehensive summary
      await summaryService.generateSummary(results, config)

      // Step 9: Handle success
      if (this.hasBumped) {
        core.info('✅ Version bump action completed successfully with changes')
        core.notice(`Version bump completed: ${results.totalPackages} packages updated`)
      } else {
        core.info('✅ Version bump action completed successfully with no changes needed')
        core.notice(`No version changes needed with strategy '${config.strategy}'`)
      }

      // Set outputs for GitHub Actions
      this.setActionOutputs(results, config)
    } catch (error) {
      this.handleError(error)
    } finally {
      await this.finalize()
    }
  }

  /**
   * Parse and validate action configuration from inputs.
   */
  private async parseConfiguration(): Promise<ActionConfiguration> {
    const configService = new ConfigurationService()
    return await configService.parseConfiguration()
  }

  /**
   * Handle errors that occur during execution.
   */
  private handleError(error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error)
    core.error(`❌ Version bump failed: ${errorMessage}`)
    core.setFailed(errorMessage)
    this.exitCode = 1
  }

  /**
   * Finalize the process by pushing changes if any were made.
   */
  private async finalize(): Promise<void> {
    if (this.hasBumped) {
      try {
        // If we have a temp ref, create the proper versioned branch name
        if (this.tempRef && this.branchTemplate) {
          // Get the final root package version to create the branch name
          const { promises: fs } = await import('fs')
          const rootPkgContent = await fs.readFile('package.json', 'utf-8')
          const rootPkg = JSON.parse(rootPkgContent)
          const versionedBranch = interpolateTemplate(this.branchTemplate, {
            version: rootPkg.version,
          })

          core.info(`[git] Creating versioned branch: ${versionedBranch}`)
          // Create branch ref from temp ref and push
          try {
            await this.git.raw('update-ref', `refs/heads/${versionedBranch}`, this.tempRef)
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e)
            core.warning(`[git] Failed to create branch ref from temp ref: ${msg}`)
          }
          await this.git.push('origin', versionedBranch, ['--set-upstream', '--force'])
          core.setOutput('branch', versionedBranch)
        } else {
          // Fallback for when no temp ref was created
          if (this.outputBranch) {
            await this.git.push('origin', this.outputBranch, ['--set-upstream'])
          } else {
            await this.git.push()
          }
          if (this.outputBranch) {
            core.setOutput('branch', this.outputBranch)
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        core.error(`Failed to push changes: ${errorMessage}`)
        core.setFailed(`Failed to push changes: ${errorMessage}`)
        this.exitCode = 1
      }
    } else {
      core.info('📝 No changes to push')

      // Push tags even when no commits were made (when not creating branches)
      if (!this.outputBranch) {
        try {
          core.info(`[git] Pushing tags only`)
          await this.git.pushTags()
          core.info(`[git] Successfully pushed tags`)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          core.warning(`Failed to push tags: ${errorMessage}`)
        }
      }
    }

    // Clean up the temporary ref if it was created
    if (this.tempRef) {
      try {
        core.info(`[git] Cleaning up temporary ref ${this.tempRef}`)
        await this.git.raw('update-ref', '-d', this.tempRef)
        core.debug(`[git] Successfully deleted temporary ref ${this.tempRef}`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        // Ref not existing during cleanup is expected
        if (!errorMessage.includes('not found') && !errorMessage.includes('does not exist')) {
          core.warning(`Failed to delete temporary ref ${this.tempRef}: ${errorMessage}`)
        } else {
          core.debug(`[git] Temporary ref ${this.tempRef} already cleaned up`)
        }
      }
    }

    // Write summary to GitHub Actions (only if in GitHub Actions environment)
    if (process.env.GITHUB_STEP_SUMMARY) {
      await core.summary.write({ overwrite: true })
    }

    // Exit with appropriate code
    process.exit(this.exitCode)
  }

  /**
   * Set GitHub Actions outputs based on results.
   */
  private setActionOutputs(results: any, config: ActionConfiguration): void {
    core.setOutput('packages-updated', results.totalPackages)
    core.setOutput('releases-created', results.releasePackages)
    core.setOutput('prereleases-created', results.prereleasePackages)
    core.setOutput('versions-finalized', results.finalizedPackages)
    core.setOutput('test-failures', results.testFailures?.length || 0)
    core.setOutput('strategy-used', config.strategy)
    core.setOutput('changes-made', this.hasBumped)

    // Export useful environment variables
    core.exportVariable('VERSION_BUMP_PACKAGES_UPDATED', results.totalPackages)
    core.exportVariable('VERSION_BUMP_CHANGES_MADE', this.hasBumped)
    core.exportVariable('VERSION_BUMP_STRATEGY', config.strategy)
  }

  /**
   * Determine if we should create a tag for the current version.
   */
  private async shouldCreateTag(
    currentVersion: string,
    isPrerelease: boolean,
    tagPrereleases: boolean
  ): Promise<boolean> {
    try {
      // Get latest tag
      const tags = await this.git.tags(['--sort=-v:refname'])
      const latestTag = tags.latest

      if (!latestTag) {
        // No tags exist, so this is the first version
        return !isPrerelease || tagPrereleases
      }

      // Compare current version with latest tag
      const latestVersion = latestTag.replace(/^v/, '')
      const semver = (await import('semver')).default

      if (semver.gt(currentVersion, latestVersion)) {
        // Current version is greater than latest tag
        return !isPrerelease || tagPrereleases
      }

      return false
    } catch (error) {
      core.warning(`Failed to check if should create tag: ${error}`)
      return false
    }
  }

  // Minimal package manager detection and implementation
  private async detectPackageManager(): Promise<PackageManagerStrategy> {
    const cwd = process.cwd()
    const exists = async (p: string) => {
      try {
        await access(p)
        return true
      } catch {
        return false
      }
    }

    type PM = 'pnpm' | 'yarn' | 'npm'
    let pm: PM = 'npm'
    if (await exists(path.join(cwd, 'pnpm-lock.yaml'))) pm = 'pnpm'
    else if (await exists(path.join(cwd, 'yarn.lock'))) pm = 'yarn'
    else if (await exists(path.join(cwd, 'package-lock.json'))) pm = 'npm'

    const run = (cmd: string, dir: string) =>
      execSync(cmd, { cwd: dir, stdio: 'pipe', encoding: 'utf-8', timeout: 120_000 })

    const strategy: PackageManagerStrategy = {
      name: pm,
      isAvailable: () => true,
      async test(packageDir: string) {
        try {
          const cmd = pm === 'pnpm' ? 'pnpm test' : pm === 'yarn' ? 'yarn test' : 'npm test'
          run(cmd, packageDir)
          return { success: true }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          return { success: false, error: msg }
        }
      },
      async install(packageDir: string) {
        const cmd =
          pm === 'pnpm'
            ? 'pnpm install --frozen-lockfile'
            : pm === 'yarn'
            ? 'yarn install --frozen-lockfile'
            : 'npm ci'
        execSync(cmd, { cwd: packageDir, stdio: 'inherit', timeout: 300_000 })
      },
    }
    core.info(`📦 Package manager: ${strategy.name}`)
    return strategy
  }

  // (unused) legacy git operation strategy left intentionally removed
}

/**
 * Application entry point.
 * Creates and runs the version bump application.
 */
async function main(): Promise<void> {
  const app = new VersionBumpApplication()
  await app.run()
}

// Run the application if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error)
    process.exit(1)
  })
}

export { VersionBumpApplication, main }
export default main

import 'source-map-support/register'
import * as core from '@actions/core'
import { promises as fs } from 'fs'
import type { ActionConfiguration } from '@types'
import { findRootPackage, createWorkspacePackages } from './utils/workspace.js'
import { ConfigurationService } from './services/configuration.js'
import { SimpleGit } from './adapters/Git/SimpleGit.js'
import { GitHubActions as GitHubActionsConfigAdapter } from './adapters/Config/GitHubActions.js'
import { interpolateTemplate } from './utils/template.js'
import { main as mainObjective } from './objectives/Main/objective.js'

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

      // Step 2: Load root package and discover packages
      const { pkg: rootPkg } = await findRootPackage()
      const packages = await createWorkspacePackages(rootPkg)
      core.info(`📁 Discovered ${packages.length} packages`)

      // Step 3: Execute main action using Main objective
      const actionStrategy = mainObjective.strategise(config)
      const actionResult = await actionStrategy.performAction({
        packages,
        rootPkg,
      })

      this.hasBumped = actionResult.results.hasBumped
      this.tempRef = actionResult.gitSetup.tempRef
      this.branchTemplate = actionResult.gitSetup.branchTemplate

      // Step 4: Handle success
      if (this.hasBumped) {
        core.info('✅ Action completed successfully with changes')
        core.notice(`Action completed: ${actionResult.results.totalPackages} packages updated`)
      } else {
        core.info('✅ Action completed successfully with no changes needed')
        core.notice(`No version changes needed with strategy '${config.strategy}'`)
      }

      // Set outputs for GitHub Actions
      this.setActionOutputs(actionResult.results, config)
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
    const configAdapter = new GitHubActionsConfigAdapter()
    const configService = new ConfigurationService(configAdapter)
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

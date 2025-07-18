import 'source-map-support/register';
import * as core from '@actions/core';
import type { ActionConfiguration, PackageJson } from './types/index.js';
import { validateConfiguration } from './utils/validation.js';
import { setupGit, pushChanges } from './utils/git.js';
import { findRootPackage, createWorkspacePackages } from './utils/workspace.js';
import { GitOperationStrategyFactory } from './strategies/git-operations/factory.js';
import { PackageManagerFactory } from './strategies/package-managers/factory.js';
import { ConfigurationService } from './services/configuration.js';
import { VersionBumpService } from './services/version-bump.js';
import { SummaryService } from './services/summary.js';

/**
 * Main application class that orchestrates the version bump process.
 * Follows clean architecture principles with proper separation of concerns.
 */
class VersionBumpApplication {
  private exitCode = 0;
  private outputBranch: string | undefined;
  private hasBumped = false;

  /**
   * Run the complete version bump process.
   */
  public async run(): Promise<void> {
    try {
      core.info('🚀 Starting version bump action...');
      
      // Step 1: Parse and validate configuration
      const config = await this.parseConfiguration();
      core.info(`📋 Configuration loaded: strategy=${config.strategy}, base=${config.baseBranch || 'none'}`);

      // Step 2: Setup git and determine branches
      const gitSetup = await setupGit(config.shouldCreateBranch, config.branchTemplate);
      this.outputBranch = gitSetup.newBranch;

      // Step 3: Load root package and initialize services
      const { pkg: rootPkg, path: rootPath } = await findRootPackage();
      const packageManager = PackageManagerFactory.getPackageManager();
      const gitStrategy = GitOperationStrategyFactory.getStrategy('conventional');
      
      core.info(`📦 Package manager: ${packageManager.name}`);
      core.info(`🔧 Git strategy: ${gitStrategy.name}`);

      // Step 4: Initialize services
      const versionBumpService = new VersionBumpService(gitStrategy, packageManager);
      const summaryService = new SummaryService();

      // Step 5: Discover and process packages
      const packages = await createWorkspacePackages(rootPkg);
      core.info(`📁 Discovered ${packages.length} packages`);

      // Step 6: Execute version bump process
      const results = await versionBumpService.processWorkspace(
        packages,
        rootPkg,
        config
      );

      this.hasBumped = results.hasBumped;

      // Step 7: Generate comprehensive summary
      await summaryService.generateSummary(results, config);

      // Step 8: Handle success
      if (this.hasBumped) {
        core.info('✅ Version bump action completed successfully with changes');
        core.notice(`Version bump completed: ${results.totalPackages} packages updated`);
      } else {
        core.info('✅ Version bump action completed successfully with no changes needed');
        core.notice(`No version changes needed with strategy '${config.strategy}'`);
      }

      // Set outputs for GitHub Actions
      this.setActionOutputs(results, config);

    } catch (error) {
      this.handleError(error);
    } finally {
      await this.finalize();
    }
  }

  /**
   * Parse and validate action configuration from inputs.
   */
  private async parseConfiguration(): Promise<ActionConfiguration> {
    const configService = new ConfigurationService();
    return await configService.parseConfiguration();
  }

  /**
   * Handle errors that occur during execution.
   */
  private handleError(error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.error(`❌ Version bump failed: ${errorMessage}`);
    core.setFailed(errorMessage);
    this.exitCode = 1;
  }

  /**
   * Finalize the process by pushing changes if any were made.
   */
  private async finalize(): Promise<void> {
    if (this.hasBumped) {
      try {
        await pushChanges(this.outputBranch);
        if (this.outputBranch) {
          core.setOutput('branch', this.outputBranch);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        core.error(`Failed to push changes: ${errorMessage}`);
        core.setFailed(`Failed to push changes: ${errorMessage}`);
        this.exitCode = 1;
      }
    } else {
      core.info('📝 No changes to push');
    }

    // Write summary to GitHub Actions
    await core.summary.write({ overwrite: true });
    
    // Exit with appropriate code
    process.exit(this.exitCode);
  }

  /**
   * Set GitHub Actions outputs based on results.
   */
  private setActionOutputs(results: any, config: ActionConfiguration): void {
    core.setOutput('packages-updated', results.totalPackages);
    core.setOutput('releases-created', results.releasePackages);
    core.setOutput('prereleases-created', results.prereleasePackages);
    core.setOutput('versions-finalized', results.finalizedPackages);
    core.setOutput('test-failures', results.testFailures?.length || 0);
    core.setOutput('strategy-used', config.strategy);
    core.setOutput('changes-made', this.hasBumped);

    // Export useful environment variables
    core.exportVariable('VERSION_BUMP_PACKAGES_UPDATED', results.totalPackages);
    core.exportVariable('VERSION_BUMP_CHANGES_MADE', this.hasBumped);
    core.exportVariable('VERSION_BUMP_STRATEGY', config.strategy);
  }
}

/**
 * Application entry point.
 * Creates and runs the version bump application.
 */
async function main(): Promise<void> {
  const app = new VersionBumpApplication();
  await app.run();
}

// Run the application if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { VersionBumpApplication, main };
export default main;
import * as core from '@actions/core'
import type {
  SummaryOutputGoals,
  SummaryOutputConfig,
  ActionConfiguration,
  VersionBumpResults,
  StrategyOf,
} from '@types'
import type { LoggingAdapter } from '../../../adapters/Logging/LoggingAdapter.js'

/**
 * GitHub Actions summary strategy.
 * Generates rich markdown summaries for GitHub Actions environments.
 */
export class GitHubActions implements StrategyOf<SummaryOutputGoals> {
  readonly name = 'github-actions'
  readonly description = 'GitHub Actions markdown summary'

  constructor(
    _config: SummaryOutputConfig,
    private readonly logger: LoggingAdapter
  ) {}

  /**
   * Generate GitHub Actions summary with detailed tables.
   */
  public async generateSummary(
    results: VersionBumpResults,
    config: ActionConfiguration
  ): Promise<void> {
    core.summary.addHeading('📦 Version Bump Summary', 2)

    if (results.totalPackages > 0) {
      // Package changes table
      core.summary.addTable([
        [
          { data: 'Package', header: true },
          { data: 'Version', header: true },
          { data: 'Bump Type', header: true },
          { data: 'Previous Commit', header: true },
          { data: 'Status', header: true },
        ],
        ...Object.entries(results.bumped).map(([name, result]) => [
          { data: name },
          { data: result.version },
          { data: this.formatBumpType(result.bumpType) },
          { data: result.sha?.slice(0, 7) || 'N/A' },
          { data: results.testFailures.includes(name) ? '❌ Failed' : '✅ Success' },
        ]),
      ])
    } else {
      core.summary.addRaw('✨ No packages required version changes.')
    }

    // Configuration summary
    core.summary.addHeading('⚙️ Configuration Used', 3)
    core.summary.addList([
      `**Strategy**: ${config.strategy}`,
      `**Active Branch**: ${config.activeBranch}`,
      `**Base Branch**: ${config.baseBranch || 'none (tag-based)'}`,
      `**Tag Prereleases**: ${config.tagPrereleases ? 'enabled' : 'disabled'}`,
      `**Create Branch**: ${config.shouldCreateBranch ? 'enabled' : 'disabled'}`,
      `**Branch Cleanup**: ${config.branchCleanup}`,
    ])

    // Statistics summary
    core.summary.addHeading('📊 Statistics', 3)
    core.summary.addList([
      `**Total Packages Processed**: ${results.totalPackages}`,
      `**Release Versions**: ${results.releasePackages}`,
      `**Prerelease Versions**: ${results.prereleasePackages}`,
      `**Finalized Versions**: ${results.finalizedPackages}`,
      `**Test Failures**: ${results.testFailures.length}`,
    ])

    // Add recommendations if any
    this.addRecommendations(results, config)

    // Generate operational logging and notices
    this.logResultsSummary(results, config)
    this.generateNotices(results, config)
  }

  /**
   * Log summary to console for debugging.
   */
  private logResultsSummary(results: VersionBumpResults, config: ActionConfiguration): void {
    this.logger.startGroup('📊 Results Summary')

    if (results.totalPackages > 0) {
      this.logger.info(`✅ Processed ${results.totalPackages} packages:`)
      this.logger.info(`   • ${results.releasePackages} release versions`)
      this.logger.info(`   • ${results.prereleasePackages} prerelease versions`)
      this.logger.info(`   • ${results.finalizedPackages} finalized versions`)

      if (results.testFailures.length > 0) {
        this.logger.warning(
          `⚠️  ${results.testFailures.length} packages failed tests: ${results.testFailures.join(
            ', '
          )}`
        )
      }
    } else {
      this.logger.info(`ℹ️  No packages required version changes with strategy '${config.strategy}'`)
    }

    this.logger.endGroup()
  }

  /**
   * Generate GitHub Actions notices based on results.
   */
  private generateNotices(results: VersionBumpResults, config: ActionConfiguration): void {
    if (results.totalPackages > 0) {
      const releaseCount = results.releasePackages
      const prereleaseCount = results.prereleasePackages

      if (releaseCount > 0 && prereleaseCount > 0) {
        this.logger.notice(
          `🚀 Version bump completed: ${releaseCount} releases and ${prereleaseCount} prereleases created`
        )
      } else if (releaseCount > 0) {
        this.logger.notice(
          `🚀 Version bump completed: ${releaseCount} release${
            releaseCount === 1 ? '' : 's'
          } created`
        )
      } else if (prereleaseCount > 0) {
        this.logger.notice(
          `🧪 Version bump completed: ${prereleaseCount} prerelease${
            prereleaseCount === 1 ? '' : 's'
          } created`
        )
      }

      if (results.testFailures.length > 0) {
        this.logger.warning(
          `⚠️ ${results.testFailures.length} package${
            results.testFailures.length === 1 ? '' : 's'
          } failed compatibility tests`
        )
      }
    } else {
      this.logger.notice(`ℹ️ No version changes needed with strategy '${config.strategy}'`)
    }
  }

  /**
   * Add recommendations section to summary.
   */
  private addRecommendations(results: VersionBumpResults, config: ActionConfiguration): void {
    const recommendations: string[] = []

    // Strategy recommendations
    if (config.strategy === 'do-nothing' && results.totalPackages === 0) {
      recommendations.push(
        'Consider using `apply-bump` strategy if you want to apply version bumps'
      )
    }

    if (config.strategy === 'pre-release' && !config.baseBranch) {
      recommendations.push('Set a base branch to enable prerelease finalization')
    }

    // Test failure recommendations
    if (results.testFailures.length > 0) {
      recommendations.push(
        'Review test failures and consider pinning dependency versions for compatibility'
      )
    }

    // Branch management recommendations
    if (config.branchCleanup === 'keep' && results.totalPackages > 0 && config.shouldCreateBranch) {
      recommendations.push(
        'Consider using `prune` or `semantic` branch cleanup to keep workspace clean'
      )
    }

    if (recommendations.length > 0) {
      core.summary.addHeading('💡 Recommendations', 3)
      core.summary.addList(recommendations)
    }
  }

  /**
   * Format bump type with emoji for better readability.
   */
  private formatBumpType(bumpType: string): string {
    switch (bumpType) {
      case 'major':
        return '🔴 major'
      case 'minor':
        return '🟡 minor'
      case 'patch':
        return '🟢 patch'
      case 'prerelease':
        return '🧪 prerelease'
      case 'release':
        return '🚀 release'
      default:
        return bumpType
    }
  }
}

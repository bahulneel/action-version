import * as core from '@actions/core'
import type { ActionConfiguration, VersionBumpResults } from '../../types/index.js'
import { BaseSummaryStrategy } from './base.js'

/**
 * Console summary strategy.
 * Generates console-based summaries for non-GitHub Actions environments.
 */
export class ConsoleSummaryStrategy extends BaseSummaryStrategy {
  constructor() {
    super('console')
  }

  /**
   * Generate console-based summary for non-GitHub Actions environments.
   */
  public async generateSummary(
    results: VersionBumpResults,
    config: ActionConfiguration
  ): Promise<void> {
    core.info('📦 Version Bump Summary')
    core.info('='.repeat(50))

    if (results.totalPackages > 0) {
      core.info('Package Changes:')
      Object.entries(results.bumped).forEach(([name, result]) => {
        const status = results.testFailures.includes(name) ? '❌ Failed' : '✅ Success'
        core.info(
          `  ${name}: ${result.version} (${this.formatBumpType(result.bumpType)}) - ${status}`
        )
      })
    } else {
      core.info('✨ No packages required version changes.')
    }

    core.info('\n⚙️ Configuration Used:')
    core.info(`  Strategy: ${config.strategy}`)
    core.info(`  Active Branch: ${config.activeBranch}`)
    core.info(`  Base Branch: ${config.baseBranch || 'none (tag-based)'}`)
    core.info(`  Tag Prereleases: ${config.tagPrereleases ? 'enabled' : 'disabled'}`)
    core.info(`  Create Branch: ${config.shouldCreateBranch ? 'enabled' : 'disabled'}`)
    core.info(`  Branch Cleanup: ${config.branchCleanup}`)

    core.info('\n📊 Statistics:')
    core.info(`  Total Packages Processed: ${results.totalPackages}`)
    core.info(`  Release Versions: ${results.releasePackages}`)
    core.info(`  Prerelease Versions: ${results.prereleasePackages}`)
    core.info(`  Finalized Versions: ${results.finalizedPackages}`)
    core.info(`  Test Failures: ${results.testFailures.length}`)

    // Add recommendations
    this.addConsoleRecommendations(results, config)
  }

  /**
   * Add console-based recommendations for non-GitHub Actions environments.
   */
  private addConsoleRecommendations(
    results: VersionBumpResults,
    config: ActionConfiguration
  ): void {
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
    if (config.branchCleanup === 'keep' && results.totalPackages > 0) {
      recommendations.push(
        'Consider using `prune` or `semantic` branch cleanup to keep workspace clean'
      )
    }

    if (recommendations.length > 0) {
      core.info('\n💡 Recommendations:')
      recommendations.forEach((rec: string) => core.info(`  • ${rec}`))
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

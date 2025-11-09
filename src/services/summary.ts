import * as core from '@actions/core'
import type { ActionConfiguration } from '@types'
import type { VersionBumpResults } from './version-bump.js'
import { summaryOutput } from '../objectives/index.js'

/**
 * Service responsible for generating comprehensive summaries and reports.
 * Handles GitHub Actions summary creation and output generation.
 */
export class SummaryService {
  constructor(private readonly config: ActionConfiguration) {}

  /**
   * Generate comprehensive summary for the version bump process.
   */
  public async generateSummary(
    results: VersionBumpResults,
    config: ActionConfiguration
  ): Promise<void> {
    // Get the appropriate summary strategy from objective
    const strategy = summaryOutput.strategise(this.config)

    // Generate summary using the strategy
    await strategy.generateSummary(results, config)

    // Generate additional outputs
    this.logResultsSummary(results, config)
    this.generateNotices(results, config)
  }

  /**
   * Log summary to console for debugging.
   */
  private logResultsSummary(results: VersionBumpResults, config: ActionConfiguration): void {
    core.startGroup('📊 Results Summary')

    if (results.totalPackages > 0) {
      core.info(`✅ Processed ${results.totalPackages} packages:`)
      core.info(`   • ${results.releasePackages} release versions`)
      core.info(`   • ${results.prereleasePackages} prerelease versions`)
      core.info(`   • ${results.finalizedPackages} finalized versions`)

      if (results.testFailures.length > 0) {
        core.warning(
          `⚠️  ${results.testFailures.length} packages failed tests: ${results.testFailures.join(
            ', '
          )}`
        )
      }
    } else {
      core.info(`ℹ️  No packages required version changes with strategy '${config.strategy}'`)
    }

    core.endGroup()
  }

  /**
   * Generate GitHub Actions notices based on results.
   */
  private generateNotices(results: VersionBumpResults, config: ActionConfiguration): void {
    if (results.totalPackages > 0) {
      const releaseCount = results.releasePackages
      const prereleaseCount = results.prereleasePackages

      if (releaseCount > 0 && prereleaseCount > 0) {
        core.notice(
          `🚀 Version bump completed: ${releaseCount} releases and ${prereleaseCount} prereleases created`
        )
      } else if (releaseCount > 0) {
        core.notice(
          `🚀 Version bump completed: ${releaseCount} release${
            releaseCount === 1 ? '' : 's'
          } created`
        )
      } else if (prereleaseCount > 0) {
        core.notice(
          `🧪 Version bump completed: ${prereleaseCount} prerelease${
            prereleaseCount === 1 ? '' : 's'
          } created`
        )
      }

      if (results.testFailures.length > 0) {
        core.warning(
          `⚠️ ${results.testFailures.length} package${
            results.testFailures.length === 1 ? '' : 's'
          } failed compatibility tests`
        )
      }
    } else {
      core.notice(`ℹ️ No version changes needed with strategy '${config.strategy}'`)
    }
  }
}

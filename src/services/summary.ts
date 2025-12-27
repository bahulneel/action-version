import type { ActionConfiguration } from '@types'
import type { VersionBumpResults } from './version-bump.js'
import { summaryOutput } from '../objectives/index.js'

/**
 * Service responsible for generating comprehensive summaries and reports.
 * Thin orchestrator that delegates to SummaryOutput objective.
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

    // Generate summary using the strategy (includes all logging and notices)
    await strategy.generateSummary(results, config)
  }
}

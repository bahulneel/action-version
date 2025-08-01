import type { SummaryStrategy, ActionConfiguration, VersionBumpResults } from '../../types/index.js'

/**
 * Abstract base class for summary strategies.
 * Implements the Strategy pattern for handling different summary generation approaches.
 */
export abstract class BaseSummaryStrategy implements SummaryStrategy {
  public readonly name: string

  protected constructor(name: string) {
    this.name = name
  }

  /**
   * Generate summary for the version bump process.
   * @param results - The version bump results
   * @param config - The action configuration
   */
  public abstract generateSummary(
    results: VersionBumpResults,
    config: ActionConfiguration
  ): Promise<void>
}

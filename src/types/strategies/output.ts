import type { ActionConfiguration, SummaryStrategyType } from '../index.js'

/**
 * Summary strategy interface.
 * Handles different approaches to generating and displaying results.
 */
export interface Summary {
  readonly name: string
  generateSummary(results: any, config: ActionConfiguration): Promise<void>
}

/**
 * Configuration for summary strategy selection.
 */
export interface SummaryConfig {
  readonly strategy: SummaryStrategyType
}

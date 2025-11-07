import type { ActionConfiguration, SummaryStrategyType } from '../index.js'
import type { Strategy } from '../strategy.js'
/**
 * Summary strategy interface.
 * Handles different approaches to generating and displaying results.
 */
export interface Summary extends Strategy {
  generateSummary(results: any, config: ActionConfiguration): Promise<void>
}

// Backwards-compatible alias for legacy naming used across summary strategy
export type SummaryStrategy = Summary

/**
 * Configuration for summary strategy selection.
 */
export interface SummaryConfig {
  readonly strategy: SummaryStrategyType
}

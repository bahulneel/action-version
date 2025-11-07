/**
 * Objective interface for config-to-strategy resolution.
 *
 * Objectives act as the bridge between configuration and strategy implementation.
 * They satisfy the contract: Config → Objective → Strategy
 */
export interface Objective<TConfig, TStrategy> {
  strategise(config: TConfig): TStrategy
}

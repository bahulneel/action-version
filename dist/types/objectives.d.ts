/**
 * Objective interface for config-to-strategy resolution.
 *
 * Objectives act as the bridge between configuration and strategy implementation.
 * They satisfy the contract: Config → Objective → Strategy
 */
export interface Objective<Config, Strategy> {
    strategise(config: Config): Strategy;
}
//# sourceMappingURL=objectives.d.ts.map
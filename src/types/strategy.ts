export interface Strategy {
  readonly name: string
  readonly description?: string
}

export interface StrategyFactory<T> {
  getStrategy(name: string): T
  getAvailableStrategies(): readonly string[]
}

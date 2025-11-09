export interface Strategy {
  readonly name: string
  readonly description?: string
}

// Helper type for strategies that satisfy a Goals interface
export type StrategyOf<Goals> = { name: string } & Goals

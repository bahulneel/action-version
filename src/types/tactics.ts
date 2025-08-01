/**
 * Base result from a tactic execution.
 * Only reports what happened - doesn't dictate strategy behavior.
 */
export interface TacticResult<T = any, C = any> {
  applied: boolean // Did the tactic attempt to execute?
  success: boolean // If applied, did it succeed?
  result?: T // The actual result if successful
  context?: Partial<C> // Updated context information
  message?: string // Descriptive message about what happened
}

/**
 * Interface that all tactics must implement.
 */
export interface Tactic<T, C> {
  name: string
  assess(context: C): boolean
  attempt(context: C): Promise<TacticResult<T, C>>
}

/**
 * Interface for a tactical plan.
 */
export interface TacticalPlanInterface<T, C> {
  description?: string | undefined
  execute(context: C): Promise<T>
}

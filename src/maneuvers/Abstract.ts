import type { Tactic, Maneuver as ManeuverInterface, TacticResult, ManeuverResult } from '@types'

/**
 * Abstract base class for all maneuver types.
 * Defines the common interface and structure for executing tactics.
 */
export abstract class AbstractManeuver<T, C> implements ManeuverInterface<T, C> {
  public readonly name: string
  public readonly description?: string

  constructor(protected readonly tactics: Tactic<T, C>[], name: string, description?: string) {
    this.name = name
    if (description) {
      this.description = description
    }
  }

  /**
   * Execute this maneuver according to its execution strategy.
   * Must be implemented by concrete maneuver types.
   */
  abstract execute(context: C): Promise<ManeuverResult<T, C>>

  /**
   * Helper to execute a single tactic and handle its result.
   */
  protected async executeTactic(tactic: Tactic<T, C>, context: C): Promise<TacticResult<T, C>> {
    // Assess if this tactic is applicable
    if (!tactic.assess(context)) {
      return {
        applied: false,
        success: false,
        message: 'Not applicable to this context',
      }
    }

    try {
      const result = await tactic.attempt(context)

      // Update context with any new information
      if (result.context && typeof context === 'object' && context !== null) {
        Object.assign(context, result.context)
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        applied: true,
        success: false,
        message: `Error: ${errorMessage}`,
      }
    }
  }
}

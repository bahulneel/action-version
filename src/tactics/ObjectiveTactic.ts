import * as core from '@actions/core'
import type { Tactic, TacticResult } from '../types/tactics.js'
import type { Strategy } from '../types/strategies/index.js'
import type { Objective } from '../types/objectives.js'

/**
 * A tactical objective - coordinates a strategy to fulfill an objective through tactical execution.
 *
 * Takes config and strategic command name to attempt strategic fulfillment.
 */
export class ObjectiveTactic<T, C, TConfig, TStrategy extends Strategy> implements Tactic<T, C> {
  public readonly name: string
  private readonly strategy: TStrategy

  constructor(
    private objective: Objective<TConfig, TStrategy>,
    private config: TConfig,
    private strategicCommandName: Exclude<keyof TStrategy, 'name'> & string,
    name?: string
  ) {
    this.strategy = this.objective.strategise(this.config)
    this.name = name || `ObjectiveTactic(${this.strategy.name}.${this.strategicCommandName})`
  }

  /**
   * Assess if this tactical objective is applicable.
   */
  public assess(_context: C): boolean {
    // A tactical objective is always applicable - the strategy will handle specifics
    return true
  }

  /**
   * Attempt this tactical objective by attempting strategic fulfillment.
   */
  public async attempt(context: C): Promise<TacticResult<T, C>> {
    try {
      core.debug(`🎯 Attempting tactical objective: ${this.name}`)
      core.debug(`📋 Using strategy: ${this.strategy.name}`)
      core.debug(`🎯 Strategic command: ${this.strategicCommandName}`)

      // Call the strategic command directly on the strategy
      const strategicMethod = this.strategy[this.strategicCommandName] as Function
      const result = await strategicMethod.call(this.strategy, context)

      core.info(`✅ ${this.name}: Strategic command executed`)
      return {
        applied: true,
        success: true,
        result,
        message: `Strategic command ${this.strategicCommandName} executed successfully`,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      core.debug(`❌ ${this.name}: Error - ${errorMessage}`)

      return {
        applied: true,
        success: false,
        message: `Strategic command failed: ${errorMessage}`,
      }
    }
  }
}

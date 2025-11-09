import type { Tactic } from '@types'
import { OneManeuver } from '~/maneuvers/One.js'
import { AnyManeuver } from '~/maneuvers/Any.js'
import { AllManeuver } from '~/maneuvers/All.js'

/**
 * Maneuver factory for creating different execution strategies.
 */
export const maneuver = {
  /**
   * One: Execute tactics in sequence until one succeeds (fallback behavior).
   * If a tactic fails, tries the next one.
   */
  one: <T, C>(tactics: Tactic<T, C>[], name: string, description?: string) =>
    new OneManeuver(tactics, name, description),

  /**
   * Any: Execute first matching (assessed) tactic.
   * Does not retry on failure - assessment determines which tactic runs.
   */
  any: <T, C>(tactics: Tactic<T, C>[], name: string, description?: string) =>
    new AnyManeuver(tactics, name, description),

  /**
   * All: Execute all applicable tactics and collect results.
   * Returns aggregated results with success/failure status for each.
   */
  all: <T, C>(tactics: Tactic<T, C>[], name: string, description?: string) =>
    new AllManeuver(tactics, name, description),
}

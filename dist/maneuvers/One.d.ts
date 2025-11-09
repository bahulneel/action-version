import type { ManeuverResult } from '@types';
import { AbstractManeuver } from './Abstract.js';
/**
 * One maneuver: runs tactics in sequence, returns on first success.
 * If a tactic fails, tries the next one (fallback behavior).
 */
export declare class OneManeuver<T, C> extends AbstractManeuver<T, C> {
    /**
     * Execute tactics in sequence until one succeeds.
     */
    execute(context: C): Promise<ManeuverResult<T, C>>;
}
//# sourceMappingURL=One.d.ts.map
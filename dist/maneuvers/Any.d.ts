import type { ManeuverResult } from '@types';
import { AbstractManeuver } from './Abstract.js';
/**
 * Any maneuver: runs first matching (assessed) tactic.
 * Does not retry on failure - uses assessment to choose the right tactic upfront.
 */
export declare class AnyManeuver<T, C> extends AbstractManeuver<T, C> {
    /**
     * Execute the first tactic that assesses as applicable.
     */
    execute(context: C): Promise<ManeuverResult<T, C>>;
}
//# sourceMappingURL=Any.d.ts.map
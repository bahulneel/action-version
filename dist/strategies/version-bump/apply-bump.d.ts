import type { BumpType } from '../../types/index.js';
import { BaseVersionBumpStrategy } from './base.js';
/**
 * Apply-bump strategy that performs normal semantic version increments.
 * This strategy will always apply the commit-based bump type.
 */
export declare class ApplyBumpStrategy extends BaseVersionBumpStrategy {
    constructor();
    execute(currentVersion: string, commitBasedBump: BumpType | null, historicalBump: BumpType | null): string | null;
}
//# sourceMappingURL=apply-bump.d.ts.map
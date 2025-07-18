import type { BumpType } from '../../types/index.js';
import { BaseVersionBumpStrategy } from './base.js';
/**
 * Do-nothing strategy that skips version bumps when the same bump type is detected.
 * This is useful when you want to prevent duplicate version bumps.
 */
export declare class DoNothingStrategy extends BaseVersionBumpStrategy {
    constructor();
    execute(currentVersion: string, commitBasedBump: BumpType | null, historicalBump: BumpType | null): string | null;
}
//# sourceMappingURL=do-nothing.d.ts.map
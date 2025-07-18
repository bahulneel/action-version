import type { BumpType } from '../../types/index.js';
import { BaseVersionBumpStrategy } from './base.js';
/**
 * Pre-release strategy that creates or increments prerelease versions.
 * Handles the complex logic of transitioning between regular and prerelease versions.
 */
export declare class PreReleaseStrategy extends BaseVersionBumpStrategy {
    constructor();
    execute(currentVersion: string, commitBasedBump: BumpType | null, historicalBump: BumpType | null): string | null;
}
//# sourceMappingURL=pre-release.d.ts.map
import type { BumpType, VersioningGoals, VersioningConfig } from '../../../types/index.js';
import type { StrategyOf } from '../../../types/strategy.js';
/**
 * Semver versioning strategy.
 * Implements semantic versioning with support for regular releases, prereleases, and finalization.
 */
export declare class Semver implements StrategyOf<VersioningGoals> {
    private readonly config;
    readonly name = "semver";
    readonly description = "Semantic versioning with prerelease support";
    constructor(config: VersioningConfig);
    /**
     * Bump version based on commit signals and strategy policy.
     */
    bumpVersion(currentVersion: string, commitBasedBump: BumpType | null, historicalBump: BumpType | null): string | null;
    /**
     * Compare two semantic versions.
     * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
     */
    compareVersion(v1: string, v2: string): number;
    /**
     * Do-nothing approach: always skip bumps.
     */
    private doNothingBump;
    /**
     * Apply-bump approach: perform normal semantic version increments.
     */
    private applyBump;
    /**
     * Pre-release approach: create or increment prerelease versions.
     */
    private preReleaseBump;
}
//# sourceMappingURL=Semver.d.ts.map
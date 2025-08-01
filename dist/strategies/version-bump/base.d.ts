import type { BumpType, VersionBumpStrategy } from '../../types/index.js';
/**
 * Abstract base class for version bump strategies.
 * Implements the Strategy pattern for handling different version bumping approaches.
 */
export declare abstract class BaseVersionBumpStrategy implements VersionBumpStrategy {
    readonly name: string;
    protected constructor(name: string);
    /**
     * Execute the version bump strategy.
     * @param currentVersion - The current version of the package
     * @param commitBasedBump - The bump type determined from commits
     * @param historicalBump - The bump type determined from version history
     * @returns The new version string or null if no bump should occur
     */
    abstract execute(currentVersion: string, commitBasedBump: BumpType | null, historicalBump: BumpType | null): string | null;
}
//# sourceMappingURL=base.d.ts.map
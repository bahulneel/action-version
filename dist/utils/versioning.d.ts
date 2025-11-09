import type { BumpType, StrategyName } from '@types';
/**
 * Get the next version based on current version, bump type, and strategy.
 */
export declare function getNextVersion(currentVersion: string, commitBasedBump: BumpType | null, _historicalBump: BumpType | null, strategy: StrategyName): string | null;
//# sourceMappingURL=versioning.d.ts.map
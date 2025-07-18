import type { BumpType, StrategyName } from '../types/index.js';
/**
 * Get the next version based on current version, bump types, and strategy.
 */
export declare function getNextVersion(currentVersion: string, commitBasedBump: BumpType | null, historicalBump: BumpType | null, strategyName?: StrategyName): string | null;
/**
 * Validate version string using semver.
 */
export declare function validateVersion(version: string): boolean;
/**
 * Compare two versions and return the relationship.
 */
export declare function compareVersions(version1: string, version2: string): -1 | 0 | 1;
/**
 * Check if a version satisfies a range specification.
 */
export declare function satisfiesRange(version: string, range: string): boolean;
/**
 * Get the major, minor, and patch components of a version.
 */
export declare function parseVersionComponents(version: string): {
    major: number;
    minor: number;
    patch: number;
    prerelease: readonly string[];
} | null;
/**
 * Create a clean version string from any input.
 */
export declare function cleanVersion(version: string): string;
/**
 * Check if a version is a prerelease.
 */
export declare function isPrerelease(version: string): boolean;
/**
 * Get the release version from a prerelease version.
 */
export declare function getReleaseVersion(version: string): string;
//# sourceMappingURL=versioning.d.ts.map
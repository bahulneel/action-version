import type { BumpType } from '../types/index.js';
/**
 * Guess the bump type based on version string patterns.
 * @param version - The version string to analyze
 * @returns The guessed bump type
 */
export declare function guessBumpType(version: string): BumpType;
/**
 * Initialize a version if it's missing or invalid.
 * @param version - The version to initialize
 * @returns A valid version string
 */
export declare function initializeVersion(version: string | undefined): string;
/**
 * Calculate the bump type between two versions.
 * @param fromVersion - The starting version
 * @param toVersion - The target version
 * @returns The bump type or null if no change
 */
export declare function calculateBumpType(fromVersion: string, toVersion: string): BumpType | null;
/**
 * Finalize a prerelease version by removing the prerelease suffix.
 * @param version - The prerelease version to finalize
 * @returns The finalized version
 */
export declare function finalizeVersion(version: string): string;
/**
 * Get the priority of a bump type for comparison.
 * @param bumpType - The bump type to get priority for
 * @returns Numeric priority (higher = more significant)
 */
export declare function bumpPriority(bumpType: BumpType | null): number;
/**
 * Get the most significant bump type from an array of bump types.
 * @param bumpTypes - Array of bump types to compare
 * @returns The most significant bump type
 */
export declare function getMostSignificantBumpType(bumpTypes: readonly (BumpType | null)[]): BumpType | null;
//# sourceMappingURL=version.d.ts.map
import type { BumpType } from '@types';
/**
 * Calculate the bump type between two versions.
 */
export declare function calculateBumpType(fromVersion: string, toVersion: string): BumpType | null;
/**
 * Finalize a prerelease version by removing the prerelease suffix.
 */
export declare function finalizeVersion(version: string): string;
/**
 * Get the most significant bump type from an array of bump types.
 */
export declare function getMostSignificantBumpType(bumpTypes: readonly (BumpType | null)[]): BumpType | null;
/**
 * Initialize a version if it's missing or invalid.
 */
export declare function initializeVersion(version: string | undefined): string;
//# sourceMappingURL=version.d.ts.map
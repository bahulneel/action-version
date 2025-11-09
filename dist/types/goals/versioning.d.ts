import type { BumpType } from '../index.js';
/**
 * Goals for versioning objective.
 */
export interface VersioningGoals {
    bumpVersion(currentVersion: string, commitBasedBump: BumpType | null, historicalBump: BumpType | null): string | null;
    compareVersion(v1: string, v2: string): number;
}
/**
 * Configuration for versioning strategy selection.
 */
export interface VersioningConfig {
    readonly approach: 'do-nothing' | 'apply-bump' | 'pre-release';
}
//# sourceMappingURL=versioning.d.ts.map
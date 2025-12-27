export * from './reference/branch-cleanup.js';
import type { ReferencePointResult } from '../index.js';
import type { Strategy } from '../strategy.js';
/**
 * Discovery strategy interface.
 * Handles different approaches to finding version reference points.
 */
export interface Discovery extends Strategy {
    readonly name: string;
    findReferencePoint(baseBranch: string | undefined, activeBranch: string): Promise<ReferencePointResult>;
}
/**
 * Configuration for discovery strategy selection.
 */
export interface DiscoveryConfig {
    readonly strategy: 'tag' | 'base-branch';
    readonly baseBranch?: string;
}
//# sourceMappingURL=reference.d.ts.map
import type { PackageJson } from '../index.js';
import type { Package } from '../../domain/package.js';
import type { VersionBumpResults } from '../../services/version-bump.js';
import type { ActionConfiguration, ReferencePointResult } from '../index.js';
/**
 * Goals for VersionBumping objective.
 */
export interface VersionBumpingGoals {
    processWorkspace(packages: Package[], rootPkg: PackageJson, referencePoint: ReferencePointResult, config: ActionConfiguration): Promise<VersionBumpResults>;
}
//# sourceMappingURL=version-bumping.d.ts.map
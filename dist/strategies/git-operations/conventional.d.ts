import type { BumpType } from '../../types/index.js';
import { BaseGitOperationStrategy } from './base.js';
/**
 * Conventional git strategy that uses conventional commit messages
 * and follows standard git practices for version management.
 */
export declare class ConventionalGitStrategy extends BaseGitOperationStrategy {
    constructor();
    commitVersionChange(packageDir: string, packageName: string, version: string, bumpType: BumpType, template: string): Promise<void>;
    commitDependencyUpdate(packageDir: string, packageName: string, depName: string, depVersion: string, template: string): Promise<void>;
    tagVersion(version: string, isPrerelease: boolean, shouldTag: boolean): Promise<void>;
}
//# sourceMappingURL=conventional.d.ts.map
import type { BumpType } from '../../types/index.js';
import { BaseGitOperationStrategy } from './base.js';
/**
 * Simple git strategy that uses minimal commit messages
 * and basic git operations for version management.
 */
export declare class SimpleGitStrategy extends BaseGitOperationStrategy {
    constructor();
    commitVersionChange(packageDir: string, packageName: string, version: string, _bumpType: BumpType, _template: string): Promise<void>;
    commitDependencyUpdate(packageDir: string, packageName: string, depName: string, _depVersion: string, _template: string): Promise<void>;
    tagVersion(version: string, _isPrerelease: boolean, shouldTag: boolean): Promise<void>;
}
//# sourceMappingURL=simple.d.ts.map
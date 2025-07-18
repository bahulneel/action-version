import type { GitOperationStrategy, BumpType } from '../../types/index.js';

/**
 * Abstract base class for git operation strategies.
 * Implements the Strategy pattern for handling different git operation approaches.
 */
export abstract class BaseGitOperationStrategy implements GitOperationStrategy {
  public readonly name: string;

  protected constructor(name: string) {
    this.name = name;
  }

  /**
   * Commit a version change for a package.
   * @param packageDir - The directory of the package
   * @param packageName - The name of the package
   * @param version - The new version
   * @param bumpType - The type of bump that occurred
   * @param template - The commit message template
   */
  public abstract commitVersionChange(
    packageDir: string,
    packageName: string,
    version: string,
    bumpType: BumpType,
    template: string
  ): Promise<void>;

  /**
   * Commit a dependency update for a package.
   * @param packageDir - The directory of the package
   * @param packageName - The name of the package
   * @param depName - The name of the dependency that was updated
   * @param depVersion - The new version of the dependency
   * @param template - The commit message template
   */
  public abstract commitDependencyUpdate(
    packageDir: string,
    packageName: string,
    depName: string,
    depVersion: string,
    template: string
  ): Promise<void>;

  /**
   * Create a git tag for a version.
   * @param version - The version to tag
   * @param isPrerelease - Whether this is a prerelease version
   * @param shouldTag - Whether tagging should actually occur
   */
  public abstract tagVersion(
    version: string,
    isPrerelease: boolean,
    shouldTag: boolean
  ): Promise<void>;
}
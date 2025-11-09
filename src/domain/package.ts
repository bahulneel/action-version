import * as core from '@actions/core'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import type {
  PackageJson,
  BumpResult,
  BumpType,
  StrategyName,
  TestResult,
  VcsInterface,
  PackageManager,
} from '../types/index.js'
import { DEPENDENCY_KEYS } from '../constants.js'
import { initializeVersion } from '../utils/version.js'
import { getNextVersion } from '../utils/versioning.js'
import { getCommitsAffecting } from '../utils/git.js'
import { getMostSignificantBump } from '../utils/commits.js'

/**
 * Represents a package in the workspace with its metadata and operations.
 * Encapsulates package-specific version management logic.
 */
export class Package {
  private _bumpResult: BumpResult | null = null

  constructor(
    public readonly name: string,
    public readonly dir: string,
    private _pkg: PackageJson,
    public readonly packageJsonPath: string
  ) {}

  /**
   * Get the current version of the package.
   */
  public get version(): string {
    return this._pkg.version
  }

  /**
   * Set the version of the package.
   */
  public set version(newVersion: string) {
    this._pkg.version = newVersion
  }

  /**
   * Get the package.json data.
   */
  public get pkg(): Readonly<PackageJson> {
    return this._pkg
  }

  /**
   * Get the relative path of the package directory.
   */
  public get relativePath(): string {
    return path.relative(process.cwd(), this.dir) || '/'
  }

  /**
   * Get the bump result if a version bump has occurred.
   */
  public get bumpResult(): BumpResult | null {
    return this._bumpResult
  }

  /**
   * Initialize the version if it's missing or invalid.
   */
  public initializeVersion(): void {
    if (!this._pkg.version) {
      this._pkg.version = initializeVersion(this._pkg.version)
      core.info(`[${this.name}] Initialized missing version to ${this._pkg.version}`)
    }
  }

  /**
   * Save the package.json file to disk.
   */
  public async save(): Promise<void> {
    await this.writeJSON(this.packageJsonPath, this._pkg)
  }

  /**
   * Get commits affecting this package since a reference commit.
   */
  public async getCommitsAffecting(sinceRef: string): Promise<readonly any[]> {
    return await getCommitsAffecting(this.dir, sinceRef)
  }

  /**
   * Process version bump for this package based on conventional commits.
   */
  public async processVersionBump(
    referenceCommit: string,
    referenceVersion: string,
    strategy: StrategyName,
    commitMsgTemplate: string,
    gitStrategy: VcsInterface,
    shouldForceBump = false
  ): Promise<BumpResult | null> {
    this.initializeVersion()

    core.info(`[${this.name}@${this.version}] Processing package`)

    // Find changes since reference point
    const commitsSinceReference = await this.getCommitsAffecting(referenceCommit)
    const commitBasedBump =
      commitsSinceReference.length > 0 ? getMostSignificantBump(commitsSinceReference) : null

    // Calculate historical bump type from reference
    const historicalVersion = referenceVersion
    const historicalBump = this.calculateBumpType(historicalVersion, this.version)

    core.info(
      `[${this.name}@${this.version}] Commit-based bump: ${
        commitBasedBump || 'none'
      }, Historical bump: ${historicalBump || 'none'}`
    )

    // Apply strategy for same bump type or force bump
    const nextVersion = getNextVersion(this.version, commitBasedBump, historicalBump, strategy)

    if (!nextVersion || nextVersion === this.version) {
      if (shouldForceBump && commitBasedBump) {
        return await this.performVersionBump(
          commitBasedBump,
          referenceCommit,
          commitMsgTemplate,
          gitStrategy
        )
      }
      core.info(`[${this.name}@${this.version}] Skipping - no changes needed`)
      return null
    }

    this.version = nextVersion
    await this.save()

    const bumpType = this.determineBumpType(commitBasedBump)
    await gitStrategy.commitVersionChange(
      this.dir,
      this.name,
      this.version,
      bumpType,
      commitMsgTemplate
    )

    const result: BumpResult = {
      version: this.version,
      bumpType,
      sha: referenceCommit,
    }

    core.info(`[${this.name}@${this.version}] Bumped to ${this.version} (${bumpType})`)
    this._bumpResult = result
    return result
  }

  /**
   * Finalize a prerelease version to a stable release.
   */
  public async finalizePrerelease(
    commitMsgTemplate: string,
    gitStrategy: VcsInterface
  ): Promise<BumpResult | null> {
    if (!this.version || !this.isPrerelease()) {
      return null
    }

    const finalVersion = this.finalizeVersion(this.version)
    core.info(`[${this.name}] Finalizing prerelease version: ${this.version} → ${finalVersion}`)

    this.version = finalVersion
    await this.save()

    await gitStrategy.commitVersionChange(
      this.dir,
      this.name,
      finalVersion,
      'release',
      commitMsgTemplate
    )

    const result: BumpResult = {
      version: finalVersion,
      bumpType: 'release',
      sha: null,
    }
    this._bumpResult = result
    return result
  }

  /**
   * Update a dependency to a new version.
   */
  public async updateDependency(
    depName: string,
    newVersion: string,
    depCommitMsgTemplate: string,
    gitStrategy: VcsInterface
  ): Promise<boolean> {
    let updated = false

    for (const depKey of DEPENDENCY_KEYS) {
      const deps = this._pkg[depKey]
      if (deps && deps[depName]) {
        const currentDepSpec = deps[depName]!

        if (this.satisfiesVersion(newVersion, currentDepSpec)) {
          continue
        }

        core.info(
          `[${this.name}] Updating ${depName} dependency from ${currentDepSpec} to ^${newVersion}`
        )
        deps[depName] = `^${newVersion}`
        updated = true
      }
    }

    if (updated) {
      await this.save()
      await gitStrategy.commitDependencyUpdate(
        this.dir,
        this.name,
        depName,
        newVersion,
        depCommitMsgTemplate
      )
      core.info(`[${this.name}] Updated dependencies for ${depName}`)
    }

    return updated
  }

  /**
   * Test compatibility after dependency updates.
   */
  public async testCompatibility(packageManager: PackageManager): Promise<TestResult> {
    try {
      const testResult = await packageManager.test(this.dir)
      return testResult
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      core.warning(`[${this.name}] Test execution failed: ${errorMessage}`)
      return { success: false, error: errorMessage }
    }
  }

  private async performVersionBump(
    bumpType: BumpType,
    referenceCommit: string,
    commitMsgTemplate: string,
    gitStrategy: VcsInterface
  ): Promise<BumpResult> {
    const nextVersion = getNextVersion(this.version, bumpType, null, 'apply-bump')
    if (!nextVersion) {
      throw new Error(`Failed to calculate next version for ${this.name}`)
    }

    this.version = nextVersion
    await this.save()

    const finalBumpType = this.determineBumpType(bumpType)
    await gitStrategy.commitVersionChange(
      this.dir,
      this.name,
      this.version,
      finalBumpType,
      commitMsgTemplate
    )

    const result: BumpResult = {
      version: this.version,
      bumpType: finalBumpType,
      sha: referenceCommit,
    }

    this._bumpResult = result
    return result
  }

  private isPrerelease(): boolean {
    const parsed = this.parseVersion(this.version)
    return Boolean(parsed?.prerelease?.length)
  }

  private finalizeVersion(version: string): string {
    const parsed = this.parseVersion(version)
    if (parsed && parsed.prerelease.length > 0) {
      return `${parsed.major}.${parsed.minor}.${parsed.patch}`
    }
    return version
  }

  private calculateBumpType(fromVersion: string, toVersion: string): BumpType | null {
    // This would use semver.diff logic - simplified for now
    if (fromVersion === toVersion) return null
    // Add proper semver diff logic here
    return 'patch'
  }

  private determineBumpType(commitBasedBump: BumpType | null): BumpType {
    return this.isPrerelease() ? 'prerelease' : commitBasedBump || 'patch'
  }

  private satisfiesVersion(newVersion: string, currentSpec: string): boolean {
    // Simplified semver satisfaction check
    return currentSpec.includes(newVersion)
  }

  private parseVersion(
    version: string
  ): { major: number; minor: number; patch: number; prerelease: string[] } | null {
    // Simplified version parsing - would use semver.parse in real implementation
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/)
    if (!match) return null

    return {
      major: parseInt(match[1]!, 10),
      minor: parseInt(match[2]!, 10),
      patch: parseInt(match[3]!, 10),
      prerelease: match[4] ? match[4].split('.') : [],
    }
  }

  private async writeJSON(filePath: string, data: PackageJson): Promise<void> {
    await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  }
}

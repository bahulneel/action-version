import * as core from '@actions/core'
import * as path from 'path'
import { promises as fs } from 'fs'
import simpleGit from 'simple-git'
import type {
  ActionConfiguration,
  PackageJson,
  BumpResult,
  ReferencePointResult,
  CommitInfo,
  StrategyOf,
} from '@types'
import type { VersionBumpingGoals } from '../../../types/goals/version-bumping.js'
import { Package } from '../../../domain/package.js'
import { calculateBumpType, finalizeVersion } from '../../../utils/version.js'
import { getMostSignificantBumpType } from '../../../utils/version.js'
import { getMostSignificantBump } from '../../../utils/commits.js'
import { versioning, commitMessaging } from '../../index.js'
import { BumpType } from '../../../types/index.js'
import type { VersionBumpResults } from '../../../services/version-bump.js'

/**
 * Workspace version bump strategy.
 * Handles version bumping for entire workspace including packages and root.
 */
export class WorkspaceVersionBump implements StrategyOf<VersionBumpingGoals> {
  readonly name = 'workspace-version-bump'
  readonly description = 'Workspace-wide version bumping strategy'

  constructor(
    private readonly config: ActionConfiguration,
    private readonly gitStrategy: StrategyOf<import('@types').VcsGoals>,
    private readonly packageManager: StrategyOf<import('@types').PackageManagementGoals>
  ) {}

  public async processWorkspace(
    packages: Package[],
    rootPkg: PackageJson,
    referencePoint: ReferencePointResult,
    config: ActionConfiguration
  ): Promise<VersionBumpResults> {
    core.info(
      `🎯 Reference: ${referencePoint.referenceCommit} (version: ${referencePoint.referenceVersion})`
    )

    let results: VersionBumpResults

    // Handle prerelease finalization or normal processing
    if (referencePoint.shouldFinalizeVersions) {
      results = await this.finalizePackageVersions(packages, rootPkg, config)
    } else {
      results = await this.processNormalVersionBumps(packages, rootPkg, referencePoint, config)
    }

    return results
  }

  /**
   * Finalize prerelease versions when base branch is updated.
   */
  private async finalizePackageVersions(
    packages: Package[],
    rootPkg: PackageJson,
    config: ActionConfiguration
  ): Promise<VersionBumpResults> {
    const bumped: Record<string, BumpResult> = {}
    let hasBumped = false

    core.info('🔄 Finalizing prerelease versions for base branch update')

    // Finalize workspace packages
    for (const pkg of packages) {
      const result = await pkg.finalizePrerelease(config.commitMsgTemplate, this.gitStrategy)

      if (result) {
        bumped[pkg.name] = result
        hasBumped = true
      }
    }

    // Finalize root package if it's a prerelease
    if (this.isPrerelease(rootPkg.version)) {
      const finalVersion = finalizeVersion(rootPkg.version)
      core.info(`🔧 Finalizing root prerelease: ${rootPkg.version} → ${finalVersion}`)

      rootPkg.version = finalVersion
      await this.saveRootPackage(rootPkg)

      await this.gitStrategy.commitVersionChange(
        process.cwd(),
        rootPkg.name || 'root',
        finalVersion,
        'release',
        config.commitMsgTemplate
      )

      bumped[rootPkg.name || 'root'] = {
        version: finalVersion,
        bumpType: 'release',
        sha: null,
      }
      hasBumped = true

      // Create release tags for finalized versions
      await this.gitStrategy.tagVersion(finalVersion, false, true)
    }

    const stats = this.calculateStats(bumped)

    return {
      bumped,
      testFailures: [],
      ...stats,
      hasBumped,
    }
  }

  /**
   * Process normal version bumps based on conventional commits.
   */
  private async processNormalVersionBumps(
    packages: Package[],
    rootPkg: PackageJson,
    referencePoint: ReferencePointResult,
    config: ActionConfiguration
  ): Promise<VersionBumpResults> {
    // Step 1: Process workspace packages
    const workspaceResults = await this.processWorkspacePackages(packages, referencePoint, config)

    // Step 2: Process root package
    const rootResults = await this.processRootPackage(
      rootPkg,
      workspaceResults.bumped,
      referencePoint,
      config
    )

    // Merge results
    const finalBumped = { ...workspaceResults.bumped, ...rootResults.bumped }
    const hasBumped = workspaceResults.hasBumped || rootResults.hasBumped
    const stats = this.calculateStats(finalBumped)

    return {
      bumped: finalBumped,
      testFailures: workspaceResults.testFailures,
      ...stats,
      hasBumped,
    }
  }

  /**
   * Process version bumps for all workspace packages.
   */
  private async processWorkspacePackages(
    packages: Package[],
    referencePoint: ReferencePointResult,
    config: ActionConfiguration
  ) {
    const bumped: Record<string, BumpResult> = {}
    const testFailures: string[] = []

    // Process each package for version bumps
    for (const pkg of packages) {
      const result = await pkg.processVersionBump(
        referencePoint.referenceCommit,
        referencePoint.referenceVersion,
        config.strategy,
        config.commitMsgTemplate,
        this.gitStrategy,
        referencePoint.shouldForceBump
      )

      if (result) {
        bumped[pkg.name] = result
      }
    }

    // Update dependencies for bumped packages
    await this.updateDependencies(packages, bumped, config, testFailures)

    return {
      bumped,
      testFailures,
      hasBumped: Object.keys(bumped).length > 0,
    }
  }

  /**
   * Update dependencies between packages when versions change.
   */
  private async updateDependencies(
    packages: Package[],
    bumped: Record<string, BumpResult>,
    config: ActionConfiguration,
    testFailures: string[]
  ): Promise<void> {
    for (const pkg of packages) {
      if (!bumped[pkg.name]) continue

      for (const siblingPkg of packages) {
        if (siblingPkg.name === pkg.name) continue

        const updated = await siblingPkg.updateDependency(
          pkg.name,
          pkg.version,
          config.depCommitMsgTemplate,
          this.gitStrategy
        )

        // Test compatibility for major version bumps
        if (updated && bumped[pkg.name]!.bumpType === 'major') {
          const testResult = await siblingPkg.testCompatibility(this.packageManager)

          if (!testResult.success) {
            core.warning(`🧪 Tests failed for ${siblingPkg.name} after major bump of ${pkg.name}`)
            testFailures.push(siblingPkg.name)
            // Could implement version rollback logic here
          }
        }
      }
    }
  }

  /**
   * Process root package version bump based on workspace changes.
   */
  private async processRootPackage(
    rootPkg: PackageJson,
    workspaceBumped: Record<string, BumpResult>,
    referencePoint: ReferencePointResult,
    config: ActionConfiguration
  ) {
    if (!rootPkg.workspaces) {
      return { bumped: {}, hasBumped: false }
    }

    core.info(`🏠 Processing root package: ${rootPkg.name || 'root'}@${rootPkg.version}`)

    // Get workspace bump from workspace package changes
    const workspaceBumpTypes = Object.values(workspaceBumped).map((b) => b.bumpType)
    const workspaceBump = getMostSignificantBumpType(workspaceBumpTypes)

    // Get non-workspace changes (files outside workspace packages)
    const nonWorkspaceCommits = await this.getNonWorkspaceCommits(referencePoint.referenceCommit)
    const nonWorkspaceBump = getMostSignificantBumpType(nonWorkspaceCommits)

    // Combine both workspace and non-workspace changes
    const allBumpTypes = [...workspaceBumpTypes, ...nonWorkspaceCommits]
    const mostSignificantBump = getMostSignificantBumpType(allBumpTypes)

    if (!mostSignificantBump) {
      core.info('🏠 No changes requiring root package bump')
      return { bumped: {}, hasBumped: false }
    }

    // Calculate historical bump type
    const historicalBump = calculateBumpType(referencePoint.referenceVersion, rootPkg.version)

    core.info(
      `🏠 Workspace bump: ${workspaceBump || 'none'}, Non-workspace bump: ${
        nonWorkspaceBump || 'none'
      }, Combined: ${mostSignificantBump}, Historical: ${historicalBump || 'none'}`
    )

    // Apply version bump using the most significant change
    const strategy = versioning.strategise(config)
    const nextVersion = strategy.bumpVersion(rootPkg.version, mostSignificantBump, historicalBump)

    if (!nextVersion || nextVersion === rootPkg.version) {
      core.info('🏠 No root package version change needed')
      return { bumped: {}, hasBumped: false }
    }

    // Update root package version
    rootPkg.version = nextVersion
    await this.saveRootPackage(rootPkg)

    // Commit the version change
    await this.gitStrategy.commitVersionChange(
      process.cwd(),
      rootPkg.name || 'root',
      nextVersion,
      mostSignificantBump,
      config.commitMsgTemplate
    )

    const result: BumpResult = {
      version: nextVersion,
      bumpType: mostSignificantBump,
      sha: referencePoint.referenceCommit,
    }

    core.info(`🏠 Root package bumped to ${nextVersion} (${mostSignificantBump})`)

    return {
      bumped: { [rootPkg.name || 'root']: result },
      hasBumped: true,
    }
  }

  /**
   * Get commits affecting non-workspace files.
   */
  private async getNonWorkspaceCommits(referenceCommit: string): Promise<BumpType[]> {
    try {
      const git = simpleGit()

      // If no reference commit, get all commits
      const logArgs = referenceCommit ? [`${referenceCommit}..HEAD`] : ['--all']
      const log = await git.log(logArgs)

      // Parse commits to get bump types
      const messaging = commitMessaging.strategise(this.config)
      const commits = await messaging.parseCommits([...log.all], referenceCommit)

      // Filter out commits that only affect workspace packages
      const workspaceDirs = await this.getWorkspaceDirectories()
      const nonWorkspaceBumpTypes: BumpType[] = []

      for (const commit of log.all) {
        // Check if this commit affects files outside workspace directories
        const files = await git.diff([`${commit.hash}~1..${commit.hash}`, '--name-only'])
        const hasNonWorkspaceChanges = files.split('\n').some((file) => {
          if (!file.trim()) return false
          return !workspaceDirs.some((dir) => file.startsWith(dir))
        })

        if (hasNonWorkspaceChanges) {
          // Get bump type for this commit
          const commitInfo = commits.find(
            (c: CommitInfo) => c.header === commit.message.split('\n')[0]
          )
          if (commitInfo) {
            const bumpType = getMostSignificantBump([commitInfo])
            if (bumpType) {
              nonWorkspaceBumpTypes.push(bumpType)
            }
          }
        }
      }

      return nonWorkspaceBumpTypes
    } catch (error) {
      core.warning(`Failed to get non-workspace commits: ${error}`)
      return []
    }
  }

  /**
   * Get workspace directories from the root package.json workspaces configuration.
   */
  private async getWorkspaceDirectories(): Promise<string[]> {
    try {
      const rootPkgPath = path.join(process.cwd(), 'package.json')
      const rootPkg = JSON.parse(await fs.readFile(rootPkgPath, 'utf-8'))

      if (!rootPkg.workspaces) {
        return []
      }

      // Handle both array and object format
      const workspaces = Array.isArray(rootPkg.workspaces)
        ? rootPkg.workspaces
        : rootPkg.workspaces.packages || []

      // Convert glob patterns to directory prefixes
      const directories: string[] = []
      for (const pattern of workspaces) {
        // Convert patterns like "packages/*" to "packages/"
        if (pattern.includes('*')) {
          const dir = pattern.split('*')[0]
          if (dir) {
            directories.push(dir)
          }
        } else {
          // Direct directory reference
          directories.push(pattern.endsWith('/') ? pattern : `${pattern}/`)
        }
      }

      return directories
    } catch (error) {
      core.warning(`Failed to get workspace directories: ${error}`)
      // Fallback to common patterns
      return ['packages/', 'apps/', 'libs/', 'src/', 'implementations/']
    }
  }

  /**
   * Calculate statistics from bump results.
   */
  private calculateStats(bumped: Record<string, BumpResult>) {
    const totalPackages = Object.keys(bumped).length
    const prereleasePackages = Object.values(bumped).filter((b) =>
      this.isPrerelease(b.version)
    ).length
    const releasePackages = totalPackages - prereleasePackages
    const finalizedPackages = Object.values(bumped).filter((b) => b.bumpType === 'release').length

    return {
      totalPackages,
      releasePackages,
      prereleasePackages,
      finalizedPackages,
    }
  }

  /**
   * Check if a version is a prerelease.
   */
  private isPrerelease(version: string): boolean {
    return version.includes('-')
  }

  /**
   * Save the root package.json file.
   */
  private async saveRootPackage(rootPkg: PackageJson): Promise<void> {
    const rootPath = path.join(process.cwd(), 'package.json')
    const content = `${JSON.stringify(rootPkg, null, 2)}\n`
    await fs.writeFile(rootPath, content, 'utf8')
  }
}

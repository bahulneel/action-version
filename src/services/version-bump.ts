import type {
  ActionConfiguration,
  PackageJson,
  StrategyOf,
} from '@types'
import { Package } from '../domain/package.js'
import { DiscoveryService } from './discovery.js'
import { versionBumping, type VersionBumpingConfig } from '../objectives/index.js'

export interface VersionBumpResults {
  bumped: Record<string, import('@types').BumpResult>
  testFailures: string[]
  totalPackages: number
  releasePackages: number
  prereleasePackages: number
  finalizedPackages: number
  hasBumped: boolean
}

/**
 * Service responsible for orchestrating the complete version bump process.
 * Thin orchestrator that delegates to VersionBumping objective.
 */
export class VersionBumpService {
  private readonly discoveryService: DiscoveryService

  constructor(
    private readonly gitStrategy: StrategyOf<import('@types').VcsGoals>,
    private readonly packageManager: StrategyOf<import('@types').PackageManagementGoals>,
    config: ActionConfiguration
  ) {
    this.discoveryService = new DiscoveryService(config)
  }

  /**
   * Process the entire workspace for version bumps.
   */
  public async processWorkspace(
    packages: Package[],
    rootPkg: PackageJson,
    config: ActionConfiguration
  ): Promise<VersionBumpResults> {
    // Step 1: Determine reference point for version comparison
    const referencePoint = await this.discoveryService.determineReferencePoint(
      config.baseBranch,
      config.activeBranch
    )

    // Step 2: Use VersionBumping objective to process workspace
    const versionBumpingConfig: VersionBumpingConfig = {
      ...config,
      gitStrategy: this.gitStrategy,
      packageManager: this.packageManager,
    }
    const strategy = versionBumping.strategise(versionBumpingConfig)
    return await strategy.processWorkspace(packages, rootPkg, referencePoint, config)
  }
}

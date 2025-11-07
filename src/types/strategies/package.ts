import type { TestResult, PackageManagerType } from '../index.js'
import type { Strategy } from '../strategy.js'
/**
 * Package manager strategy interface.
 * Handles different package manager implementations.
 */
export interface PackageManager extends Strategy {
  isAvailable(): boolean
  test(packageDir: string): Promise<TestResult>
  install(packageDir: string): Promise<void>
}

// Backwards-compatible alias for legacy naming used across services

/**
 * Configuration for package manager strategy selection.
 */
export interface PackageManagerConfig {
  readonly manager: PackageManagerType
}

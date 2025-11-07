import type { TestResult, PackageManagerType } from '../index.js'

/**
 * Package manager strategy interface.
 * Handles different package manager implementations.
 */
export interface PackageManager {
  readonly name: PackageManagerType
  isAvailable(): boolean
  test(packageDir: string): Promise<TestResult>
  install(packageDir: string): Promise<void>
}

/**
 * Configuration for package manager strategy selection.
 */
export interface PackageManagerConfig {
  readonly manager: PackageManagerType
}

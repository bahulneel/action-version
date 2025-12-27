import type {
  BumpType,
  StrategyName,
  BranchCleanupStrategyType,
  GitOperationStrategyType,
  PackageManagerType,
} from '../types/index.js'

export function isBumpType(value: string): value is BumpType {
  return ['major', 'minor', 'patch', 'prerelease', 'release'].includes(value)
}

export function isStrategyName(value: string): value is StrategyName {
  return ['do-nothing', 'apply-bump', 'pre-release', 'finalize', 'sync'].includes(value)
}

export function isBranchCleanupStrategy(value: string): value is BranchCleanupStrategyType {
  return ['keep', 'prune', 'semantic'].includes(value)
}

export function isGitOperationStrategyType(value: string): value is GitOperationStrategyType {
  return ['conventional', 'simple'].includes(value)
}

export function isPackageManagerType(value: string): value is PackageManagerType {
  return ['npm', 'yarn', 'pnpm'].includes(value)
}



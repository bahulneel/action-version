const gitOperations = require('./git-operations/index.cjs')
// Main lib index - exports all strategies
const packageManagers = require('./package-managers/index.cjs')

module.exports = {
  packageManagers,
  gitOperations,
  // Direct exports for convenience
  PackageManagerFactory: packageManagers.PackageManagerFactory,
  GitOperationStrategyFactory: gitOperations.GitOperationStrategyFactory,
  DiscoveryStrategyFactory: gitOperations.DiscoveryStrategyFactory,
}

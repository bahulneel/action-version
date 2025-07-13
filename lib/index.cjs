// Main lib index - exports all strategies
const packageManagers = require('./package-managers/index.cjs');
const gitOperations = require('./git-operations/index.cjs');

module.exports = {
  packageManagers,
  gitOperations,
  // Direct exports for convenience
  PackageManagerFactory: packageManagers.PackageManagerFactory,
  GitOperationStrategyFactory: gitOperations.GitOperationStrategyFactory
};
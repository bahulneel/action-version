// Base class for git operation strategies
class GitOperationStrategy {
  constructor(name) {
    this.name = name
  }

  async commitVersionChange(packageDir, packageName, version, bumpType, template) {
    throw new Error('Strategy must implement commitVersionChange method')
  }

  async commitDependencyUpdate(packageDir, packageName, depName, depVersion, template) {
    throw new Error('Strategy must implement commitDependencyUpdate method')
  }

  async tagVersion(version, isPrerelease, shouldTag) {
    throw new Error('Strategy must implement tagVersion method')
  }
}

module.exports = { GitOperationStrategy }

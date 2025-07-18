// Base class for git operation strategies
class GitOperationStrategy {
  constructor(name) {
    this.name = name
  }

  async commitVersionChange(_packageDir, _packageName, _version, _bumpType, _template) {
    throw new Error('Strategy must implement commitVersionChange method')
  }

  async commitDependencyUpdate(_packageDir, _packageName, _depName, _depVersion, _template) {
    throw new Error('Strategy must implement commitDependencyUpdate method')
  }

  async tagVersion(_version, _isPrerelease, _shouldTag) {
    throw new Error('Strategy must implement tagVersion method')
  }
}

module.exports = { GitOperationStrategy }

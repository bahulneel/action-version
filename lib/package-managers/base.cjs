// Base class for package manager strategies
class PackageManagerStrategy {
  constructor(name) {
    this.name = name
  }

  isAvailable() {
    throw new Error('Strategy must implement isAvailable method')
  }

  async install(packageDir = '.') {
    throw new Error('Strategy must implement install method')
  }

  async test(packageDir = '.') {
    throw new Error('Strategy must implement test method')
  }

  async build(packageDir = '.') {
    throw new Error('Strategy must implement build method')
  }

  getInstallCommand(packageDir = '.') {
    throw new Error('Strategy must implement getInstallCommand method')
  }

  getTestCommand(packageDir = '.') {
    throw new Error('Strategy must implement getTestCommand method')
  }
}

exports.PackageManagerStrategy = PackageManagerStrategy

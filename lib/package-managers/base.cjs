// Base class for package manager strategies
class PackageManagerStrategy {
  constructor(name) {
    this.name = name
  }

  isAvailable() {
    throw new Error('Strategy must implement isAvailable method')
  }

  async install(_packageDir = '.') {
    throw new Error('Strategy must implement install method')
  }

  async test(_packageDir = '.') {
    throw new Error('Strategy must implement test method')
  }

  async build(_packageDir = '.') {
    throw new Error('Strategy must implement build method')
  }

  getInstallCommand(_packageDir = '.') {
    throw new Error('Strategy must implement getInstallCommand method')
  }

  getTestCommand(_packageDir = '.') {
    throw new Error('Strategy must implement getTestCommand method')
  }
}

exports.PackageManagerStrategy = PackageManagerStrategy

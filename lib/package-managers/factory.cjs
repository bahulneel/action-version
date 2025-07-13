const { YarnPackageManagerStrategy } = require('./yarn.cjs');
const { NpmPackageManagerStrategy } = require('./npm.cjs');
const { PnpmPackageManagerStrategy } = require('./pnpm.cjs');

class PackageManagerFactory {
  static strategies = [
    new YarnPackageManagerStrategy(),
    new PnpmPackageManagerStrategy(),
    new NpmPackageManagerStrategy() // NPM as fallback
  ];
  
  static getPackageManager() {
    for (const strategy of this.strategies) {
      if (strategy.isAvailable()) {
        return strategy;
      }
    }
    return new NpmPackageManagerStrategy(); // Default fallback
  }
}

module.exports = { PackageManagerFactory };
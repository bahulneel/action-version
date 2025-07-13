const path = require('path');
const core = require('@actions/core');
const { PackageManagerStrategy } = require('./base.cjs');

class YarnPackageManagerStrategy extends PackageManagerStrategy {
  constructor() {
    super('yarn');
  }
  
  isAvailable() {
    try {
      const fs = require('fs');
      return fs.existsSync(path.join(process.cwd(), 'yarn.lock'));
    } catch {
      return false;
    }
  }
  
  async install(packageDir = '.') {
    const { execSync } = require('child_process');
    const command = `cd ${packageDir} && yarn install`;
    core.debug(`[${this.name}] Running: ${command}`);
    return execSync(command, { stdio: 'inherit' });
  }
  
  async test(packageDir = '.') {
    const { execSync } = require('child_process');
    try {
      const command = `cd ${packageDir} && yarn test`;
      core.debug(`[${this.name}] Running: ${command}`);
      execSync(command, { stdio: 'inherit' });
      return { success: true };
    } catch (error) {
      core.warning(`[${this.name}] Tests failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  async build(packageDir = '.') {
    const { execSync } = require('child_process');
    const command = `cd ${packageDir} && yarn build`;
    core.debug(`[${this.name}] Running: ${command}`);
    return execSync(command, { stdio: 'inherit' });
  }
  
  getInstallCommand(packageDir = '.') {
    return `cd ${packageDir} && yarn install`;
  }
  
  getTestCommand(packageDir = '.') {
    return `cd ${packageDir} && yarn test`;
  }
}

module.exports = { YarnPackageManagerStrategy };
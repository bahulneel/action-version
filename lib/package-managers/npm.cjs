const path = require('node:path')
const core = require('@actions/core')
const { PackageManagerStrategy } = require('./base.cjs')

class NpmPackageManagerStrategy extends PackageManagerStrategy {
  constructor() {
    super('npm')
  }

  isAvailable() {
    try {
      const fs = require('node:fs')
      return fs.existsSync(path.join(process.cwd(), 'package-lock.json'))
        || !fs.existsSync(path.join(process.cwd(), 'yarn.lock'))
    }
    catch {
      return true // NPM is default fallback
    }
  }

  async install(packageDir = '.') {
    const { execSync } = require('node:child_process')
    const command = `cd ${packageDir} && npm install`
    core.debug(`[${this.name}] Running: ${command}`)
    return execSync(command, { stdio: 'inherit' })
  }

  async test(packageDir = '.') {
    const { execSync } = require('node:child_process')
    try {
      const command = `cd ${packageDir} && npm test`
      core.debug(`[${this.name}] Running: ${command}`)
      execSync(command, { stdio: 'inherit' })
      return { success: true }
    }
    catch (error) {
      core.warning(`[${this.name}] Tests failed: ${error.message}`)
      return { success: false, error: error.message }
    }
  }

  async build(packageDir = '.') {
    const { execSync } = require('node:child_process')
    const command = `cd ${packageDir} && npm run build`
    core.debug(`[${this.name}] Running: ${command}`)
    return execSync(command, { stdio: 'inherit' })
  }

  getInstallCommand(packageDir = '.') {
    return `cd ${packageDir} && npm install`
  }

  getTestCommand(packageDir = '.') {
    return `cd ${packageDir} && npm test`
  }
}

module.exports = { NpmPackageManagerStrategy }

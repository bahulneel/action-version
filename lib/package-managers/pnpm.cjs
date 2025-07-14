const path = require('node:path')
const core = require('@actions/core')
const { PackageManagerStrategy } = require('./base.cjs')

class PnpmPackageManagerStrategy extends PackageManagerStrategy {
  constructor() {
    super('pnpm')
  }

  isAvailable() {
    try {
      const fs = require('node:fs')
      return fs.existsSync(path.join(require('node:process').cwd(), 'pnpm-lock.yaml'))
    }
    catch {
      return false
    }
  }

  async install(packageDir = '.') {
    const { execSync } = require('node:child_process')
    const command = `cd ${packageDir} && pnpm install`
    core.debug(`[${this.name}] Running: ${command}`)
    return execSync(command, { stdio: 'inherit' })
  }

  async test(packageDir = '.') {
    const { execSync } = require('node:child_process')
    try {
      const command = `cd ${packageDir} && pnpm test`
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
    const command = `cd ${packageDir} && pnpm build`
    core.debug(`[${this.name}] Running: ${command}`)
    return execSync(command, { stdio: 'inherit' })
  }

  getInstallCommand(packageDir = '.') {
    return `cd ${packageDir} && pnpm install`
  }

  getTestCommand(packageDir = '.') {
    return `cd ${packageDir} && pnpm test`
  }
}

module.exports = { PnpmPackageManagerStrategy }

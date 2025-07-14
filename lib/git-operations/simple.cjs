const path = require('node:path')
const core = require('@actions/core')
const { GitOperationStrategy } = require('./base.cjs')

class SimpleCommitStrategy extends GitOperationStrategy {
  constructor() {
    super('simple')
  }

  async commitVersionChange(packageDir, packageName, version, bumpType, template) {
    const relativePath = path.relative(process.cwd(), packageDir) || '.'
    const packageJsonPath = path.join(packageDir, 'package.json')

    // Simple commit message
    const msg = `Bump ${packageName} to ${version}`

    try {
      const git = require('simple-git')()

      await git.add([packageJsonPath])
      await git.commit(msg)
      core.debug(`[${relativePath}] Successfully committed simple version change`)
    }
    catch (error) {
      throw new Error(`Failed to commit version change in ${relativePath}: ${error.message}`)
    }
  }

  async commitDependencyUpdate(packageDir, packageName, depName, depVersion, template) {
    const relativePath = path.relative(process.cwd(), packageDir) || '.'
    const packageJsonPath = path.join(packageDir, 'package.json')

    const msg = `Update ${depName} to ${depVersion} in ${packageName}`

    try {
      const git = require('simple-git')()

      await git.add([packageJsonPath])
      await git.commit(msg)
      core.debug(`[${relativePath}] Successfully committed simple dependency update`)
    }
    catch (error) {
      throw new Error(`Failed to commit dependency update in ${relativePath}: ${error.message}`)
    }
  }

  async tagVersion(version, isPrerelease, shouldTag) {
    if (!version || (isPrerelease && !shouldTag))
      return

    const tagName = `v${version}`
    const git = require('simple-git')()

    try {
      await git.addTag(tagName)
      core.info(`Created simple tag ${tagName}`)
    }
    catch (error) {
      core.error(`Failed to create tag ${tagName}: ${error.message}`)
    }
  }
}

module.exports = { SimpleCommitStrategy }

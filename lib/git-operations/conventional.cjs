const path = require('node:path')
const core = require('@actions/core')
const { GitOperationStrategy } = require('./base.cjs')

class ConventionalCommitStrategy extends GitOperationStrategy {
  constructor() {
    super('conventional')
  }

  async commitVersionChange(packageDir, packageName, version, bumpType, template) {
    const relativePath = path.relative(process.cwd(), packageDir) || '.'
    const packageJsonPath = path.join(packageDir, 'package.json')

    // Create conventional commit message
    const msg = this.interpolate(template, {
      package: packageName,
      version,
      bumpType,
    })

    try {
      const git = require('simple-git')()

      core.debug(`[${relativePath}] Adding package.json to git`)
      await git.add([packageJsonPath])

      core.debug(`[${relativePath}] Committing: ${msg}`)
      await git.commit(msg)

      core.debug(`[${relativePath}] Successfully committed version change`)
    }
    catch (error) {
      core.error(`[${relativePath}] Failed to commit version change: ${error.message}`)
      throw new Error(`Failed to commit version change in ${relativePath}: ${error.message}`)
    }
  }

  async commitDependencyUpdate(packageDir, packageName, depName, depVersion, template) {
    const relativePath = path.relative(process.cwd(), packageDir) || '.'
    const packageJsonPath = path.join(packageDir, 'package.json')

    const msg = this.interpolate(template, {
      package: packageName,
      depPackage: depName,
      depVersion,
      version: 'unknown', // We don't always have current version context
      bumpType: 'patch',
    })

    try {
      const git = require('simple-git')()

      core.debug(`[${relativePath}] Adding package.json to git`)
      await git.add([packageJsonPath])

      core.debug(`[${relativePath}] Committing: ${msg}`)
      await git.commit(msg)

      core.debug(`[${relativePath}] Successfully committed dependency update`)
    }
    catch (error) {
      core.error(`[${relativePath}] Failed to commit dependency update: ${error.message}`)
      throw new Error(`Failed to commit dependency update in ${relativePath}: ${error.message}`)
    }
  }

  async tagVersion(version, isPrerelease, shouldTag) {
    const tagName = `v${version}`
    const git = require('simple-git')()

    if (!version) {
      core.warning('No version found, skipping tag')
      return
    }

    if (isPrerelease && !shouldTag) {
      core.info(`Skipping prerelease tag ${tagName} (use tag-prereleases: true to enable)`)
      return
    }

    try {
      const existingTags = await git.tags()
      if (existingTags.all.includes(tagName)) {
        core.info(`Skipping tag ${tagName} because it already exists`)
        return
      }

      if (isPrerelease) {
        core.info(`Creating prerelease tag ${tagName}`)
      }
      else {
        core.info(`Creating release tag ${tagName}`)
      }

      await git.addAnnotatedTag(tagName, `Release ${version}`)
    }
    catch (error) {
      core.error(`Failed to create tag ${tagName}: ${error.message}`)
      throw new Error(`Failed to create tag ${tagName}: ${error.message}`)
    }
  }

  interpolate(template, vars) {
    return template.replace(/\$\{(\w+)\}/g, (_, v) => vars[v] ?? '')
  }
}

module.exports = { ConventionalCommitStrategy }

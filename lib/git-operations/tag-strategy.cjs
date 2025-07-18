const core = require('@actions/core')
const semver = require('semver')
const simpleGit = require('simple-git').default

class TagDiscoveryStrategy {
  constructor() {
    this.name = 'tag-based'
  }

  async findReferencePoint() {
    core.info(`[${this.name}] Using latest tag as reference`)
    const git = simpleGit()
    const tags = await git.tags(['--sort=-v:refname'])
    const latestTag = tags.latest

    if (latestTag) {
      const referenceCommit = await git.revparse([latestTag])
      const referenceVersion = String(semver.coerce(latestTag.replace(/^v/, '')) || '0.0.0')
      return {
        referenceCommit,
        referenceVersion,
        shouldFinalizeVersions: false,
        shouldForceBump: false
      }
    }
    else {
      // No tags, use first commit
      const firstCommit = await git.log(['--reverse', '--max-count=1'])
      if (!firstCommit.latest) {
        throw new Error('No commits found in repository')
      }
      const referenceCommit = firstCommit.latest.hash
      const referenceVersion = '0.0.0'
      return {
        referenceCommit,
        referenceVersion,
        shouldFinalizeVersions: false,
        shouldForceBump: false
      }
    }
  }

  async findLastVersionChangeCommit(packageJsonPath) {
    const git = simpleGit()

    // Find the last commit that changed the version in package.json
    try {
      const log = await git.log(['--follow', '--format=%H', '--', packageJsonPath])
      if (log.latest) {
        return log.latest.hash
      }
      throw new Error('No commits found that modified package.json')
    }
    catch (error) {
      core.debug(`Could not find last version change commit: ${error.message}`)
    }

    // Fallback: find the last commit with a version bump message
    try {
      const log = await git.log(['--grep=chore(release)', '--grep=bump', '--grep=version', '--format=%H', '-1'])
      if (log.latest) {
        return log.latest.hash
      }
      throw new Error('No version bump commits found')
    }
    catch (error) {
      core.debug(`Could not find last version bump commit: ${error.message}`)
    }

    throw new Error('Could not determine last version change commit - no fallback available')
  }

  async getVersionAtCommit(commitRef) {
    const git = simpleGit()
    const fs = require('node:fs/promises')
    const path = require('node:path')

    try {
      // Checkout the specific commit temporarily to read package.json
      const currentBranch = await git.branch()
      await git.checkout(commitRef)

      const packageJsonPath = path.join(process.cwd(), 'package.json')
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'))
      const version = packageJson.version || '0.0.0'

      // Restore original branch
      await git.checkout(currentBranch.current)

      return version
    }
    catch (error) {
      core.debug(`Could not get version at commit ${commitRef}: ${error.message}`)
      throw new Error(`Failed to get version at commit ${commitRef}: ${error.message}`)
    }
  }
}

module.exports = { TagDiscoveryStrategy } 
const core = require('@actions/core')
const semver = require('semver')
const simpleGit = require('simple-git').default

class BranchDiscoveryStrategy {
  constructor() {
    this.name = 'branch-based'
  }

  async findReferencePoint(baseBranch, activeBranch) {
    core.info(`[${this.name}] Using branch base: ${baseBranch}`)
    const git = simpleGit()
    const branch = baseBranch.startsWith('origin/') ? baseBranch : `origin/${baseBranch}`
    let referenceCommit = await this.lastNonMergeCommit(git, branch)
    referenceCommit = referenceCommit.trim()

    // Get root package version at that commit
    const rootPackageJsonPath = require('node:path').join(require('node:process').cwd(), 'package.json')
    let referenceVersion = await this.getVersionAtCommit(referenceCommit)
    referenceVersion = String(semver.coerce(referenceVersion) || '0.0.0')

    // Check if we should finalize prerelease versions or force bumps (base branch update scenario)
    let shouldFinalizeVersions = false
    let shouldForceBump = false
    if (baseBranch && activeBranch) {
      try {
        const activeCommit = await this.lastNonMergeCommit(git, `origin/${activeBranch}`)
        const baseCommit = await this.lastNonMergeCommit(git, `origin/${baseBranch}`)

        if (activeCommit === baseCommit) {
          core.info(`[${this.name}] Active and base branches are at same commit - assuming bump is requested if changes exist`)
          shouldFinalizeVersions = true
          shouldForceBump = true
        }
      }
      catch (error) {
        core.debug(`Could not compare active/base branches: ${error.message}`)
      }
    }

    return { referenceCommit, referenceVersion, shouldFinalizeVersions, shouldForceBump }
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

  async lastNonMergeCommit(git, branch) {
    try {
      core.debug(`Getting last non-merge commit from branch: ${branch}`)
      const commits = await git.log(['--no-merges', '-n1', branch])
      if (!commits.latest) {
        throw new Error(`No commits found in branch ${branch}`)
      }
      core.debug(`Last non-merge commit in ${branch}: ${commits.latest.hash}`)
      return commits.latest.hash
    }
    catch (error) {
      core.error(`Failed to get last non-merge commit from ${branch}: ${error.message}`)
      throw new Error(`Failed to get last non-merge commit from ${branch}: ${error.message}`)
    }
  }
}

module.exports = { BranchDiscoveryStrategy } 
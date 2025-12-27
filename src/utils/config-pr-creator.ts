import { promises as fs } from 'fs'
import * as path from 'path'
import * as core from '@actions/core'
import { execSync } from 'child_process'
import simpleGit from 'simple-git'
import yaml from 'js-yaml'
import type { VersioningConfig as ModelVersioningConfig } from '../types/versioning-config.js'

const git = simpleGit()

/**
 * Create a PR with the inferred .versioning.yml configuration.
 * Returns the PR URL if successful, null if PR creation failed.
 */
export async function createConfigPR(config: ModelVersioningConfig): Promise<string | null> {
  try {
    const branchName = 'add-versioning-config'
    const configPath = path.join(process.cwd(), '.versioning.yml')

    // Step 1: Create a new branch
    const currentBranch = await git.revparse(['--abbrev-ref', 'HEAD'])
    core.info(`Current branch: ${currentBranch}`)

    // Check if branch already exists
    const branches = await git.branchLocal()
    if (branches.all.includes(branchName)) {
      core.info(`Branch ${branchName} already exists, checking it out`)
      await git.checkout(branchName)
    } else {
      await git.checkoutBranch(branchName, currentBranch)
      core.info(`Created branch: ${branchName}`)
    }

    // Step 2: Write .versioning.yml to repository root
    const yamlContent = yaml.dump(config, {
      indent: 2,
      lineWidth: 120,
    })
    await fs.writeFile(configPath, yamlContent, 'utf-8')
    core.info(`Written .versioning.yml to ${configPath}`)

    // Step 3: Commit the file
    await git.add(configPath)
    await git.commit('chore(config): add inferred .versioning.yml configuration')
    core.info('Committed .versioning.yml')

    // Step 4: Push the branch
    await git.push('origin', branchName, ['--set-upstream'])
    core.info(`Pushed branch ${branchName} to origin`)

    // Step 5: Create PR using gh CLI
    try {
      const repo = process.env.GITHUB_REPOSITORY
      if (!repo) {
        throw new Error('GITHUB_REPOSITORY environment variable is not set')
      }

      const prTitle = 'chore(config): add .versioning.yml configuration'
      const prBody = `This PR adds a \`.versioning.yml\` configuration file with an inferred preset based on your repository structure.

Please review and merge this PR to enable model-driven versioning configuration.

The configuration was inferred from your repository's branch structure. You can customize it after merging if needed.

See the [documentation](https://github.com/bahulneel/action-version) for more details on customizing the configuration.`

      const prOutput = execSync(`gh pr create --base "${currentBranch}" --head "${branchName}" --title "${prTitle}" --body "${prBody}"`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      })

      // Extract PR URL from output (gh CLI outputs the PR URL)
      const prUrlMatch = prOutput.match(/https:\/\/github\.com\/[^\s]+/)?.[0]
      if (prUrlMatch) {
        core.info(`Created PR: ${prUrlMatch}`)
        return prUrlMatch
      }

      core.warning('PR created but could not extract URL from output')
      return 'PR created (URL unknown)'
    } catch (prError) {
      const errorMessage = prError instanceof Error ? prError.message : String(prError)
      core.warning(`Failed to create PR using gh CLI: ${errorMessage}`)
      core.warning('PR creation failed - will output config to action summary instead')
      return null
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    core.warning(`Failed to create PR with inferred config: ${errorMessage}`)
    return null
  }
}

/**
 * Output inferred config to GitHub Actions summary.
 */
export async function outputConfigToSummary(config: ModelVersioningConfig): Promise<void> {
  try {
    const yamlContent = yaml.dump(config, {
      indent: 2,
      lineWidth: 120,
    })

    await core.summary
      .addHeading('Inferred .versioning.yml Configuration', 2)
      .addRaw(
        `<p>Please add a <code>.versioning.yml</code> file to your repository root with the following content:</p>
<pre><code>${yamlContent}</code></pre>
<p>You can customize this configuration as needed. See the <a href="https://github.com/bahulneel/action-version">documentation</a> for more details.</p>`
      )
      .write()
  } catch (error) {
    core.warning(`Failed to write config to summary: ${error}`)
  }
}

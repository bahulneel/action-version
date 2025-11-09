import * as core from '@actions/core'
import simpleGit from 'simple-git'
import type { Tactic, TacticResult, GitSetupResult, GitSetupContext } from '../../../types/index.js'

const git = simpleGit()

export class SetupGitTactic implements Tactic<GitSetupResult, GitSetupContext> {
  public readonly name = 'SetupGit'

  public assess(context: GitSetupContext): boolean {
    return Boolean(context.branchTemplate)
  }

  public async attempt(
    context: GitSetupContext
  ): Promise<TacticResult<GitSetupResult, GitSetupContext>> {
    try {
      await git.addConfig('user.name', 'github-actions[bot]')
      await git.addConfig('user.email', 'github-actions[bot]@users.noreply.github.com')

      try {
        core.debug(`[git] Fetching all branches with full history`)
        await git.fetch(['--all', '--prune', '--prune-tags'])
        core.debug(`[git] Successfully fetched all branches`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        core.warning(`[git] Failed to fetch all branches: ${errorMessage}`)
      }

      try {
        core.debug(`[git] Attempting to unshallow repository`)
        await git.fetch(['--unshallow'])
        core.info(`[git] Successfully unshallowed repository`)
      } catch (error) {
        core.debug(`[git] Repository is not shallow or unshallow failed`)
      }

      const tempRef = `refs/heads/temp-${Date.now()}`
      const currentBranch = (await git.branch()).current

      core.debug(`[git] Creating temporary ref ${tempRef} from ${currentBranch}`)
      await git.raw(['update-ref', tempRef, 'HEAD'])

      const result: GitSetupResult = {
        tempRef,
        branchTemplate: context.branchTemplate,
      }

      return {
        applied: true,
        success: true,
        result,
        message: `Git setup complete with temp ref: ${tempRef}`,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        applied: true,
        success: false,
        message: `Git setup failed: ${errorMessage}`,
      }
    }
  }
}

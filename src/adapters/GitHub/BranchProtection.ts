import * as core from '@actions/core'
import { execSync } from 'child_process'

/**
 * Cache for branch protection status to avoid excessive API calls.
 */
const protectionCache = new Map<string, boolean>()

/**
 * GitHub branch protection adapter.
 * Checks if a branch is protected via GitHub API using gh CLI.
 */
export class BranchProtection {
  /**
   * Check if a branch is protected.
   * Caches results to avoid excessive API calls.
   */
  async isBranchProtected(branchName: string): Promise<boolean> {
    // Check cache first
    if (protectionCache.has(branchName)) {
      return protectionCache.get(branchName)!
    }

    try {
      const repo = process.env.GITHUB_REPOSITORY
      if (!repo) {
        core.debug('GITHUB_REPOSITORY not set, assuming branch is unprotected')
        return false
      }

      // Use gh CLI to check branch protection
      // API endpoint: GET /repos/:owner/:repo/branches/:branch/protection
      const apiUrl = `repos/${repo}/branches/${branchName}/protection`

      try {
        const output = execSync(`gh api ${apiUrl}`, {
          encoding: 'utf-8',
          stdio: 'pipe',
        })

        // If API call succeeds, branch is protected
        // The API returns 404 if branch is not protected
        const isProtected = output.trim().length > 0

        // Cache the result
        protectionCache.set(branchName, isProtected)

        core.debug(`Branch ${branchName} protection status: ${isProtected}`)
        return isProtected
      } catch (apiError: any) {
        // 404 means branch is not protected
        if (apiError.status === 404 || apiError.stdout?.includes('404') || apiError.stderr?.includes('404')) {
          protectionCache.set(branchName, false)
          core.debug(`Branch ${branchName} is not protected (404 response)`)
          return false
        }

        // Other errors - log and assume unprotected
        core.warning(`Failed to check branch protection for ${branchName}: ${apiError.message}`)
        protectionCache.set(branchName, false)
        return false
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      core.warning(`Failed to check branch protection for ${branchName}: ${errorMessage}`)
      // Assume unprotected on error
      protectionCache.set(branchName, false)
      return false
    }
  }

  /**
   * Clear the protection cache (useful for testing).
   */
  clearCache(): void {
    protectionCache.clear()
  }
}

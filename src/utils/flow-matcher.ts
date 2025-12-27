import * as core from '@actions/core'
import type { Flow } from '../types/versioning-config.js'

/**
 * GitHub event context for flow matching.
 */
export interface GitHubContext {
  /** Current branch name (from GITHUB_REF) */
  currentBranch: string

  /** GitHub event type (push, pull_request, etc.) */
  eventType?: string | undefined

  /** Target branch (for PR events) */
  targetBranch?: string | undefined
}

/**
 * Match a branch name against a pattern (supports globs and wildcards).
 */
export function matchPattern(pattern: string, branchName: string): boolean {
  // Exact match
  if (pattern === branchName) {
    return true
  }

  // Wildcard match
  if (pattern === '*') {
    return true
  }

  // Glob pattern matching (simple implementation)
  // Convert glob pattern to regex
  const regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
    .replace(/\*/g, '.*') // Convert * to .*
    .replace(/\?/g, '.') // Convert ? to .

  const regex = new RegExp(`^${regexPattern}$`)
  return regex.test(branchName)
}

/**
 * Check if a branch matches a pattern, excluding any excluded patterns.
 */
export function matchesPatternWithExclusions(
  pattern: string,
  branchName: string,
  exclusions?: string[]
): boolean {
  // First check if branch matches the pattern
  if (!matchPattern(pattern, branchName)) {
    return false
  }

  // Then check if branch is excluded
  if (exclusions) {
    for (const exclusion of exclusions) {
      if (matchPattern(exclusion, branchName)) {
        return false // Branch matches exclusion pattern
      }
    }
  }

  return true
}

/**
 * Score a flow match (higher = more specific match).
 * Used to determine the best matching flow when multiple flows match.
 */
function scoreFlowMatch(flow: Flow, context: GitHubContext): number {
  let score = 0

  // Exact branch name match is better than pattern match
  if (flow.from === context.currentBranch) {
    score += 100
  } else if (flow.from.includes('*')) {
    score += 10 // Pattern match
  } else {
    score += 50 // Specific pattern (like 'release/*')
  }

  // Flows with versioning specified are more specific
  if (flow.versioning) {
    score += 20
  }

  // Flows with base specified are more specific
  if (flow.base) {
    score += 10
  }

  return score
}

/**
 * Match current GitHub context to the best flow.
 * Returns the most specific matching flow, or null if no flow matches.
 */
export function matchFlow(flows: Flow[], context: GitHubContext): Flow | null {
  const matchingFlows: Array<{ flow: Flow; score: number }> = []

  for (const flow of flows) {
    let shouldMatch = false

    // Check if current branch matches the 'from' pattern (with exclusions)
    if (matchesPatternWithExclusions(flow.from, context.currentBranch, flow['from-exclude'])) {
      shouldMatch = true
    }

    // Also check if current branch matches the 'to' pattern (for sync flows)
    // This allows matching sync-version flow when on the target branch
    if (flow.to && matchesPatternWithExclusions(flow.to, context.currentBranch, [])) {
      shouldMatch = true
    }

    if (shouldMatch) {
      // Check triggered status if specified
      if (flow.triggered !== undefined) {
        // If triggered is true, only match on explicit triggers (for now, we match all)
        // In the future, this could check event type
        // For now, if triggered is specified, we still match (triggered check happens elsewhere)
      }

      const score = scoreFlowMatch(flow, context)
      matchingFlows.push({ flow, score })
    }
  }

  if (matchingFlows.length === 0) {
    core.debug(`No matching flows found for branch: ${context.currentBranch}`)
    return null
  }

  // Sort by score (highest first) and return the best match
  matchingFlows.sort((a, b) => b.score - a.score)
  const bestMatch = matchingFlows[0]?.flow

  if (!bestMatch) {
    return null
  }

  core.debug(
    `Matched flow: ${bestMatch.name} (score: ${matchingFlows[0]!.score}, from: ${bestMatch.from}, to: ${bestMatch.to})`
  )

  return bestMatch
}

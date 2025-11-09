import * as core from '@actions/core'
import type { Tactic, TacticResult, CommitInfo, CommitParsingContext } from '@types'

/**
 * BestGuessCommitTactic - Parse commits using heuristics when conventional format fails.
 */
export class BestGuessCommitTactic implements Tactic<CommitInfo[], CommitParsingContext> {
  public readonly name = 'BestGuessCommit'

  public assess(context: CommitParsingContext): boolean {
    return context.logEntries && context.logEntries.length > 0
  }

  public async attempt(
    context: CommitParsingContext
  ): Promise<TacticResult<CommitInfo[], CommitParsingContext>> {
    try {
      const commits: CommitInfo[] = []

      for (const entry of context.logEntries) {
        const entryAny = entry as any
        const messageHeader = entryAny.message.split('\n')[0]

        if (context.sinceRef && entryAny.hash === context.sinceRef) {
          core.debug(
            `Skipping commit ${entryAny.hash} because it is the same as the sinceRef: ${messageHeader}`
          )
          continue
        }

        core.debug(`Best guess parsing commit ${entryAny.hash}: ${messageHeader}`)

        // Heuristic parsing
        const breaking =
          /breaking|break/i.test(entryAny.message) ||
          /!:/.test(messageHeader) ||
          /major/i.test(messageHeader)

        let type = null
        let scope = null
        let subject = messageHeader

        // Try to extract type and scope from common patterns
        const typeMatch = messageHeader.match(/^(\w+)(\([^)]+\))?:\s*(.+)/)
        if (typeMatch) {
          type = typeMatch[1] ?? null
          scope = typeMatch[2] ? typeMatch[2].slice(1, -1) : null
          subject = typeMatch[3] ?? messageHeader
        } else {
          // Guess type from keywords
          if (/fix|bug|patch/i.test(messageHeader)) {
            type = 'fix'
          } else if (/feat|feature|add/i.test(messageHeader)) {
            type = 'feat'
          } else if (/chore|refactor|docs|style|test/i.test(messageHeader)) {
            type = 'chore'
          }
        }

        commits.push({
          type,
          scope,
          subject,
          breaking,
          header: messageHeader,
        })
      }

      return {
        applied: true,
        success: true,
        result: commits,
        message: `Best guess parsed ${commits.length} commits`,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        applied: true,
        success: false,
        message: `Best guess commit parsing failed: ${errorMessage}`,
      }
    }
  }
}

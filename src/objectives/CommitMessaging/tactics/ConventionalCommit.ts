import * as core from '@actions/core'
import conventionalCommitsParser from 'conventional-commits-parser'
import type { Tactic, TacticResult, CommitInfo, CommitParsingContext } from '@types'

/**
 * ConventionalCommitTactic - Parse commits using conventional commit format.
 */
export class ConventionalCommitTactic implements Tactic<CommitInfo[], CommitParsingContext> {
  public readonly name = 'ConventionalCommit'

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

        core.debug(`Parsing commit ${entryAny.hash}: ${messageHeader}`)

        const parsed = conventionalCommitsParser.sync(entryAny.message)

        // Only process if it's a valid conventional commit
        if (parsed.type) {
          const breaking = Boolean(
            (parsed.notes && parsed.notes.find((n) => n.title === 'BREAKING CHANGE')) ||
              (typeof parsed.header === 'string' && /!:/.test(parsed.header))
          )

          commits.push({
            type: parsed.type,
            scope: parsed.scope || null,
            subject: parsed.subject || null,
            breaking,
            header: parsed.header,
          })
        }
      }

      if (commits.length > 0) {
        return {
          applied: true,
          success: true,
          result: commits,
          message: `Parsed ${commits.length} conventional commits`,
        }
      } else {
        return {
          applied: true,
          success: false,
          message: 'No valid conventional commits found',
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        applied: true,
        success: false,
        message: `Conventional commit parsing failed: ${errorMessage}`,
      }
    }
  }
}

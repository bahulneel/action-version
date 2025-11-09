import { maneuver } from '~/maneuver.js'
import type { CommitInfo, CommitParsingContext } from '@types'
import { ConventionalCommitTactic } from '../tactics/ConventionalCommit.js'
import { BestGuessCommitTactic } from '../tactics/BestGuessCommit.js'

/**
 * ParseCommits maneuver.
 * Try conventional parsing first, fallback to heuristic parsing.
 */
export const parseCommits = maneuver.one<CommitInfo[], CommitParsingContext>(
  [new ConventionalCommitTactic(), new BestGuessCommitTactic()],
  'ParseCommits',
  'Parse commits using conventional or heuristic tactics'
)

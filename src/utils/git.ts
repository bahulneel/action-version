import simpleGit from 'simple-git'

const git = simpleGit()

/**
 * Get commits affecting a specific directory.
 */
export async function getCommitsAffecting(
  dir: string,
  sinceRef?: string
): Promise<readonly any[]> {
  const logArgs = sinceRef ? [`${sinceRef}..HEAD`, '--', dir] : ['--all', '--', dir]
  const log = await git.log(logArgs)
  return log.all
}


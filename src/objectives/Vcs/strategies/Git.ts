import path from 'node:path'
import { SimpleGit } from '@adapters/Git/SimpleGit.js'
import type {
  VcsGoals,
  VcsConfig,
  BumpType,
  GitSetupResult,
  GitSetupContext,
  StrategyOf,
} from '@types'
import { SetupGitTactic } from '../tactics/SetupGit.js'
import { interpolateTemplate } from '@utils/template.js'

/**
 * Git VCS strategy.
 * Implements version control operations using Git.
 */
export class Git implements StrategyOf<VcsGoals> {
  public readonly name = 'git'
  public readonly description = 'Git-backed VCS strategy'
  private readonly git = new SimpleGit()

  constructor(_config: VcsConfig) {}

  public async setup(context: GitSetupContext): Promise<GitSetupResult> {
    // Use SetupGit tactic directly (it handles all setup steps)
    const tactic = new SetupGitTactic()
    const tacticResult = await tactic.attempt(context)

    if (tacticResult.success && tacticResult.result) {
      return tacticResult.result
    }

    throw new Error(`Git setup failed: ${tacticResult.message}`)
  }

  public async commitVersionChange(
    packageDir: string,
    packageName: string,
    version: string,
    bumpType: BumpType,
    template: string
  ): Promise<void> {
    const message = template
      ? interpolateTemplate(template, { packageName, version, bumpType })
      : `chore${packageName === 'root' ? '' : `(${packageName})`}: bump to ${version}`
    await this.git.add(path.join(packageDir, 'package.json'))
    await this.git.commit(message)
  }

  public async commitDependencyUpdate(
    packageDir: string,
    packageName: string,
    depName: string,
    depVersion: string,
    template: string
  ): Promise<void> {
    const message = template
      ? interpolateTemplate(template, {
          packageName,
          dependencyName: depName,
          dependencyVersion: depVersion,
        })
      : `chore${
          packageName === 'root' ? '' : `(${packageName})`
        }: update ${depName} to ${depVersion}`
    await this.git.add(path.join(packageDir, 'package.json'))
    await this.git.commit(message)
  }

  public async tagVersion(
    version: string,
    _isPrerelease: boolean,
    shouldTag: boolean
  ): Promise<void> {
    if (!shouldTag) return
    const tag = `v${version}`
    await this.git.addTag(tag)
  }

  public async prepareVersionBranch(versionedBranch: string, tempRef?: string): Promise<void> {
    if (!tempRef) return
    await this.git.raw('update-ref', `refs/heads/${versionedBranch}`, tempRef)
  }
}

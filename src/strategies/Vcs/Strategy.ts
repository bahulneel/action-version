import path from 'node:path'
import { SimpleGit } from '../../adapters/Git/SimpleGit.js'
import type { VcsInterface, VcsConfig } from '../../types/strategies/vcs.js'
import type { BumpType, GitSetupResult } from '../../types/index.js'
import { TacticalPlan } from '../../tactics/TacticalPlan.js'
import { SetupGitTactic } from './tactics/SetupGit.js'
import type { GitSetupContext } from './tactics/SetupGit.js'
import { interpolateTemplate } from '../../utils/template.js'

export class Strategy implements VcsInterface {
  public readonly name = 'git'
  public readonly description?: string = 'Git-backed VCS strategy'
  private readonly git = new SimpleGit()

  constructor(_config: VcsConfig) {}

  public async setup(context: GitSetupContext): Promise<GitSetupResult> {
    const plan = new TacticalPlan<GitSetupResult, GitSetupContext>(
      [new SetupGitTactic()],
      'VcsSetup',
      'Prepare repository for version operations'
    )
    return await plan.execute(context)
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
      : `chore${packageName === 'root' ? '' : `(${packageName})`}: update ${depName} to ${depVersion}`
    await this.git.add(path.join(packageDir, 'package.json'))
    await this.git.commit(message)
  }

  public async tagVersion(version: string, _isPrerelease: boolean, shouldTag: boolean): Promise<void> {
    if (!shouldTag) return
    const tag = `v${version}`
    await this.git.addTag(tag)
  }

  public async prepareVersionBranch(versionedBranch: string, tempRef?: string): Promise<void> {
    if (!tempRef) return
    await this.git.raw('update-ref', `refs/heads/${versionedBranch}`, tempRef)
  }
}



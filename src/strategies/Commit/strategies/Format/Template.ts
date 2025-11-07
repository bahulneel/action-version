import type {
  FormatCommitStrategy,
  FormatVersionContext,
  FormatDependencyContext,
} from '../../../../types/strategies/commit.js'
import { interpolateTemplate } from '../../../../utils/template.js'

/**
 * Template-based format strategy.
 * Uses template interpolation for commit message formatting.
 */
export class Template implements FormatCommitStrategy {
  public readonly name = 'template'

  constructor(private commitMsgTemplate: string, private depCommitMsgTemplate: string) {}

  public async formatVersion(context: FormatVersionContext): Promise<string> {
    return interpolateTemplate(this.commitMsgTemplate, {
      packageName: context.packageName,
      version: context.version,
      bumpType: context.bumpType,
    })
  }

  public async formatDependency(context: FormatDependencyContext): Promise<string> {
    return interpolateTemplate(this.depCommitMsgTemplate, {
      packageName: context.packageName,
      dependencyName: context.depName,
      dependencyVersion: context.depVersion,
    })
  }
}

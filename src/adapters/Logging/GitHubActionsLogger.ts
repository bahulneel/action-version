import * as core from '@actions/core'
import type { LoggingAdapter } from './LoggingAdapter.js'

/**
 * GitHub Actions logging adapter implementation.
 * Uses @actions/core for all logging operations.
 */
export class GitHubActionsLogger implements LoggingAdapter {
  info(message: string): void {
    core.info(message)
  }

  warning(message: string): void {
    core.warning(message)
  }

  error(message: string): void {
    core.error(message)
  }

  notice(message: string): void {
    core.notice(message)
  }

  debug(message: string): void {
    core.debug(message)
  }

  startGroup(title: string): void {
    core.startGroup(title)
  }

  endGroup(): void {
    core.endGroup()
  }
}

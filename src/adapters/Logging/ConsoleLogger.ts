import type { LoggingAdapter } from './LoggingAdapter.js'

/**
 * Console logging adapter implementation.
 * Uses console for all logging operations (for non-GitHub Actions environments).
 */
export class ConsoleLogger implements LoggingAdapter {
  info(message: string): void {
    console.log(message)
  }

  warning(message: string): void {
    console.warn(message)
  }

  error(message: string): void {
    console.error(message)
  }

  notice(message: string): void {
    console.log(`[NOTICE] ${message}`)
  }

  debug(message: string): void {
    if (process.env.DEBUG) {
      console.debug(message)
    }
  }

  startGroup(title: string): void {
    console.group(title)
  }

  endGroup(): void {
    console.groupEnd()
  }
}

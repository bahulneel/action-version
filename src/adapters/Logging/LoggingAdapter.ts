/**
 * Logging adapter interface.
 * Abstracts operational logging from specific implementations (GitHub Actions, Console, etc.).
 */
export interface LoggingAdapter {
  info(message: string): void
  warning(message: string): void
  error(message: string): void
  notice(message: string): void
  debug(message: string): void
  startGroup(title: string): void
  endGroup(): void
}

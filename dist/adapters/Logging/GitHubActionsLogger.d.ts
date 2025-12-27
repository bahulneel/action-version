import type { LoggingAdapter } from './LoggingAdapter.js';
/**
 * GitHub Actions logging adapter implementation.
 * Uses @actions/core for all logging operations.
 */
export declare class GitHubActionsLogger implements LoggingAdapter {
    info(message: string): void;
    warning(message: string): void;
    error(message: string): void;
    notice(message: string): void;
    debug(message: string): void;
    startGroup(title: string): void;
    endGroup(): void;
}
//# sourceMappingURL=GitHubActionsLogger.d.ts.map
import type { LoggingAdapter } from './LoggingAdapter.js';
/**
 * Console logging adapter implementation.
 * Uses console for all logging operations (for non-GitHub Actions environments).
 */
export declare class ConsoleLogger implements LoggingAdapter {
    info(message: string): void;
    warning(message: string): void;
    error(message: string): void;
    notice(message: string): void;
    debug(message: string): void;
    startGroup(title: string): void;
    endGroup(): void;
}
//# sourceMappingURL=ConsoleLogger.d.ts.map
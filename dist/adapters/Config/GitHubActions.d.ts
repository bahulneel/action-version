import type { ConfigAdapter } from '../../types/config.js';
/**
 * GitHub Actions config adapter implementation.
 * Reads configuration from GitHub Actions inputs.
 */
export declare class GitHubActions implements ConfigAdapter {
    readString(key: string): string | undefined;
    readBoolean(key: string): boolean;
    readNumber(key: string): number | undefined;
}
//# sourceMappingURL=GitHubActions.d.ts.map
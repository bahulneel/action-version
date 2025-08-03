/**
 * Utility for parsing tactic-specific configuration from GitHub Actions inputs.
 * Uses the pattern {tactic_name}_{option_name} for input names.
 */
export declare class TacticConfig {
    /**
     * Get tactic-specific configuration options.
     * @param tacticName The name of the tactic (e.g., 'MergeBase', 'LastVersionCommit')
     * @param options Object defining the expected options and their types
     * @returns Object with parsed configuration values
     */
    static getTacticOptions<T extends Record<string, any>>(tacticName: string, options: Record<keyof T, 'string' | 'number' | 'boolean'>): T;
    /**
     * Get a single tactic option value.
     * @param tacticName The name of the tactic
     * @param optionName The name of the option
     * @param defaultValue Default value if not set
     * @returns The option value or default
     */
    static getTacticOption<T>(tacticName: string, optionName: string, defaultValue: T): T;
}
//# sourceMappingURL=tactic-config.d.ts.map
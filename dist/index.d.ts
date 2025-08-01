import 'source-map-support/register';
/**
 * Main application class that orchestrates the version bump process.
 * Follows clean architecture principles with proper separation of concerns.
 */
declare class VersionBumpApplication {
    private exitCode;
    private outputBranch;
    private hasBumped;
    /**
     * Run the complete version bump process.
     */
    run(): Promise<void>;
    /**
     * Parse and validate action configuration from inputs.
     */
    private parseConfiguration;
    /**
     * Handle errors that occur during execution.
     */
    private handleError;
    /**
     * Finalize the process by pushing changes if any were made.
     */
    private finalize;
    /**
     * Set GitHub Actions outputs based on results.
     */
    private setActionOutputs;
}
/**
 * Application entry point.
 * Creates and runs the version bump application.
 */
declare function main(): Promise<void>;
export { VersionBumpApplication, main };
export default main;
//# sourceMappingURL=index.d.ts.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractManeuver = void 0;
/**
 * Abstract base class for all maneuver types.
 * Defines the common interface and structure for executing tactics.
 */
class AbstractManeuver {
    tactics;
    name;
    description;
    constructor(tactics, name, description) {
        this.tactics = tactics;
        this.name = name;
        if (description) {
            this.description = description;
        }
    }
    /**
     * Helper to execute a single tactic and handle its result.
     */
    async executeTactic(tactic, context) {
        // Assess if this tactic is applicable
        if (!tactic.assess(context)) {
            return {
                applied: false,
                success: false,
                message: 'Not applicable to this context',
            };
        }
        try {
            const result = await tactic.attempt(context);
            // Update context with any new information
            if (result.context && typeof context === 'object' && context !== null) {
                Object.assign(context, result.context);
            }
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                applied: true,
                success: false,
                message: `Error: ${errorMessage}`,
            };
        }
    }
}
exports.AbstractManeuver = AbstractManeuver;
//# sourceMappingURL=Abstract.js.map
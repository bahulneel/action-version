"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maneuver = void 0;
const One_js_1 = require("~/maneuvers/One.js");
const Any_js_1 = require("~/maneuvers/Any.js");
const All_js_1 = require("~/maneuvers/All.js");
/**
 * Maneuver factory for creating different execution strategies.
 */
exports.maneuver = {
    /**
     * One: Execute tactics in sequence until one succeeds (fallback behavior).
     * If a tactic fails, tries the next one.
     */
    one: (tactics, name, description) => new One_js_1.OneManeuver(tactics, name, description),
    /**
     * Any: Execute first matching (assessed) tactic.
     * Does not retry on failure - assessment determines which tactic runs.
     */
    any: (tactics, name, description) => new Any_js_1.AnyManeuver(tactics, name, description),
    /**
     * All: Execute all applicable tactics and collect results.
     * Returns aggregated results with success/failure status for each.
     */
    all: (tactics, name, description) => new All_js_1.AllManeuver(tactics, name, description),
};
//# sourceMappingURL=maneuver.js.map
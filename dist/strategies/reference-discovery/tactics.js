"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferenceDiscoveryTactics = void 0;
const merge_base_js_1 = require("./tactics/merge-base.js");
const last_version_commit_js_1 = require("./tactics/last-version-commit.js");
const diff_based_version_commit_js_1 = require("./tactics/diff-based-version-commit.js");
const execute_plan_js_1 = require("./tactics/execute-plan.js");
const TacticalPlan_js_1 = require("../../TacticalPlan.js");
/**
 * Reference Discovery Tactics - Tactical plans for different scenarios.
 *
 * This module provides pre-configured tactical plans for reference discovery:
 * - Different workflows use different tactical arrangements
 * - Tactical execution order is explicit and configurable
 * - Plans are composable and testable
 */
class ReferenceDiscoveryTactics {
    /**
     * Branch-based reference discovery plan.
     *
     * Order: MergeBase -> LastVersionCommit
     *
     * This tries to find the merge base first (most accurate for branch workflows),
     * but falls back to finding the last version change commit if merge base fails.
     */
    static branchBased() {
        return new TacticalPlan_js_1.TacticalPlan([new merge_base_js_1.MergeBaseTactic(), new last_version_commit_js_1.LastVersionCommitTactic()], 'Branch-based reference discovery: MergeBase -> LastVersionCommit');
    }
    /**
     * Tag-based reference discovery plan.
     *
     * For now, this just uses the version commit tactic since tag-based
     * discovery is still handled in the main DiscoveryService.
     * In the future, we could create a TagBasedTactic.
     */
    static tagBased() {
        return new TacticalPlan_js_1.TacticalPlan([new last_version_commit_js_1.LastVersionCommitTactic()], 'Tag-based reference discovery: LastVersionCommit only');
    }
    /**
     * Composed version commit discovery plan.
     *
     * Uses both the efficient -L approach and the thorough diff-based approach.
     * This provides the best of both worlds: speed and reliability.
     */
    static composedVersionCommit() {
        return new TacticalPlan_js_1.TacticalPlan([new last_version_commit_js_1.LastVersionCommitTactic(), new diff_based_version_commit_js_1.DiffBasedVersionCommitTactic()], 'Composed version commit discovery: LastVersionCommit -> DiffBasedVersionCommit');
    }
    /**
     * Create a plan that can be executed as a tactic.
     *
     * This enables composition where plans can be nested and reused.
     */
    static createExecutablePlan(plan, name) {
        return new execute_plan_js_1.ExecutePlanTactic(plan, name);
    }
}
exports.ReferenceDiscoveryTactics = ReferenceDiscoveryTactics;
//# sourceMappingURL=tactics.js.map
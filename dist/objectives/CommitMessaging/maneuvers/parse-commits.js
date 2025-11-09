"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCommits = void 0;
const maneuver_js_1 = require("~/maneuver.js");
const ConventionalCommit_js_1 = require("../tactics/ConventionalCommit.js");
const BestGuessCommit_js_1 = require("../tactics/BestGuessCommit.js");
/**
 * ParseCommits maneuver.
 * Try conventional parsing first, fallback to heuristic parsing.
 */
exports.parseCommits = maneuver_js_1.maneuver.one([new ConventionalCommit_js_1.ConventionalCommitTactic(), new BestGuessCommit_js_1.BestGuessCommitTactic()], 'ParseCommits', 'Parse commits using conventional or heuristic tactics');
//# sourceMappingURL=parse-commits.js.map
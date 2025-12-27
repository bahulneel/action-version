"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleLogger = void 0;
/**
 * Console logging adapter implementation.
 * Uses console for all logging operations (for non-GitHub Actions environments).
 */
class ConsoleLogger {
    info(message) {
        console.log(message);
    }
    warning(message) {
        console.warn(message);
    }
    error(message) {
        console.error(message);
    }
    notice(message) {
        console.log(`[NOTICE] ${message}`);
    }
    debug(message) {
        if (process.env.DEBUG) {
            console.debug(message);
        }
    }
    startGroup(title) {
        console.group(title);
    }
    endGroup() {
        console.groupEnd();
    }
}
exports.ConsoleLogger = ConsoleLogger;
//# sourceMappingURL=ConsoleLogger.js.map
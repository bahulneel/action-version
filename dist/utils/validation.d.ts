import type { ActionConfiguration, ValidationError } from '../types/index.js';
/**
 * Custom validation error class.
 */
export declare class ConfigurationValidationError extends Error implements ValidationError {
    readonly field: string;
    readonly value: unknown;
    constructor(message: string, field: string, value: unknown);
}
/**
 * Validate action configuration inputs.
 */
export declare function validateConfiguration(config: Partial<ActionConfiguration>): ActionConfiguration;
/**
 * Type guard to check if a value is a non-empty string.
 */
export declare function isNonEmptyString(value: unknown): value is string;
/**
 * Type guard to check if a value is a valid RegExp.
 */
export declare function isValidRegExp(value: unknown): value is RegExp;
/**
 * Validate an array contains only valid elements.
 */
export declare function validateArray<T>(array: unknown[], validator: (item: unknown) => item is T, fieldName: string): T[];
//# sourceMappingURL=validation.d.ts.map
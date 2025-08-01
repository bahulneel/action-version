import type { InterpolationVars } from '../types/index.js';
/**
 * Interpolate variables into a template string.
 * Replaces ${variableName} patterns with corresponding values from the vars object.
 *
 * @param template - The template string containing ${variable} patterns
 * @param vars - Object containing variable values
 * @returns The interpolated string
 *
 * @example
 * interpolateTemplate('Hello ${name}!', { name: 'World' }) // 'Hello World!'
 */
export declare function interpolateTemplate(template: string, vars: InterpolationVars): string;
/**
 * Validate that a template string contains only expected variable names.
 *
 * @param template - The template string to validate
 * @param allowedVars - Array of allowed variable names
 * @returns Array of invalid variable names found in the template
 */
export declare function validateTemplate(template: string, allowedVars: readonly string[]): string[];
/**
 * Extract all variable names from a template string.
 *
 * @param template - The template string to analyze
 * @returns Array of unique variable names found in the template
 */
export declare function extractTemplateVars(template: string): string[];
//# sourceMappingURL=template.d.ts.map
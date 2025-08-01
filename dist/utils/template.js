"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interpolateTemplate = interpolateTemplate;
exports.validateTemplate = validateTemplate;
exports.extractTemplateVars = extractTemplateVars;
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
function interpolateTemplate(template, vars) {
    return template.replace(/\$\{(\w+)\}/g, (match, variableName) => {
        const value = vars[variableName];
        return value !== undefined ? String(value) : match;
    });
}
/**
 * Validate that a template string contains only expected variable names.
 *
 * @param template - The template string to validate
 * @param allowedVars - Array of allowed variable names
 * @returns Array of invalid variable names found in the template
 */
function validateTemplate(template, allowedVars) {
    const variableMatches = template.matchAll(/\$\{(\w+)\}/g);
    const usedVars = Array.from(variableMatches, match => match[1]);
    const allowedSet = new Set(allowedVars);
    return usedVars.filter(varName => !allowedSet.has(varName));
}
/**
 * Extract all variable names from a template string.
 *
 * @param template - The template string to analyze
 * @returns Array of unique variable names found in the template
 */
function extractTemplateVars(template) {
    const variableMatches = template.matchAll(/\$\{(\w+)\}/g);
    const vars = Array.from(variableMatches, match => match[1]);
    return Array.from(new Set(vars));
}
//# sourceMappingURL=template.js.map
import type {
  ActionConfiguration,
  ValidationError,
  BranchCleanupStrategyType,
} from '../types/index.js';
import { isStrategyName, isBranchCleanupStrategy } from '../utils/guards.js';

/**
 * Custom validation error class.
 */
export class ConfigurationValidationError extends Error implements ValidationError {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown
  ) {
    super(message);
    this.name = 'ConfigurationValidationError';
  }
}

/**
 * Validate action configuration inputs.
 */
export function validateConfiguration(config: Partial<ActionConfiguration>): ActionConfiguration {
  const errors: ConfigurationValidationError[] = [];

  // Validate strategy
  if (config.strategy && !isStrategyName(config.strategy)) {
    errors.push(new ConfigurationValidationError(
      `Invalid strategy: ${config.strategy}. Must be one of: do-nothing, apply-bump, pre-release`,
      'strategy',
      config.strategy
    ));
  }

  // Validate branch cleanup strategy
  if (config.branchCleanup && !isBranchCleanupStrategy(config.branchCleanup)) {
    errors.push(new ConfigurationValidationError(
      `Invalid branch cleanup strategy: ${config.branchCleanup}. Must be one of: keep, prune, semantic`,
      'branchCleanup',
      config.branchCleanup
    ));
  }

  // Validate branch names
  if (config.activeBranch !== undefined && config.activeBranch.trim() === '') {
    errors.push(new ConfigurationValidationError(
      'branch cannot be empty if provided',
      'activeBranch',
      config.activeBranch
    ));
  }

  if (config.baseBranch !== undefined && config.baseBranch.trim() === '') {
    errors.push(new ConfigurationValidationError(
      'base cannot be empty if provided',
      'baseBranch',
      config.baseBranch
    ));
  }

  // Validate templates contain required variables
  if (config.commitMsgTemplate) {
    const requiredVars = ['package', 'version', 'bumpType'];
    const templateVars = extractTemplateVars(config.commitMsgTemplate);
    const missingVars = requiredVars.filter(v => !templateVars.includes(v));
    
    if (missingVars.length > 0) {
      errors.push(new ConfigurationValidationError(
        `Commit template missing required variables: ${missingVars.join(', ')}`,
        'commitMsgTemplate',
        config.commitMsgTemplate
      ));
    }
  }

  if (config.depCommitMsgTemplate) {
    const requiredVars = ['package', 'depPackage', 'depVersion'];
    const templateVars = extractTemplateVars(config.depCommitMsgTemplate);
    const missingVars = requiredVars.filter(v => !templateVars.includes(v));
    
    if (missingVars.length > 0) {
      errors.push(new ConfigurationValidationError(
        `Dependency commit template missing required variables: ${missingVars.join(', ')}`,
        'depCommitMsgTemplate',
        config.depCommitMsgTemplate
      ));
    }
  }

  // Validate strategy compatibility
  if (config.strategy === 'pre-release' && !config.baseBranch) {
    // This is a warning, not an error
    console.warn('Using pre-release strategy without base - prerelease finalization will not be available');
  }

  if (errors.length > 0) {
    const errorMessage = errors.map(e => `${e.field}: ${e.message}`).join('; ');
    throw new ConfigurationValidationError(
      `Configuration validation failed: ${errorMessage}`,
      'configuration',
      config
    );
  }

  // Create default regex pattern
  const templateRegex = new RegExp(
    (config.branchTemplate || 'release/${version}').replace(/\$\{(\w+)\}/g, '(?<$1>\\w+)')
  );

  // Return validated configuration with defaults
  return {
    commitMsgTemplate: config.commitMsgTemplate || 'chore(release): bump ${package} to ${version} (${bumpType})',
    depCommitMsgTemplate: config.depCommitMsgTemplate || 'chore(deps): update ${depPackage} to ${depVersion} in ${package} (patch)',
    shouldCreateBranch: config.shouldCreateBranch || false,
    branchTemplate: config.branchTemplate || 'release/${version}',
    templateRegex,
    branchCleanup: (config.branchCleanup as BranchCleanupStrategyType) || 'keep',
    baseBranch: config.baseBranch,
    strategy: config.strategy || 'do-nothing',
    activeBranch: config.activeBranch || 'develop',
    tagPrereleases: config.tagPrereleases || false,
  };
}

/**
 * Extract template variables from a template string.
 */
function extractTemplateVars(template: string): string[] {
  const matches = template.matchAll(/\$\{(\w+)\}/g);
  return Array.from(matches, match => match[1]!);
}

/**
 * Type guard to check if a value is a non-empty string.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Type guard to check if a value is a valid RegExp.
 */
export function isValidRegExp(value: unknown): value is RegExp {
  return value instanceof RegExp;
}

/**
 * Validate an array contains only valid elements.
 */
export function validateArray<T>(
  array: unknown[],
  validator: (item: unknown) => item is T,
  fieldName: string
): T[] {
  const validItems: T[] = [];
  const invalidItems: unknown[] = [];

  for (const item of array) {
    if (validator(item)) {
      validItems.push(item);
    } else {
      invalidItems.push(item);
    }
  }

  if (invalidItems.length > 0) {
    throw new ConfigurationValidationError(
      `Invalid items in ${fieldName}: ${JSON.stringify(invalidItems)}`,
      fieldName,
      invalidItems
    );
  }

  return validItems;
}
import antfu from '@antfu/eslint-config'

export default antfu({
  // Enable all features
  typescript: false,
  vue: false,
  react: false,
  svelte: false,
  unocss: false,
  markdown: false,
  yaml: false,
  json: false,
  jsonc: false,
  toml: false,
  astro: false,
  solid: false,
  tailwindcss: false,
  prettier: false,

  // Node.js specific settings
  node: true,

  // CommonJS specific settings
  rules: {
    // Allow CommonJS require statements
    'import/no-commonjs': 'off',
    'unicorn/prefer-module': 'off',

    // Allow console statements for GitHub Actions
    'no-console': 'off',

    // Allow unused variables in function parameters (for destructuring)
    'unused-imports/no-unused-vars': ['error', {
      varsIgnorePattern: '^_',
      argsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
    }],

    // Allow async functions without await
    'require-await': 'off',

    // Allow empty catch blocks (common in this codebase)
    'no-empty': 'off',

    // Allow unused expressions (for destructuring)
    'no-unused-expressions': 'off',

    // Allow template literals without expressions
    'prefer-template': 'off',

    // Allow var declarations (for compatibility)
    'no-var': 'off',

    // Allow function declarations
    'func-style': 'off',

    // Allow nested ternary operators
    'no-nested-ternary': 'off',

    // Allow multiple empty lines
    'no-multiple-empty-lines': 'off',

    // Allow trailing commas
    'comma-dangle': 'off',

    // Allow semicolons (CommonJS style)
    'semi': 'off',
    '@stylistic/semi': 'off',

    // Allow quotes (CommonJS style)
    'quotes': 'off',
    '@stylistic/quotes': 'off',

    // Allow indentation (CommonJS style)
    'indent': 'off',
    '@stylistic/indent': 'off',

    // Allow line breaks
    'linebreak-style': 'off',

    // Allow max line length
    'max-len': 'off',
    '@stylistic/max-len': 'off',

    // Allow global process variable (CommonJS)
    'node/prefer-global/process': 'off',

    // Allow undefined variables (for functions that are defined elsewhere)
    'no-undef': 'warn',

    // Allow template string expressions
    'no-template-curly-in-string': 'off',

    // Allow unused variables with underscore prefix
    'no-unused-vars': 'off',
  },

  // Ignore patterns
  ignores: [
    'node_modules/',
    'dist/',
    'coverage/',
    '.git/',
    '*.min.js',
    'action.yml',
  ],
})

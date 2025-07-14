const js = require('@eslint/js');

module.exports = [
  js.configs.recommended,
  {
    ignores: ['dist/**']
  },
  {
    files: ['**/*.cjs', '**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        console: 'readonly',
        process: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        URL: 'readonly',
        XMLHttpRequest: 'readonly',
        window: 'readonly',
        queueMicrotask: 'readonly',
        navigator: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        DOMException: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        URLSearchParams: 'readonly',
        atob: 'readonly',
        performance: 'readonly',
        AbortSignal: 'readonly',
        EventTarget: 'readonly',
        Event: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-console': 'off',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'indent': ['error', 2],
      'no-trailing-spaces': 'error',
      'eol-last': 'error',
      'no-multiple-empty-lines': ['error', { max: 2 }],
      'comma-dangle': ['error', 'never'],
      'brace-style': ['error', '1tbs'],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'require-yield': 'off',
      'getter-return': 'off',
      'no-cond-assign': 'off',
      'no-prototype-builtins': 'off',
      'no-useless-escape': 'off',
      'no-redeclare': 'off'
    }
  }
];

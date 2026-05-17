import js from '@eslint/js';
import globals from 'globals';

const browserFiles = ['assets/app.js', 'assets/config-local-loader.js', 'config.js'];

const nodeFiles = [
  'lambda/index.mjs',
  'lambda/migrate-legacy-data.mjs',
  'scripts/generate-local-config.mjs',
  'eslint.config.js',
];

export default [
  {
    ignores: [
      'node_modules/**',
      'lambda/node_modules/**',
      'lambda/bundle.js',
      'lambda/bundle.cjs',
      'lambda/bundle.mjs',
      'config.local.js',
      '**/* 2.html',
      'lambda/* 2.mjs',
    ],
  },
  js.configs.recommended,
  {
    files: browserFiles,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        Chart: 'readonly',
        WQT_CONFIG: 'readonly',
        WQT_LOCAL_CONFIG: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
    },
  },
  {
    files: nodeFiles,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
    },
  },
];

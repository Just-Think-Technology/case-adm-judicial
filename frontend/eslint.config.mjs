import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', 'coverage/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  // Node-run helpers (stub API, playwright setup) use server globals.
  {
    files: ['e2e/fixtures/*.mjs', 'playwright.config.ts', 'postcss.config.mjs'],
    languageOptions: { globals: globals.node },
  },
);

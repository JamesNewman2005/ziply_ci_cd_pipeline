import { baseConfig } from './base.js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export const reactConfig = [
  ...baseConfig,
  {
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
];

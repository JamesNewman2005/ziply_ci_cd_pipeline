import { baseConfig } from './base.js';
import reactHooks from 'eslint-plugin-react-hooks';

export const reactNativeConfig = [
  ...baseConfig,
  {
    languageOptions: {
      globals: { __DEV__: 'readonly' },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
];

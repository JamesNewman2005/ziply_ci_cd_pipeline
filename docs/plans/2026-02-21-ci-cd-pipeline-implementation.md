# Ziply CI/CD Pipeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build reusable GitHub Actions CI/CD workflows with shared ESLint and Vitest configs for ziply_app (Expo) and ziply_website (React/Vite).

**Architecture:** Reusable workflows in `ziply_ci_cd_pipeline` called by thin caller workflows in each consumer repo. Shared ESLint/Vitest configs distributed as a Git npm dependency (`@ziply/ci-config`).

**Tech Stack:** GitHub Actions, ESLint 9 (flat config), typescript-eslint 8, eslint-plugin-react-hooks, Vitest, @vitest/coverage-v8, Node.js 20

**Important:** The pipeline repo must be **public** on GitHub for reusable workflows to be callable by other repos.

---

### Task 1: Initialize Pipeline Repo Package Structure

**Files:**
- Create: `package.json`
- Create: `.gitignore`

**Step 1: Create package.json**

```json
{
  "name": "@ziply/ci-config",
  "version": "1.0.0",
  "type": "module",
  "description": "Shared CI/CD configs for Ziply projects",
  "exports": {
    "./eslint/base": "./configs/eslint/base.js",
    "./eslint/react": "./configs/eslint/react.js",
    "./eslint/react-native": "./configs/eslint/react-native.js",
    "./vitest/base": "./configs/vitest/base.js",
    "./vitest/web": "./configs/vitest/web.js",
    "./vitest/expo": "./configs/vitest/expo.js"
  },
  "dependencies": {
    "@eslint/js": "^9.0.0",
    "eslint-plugin-react-hooks": "^5.0.0",
    "globals": "^16.0.0",
    "typescript-eslint": "^8.0.0"
  },
  "peerDependencies": {
    "eslint": ">=9.0.0"
  }
}
```

**Step 2: Create .gitignore**

```
node_modules/
```

**Step 3: Create directories**

Run:
```bash
mkdir -p configs/eslint configs/vitest .github/workflows caller-templates
```

**Step 4: Install dependencies**

Run: `npm install`
Expected: `package-lock.json` created, `node_modules/` populated.

**Step 5: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "chore: initialize pipeline repo with package structure"
```

---

### Task 2: Create ESLint Configurations

**Files:**
- Create: `configs/eslint/base.js`
- Create: `configs/eslint/react.js`
- Create: `configs/eslint/react-native.js`

**Step 1: Create base ESLint config**

Write `configs/eslint/base.js`:
```js
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export const baseConfig = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.es2020 },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', '.expo/', 'coverage/'],
  },
);
```

**Step 2: Create React ESLint config (for ziply_website)**

Write `configs/eslint/react.js`:
```js
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
```

**Step 3: Create React Native ESLint config (for ziply_app)**

Write `configs/eslint/react-native.js`:
```js
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
```

**Step 4: Commit**

```bash
git add configs/eslint/
git commit -m "feat: add shared ESLint flat configs (base, react, react-native)"
```

---

### Task 3: Create Vitest Configurations

**Files:**
- Create: `configs/vitest/base.js`
- Create: `configs/vitest/web.js`
- Create: `configs/vitest/expo.js`

These export plain config objects. Consumer repos merge them with `mergeConfig` from `vitest/config`.

**Step 1: Create base Vitest config**

Write `configs/vitest/base.js`:
```js
export const baseTestConfig = {
  test: {
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/**/*.d.ts',
        'src/types/**',
      ],
    },
  },
};
```

**Step 2: Create web Vitest config (for ziply_website)**

Write `configs/vitest/web.js`:
```js
import { baseTestConfig } from './base.js';

export const webTestConfig = {
  ...baseTestConfig,
  test: {
    ...baseTestConfig.test,
    environment: 'jsdom',
    coverage: { ...baseTestConfig.test.coverage },
  },
};
```

**Step 3: Create Expo Vitest config (for ziply_app)**

Write `configs/vitest/expo.js`:
```js
import { baseTestConfig } from './base.js';

export const expoTestConfig = {
  ...baseTestConfig,
  test: {
    ...baseTestConfig.test,
    environment: 'jsdom',
    coverage: { ...baseTestConfig.test.coverage },
    server: {
      deps: {
        inline: [/react-native/, /expo/, /@react-navigation/],
      },
    },
  },
};
```

**Step 4: Commit**

```bash
git add configs/vitest/
git commit -m "feat: add shared Vitest configs (base, web, expo)"
```

---

### Task 4: Create Reusable GitHub Actions Workflows

**Files:**
- Create: `.github/workflows/reusable-lint-typecheck.yml`
- Create: `.github/workflows/reusable-build.yml`
- Create: `.github/workflows/reusable-test.yml`

**Step 1: Create lint-typecheck workflow**

Write `.github/workflows/reusable-lint-typecheck.yml`:
```yaml
name: Lint & Type Check

on:
  workflow_call:
    inputs:
      node-version:
        type: string
        default: '20'
      working-directory:
        type: string
        default: '.'
      typecheck-command:
        type: string
        default: 'npx tsc --noEmit'
        description: 'Command to run type checking. Use "npx tsc -b" for projects with tsconfig references.'

jobs:
  lint-typecheck:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ${{ inputs.working-directory }}
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
          cache: npm
          cache-dependency-path: ${{ inputs.working-directory }}/package-lock.json

      - run: npm ci

      - name: Lint
        run: npx eslint . --max-warnings 0

      - name: Type Check
        run: ${{ inputs.typecheck-command }}
```

**Step 2: Create build workflow**

Write `.github/workflows/reusable-build.yml`:
```yaml
name: Build

on:
  workflow_call:
    inputs:
      node-version:
        type: string
        default: '20'
      platform:
        type: string
        required: true
        description: '"web" or "expo"'
      build-command:
        type: string
        default: 'npm run build'

jobs:
  build:
    name: Build (${{ inputs.platform }})
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
          cache: npm

      - run: npm ci

      - name: Build
        run: ${{ inputs.build-command }}
```

**Step 3: Create test workflow**

Write `.github/workflows/reusable-test.yml`:
```yaml
name: Test

on:
  workflow_call:
    inputs:
      node-version:
        type: string
        default: '20'
      coverage-threshold:
        type: number
        default: 0

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
          cache: npm

      - run: npm ci

      - name: Run Tests
        run: npx vitest run --coverage

      - name: Upload Coverage
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/
          retention-days: 7
```

**Step 4: Commit**

```bash
git add .github/workflows/
git commit -m "feat: add reusable GitHub Actions workflows (lint, build, test)"
```

---

### Task 5: Create Caller Templates

**Files:**
- Create: `caller-templates/website-ci.yml`
- Create: `caller-templates/app-ci.yml`

**Step 1: Create website caller template**

Write `caller-templates/website-ci.yml`:
```yaml
# Copy this file to ziply_website/.github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    uses: JamesCole809/ziply_ci_cd_pipeline/.github/workflows/reusable-lint-typecheck.yml@main
    with:
      typecheck-command: npx tsc -b

  build:
    uses: JamesCole809/ziply_ci_cd_pipeline/.github/workflows/reusable-build.yml@main
    with:
      platform: web

  test:
    uses: JamesCole809/ziply_ci_cd_pipeline/.github/workflows/reusable-test.yml@main
```

**Step 2: Create app caller template**

Write `caller-templates/app-ci.yml`:
```yaml
# Copy this file to ziply_app/.github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    uses: JamesCole809/ziply_ci_cd_pipeline/.github/workflows/reusable-lint-typecheck.yml@main

  build:
    uses: JamesCole809/ziply_ci_cd_pipeline/.github/workflows/reusable-build.yml@main
    with:
      platform: expo
      build-command: npx expo export --platform web

  test:
    uses: JamesCole809/ziply_ci_cd_pipeline/.github/workflows/reusable-test.yml@main
```

**Step 3: Commit**

```bash
git add caller-templates/
git commit -m "feat: add caller workflow templates for website and app"
```

---

### Task 6: Integrate into ziply_website

**Context:** ziply_website is a React 19 + Vite 6 + TypeScript 5.7 project at `/Users/jamie/Documents/Projects/ziply_website`. It has `"type": "module"` in package.json. No existing ESLint or Vitest config.

**Files:**
- Modify: `package.json` (add scripts + devDependencies)
- Create: `eslint.config.js`
- Create: `vitest.config.ts`
- Create: `.github/workflows/ci.yml`

**Step 1: Install dependencies**

Run in `/Users/jamie/Documents/Projects/ziply_website`:
```bash
npm install -D eslint vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom @ziply/ci-config@file:../ziply_ci_cd_pipeline
```

> **Note:** Replace `file:../ziply_ci_cd_pipeline` with `github:JamesCole809/ziply_ci_cd_pipeline` after pushing the pipeline repo to GitHub.

**Step 2: Add scripts to package.json**

Add to `scripts` in `package.json`:
```json
"lint": "eslint .",
"lint:fix": "eslint . --fix",
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

**Step 3: Create ESLint config**

Write `eslint.config.js`:
```js
import { reactConfig } from '@ziply/ci-config/eslint/react';

export default [
  ...reactConfig,
  {
    files: ['src/**/*.{ts,tsx}'],
  },
];
```

**Step 4: Create Vitest config**

Write `vitest.config.ts`:
```ts
import { mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';
import { webTestConfig } from '@ziply/ci-config/vitest/web';

export default mergeConfig(viteConfig, webTestConfig);
```

**Step 5: Create CI workflow**

Run: `mkdir -p .github/workflows`

Copy `caller-templates/website-ci.yml` to `.github/workflows/ci.yml` (from Task 5, Step 1).

**Step 6: Run linting to verify**

Run: `npx eslint . --max-warnings 0`

Expected: Lint errors will appear since the project has never been linted. Review errors and fix them. Common issues:
- `@typescript-eslint/no-unused-vars` — remove unused imports/variables
- `@typescript-eslint/no-explicit-any` — add proper types (or suppress with `// eslint-disable-next-line`)
- `no-undef` — may need to adjust globals

**Step 7: Fix lint errors iteratively**

Run `npx eslint . --fix` first (auto-fixes formatting issues), then manually fix remaining errors. If errors are overwhelming, temporarily relax rules by adding overrides in `eslint.config.js`:
```js
{
  rules: {
    '@typescript-eslint/no-explicit-any': 'off', // TODO: enable incrementally
  },
}
```

**Step 8: Run type check**

Run: `npx tsc -b`
Expected: Should pass (project already builds with `tsc -b` in the build script).

**Step 9: Commit**

```bash
git add eslint.config.js vitest.config.ts .github/workflows/ci.yml package.json package-lock.json
git add -u  # stage any lint fixes
git commit -m "feat: add CI pipeline with ESLint, Vitest, and GitHub Actions"
```

---

### Task 7: Integrate into ziply_app

**Context:** ziply_app is an Expo 54 + React Native 0.81 + TypeScript project at `/Users/jamie/Documents/Projects/ziply_app`. It does NOT have `"type": "module"`, so ESLint config must use `.mjs` extension.

**Files:**
- Modify: `package.json` (add scripts + devDependencies)
- Create: `eslint.config.mjs` (note: `.mjs` because no `"type": "module"`)
- Create: `vitest.config.ts`
- Create: `.github/workflows/ci.yml`

**Step 1: Install dependencies**

Run in `/Users/jamie/Documents/Projects/ziply_app`:
```bash
npm install -D eslint vitest @vitest/coverage-v8 jsdom @ziply/ci-config@file:../ziply_ci_cd_pipeline
```

> **Note:** No `@testing-library/react-native` for now — Vitest tests will focus on utility functions, stores, and services rather than component rendering. Replace `file:` path with `github:` URL after pushing pipeline repo.

**Step 2: Add scripts to package.json**

Add to `scripts` in `package.json`:
```json
"lint": "eslint .",
"lint:fix": "eslint . --fix",
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

**Step 3: Create ESLint config**

Write `eslint.config.mjs`:
```js
import { reactNativeConfig } from '@ziply/ci-config/eslint/react-native';

export default [
  ...reactNativeConfig,
  {
    files: ['src/**/*.{ts,tsx}'],
  },
];
```

**Step 4: Create Vitest config**

Write `vitest.config.ts`:
```ts
import { defineConfig, mergeConfig } from 'vitest/config';
import { expoTestConfig } from '@ziply/ci-config/vitest/expo';
import { fileURLToPath, URL } from 'url';

export default mergeConfig(
  expoTestConfig,
  defineConfig({
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }),
);
```

**Step 5: Create CI workflow**

Run: `mkdir -p .github/workflows`

Copy `caller-templates/app-ci.yml` to `.github/workflows/ci.yml` (from Task 5, Step 2).

**Step 6: Run linting to verify**

Run: `npx eslint . --max-warnings 0`

Expected: Lint errors will appear. Same approach as Task 6 Step 7 — auto-fix first, then manually fix or relax rules.

**Step 7: Fix lint errors iteratively**

Run `npx eslint . --fix` first, then manually fix remaining. Add rule overrides if needed.

**Step 8: Run type check**

Run: `npx tsc --noEmit`
Expected: Should pass (project uses strict TypeScript already).

**Step 9: Commit**

```bash
git add eslint.config.mjs vitest.config.ts .github/workflows/ci.yml package.json package-lock.json
git add -u  # stage any lint fixes
git commit -m "feat: add CI pipeline with ESLint, Vitest, and GitHub Actions"
```

---

### Task 8: Update Pipeline CLAUDE.md and Push to GitHub

**Files:**
- Modify: `CLAUDE.md` (in ziply_ci_cd_pipeline)

**Step 1: Update CLAUDE.md**

Replace the contents of `/Users/jamie/Documents/Projects/ziply_ci_cd_pipeline/CLAUDE.md` with comprehensive project documentation covering: repo purpose, structure, how to add/modify workflows, how consumer repos integrate, and key commands.

**Step 2: Create the GitHub repo and push**

```bash
# In ziply_ci_cd_pipeline
gh repo create JamesCole809/ziply_ci_cd_pipeline --public --source=. --push
```

> **Important:** Repo must be **public** for reusable workflows to work across repos.

**Step 3: Update consumer repos to use GitHub dependency**

In both `ziply_website` and `ziply_app`, update `package.json`:
```json
"@ziply/ci-config": "github:JamesCole809/ziply_ci_cd_pipeline"
```

Then run `npm install` in each to update the lock file.

**Step 4: Commit dependency updates in consumer repos**

In each consumer repo:
```bash
git add package.json package-lock.json
git commit -m "chore: switch @ziply/ci-config to GitHub dependency"
```

**Step 5: Push consumer repos**

Push both repos to trigger CI workflows and verify they run correctly.

---

## Execution Notes

- **Lint error volume:** Both projects have never been linted. Expect 50-200+ errors per project. Strategy: auto-fix what you can, disable `no-explicit-any` initially, fix `no-unused-vars` manually.
- **Vitest with no tests:** Both projects have zero tests. The test workflow will still pass (Vitest exits 0 with no test files). Tests are added incrementally.
- **Local testing of configs:** Before pushing to GitHub, use `file:../ziply_ci_cd_pipeline` dependency path to test configs locally.
- **Expo build in CI:** `npx expo export --platform web` validates the JS bundle compiles. It does NOT produce native iOS/Android builds (those require Expo EAS).

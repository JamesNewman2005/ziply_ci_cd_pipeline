# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Shared CI/CD pipeline for Ziply projects. Provides reusable GitHub Actions workflows and shared ESLint/Vitest configurations distributed as an npm package (`@ziply/ci-config`).

**Consumer projects:**
- `ziply_website` — React 19 + Vite 6 SPA (uses `eslint/react` + `vitest/web`)
- `ziply_app` — Expo 54 + React Native mobile app (uses `eslint/react-native` + `vitest/expo`)

## Repository Structure

- `.github/workflows/` — Reusable GitHub Actions workflows (lint, build, test)
- `configs/eslint/` — Shared ESLint flat configs (base, react, react-native)
- `configs/vitest/` — Shared Vitest configs (base, web, expo)
- `caller-templates/` — Ready-to-copy CI workflow files for consumer repos
- `docs/plans/` — Design and implementation documentation

## How It Works

This repo is installed as a Git npm dependency by consumer projects:
```
npm install -D @ziply/ci-config@github:JamesNewman2005/ziply_ci_cd_pipeline
```

Consumer repos import configs via the package exports map:
```js
import { reactConfig } from '@ziply/ci-config/eslint/react';
import { webTestConfig } from '@ziply/ci-config/vitest/web';
```

Consumer repos call reusable workflows:
```yaml
uses: JamesNewman2005/ziply_ci_cd_pipeline/.github/workflows/reusable-lint-typecheck.yml@main
```

## Key Commands

```bash
npm install          # Install ESLint plugin dependencies
```

No build step — this is a config-only package. No tests — configs are validated by running them in consumer projects.

## Adding/Modifying Configs

- ESLint configs use ESLint 9 flat config format (`tseslint.config()`)
- Vitest configs export plain objects (not `defineConfig`-wrapped) for `mergeConfig` compatibility
- All configs use ESM (`import`/`export`) — repo has `"type": "module"`
- After changes, test in consumer repos: `cd ../ziply_website && npm run lint`

## Reusable Workflow Inputs

| Workflow | Key Inputs |
|----------|-----------|
| `reusable-lint-typecheck.yml` | `node-version`, `working-directory`, `typecheck-command` |
| `reusable-build.yml` | `node-version`, `platform` (required), `build-command` |
| `reusable-test.yml` | `node-version`, `coverage-threshold` |

## Important Notes

- This repo must be **public** on GitHub for reusable workflows to work across repos
- Consumer repos need `eslint` as a direct devDependency (peer dep of this package)
- The `@ziply/ci-config` package bundles its ESLint plugin dependencies (`@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `globals`)

# Ziply CI/CD Pipeline Design

**Date**: 2026-02-21
**Status**: Approved

## Overview

A reusable GitHub Actions CI/CD pipeline serving two projects:
- **ziply_app** — Expo (React Native) mobile app, TypeScript
- **ziply_website** — React 19 SPA, Vite 6, TypeScript, deployed on Vercel

Both share a Supabase backend. Neither has existing CI/CD, testing, or linting.

## Architecture: Reusable Workflows

This repo (`ziply_ci_cd_pipeline`) is a reusable workflow library. Consumer repos call workflows via `uses: JamesCole809/ziply_ci_cd_pipeline/.github/workflows/<name>.yml@main`.

### Repository Structure

```
ziply_ci_cd_pipeline/
├── .github/workflows/
│   ├── reusable-lint-typecheck.yml
│   ├── reusable-build.yml
│   └── reusable-test.yml
├── configs/
│   ├── eslint/
│   │   ├── base.js          # Shared ESLint base (TS-ESLint, import ordering)
│   │   ├── react.js         # React rules (react, react-hooks, jsx-a11y)
│   │   └── react-native.js  # React Native rules
│   └── vitest/
│       ├── base.ts          # Shared Vitest (v8 coverage, file patterns)
│       ├── web.ts           # jsdom environment for website
│       └── expo.ts          # jsdom + Expo module handling for app
├── caller-templates/
│   ├── website-ci.yml
│   └── app-ci.yml
├── docs/plans/
├── CLAUDE.md
└── README.md
```

## Reusable Workflows

### reusable-lint-typecheck.yml
- **Trigger**: `workflow_call`
- **Inputs**: `node-version` (default 20), `working-directory` (default `.`)
- **Steps**: checkout, setup Node.js + npm cache, `npm ci`, `npx eslint . --max-warnings 0`, `npx tsc --noEmit`

### reusable-build.yml
- **Trigger**: `workflow_call`
- **Inputs**: `node-version`, `build-command` (default `npm run build`), `platform` (`web` | `expo`)
- **Steps**: checkout, setup Node.js + npm cache, `npm ci`, run build
  - web: `npm run build` (Vite production build)
  - expo: `npx expo export --platform web` (bundle compilation check)

### reusable-test.yml
- **Trigger**: `workflow_call`
- **Inputs**: `node-version`, `coverage-threshold` (default 0)
- **Steps**: checkout, setup Node.js + npm cache, `npm ci`, `npx vitest run --coverage`, upload coverage artifact

## Shared Configurations

Distributed as a Git npm dependency: `"@ziply/ci-config": "github:JamesCole809/ziply_ci_cd_pipeline"`

### ESLint
- **base.js**: TypeScript-ESLint parser + recommended, no unused vars (error), no `any` (warn), import ordering
- **react.js**: extends base + react, react-hooks, jsx-a11y plugins
- **react-native.js**: extends base + react-native plugin

### Vitest
- **base.ts**: v8 coverage, text + lcov reporters, `**/*.{test,spec}.{ts,tsx}` pattern
- **web.ts**: extends base, jsdom environment, React Testing Library setup
- **expo.ts**: extends base, jsdom environment, Expo module transforms

## Consumer Integration

Each project adds to `package.json`:
```json
"devDependencies": {
  "@ziply/ci-config": "github:JamesCole809/ziply_ci_cd_pipeline"
}
```

Each project creates:
- `.github/workflows/ci.yml` — thin caller (from caller-templates/)
- `eslint.config.js` — imports from `@ziply/ci-config/configs/eslint/`
- `vitest.config.ts` — imports from `@ziply/ci-config/configs/vitest/`

### Caller Workflow (both projects)

All three jobs (lint, build, test) run in **parallel** on push to main and on pull requests to main.

## Pipeline Scope

| Stage | What it does |
|-------|-------------|
| Lint + Type-check | ESLint with zero warnings + `tsc --noEmit` |
| Build verification | Vite build (website) or Expo export (app) |
| Automated testing | Vitest with coverage reporting |

No deployment automation at this time. Vercel handles website deploys via Git integration. Expo builds remain manual.

## Decisions

- **No deploy stage** — out of scope for now
- **Parallel jobs** — lint, build, test run independently
- **Coverage threshold starts at 0** — both projects have zero tests today; raise incrementally
- **Node 20** — matches both projects' requirements
- **npm** — both projects use npm (not yarn/pnpm)

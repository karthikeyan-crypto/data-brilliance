# Project Structure

Data Brilliance is a React + TypeScript application built with Vite.

## Root files

- `package.json` — project metadata and development scripts.
- `package-lock.json` — npm dependency lockfile; use npm consistently for reproducible installs.
- `vite.config.ts` — Vite configuration.
- `tsconfig*.json` — TypeScript configuration.
- `eslint.config.js` — linting rules.
- `vitest.config.ts` — test runner configuration.
- `index.html` — application HTML entry point.
- `public/` — static assets served as-is.
- `src/` — application source code.

## Source layout

- `src/main.tsx` — React entry point.
- `src/App.tsx` — application shell and route setup.
- `src/pages/` — route-level page components.
- `src/components/` — reusable UI and dashboard components.
- `src/components/ui/` — shared UI primitives.
- `src/hooks/` — reusable React hooks.
- `src/lib/` — small shared utilities.
- `src/test/` — test setup and test files.
- `src/index.css` and `src/App.css` — global and app-level styles.

## Local development

Use Node.js and npm:

```bash
npm ci
npm run dev
```

## Quality checks

Run these before opening a pull request:

```bash
npm run lint
npm test
npm run build
```

## Structure guidelines

- Keep route-level page composition in `src/pages/`.
- Keep reusable visual components in `src/components/`.
- Move data-processing and file-parsing logic into focused utility modules rather than growing the main dashboard component.
- Keep shared hooks in `src/hooks/` and general helpers in `src/lib/`.
- Add tests for data-cleaning transformations and edge cases.
- Avoid committing generated output, dependency folders, local environment files, or uploaded datasets containing private information.

# Technical Writing Assistant

Technical Writing Assistant is a privacy-first Vite + React app that reviews one draft locally in the browser and now ships with GitHub Actions quality gates plus GitHub Pages deployment.

## Local Commands

- `npm run dev` - start the local app
- `npm run lint` - run the repo lint gate
- `npm run test -- --run` - run the test suite once
- `npm run build` - type-check and build the Pages artifact
- `npm run preview` - preview the built static output

## GitHub Actions and Pages

The checked-in workflow lives at `.github/workflows/ci-pages.yml` and exposes these required check names:

- `lint`
- `test`
- `build`

Automatic deployment runs from `main` only and publishes the Pages site from the uploaded build artifact. The `deploy` job stays separate so failed releases are easy to spot in pull requests and the Actions tab.

## Repository Setup

1. In GitHub, open Settings -> Pages and set the source to GitHub Actions.
2. In your `main` branch protection or ruleset, require `lint`, `test`, and `build` before merge.
3. Merge to `main` to trigger the normal production deploy path.

## Manual Redeploy

Open the Actions tab, choose the `CI and Pages` workflow, and use Run workflow on `main`. This reruns the same checked release path without changing code.

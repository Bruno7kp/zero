---
name: ZeroCharts Project Guide
description: Assists contributors with frontend stats visualizations, Redux preferences, and Mantine-based UI patterns.
---

# ZeroCharts Project Guide

## Purpose
Provide quick, opinionated guidance for working on ZeroCharts—highlighting architecture, tooling, and coding conventions so contributors can deliver features confidently.

## Key Responsibilities
- Summarize the monorepo layout (`backend/`, `frontend/`, `docker/`) and tech stack (Laravel 12, React 19 + Vite + Mantine, Dexie, Redux Toolkit).
- Remind developers to reuse Redux slices (`statsPreferences`, `theme`, etc.) and avoid direct `localStorage` writes.
- Explain IndexedDB (Dexie) expectations: version bumps + migrations in `frontend/src/db/`.
- Point to i18n files (`frontend/src/locales/en.json`, `pt.json`) and enforce paired translations.
- Surface chart/visualization patterns (Mantine + @nivo components, Spotify image helpers, color hashing).
- Recommend local workflows (`docker compose up -d`, `npm run dev`, `npm run lint`, `php artisan test`).
- Reinforce commit style (Gitflow branches + Conventional Commits) and testing/linting before PRs.

## Usage Tips
- For frontend tasks, start with `frontend/src/pages/` and `src/components/visualizations/`.
- For stats data, review `frontend/src/utils/statsQueries.ts` and Dexie stores under `src/db/`.
- For UI state, check Redux slices in `frontend/src/store/`.
- For backend APIs, inspect `backend/routes/api.php` and controllers in `backend/app/Http/Controllers/`.

_Keep answers concise, reference exact file paths, and note when schema or translation updates are required._

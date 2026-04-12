---
phase: 24
plan: 02
subsystem: tooling
tags: [playwright, e2e, dev-server, tooling]
dependency_graph:
  requires: []
  provides: [test:e2e:dev npm script, PW_DEV_SERVER env-var branching]
  affects: [playwright.config.ts, package.json]
tech_stack:
  added: []
  patterns: [env-var ternary for config branching]
key_files:
  created: []
  modified: [playwright.config.ts, package.json]
decisions:
  - Used inline PW_DEV_SERVER=1 syntax (no cross-env) since project runs on WSL/Linux
metrics:
  duration: 35s
  completed: 2026-04-12
  tasks_completed: 1
  tasks_total: 1
  files_changed: 2
---

# Phase 24 Plan 02: Dev E2E Script Summary

Env-var-branched Playwright webServer command with `test:e2e:dev` npm script for fast local E2E iteration against Turbopack dev server.

## What Was Done

### Task 1: Add env-var ternary to playwright.config.ts and test:e2e:dev script to package.json

**Commit:** a6bde9b

Replaced the hardcoded `command: 'npm run build && npm run start'` in `playwright.config.ts` with a ternary that checks `process.env.PW_DEV_SERVER === '1'`. When set, Playwright starts `npm run dev` (Turbopack, ~5s startup) instead of building first (~60s). Added `"test:e2e:dev": "PW_DEV_SERVER=1 playwright test"` to `package.json` scripts.

**Files modified:**
- `playwright.config.ts` -- webServer.command now uses PW_DEV_SERVER ternary
- `package.json` -- added test:e2e:dev script

**Preserved invariants:**
- `timeout: 120000` unchanged (D-07)
- `reuseExistingServer: !process.env.CI` unchanged (D-08)
- Default `npm run test:e2e` behavior unchanged
- No new dependencies added

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

| Check | Result |
|-------|--------|
| `grep -c '"test:e2e:dev"' package.json` | 1 |
| `grep 'PW_DEV_SERVER' playwright.config.ts` | Found ternary line |
| Old hardcoded command absent | Confirmed (0 matches) |
| Dev branch present (`npm run dev`) | Confirmed |
| Prod branch present (`npm run build && npm run start`) | Confirmed |
| Timeout 120000 preserved | Confirmed |
| reuseExistingServer preserved | Confirmed |
| Valid JSON (package.json) | Confirmed |
| `npm run lint` | 0 errors, 0 warnings |

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | a6bde9b | feat(24-02): add dev-server E2E script for fast local iteration |

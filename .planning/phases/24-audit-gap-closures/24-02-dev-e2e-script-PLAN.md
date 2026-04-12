---
phase: 24
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - playwright.config.ts
  - package.json
autonomous: true
requirements:
  - GAP-02
tags: [playwright, e2e, dev-server, tooling]

must_haves:
  truths:
    - "Running `npm run test:e2e:dev` launches Playwright against `npm run dev` (no build required)"
    - "Running `npm run test:e2e` still launches Playwright against `npm run build && npm run start` (default unchanged)"
    - "webServer.timeout stays at 120000ms for both modes (D-07)"
    - "reuseExistingServer stays at !process.env.CI for both modes (D-08)"
  artifacts:
    - path: "playwright.config.ts"
      provides: "Env-var branched webServer.command"
      contains: "PW_DEV_SERVER"
    - path: "package.json"
      provides: "test:e2e:dev script"
      contains: "test:e2e:dev"
  key_links:
    - from: "package.json test:e2e:dev script"
      to: "playwright.config.ts PW_DEV_SERVER ternary"
      via: "PW_DEV_SERVER=1 env var"
      pattern: "PW_DEV_SERVER"
---

<objective>
Close GAP-02 by adding an env-var-branched `webServer.command` in `playwright.config.ts` and a corresponding `test:e2e:dev` npm script. This removes the full-build requirement for local E2E iteration.

Purpose: Running Playwright against the dev server (Turbopack) is much faster (~5s startup vs ~60s build) for iterating on E2E tests locally. The existing `test:e2e` command is unchanged.

Output: Edited `playwright.config.ts` + `package.json`, verified script presence.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/24-audit-gap-closures/24-CONTEXT.md
@.planning/phases/24-audit-gap-closures/24-RESEARCH.md
@./CLAUDE.md

<interfaces>
<!-- Current playwright.config.ts webServer block (lines 24-29) -->
```typescript
webServer: {
  command: 'npm run build && npm run start',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
  timeout: 120000,
},
```

<!-- Current package.json scripts (lines 6-13) -->
```json
"scripts": {
  "dev": "velite --watch & next dev --turbopack",
  "build": "velite && next build",
  "start": "next start",
  "lint": "eslint .",
  "velite": "velite",
  "test": "vitest run",
  "test:e2e": "playwright test"
}
```
</interfaces>
</context>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| (none) | This plan edits local dev tooling only. No trust boundaries crossed. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| (none) | — | — | — | No security threats — env-var ternary in local dev tooling. PW_DEV_SERVER is process-local to the npm script invocation; not stored in any `.env` file, not deployed to Vercel, not used in production. |
</threat_model>

<tasks>

<task type="auto">
  <name>Task 1: Add env-var ternary to playwright.config.ts and test:e2e:dev script to package.json</name>
  <files>playwright.config.ts, package.json</files>
  <read_first>
    - playwright.config.ts (full file — 30 lines, webServer block lines 24-29)
    - package.json (scripts block lines 6-13)
    - .planning/phases/24-audit-gap-closures/24-CONTEXT.md D-05, D-06, D-07, D-08
    - .planning/phases/24-audit-gap-closures/24-RESEARCH.md Pattern 2 + Example 2 + Example 3
  </read_first>
  <action>
    Two edits — both small, zero risk of side effects.

    **Edit 1: `playwright.config.ts` line 25** — change the `command` value from a string literal to a ternary per D-05. Keep everything else identical per D-07 (timeout stays 120000) and D-08 (reuseExistingServer stays `!process.env.CI`).

    Before (line 25):
    ```typescript
    command: 'npm run build && npm run start',
    ```

    After:
    ```typescript
    command: process.env.PW_DEV_SERVER === '1'
      ? 'npm run dev'
      : 'npm run build && npm run start',
    ```

    This is the ONLY change in `playwright.config.ts`. Do NOT touch `testDir`, `fullyParallel`, `forbidOnly`, `retries`, `workers`, `reporter`, `use`, `projects`, or any other `webServer` property. The ternary evaluates at config-load time (verified empirically in RESEARCH.md).

    **Edit 2: `package.json` scripts block** — add `"test:e2e:dev"` on a new line after `"test:e2e"` per D-06. Do NOT modify any existing script. Do NOT add `cross-env` (D-05 explicitly rejects it — user is on WSL/Linux where `VAR=val cmd` syntax works natively).

    Before (line 13):
    ```json
    "test:e2e": "playwright test"
    ```

    After (lines 13-14):
    ```json
    "test:e2e": "playwright test",
    "test:e2e:dev": "PW_DEV_SERVER=1 playwright test"
    ```

    Note: add a trailing comma after the existing `"test:e2e"` line (JSON requires it since there's now a next entry) and do NOT add a trailing comma after the new last entry.
  </action>
  <verify>
    <automated>cd /home/smada/git/smadam813/keech-dev && node -e "const c = require('./playwright.config.ts'); console.log('OK')" 2>/dev/null; grep -c '"test:e2e:dev"' package.json && grep 'PW_DEV_SERVER' playwright.config.ts</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c '"test:e2e:dev"' package.json` equals 1
    - `grep 'PW_DEV_SERVER' playwright.config.ts` finds the ternary line
    - `grep "command: 'npm run build" playwright.config.ts` finds nothing (the old hardcoded string is replaced by the ternary)
    - `grep "npm run dev" playwright.config.ts` finds the dev branch of the ternary
    - `grep "npm run build && npm run start" playwright.config.ts` finds the prod branch of the ternary
    - `grep "timeout: 120000" playwright.config.ts` still present (D-07)
    - `grep "reuseExistingServer: !process.env.CI" playwright.config.ts` still present (D-08)
    - `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"` exits 0 (valid JSON)
    - `npm run lint` exits 0
  </acceptance_criteria>
  <done>
    `playwright.config.ts` uses `PW_DEV_SERVER` env-var ternary for `webServer.command`. `package.json` has `test:e2e:dev` script that sets the env var and runs Playwright. Default `test:e2e` behavior is unchanged. Timeout and reuseExistingServer are unchanged per D-07 and D-08. No new dependencies added.
  </done>
</task>

</tasks>

<verification>
- `grep '"test:e2e:dev"' package.json` — script present
- `grep 'PW_DEV_SERVER' playwright.config.ts` — ternary present
- `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"` — valid JSON (no trailing comma errors)
- `npm run lint` — green
- (Manual) `npm run test:e2e:dev` — boots Turbopack dev server and runs all E2E specs green (recommended post-execution verification)
</verification>

<success_criteria>
- GAP-02 closed per ROADMAP.md Phase 24 success criterion 3:
  Running `npm run test:e2e:dev` executes the Playwright suite against `npm run dev` (no `next build` required)
- Default `npm run test:e2e` behavior unchanged (still does `npm run build && npm run start`)
- No new dependencies, no second config file, no `cross-env`
</success_criteria>

<output>
After completion, create `.planning/phases/24-audit-gap-closures/24-02-SUMMARY.md` following the summary template. Record the env-var ternary pattern for future reference.
</output>

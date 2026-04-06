# Phase 23: Test Coverage & Code Quality - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-05
**Phase:** 23-test-coverage-code-quality
**Mode:** auto
**Areas discussed:** Route handler test strategy, CodeBlockEnhancer test approach, OG font assertion, Lint suppression resolution

---

## Route Handler Test Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Direct function import + mocked Redis | Import GET/POST, mock redis module, construct Request objects | auto |
| HTTP integration test with supertest | Spin up server, make real HTTP calls | |
| Next.js test helpers (experimental) | Use next/test (not yet stable) | |

**Auto-selected:** Direct function import with mocked Redis — matches existing test patterns, no server setup needed.
**Notes:** Success criteria SC-2 specifies NextRequest for [slug] routes. Async params (`Promise<{ slug }>`) pattern from Next.js 16 must be used.

---

## CodeBlockEnhancer Test Approach

| Option | Description | Selected |
|--------|-------------|----------|
| jsdom DOM fixture + render component | Pre-create .prose container with pre/code, render component, assert mutations | auto |
| Playwright E2E test | Test in real browser with built site | |
| JSDOM manual effect trigger | Use document.createElement without React rendering | |

**Auto-selected:** jsdom DOM fixture + render component — uses existing jsdom test environment, tests the actual React effect lifecycle.
**Notes:** Need to mock navigator.clipboard using established pattern from codebase.

---

## OG Font Assertion

| Option | Description | Selected |
|--------|-------------|----------|
| fs.existsSync in seo-assets.test.ts | Extend existing file-based assertion test file | auto |
| Standalone font test file | New test file for font checks | |

**Auto-selected:** Extend seo-assets.test.ts — follows established file-based assertion pattern, natural home for this check.

---

## Lint Suppression Resolution (QUAL-01)

| Option | Description | Selected |
|--------|-------------|----------|
| Document as intentional (keep suppressions) | Already evaluated in Phase 18, inline comments exist, add decision log entry | auto |
| Refactor with useLayoutEffect | Move DOM reads to useLayoutEffect, remove suppressions | |
| Refactor with derived state | Compute values outside effects where possible | |

**Auto-selected:** Document as intentional — Phase 18 D-08 already evaluated these as intentional animation orchestration patterns. Refactoring adds complexity for zero benefit.

---

## Claude's Discretion

- Test file naming and grouping structure
- Exact test case count per scenario
- OG font test placement within seo-assets.test.ts

## Deferred Ideas

None — analysis stayed within phase scope.

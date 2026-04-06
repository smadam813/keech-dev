# Phase 20: Dead Code & Test Hygiene - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-05
**Phase:** 20-Dead Code & Test Hygiene
**Mode:** auto
**Areas discussed:** CopyButton cleanup scope, Lucide-react outcome, Test relocation approach, tsconfig fix strategy

---

## CopyButton Cleanup Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Delete both files | Remove copy-button.tsx and copy-button.test.tsx | ✓ |
| Keep test as reference | Delete component but keep test for migration reference | |

**User's choice:** [auto] Delete both files (recommended default)
**Notes:** Component is orphaned — CodeBlockEnhancer handles copy functionality now.

---

## Lucide-react Outcome

| Option | Description | Selected |
|--------|-------------|----------|
| Keep dependency | 6 other consumers exist — not removable | ✓ |
| Remove dependency | Only valid if CopyButton was sole consumer | |

**User's choice:** [auto] Keep — 6 other consumers exist (evidence-based resolution)
**Notes:** Confirmed consumers: header.tsx, footer.tsx, mobile-toc.tsx, project-card.tsx, blog/[slug]/page.tsx, projects/[slug]/page.tsx

---

## Test Relocation Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Move and update imports | Relocate security-headers.test.ts to src/proxy.test.ts | ✓ |
| Rewrite from scratch | Write new test file for proxy.ts | |

**User's choice:** [auto] Move file to src/proxy.test.ts and update imports (recommended default)
**Notes:** Test content is still valid — only the file location and import path need updating.

---

## tsconfig Fix Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Add vitest/globals to types | Minimal change to resolve false tsc errors | ✓ |
| Separate tsconfig for tests | Create tsconfig.test.json extending base | |

**User's choice:** [auto] Add vitest/globals to compilerOptions.types array (recommended default)
**Notes:** Per HYGN-04 requirement. Also need to investigate error.test.tsx type errors found during analysis.

---

## Claude's Discretion

- Additional type references for tsconfig (e.g., @testing-library/jest-dom)
- Test count verification approach

## Deferred Ideas

None.

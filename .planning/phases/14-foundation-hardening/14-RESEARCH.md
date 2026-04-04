# Phase 14: Foundation Hardening - Research

**Researched:** 2026-04-03
**Domain:** Dependency management, lint configuration, housekeeping
**Confidence:** HIGH

## Summary

This phase is entirely mechanical -- five independent fixes with no application logic changes. All changes are verified against the current state of the codebase on the `v17` branch. The npm audit dry-run confirms all 3 vulnerabilities (brace-expansion, flatted, picomatch) resolve via `npm audit fix` without needing `overrides`. The eslint-config-next version mismatch is a simple semver bump from 16.1.6 to match next@16.2.2. The Velite pin is a one-character edit removing the caret.

**Key finding:** The error boundary eslint-disable comments (D-03/FOUND-03) are already present in all three files. This was likely done during a previous session or quick task. The planner should verify this is still the case at execution time and skip if already done.

**Primary recommendation:** Run `npm audit fix` first (updates lockfile), then update eslint-config-next and pin Velite in package.json, then `npm install` once. Commit. Worktree cleanup is a separate filesystem operation.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Run `npm audit fix` first. Only use package.json `overrides` if direct fixes fail. Research confirmed dry-run resolves all 3 vulnerabilities (flatted, picomatch x2) without overrides.
- **D-02:** Update `eslint-config-next` from `^16.1.6` to `^16.2.2` to match `next@16.2.2`. Standard semver alignment.
- **D-03:** Add `// eslint-disable-next-line @next/next/no-html-link-for-pages` with a brief inline explanation on each intentional `<a>` tag in error boundaries. Match the existing pattern in `mdx-content.tsx`. Files: `src/app/error.tsx`, `src/app/global-error.tsx`, `src/app/blog/[slug]/error.tsx`.
- **D-04:** Change `"velite": "^0.3.1"` to `"velite": "0.3.1"` (remove caret). One-character change.
- **D-05:** Remove `.claude/worktrees/agent-*` directories only. These are ephemeral Claude Code agent working directories, gitignored, safe to delete.

### Claude's Discretion
- Exact order of operations within the phase (all changes are independent)
- Whether to run `npm install` after version pin or let lockfile update naturally with audit fix
- Commit granularity (single commit or separate commits per concern)

### Deferred Ideas (OUT OF SCOPE)
None.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUND-01 | npm audit reports zero vulnerabilities after fix | Verified: `npm audit fix` dry-run resolves all 3 vulns (brace-expansion, flatted, picomatch). No overrides needed. |
| FOUND-02 | eslint-config-next version matches next@16.2.2 | Verified: installed is 16.1.6, latest is 16.2.2, package.json has `^16.1.6` -- change to `^16.2.2` |
| FOUND-03 | Intentional `<a>` tags in error boundaries have eslint-disable comments with explanatory context | **Already done.** All 3 error boundary files already have the correct eslint-disable-next-line comments with `-- plain <a> intentional: client-side routing may be broken in error state` explanation. Verify at execution time. |
| FOUND-04 | Velite pinned to exact version 0.3.1 (no caret) | Verified: package.json shows `"velite": "^0.3.1"` -- remove caret to `"0.3.1"` |
| FOUND-05 | Stale worktree directories removed | `.claude/worktrees/` directory exists but is empty (no `agent-*` subdirectories found). May already be clean. Verify at execution time. |
</phase_requirements>

## Current State Analysis

### npm audit (3 vulnerabilities)

| Package | Severity | Advisory | Fix Method |
|---------|----------|----------|------------|
| brace-expansion | moderate | GHSA-f886-m6hf-6m8v (zero-step sequence hang) | `npm audit fix` |
| flatted | high | GHSA-25h7-pfq9-p65f (unbounded recursion DoS) | `npm audit fix` |
| picomatch | high | GHSA-3v7f-55p6-f55p (method injection), GHSA-c2c7-rcm5-vvqj (ReDoS) | `npm audit fix` |

All three resolve via `npm audit fix` -- no `--force`, no `overrides` field needed.

**Note:** CONTEXT.md mentions "flatted, picomatch x2" but current audit also shows brace-expansion. The audit state may have shifted slightly since discussion. All three resolve the same way.

### eslint-config-next mismatch

- **Installed:** `eslint-config-next@16.1.6`
- **package.json:** `"eslint-config-next": "^16.1.6"`
- **next version:** `next@16.2.2`
- **Latest eslint-config-next:** `16.2.2`
- **Fix:** Change package.json to `"^16.2.2"` then `npm install`

### ESLint disable comments (ALREADY PRESENT)

All three error boundary files already have the correct pattern:

```typescript
{/* eslint-disable-next-line @next/next/no-html-link-for-pages -- plain <a> intentional: client-side routing may be broken in error state */}
```

Files verified:
- `src/app/error.tsx` (line 26)
- `src/app/global-error.tsx` (line 32)
- `src/app/blog/[slug]/error.tsx` (line 28)

This matches the pattern in `src/components/blog/mdx-content.tsx` (line 29).

**FOUND-03 may be a no-op.** The planner should include a verification step but skip the edit if comments are already present.

### Velite version pin

- **Current:** `"velite": "^0.3.1"` (line 42 of package.json)
- **Target:** `"velite": "0.3.1"` (remove caret)
- One-character deletion in package.json

### Worktree cleanup

- `.claude/worktrees/` directory exists but is **currently empty**
- No `agent-*` subdirectories found
- FOUND-05 may also be a no-op
- The directory itself is gitignored so its presence/absence has no git impact

## Architecture Patterns

### Recommended Order of Operations

Since `npm audit fix` and `npm install` both update the lockfile, batch all package.json changes before running install:

1. Edit `package.json`: pin Velite (`"0.3.1"`), bump eslint-config-next (`"^16.2.2"`)
2. Run `npm audit fix` (handles lockfile + transitive dependency updates)
3. Run `npm install` (picks up the two package.json edits)
4. Verify: `npm audit`, `npm run lint`, `npm run test`
5. Worktree cleanup: `rm -rf .claude/worktrees/agent-*` (if any exist)

Alternative: run `npm audit fix` first, then edit package.json, then `npm install`. Order does not matter since these are independent concerns. The batch approach minimizes npm operations.

### Commit Strategy (Claude's Discretion)

**Recommendation: single commit.** All five changes are small, independent, and share the theme "clean up before migration." A single commit with a descriptive message is cleaner than 3-5 micro-commits for one-line changes. The worktree cleanup is gitignored so it won't appear in the commit anyway.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dependency vulnerability fixes | Manual package version edits | `npm audit fix` | Handles transitive dependency resolution automatically |
| Version alignment checking | Script to compare versions | `npm ls` + `npm audit` | Built-in npm tooling is authoritative |

## Common Pitfalls

### Pitfall 1: npm audit fix introducing breaking changes
**What goes wrong:** `npm audit fix` upgrades a transitive dependency to a new major version that breaks something.
**Why it happens:** Audit fix follows semver but transitive deps sometimes have subtle breakages.
**How to avoid:** Run the full test suite (`npm run test` + `npm run lint` + `npm run build`) after audit fix.
**Warning signs:** Test failures, build errors, new lint warnings.

### Pitfall 2: Forgetting npm install after package.json edits
**What goes wrong:** Editing package.json (Velite pin, eslint-config-next bump) without running `npm install` leaves the lockfile out of sync.
**How to avoid:** Always run `npm install` after manual package.json edits. Or combine with `npm audit fix` which also updates the lockfile.
**Warning signs:** `npm ls` shows different versions than package.json specifies.

### Pitfall 3: Assuming worktree directories exist
**What goes wrong:** Plan includes `rm -rf` step that fails or causes confusion when directories don't exist.
**How to avoid:** Use `rm -rf` (which is idempotent) or check existence first. Either way, don't treat it as a failure if nothing is there.
**Warning signs:** N/A -- `rm -rf` on non-existent paths is silent.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm run test` |
| Full suite command | `npm run test && npm run lint && npm run build` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-01 | Zero npm audit vulnerabilities | smoke | `npm audit` (exit code 0 = pass) | N/A (CLI check) |
| FOUND-02 | eslint-config-next matches next | smoke | `npm ls eslint-config-next` (check version) | N/A (CLI check) |
| FOUND-03 | eslint-disable comments present | lint | `npm run lint` (zero errors) | N/A (lint check) |
| FOUND-04 | Velite pinned to exact 0.3.1 | smoke | `grep '"velite": "0.3.1"' package.json` | N/A (grep check) |
| FOUND-05 | Stale worktrees removed | manual | `ls .claude/worktrees/agent-* 2>&1` (should fail) | N/A (filesystem check) |

### Sampling Rate
- **Per task commit:** `npm run test && npm run lint`
- **Per wave merge:** `npm run test && npm run lint && npm run build`
- **Phase gate:** Full suite green + `npm audit` clean

### Wave 0 Gaps
None -- existing test infrastructure covers all phase requirements. No new test files needed. All validation is via existing CLI tooling (`npm audit`, `npm run lint`, `npm run test`).

## Environment Availability

Step 2.6: No external dependencies beyond npm (already available). All operations use standard npm CLI tooling.

## Open Questions

1. **FOUND-03 already done?**
   - What we know: All three error boundary files already have the eslint-disable comments with explanatory context, matching the mdx-content.tsx pattern exactly.
   - What's unclear: Whether this was done intentionally or is leftover from a previous attempt. The CONTEXT.md still lists it as a task.
   - Recommendation: Planner should include a verification step that checks and skips if already done. No harm in being idempotent.

2. **FOUND-05 worktrees already clean?**
   - What we know: `.claude/worktrees/` exists but is empty -- no `agent-*` subdirectories.
   - What's unclear: Whether worktrees will be recreated between now and execution.
   - Recommendation: Include the cleanup step as idempotent (`rm -rf`). Skip if nothing to delete.

3. **Audit vulnerability count shifted**
   - What we know: CONTEXT.md says "flatted, picomatch x2". Current audit shows brace-expansion, flatted, picomatch (3 packages, multiple advisories).
   - What's unclear: Whether the set changed or the original description was imprecise.
   - Recommendation: Not a problem -- `npm audit fix` resolves all of them regardless.

## Project Constraints (from CLAUDE.md)

- **Build:** `velite && next build` (sequential -- Velite must complete first)
- **Lint:** `npm run lint` uses ESLint flat config with 3 React 19 rules downgraded to warn
- **Test:** `npm run test` for Vitest, `npm run test:e2e` for Playwright
- **Deploy:** Git-push to Vercel (no CI/CD pipelines)
- **Velite:** Runs as separate prebuild step, not webpack plugin. Config in `velite.config.ts`
- **Error boundaries:** Intentionally use plain `<a>` tags (not `next/link`) -- documented pattern
- **Path aliases:** `@/*` maps to `./src/*`, `@/.velite` maps to `./.velite`

## Sources

### Primary (HIGH confidence)
- Direct filesystem inspection of all affected files on the `v17` branch
- `npm audit` output (live, current)
- `npm audit fix --dry-run` output (live, current)
- `npm ls eslint-config-next` and `npm ls next` (live, current)
- `npm view eslint-config-next version` (registry, current)

### Secondary (MEDIUM confidence)
- CONTEXT.md discussion findings (gathered same day)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, all changes are version bumps and pins
- Architecture: HIGH -- order of operations is straightforward npm workflow
- Pitfalls: HIGH -- well-understood npm patterns, nothing novel

**Research date:** 2026-04-03
**Valid until:** 2026-05-03 (30 days -- stable domain, nothing fast-moving)

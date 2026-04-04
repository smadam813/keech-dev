# Phase 14: Foundation Hardening - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Clean dependency tree, lock Velite, and reduce lint noise before any migration work begins. This phase touches package.json, eslint config, error boundary files, and local worktree artifacts. No application logic changes.

</domain>

<decisions>
## Implementation Decisions

### npm audit fixes
- **D-01:** Run `npm audit fix` first. Only use package.json `overrides` if direct fixes fail. Research confirmed dry-run resolves all 3 vulnerabilities (flatted, picomatch x2) without overrides.

### eslint-config-next sync
- **D-02:** Update `eslint-config-next` from `^16.1.6` to `^16.2.2` to match `next@16.2.2`. Standard semver alignment.

### ESLint disable comments
- **D-03:** Add `// eslint-disable-next-line @next/next/no-html-link-for-pages` with a brief inline explanation on each intentional `<a>` tag in error boundaries. Match the existing pattern in `mdx-content.tsx` which already has this treatment. Files needing comments: `src/app/error.tsx`, `src/app/global-error.tsx`, `src/app/blog/[slug]/error.tsx`.

### Velite version pin
- **D-04:** Change `"velite": "^0.3.1"` to `"velite": "0.3.1"` (remove caret). One-character change. Must be done before any Velite config changes in Phase 16.

### Worktree cleanup
- **D-05:** Remove `.claude/worktrees/agent-*` directories only. These are ephemeral Claude Code agent working directories, gitignored, safe to delete. Do not touch other `.claude/` contents.

### Claude's Discretion
- Exact order of operations within the phase (all changes are independent)
- Whether to run `npm install` after version pin or let lockfile update naturally with audit fix
- Commit granularity (single commit or separate commits per concern)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Concerns documentation
- `.planning/codebase/CONCERNS.md` — Full detail on each concern being addressed: npm audit findings (§ Security: Dependency Vulnerabilities), ESLint version mismatch (§ Linting: eslint-config-next Version Mismatch), error boundary `<a>` tags (§ Code Quality: `<a>` Tags in Error Boundaries), worktree artifacts (§ Housekeeping: Worktree Artifacts)

### Research findings
- `.planning/research/SUMMARY.md` — Phase 1 section confirms npm audit fix works without overrides, no new packages needed
- `.planning/research/STACK.md` — Dependency vulnerability details and fix verification

### Existing patterns
- `src/components/blog/mdx-content.tsx` — Already has eslint-disable comment pattern for intentional `<a>` tag (reference for consistency)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/blog/mdx-content.tsx` line ~29: existing `eslint-disable-next-line` comment on `<a>` tag — use same format for error boundary files

### Established Patterns
- Error boundaries use plain `<a>` tags intentionally (not `next/link`) because client-side routing may be broken when error boundary is showing — this is documented in CLAUDE.md

### Integration Points
- `package.json` — eslint-config-next version, Velite version pin, npm audit fixes
- `eslint.config.mjs` — no changes expected (already has React 19 rule downgrades)
- Error boundary files — `src/app/error.tsx`, `src/app/global-error.tsx`, `src/app/blog/[slug]/error.tsx`
- `.claude/worktrees/` — local only, gitignored

</code_context>

<specifics>
## Specific Ideas

No specific requirements — all changes are mechanical with clear patterns to follow.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 14-foundation-hardening*
*Context gathered: 2026-04-03*

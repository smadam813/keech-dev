# Phase 14: Foundation Hardening - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-03
**Phase:** 14-foundation-hardening
**Areas discussed:** ESLint comment style, npm audit approach, worktree cleanup scope
**Mode:** Auto (--auto flag, all defaults selected)

---

## ESLint Comment Style

| Option | Description | Selected |
|--------|-------------|----------|
| Brief inline explanation | Match existing pattern in mdx-content.tsx | ✓ |
| Verbose block comment | Multi-line explanation per `<a>` tag | |
| No explanation | Just the disable comment | |

**User's choice:** [auto] Brief inline explanation (recommended default)
**Notes:** mdx-content.tsx already has this pattern established — consistency is the priority.

---

## npm Audit Approach

| Option | Description | Selected |
|--------|-------------|----------|
| npm audit fix first | Direct fixes, overrides only if needed | ✓ |
| Manual overrides | Use package.json overrides for all vulnerabilities | |
| Ignore transitive | Document but don't fix transitive-only vulnerabilities | |

**User's choice:** [auto] npm audit fix first (recommended default)
**Notes:** Research dry-run confirmed all 3 vulnerabilities resolve with direct fixes. No overrides needed.

---

## Worktree Cleanup Scope

| Option | Description | Selected |
|--------|-------------|----------|
| .claude/worktrees/agent-* only | Safe, scoped to stale agent artifacts | ✓ |
| All .claude/worktrees/ | Broader cleanup including non-agent worktrees | |
| Skip cleanup | Track as housekeeping but don't execute in this phase | |

**User's choice:** [auto] .claude/worktrees/agent-* only (recommended default)
**Notes:** These are ephemeral, gitignored agent working directories safe to remove.

---

## Claude's Discretion

- Operation order within phase (all changes are independent)
- Commit granularity
- npm install timing relative to other changes

## Deferred Ideas

None — all discussion stayed within phase scope.

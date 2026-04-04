# Phase 17: Syntax Highlighting Theme Migration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-04
**Phase:** 17-syntax-highlighting-theme-migration
**Areas discussed:** CSS variable naming, Color mapping fidelity, Variable placement, Background color handling
**Mode:** --auto (all selections were recommended defaults)

---

## CSS Variable Naming

| Option | Description | Selected |
|--------|-------------|----------|
| Shiki defaults (--shiki-*) | Standard convention used by createCssVariablesTheme(), well-documented | ✓ |
| Custom prefix (--code-*) | More site-specific but non-standard, loses Shiki ecosystem recognition | |
| Design token prefix (--color-syntax-*) | Integrates with @theme tokens but conflates site design with code highlighting | |

**User's choice:** [auto] Shiki defaults (--shiki-*) (recommended default)
**Notes:** Standard convention minimizes friction for anyone reading the CSS and aligns with rehype-pretty-code documentation.

---

## Color Mapping Fidelity

| Option | Description | Selected |
|--------|-------------|----------|
| Close approximation (~10 vars) | Map prominent github-dark-dimmed token colors to CSS variables, accept some grouping | ✓ |
| Exact replication (custom theme JSON) | Port all ~40 scopes to a custom theme file — defeats the purpose of CSS variables | |
| Minimal (foreground + background only) | Too coarse, code becomes nearly monochrome | |

**User's choice:** [auto] Close approximation (~10 vars) (recommended default)
**Notes:** STATE.md already flagged the ~10 vs ~40 trade-off. Visual check at end of phase will catch any jarring regressions.

---

## Variable Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Code block section of globals.css | Alongside existing rehype-pretty-code styles, logically grouped | ✓ |
| @theme block | Would make them site-wide design tokens, but these are code-block-specific | |
| Separate CSS file | Unnecessarily splits code block styling across files | |

**User's choice:** [auto] Code block section of globals.css (recommended default)
**Notes:** Keeps all code block styling co-located. Not site-wide design tokens — they're syntax highlighting implementation details.

---

## Background Color Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Match github-dark-dimmed (#22272e) | Preserves current visual appearance, clean dark background | ✓ |
| Use --color-foreground (#000000) | Pure black, harsher contrast, different from current look | |
| Use a new design token | Over-engineering for a single use case | |

**User's choice:** [auto] Match github-dark-dimmed (#22272e) (recommended default)
**Notes:** Visual continuity with current code blocks. The #22272e value is github-dark-dimmed's documented background color.

---

## Claude's Discretion

- Exact hex values for each --shiki-token-* variable (approximate github-dark-dimmed palette)
- Whether to extract colors from Shiki source or reference docs
- Whether inline code spans need variable adjustments
- Commit granularity

## Deferred Ideas

None — discussion stayed within phase scope.

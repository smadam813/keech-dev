# Phase 16: MDX Migration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-04
**Phase:** 16-mdx-migration
**Areas discussed:** HTML rendering approach, Copy button injection, List role preservation, Velite config surface
**Mode:** --auto (all decisions auto-selected with recommended defaults)

---

## HTML Rendering Approach

| Option | Description | Selected |
|--------|-------------|----------|
| dangerouslySetInnerHTML on wrapper div | Simplest approach, eliminates new Function() entirely, standard React pattern for trusted HTML | ✓ |
| Parse HTML and render React elements | More complex, uses html-react-parser or similar, allows component overrides but adds dependency | |
| Server-side MDX compilation | Use @next/mdx or similar, but out of scope per REQUIREMENTS.md | |

**User's choice:** [auto] dangerouslySetInnerHTML on wrapper div (recommended default)
**Notes:** This is the cleanest path. Content is author-controlled and compiled at build time, so dangerouslySetInnerHTML is safe. Eliminates the need for react/jsx-runtime import and component overrides.

---

## Copy Button Injection

| Option | Description | Selected |
|--------|-------------|----------|
| DOM-based via useEffect | Find all pre elements after render, wrap with div, mount CopyButton — reuses existing component | ✓ |
| Rehype plugin at build time | Inject button HTML during Velite compilation — but button needs client-side JS for clipboard API | |
| CSS-only copy (not viable) | No clipboard API access without JS | |

**User's choice:** [auto] DOM-based via useEffect (recommended default)
**Notes:** The copy button requires clipboard API access (client-side JS), so build-time injection alone won't work. useEffect approach is consistent with how CodeBlock currently uses useRef + querySelector. Reuses existing CopyButton component.

---

## List Role Preservation

| Option | Description | Selected |
|--------|-------------|----------|
| Rehype plugin at build time | Custom rehype plugin adds role="list" to ul/ol during Velite compilation — static attribute, no JS needed | ✓ |
| DOM manipulation via useEffect | Find all ul/ol after render and set role attribute — works but unnecessary runtime overhead | |

**User's choice:** [auto] Rehype plugin at build time (recommended default)
**Notes:** role="list" is a static attribute that doesn't need client-side interactivity. Build-time is cleaner and more efficient. A simple rehype plugin visiting ul/ol nodes and adding the property is straightforward.

---

## Velite Config Surface

| Option | Description | Selected |
|--------|-------------|----------|
| Verify s.markdown() supports same rehype config | Check if mdx.rehypePlugins config key works for markdown, adjust if needed | ✓ |
| Research Velite docs for markdown-specific config | If s.markdown() uses different config surface, adapt accordingly | |

**User's choice:** [auto] Verify and adjust (recommended default)
**Notes:** Research phase will confirm the exact config surface for s.markdown(). The key question is whether rehypePlugins are configured under the same `mdx` key or a different `markdown` key.

---

## Claude's Discretion

- Exact rehype plugin implementation (inline function vs separate file)
- Container element strategy for useEffect DOM queries
- Commit granularity
- Whether to delete CodeBlock component in this phase or leave for cleanup

## Deferred Ideas

None — all discussion stayed within phase scope.

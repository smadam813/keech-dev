# Phase 16: MDX Migration - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Switch blog posts and projects from runtime JavaScript execution (`new Function()` on compiled MDX) to compiled HTML rendering (`dangerouslySetInnerHTML`), enabling `unsafe-eval` removal from CSP. Velite's `s.mdx()` becomes `s.markdown()`, MDXContent stops executing code, and the copy button + list role patterns are preserved via alternative approaches.

</domain>

<decisions>
## Implementation Decisions

### Velite config migration
- **D-01:** Change `s.mdx()` to `s.markdown()` in both `posts` and `projects` collection schemas in `velite.config.ts`. The `body` field will output compiled HTML string instead of executable MDX code.
- **D-02:** Rehype plugins (`rehype-slug`, `rehype-pretty-code`) should continue to work with `s.markdown()` — verify the config surface accepts the same `mdx.rehypePlugins` array or adjust to the markdown-equivalent config key.

### HTML rendering
- **D-03:** `MDXContent` component renders compiled HTML via `dangerouslySetInnerHTML` on a wrapper `<div>`. No more `new Function()`, no more `react/jsx-runtime` import, no more component overrides object. The component stays as a named export (`MDXContent`) to minimize API surface changes for consuming pages.
- **D-04:** The `MDXFallback` component is preserved for error handling, but the error path simplifies — HTML rendering via `dangerouslySetInnerHTML` is unlikely to throw (compared to `new Function()`).

### Copy button injection
- **D-05:** Copy buttons injected via client-side DOM manipulation in a `useEffect` within `MDXContent`. After HTML renders, find all `<pre>` elements, create a wrapper `<div class="group relative">`, and mount a `CopyButton` React component into each wrapper. This reuses the existing `CopyButton` component and preserves the current visual/behavioral pattern.
- **D-06:** The `CodeBlock` wrapper component (`src/components/blog/code-block.tsx`) becomes unused after migration and should be removed.

### List role preservation
- **D-07:** Add a custom rehype plugin in `velite.config.ts` that adds `role="list"` to all `<ul>` and `<ol>` elements at build time. This replaces the React component overrides that currently add the role attribute. Build-time is preferred over runtime DOM manipulation for this — it's a static attribute, no interactivity needed.

### CSP update
- **D-08:** Remove `'unsafe-eval'` from the `script-src` directive in `src/proxy.ts`. This is the security payoff of the entire migration.

### Claude's Discretion
- Exact implementation of the rehype plugin for `role="list"` (inline function vs separate file)
- Whether `MDXContent` needs a `useRef` for the container or can use `querySelectorAll` after render
- Commit granularity (single commit or separate commits per concern)
- Whether to keep `CodeBlock` component file or delete it in this phase

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Current implementation
- `src/components/blog/mdx-content.tsx` — Current MDX rendering via `new Function()`, component overrides for `<pre>`, `<ul>`, `<ol>`
- `src/components/blog/code-block.tsx` — Current `CodeBlock` wrapper that adds copy button to `<pre>` elements
- `src/components/blog/copy-button.tsx` — `CopyButton` component (reused in new approach)
- `velite.config.ts` — Current Velite config with `s.mdx()` and rehype plugin configuration

### CSP configuration
- `src/proxy.ts` — Middleware with CSP directives including `unsafe-eval` that must be removed

### Consuming pages
- `src/app/blog/[slug]/page.tsx` — Blog post page that passes `post.body` to `MDXContent`
- `src/app/projects/[slug]/page.tsx` — Project page that passes `project.body` to `MDXContent`

### Requirements
- `.planning/REQUIREMENTS.md` §MDX Migration — MDX-01 through MDX-05 define the five acceptance criteria

### Concerns documentation
- `.planning/codebase/CONCERNS.md` §Security: CSP Requires unsafe-eval — Documents the motivation and fix approach

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CopyButton` (`src/components/blog/copy-button.tsx`): Standalone component that accepts a `getText` callback — can be mounted into DOM-injected wrappers
- `MDXFallback`: Error fallback UI in `mdx-content.tsx` — preserved as-is
- Rehype plugin pattern: `velite.config.ts` already has rehype-slug and rehype-pretty-code configured — adding a custom plugin follows the same array pattern

### Established Patterns
- `'use client'` components use `useEffect` for DOM interactions (e.g., `CodeBlock` uses `useRef` + `querySelector`)
- Velite output is imported via `@/.velite` path alias — this doesn't change
- `dangerouslySetInnerHTML` is standard React for rendering trusted HTML (content is author-controlled, compiled at build time)

### Integration Points
- `velite.config.ts` — `s.mdx()` → `s.markdown()`, add rehype list-role plugin
- `src/components/blog/mdx-content.tsx` — Complete rewrite of rendering approach
- `src/proxy.ts` — Remove `'unsafe-eval'` from script-src
- `src/components/blog/code-block.tsx` — Becomes unused, candidate for removal
- `.velite/` output — Will change from executable MDX code to HTML strings (regenerated on build)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — all changes follow directly from the `s.mdx()` → `s.markdown()` migration path documented in REQUIREMENTS.md and CONCERNS.md.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 16-mdx-migration*
*Context gathered: 2026-04-04*

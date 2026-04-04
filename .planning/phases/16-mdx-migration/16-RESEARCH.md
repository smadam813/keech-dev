# Phase 16: MDX Migration - Research

**Researched:** 2026-04-04
**Domain:** Velite content compilation, MDX-to-HTML migration, CSP hardening
**Confidence:** HIGH

## Summary

This phase migrates Velite's content compilation from `s.mdx()` (outputs JavaScript function bodies executed via `new Function()`) to `s.markdown()` (outputs HTML strings rendered via `dangerouslySetInnerHTML`). The migration is straightforward because Velite 0.3.1 already ships both schema types with identical rehype plugin support, and the existing `.prose` CSS targets raw HTML elements -- not React component classes -- so styling carries over without changes.

The three technical challenges are: (1) moving rehype plugin configuration from the `mdx` config key to the `markdown` config key in `defineConfig`, (2) injecting copy buttons into pre-rendered HTML code blocks via client-side DOM manipulation, and (3) adding `role="list"` attributes to `<ul>` and `<ol>` elements at build time via a custom rehype plugin, replacing the React component overrides that currently do this.

**Primary recommendation:** Change `s.mdx()` to `s.markdown()`, rename the config key from `mdx` to `markdown`, rewrite `MDXContent` to use `dangerouslySetInnerHTML` with `useEffect`-based copy button injection, add a rehype-list-role plugin, and remove `'unsafe-eval'` from CSP.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Change `s.mdx()` to `s.markdown()` in both `posts` and `projects` collection schemas in `velite.config.ts`. The `body` field will output compiled HTML string instead of executable MDX code.
- **D-02:** Rehype plugins (`rehype-slug`, `rehype-pretty-code`) should continue to work with `s.markdown()` -- verify the config surface accepts the same `mdx.rehypePlugins` array or adjust to the markdown-equivalent config key.
- **D-03:** `MDXContent` component renders compiled HTML via `dangerouslySetInnerHTML` on a wrapper `<div>`. No more `new Function()`, no more `react/jsx-runtime` import, no more component overrides object. The component stays as a named export (`MDXContent`) to minimize API surface changes for consuming pages.
- **D-04:** The `MDXFallback` component is preserved for error handling, but the error path simplifies -- HTML rendering via `dangerouslySetInnerHTML` is unlikely to throw (compared to `new Function()`).
- **D-05:** Copy buttons injected via client-side DOM manipulation in a `useEffect` within `MDXContent`. After HTML renders, find all `<pre>` elements, create a wrapper `<div class="group relative">`, and mount a `CopyButton` React component into each wrapper. This reuses the existing `CopyButton` component and preserves the current visual/behavioral pattern.
- **D-06:** The `CodeBlock` wrapper component (`src/components/blog/code-block.tsx`) becomes unused after migration and should be removed.
- **D-07:** Add a custom rehype plugin in `velite.config.ts` that adds `role="list"` to all `<ul>` and `<ol>` elements at build time. This replaces the React component overrides that currently add the role attribute. Build-time is preferred over runtime DOM manipulation for this -- it's a static attribute, no interactivity needed.
- **D-08:** Remove `'unsafe-eval'` from the `script-src` directive in `src/proxy.ts`. This is the security payoff of the entire migration.

### Claude's Discretion
- Exact implementation of the rehype plugin for `role="list"` (inline function vs separate file)
- Whether `MDXContent` needs a `useRef` for the container or can use `querySelectorAll` after render
- Commit granularity (single commit or separate commits per concern)
- Whether to keep `CodeBlock` component file or delete it in this phase

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MDX-01 | Velite config uses s.markdown() instead of s.mdx() for content collections | Velite 0.3.1 `s.markdown()` confirmed in source -- outputs HTML via `rehypeStringify`. Config key must change from `mdx` to `markdown` in `defineConfig`. |
| MDX-02 | MDXContent renders HTML via dangerouslySetInnerHTML (no new Function) | `s.markdown()` returns plain HTML string. `dangerouslySetInnerHTML={{ __html: code }}` on a `<div>` replaces the entire `new Function()` + jsx-runtime pattern. |
| MDX-03 | Code block copy button works via DOM-based approach after HTML rendering | rehype-pretty-code wraps code in `<figure data-rehype-pretty-code-figure>` containing `<pre><code>`. Copy button injection via `useEffect` + `createRoot` to mount `CopyButton` React components. |
| MDX-04 | VoiceOver-compatible list elements (role="list") preserved via rehype plugin | Custom rehype plugin using `unist-util-visit` to add `role="list"` to all `<ul>` and `<ol>` hast nodes. Replaces current React component overrides. |
| MDX-05 | `unsafe-eval` removed from script-src in CSP | Single line change in `src/proxy.ts` -- remove `'unsafe-eval'` from the script-src directive string. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Commands: `npm run build` (velite && next build), `npm run test` (vitest), `npm run test:e2e` (playwright), `npm run lint` (eslint)
- Velite pinned to exact 0.3.1 (no caret)
- `cn()` from `@/lib/utils` for class merging
- Server components by default; `'use client'` only where browser APIs needed
- `.prose` CSS in `globals.css` styles content via element selectors
- Error boundaries use plain `<a>` tags with eslint-disable comments
- Tests live alongside source as `*.test.ts(x)`; e2e in `e2e/`
- Vitest globals enabled (no imports needed for describe/it/expect)

## Architecture Patterns

### Velite Config: `mdx` key vs `markdown` key

**Critical finding from Velite 0.3.1 source code** (verified in `node_modules/velite/dist/index.js`):

- `s.mdx()` reads plugin config from `meta.config.mdx` -- the `mdx` key in `defineConfig`
- `s.markdown()` reads plugin config from `meta.config.markdown` -- the `markdown` key in `defineConfig`
- These are **separate config keys**. The existing `mdx: { rehypePlugins: [...] }` will NOT be read by `s.markdown()`.

The config must change from:
```typescript
mdx: {
  rehypePlugins: [rehypeSlug, [rehypePrettyCode, { ... }]]
}
```
to:
```typescript
markdown: {
  rehypePlugins: [rehypeSlug, [rehypePrettyCode, { ... }]]
}
```

Both `MarkdownOptions` and `MdxOptions` support `remarkPlugins` and `rehypePlugins` with the same `PluggableList` type.

### s.markdown() Processing Pipeline

Verified from Velite 0.3.1 source (line 4958 of `dist/index.js`):

```
unified()
  .use(remarkParse)          // Parse markdown to mdast
  .use(remarkPlugins)        // User remark plugins
  .use(remarkRehype, { allowDangerousHtml: true })  // mdast -> hast
  .use(rehypeMetaString)     // Process code meta strings
  .use(rehypeRaw)            // Process raw HTML in markdown
  .use(rehypePlugins)        // User rehype plugins (rehype-slug, rehype-pretty-code)
  .use(rehypeStringify)      // hast -> HTML string
  .process({ value, path })
```

Key details:
- `allowDangerousHtml: true` and `rehypeRaw` mean any raw HTML in MDX files survives compilation
- `rehypeMetaString` runs before user plugins, so rehype-pretty-code's meta string features (title, line highlighting) work
- Output is a plain HTML string (not JavaScript)

### MDXContent Rewrite Pattern

Current component signature: `MDXContent({ code, components })` where `code` is a JS function body string.

New component: `MDXContent({ code })` where `code` is an HTML string. The `components` prop becomes unnecessary since there are no React component overrides anymore.

```typescript
'use client'

import { useRef, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { CopyButton } from './copy-button'

interface MDXContentProps {
  code: string
}

export function MDXContent({ code }: MDXContentProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const roots: ReturnType<typeof createRoot>[] = []

    // Find all <pre> elements (inside rehype-pretty-code figures)
    const preElements = containerRef.current.querySelectorAll('pre')

    preElements.forEach((pre) => {
      // Create wrapper div with group class for hover behavior
      const wrapper = document.createElement('div')
      wrapper.className = 'group relative'
      pre.parentNode?.insertBefore(wrapper, pre)
      wrapper.appendChild(pre)

      // Create mount point for CopyButton
      const buttonMount = document.createElement('div')
      wrapper.appendChild(buttonMount)

      const root = createRoot(buttonMount)
      root.render(
        <CopyButton getText={() => {
          const code = pre.querySelector('code')
          return code?.textContent || ''
        }} />
      )
      roots.push(root)
    })

    return () => {
      roots.forEach(root => root.unmount())
    }
  }, [code])

  return (
    <div
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: code }}
    />
  )
}
```

**Recommendation on `useRef` vs `querySelectorAll`:** Use `useRef` on the container div. This scopes DOM queries to the rendered content and avoids selecting code blocks from other parts of the page. This is cleaner and safer than document-level `querySelectorAll`.

### rehype-pretty-code HTML Structure

The e2e test (`e2e/code-copy.spec.ts`) already knows the HTML structure:

```html
<figure data-rehype-pretty-code-figure>
  <pre data-language="typescript" data-theme="github-dark-dimmed" ...>
    <code data-language="typescript" data-theme="github-dark-dimmed">
      <span data-line>...</span>
    </code>
  </pre>
</figure>
```

Copy button injection should target `<pre>` elements inside the container. The `<figure>` wrapper from rehype-pretty-code is already there, and the copy button wrapper `<div class="group relative">` should wrap the `<pre>`, not the `<figure>`.

**Important nuance:** rehype-pretty-code wraps `<pre>` in `<figure>`. The copy button's `group relative` wrapper should wrap the `<figure>` or just the `<pre>`. Since the current `CodeBlock` component wraps `<pre>` directly and the button uses `group-hover:opacity-100`, the wrapper must be an ancestor of both `<pre>` and the button mount point. Wrapping the `<pre>` (moving it into the wrapper div) achieves this.

### Custom Rehype Plugin for `role="list"`

A rehype plugin operates on hast (HTML AST) nodes. The plugin uses `unist-util-visit` (already a transitive dependency of unified) to find `<ul>` and `<ol>` elements and add `role="list"` to their properties.

```typescript
import { visit } from 'unist-util-visit'
import type { Root, Element } from 'hast'

function rehypeListRole() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName === 'ul' || node.tagName === 'ol') {
        node.properties = node.properties || {}
        node.properties.role = 'list'
      }
    })
  }
}
```

**Recommendation:** Inline this as a function in `velite.config.ts` rather than a separate file. It's ~10 lines and only used in one place. The rehype plugins array already shows the pattern for adding plugins.

**Why `role="list"` matters:** Safari strips list semantics when `list-style: none` is applied. The project's `.prose ul` uses `list-style: none` (replaced with rune bullet pseudo-elements). Without `role="list"`, VoiceOver won't announce these as lists. Currently handled by React component overrides on `<ul>` and `<ol>` in `MDXContent` -- moving to `dangerouslySetInnerHTML` loses these overrides, so the rehype plugin restores the attribute at build time.

### Consuming Page Changes

Both `src/app/blog/[slug]/page.tsx` and `src/app/projects/[slug]/page.tsx` pass `post.body`/`project.body` as `code` prop:

```tsx
<MDXContent code={post.body} />
```

**No changes needed to consuming pages.** The prop name stays `code` and the component name stays `MDXContent`. The only difference is the value changes from JavaScript to HTML, which is transparent to the consumer.

However, the consuming pages currently pass `code={post.body}` to a server component that is actually a client component. After migration, `MDXContent` stays as `'use client'` because `useEffect` and `useRef` are needed for copy button injection. The pattern remains the same.

### Anti-Patterns to Avoid

- **Don't use `innerHTML` directly on elements** -- always use React's `dangerouslySetInnerHTML` which is the sanctioned pattern for trusted HTML injection
- **Don't try to parse HTML client-side to find code blocks** -- use DOM queries after render via `useEffect`
- **Don't forget cleanup for `createRoot`** -- each mounted React root must be unmounted in the `useEffect` cleanup to prevent memory leaks
- **Don't wrap `<figure>` instead of `<pre>`** -- the `group relative` wrapper should wrap `<pre>` so the button positioning works correctly relative to the code block

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown to HTML | Custom remark/rehype pipeline | `s.markdown()` in Velite | Already handles GFM, raw HTML, linked files, plugin ordering |
| Syntax highlighting | Custom Shiki integration | `rehype-pretty-code` (existing) | Already configured, works with `s.markdown()` pipeline |
| AST traversal for rehype plugin | Manual tree walking | `unist-util-visit` | Standard utility, already in dependency tree via unified |
| React component mounting in DOM | Manual DOM manipulation for buttons | `createRoot` from react-dom/client | Proper React 19 API for mounting components into non-React DOM nodes |

## Common Pitfalls

### Pitfall 1: Config Key Mismatch
**What goes wrong:** Switching `s.mdx()` to `s.markdown()` but leaving the config key as `mdx: { rehypePlugins: [...] }` -- rehype-slug and rehype-pretty-code silently stop running, producing unstyled code blocks and missing heading IDs.
**Why it happens:** Both config keys accept the same plugin format, so no type error occurs. The markdown pipeline simply doesn't read from the `mdx` key.
**How to avoid:** Change `mdx:` to `markdown:` in `defineConfig` at the same time as changing `s.mdx()` to `s.markdown()`.
**Warning signs:** Code blocks appear as plain `<pre><code>` without syntax highlighting; headings lack `id` attributes.

### Pitfall 2: File Pattern Mismatch
**What goes wrong:** The collection `pattern` is `'posts/**/*.mdx'` -- Velite matches files by this glob. `s.markdown()` works on any file content, but the pattern must still match the actual file extensions.
**Why it happens:** The files are `.mdx` on disk. `s.markdown()` doesn't require `.md` extension -- it processes the content regardless of file extension.
**How to avoid:** Keep `pattern: 'posts/**/*.mdx'` unchanged. No need to rename files.
**Warning signs:** Empty collections if pattern is accidentally changed.

### Pitfall 3: createRoot Cleanup Leak
**What goes wrong:** `useEffect` creates `createRoot` instances for each code block but doesn't unmount them on cleanup, causing React warnings and memory leaks on navigation.
**Why it happens:** Easy to forget cleanup when dynamically mounting components.
**How to avoid:** Track all created roots in an array, unmount them all in the `useEffect` cleanup function.
**Warning signs:** Console warnings about unmounted roots, increasing memory usage during client-side navigation.

### Pitfall 4: Copy Button Positioning After DOM Mutation
**What goes wrong:** `dangerouslySetInnerHTML` renders the HTML, then `useEffect` mutates the DOM by wrapping `<pre>` elements. If React re-renders the component (e.g., due to parent state change), `dangerouslySetInnerHTML` replaces the entire innerHTML, destroying the injected buttons.
**Why it happens:** React owns the DOM inside `dangerouslySetInnerHTML` and will overwrite mutations on re-render.
**How to avoid:** The `code` prop (HTML string) is static for a given post -- it won't change during the component's lifetime. Depend on `[code]` in the `useEffect` dependency array so buttons are re-injected if the content somehow changes.
**Warning signs:** Buttons disappearing after navigation or state changes.

### Pitfall 5: E2E Test Selector Changes
**What goes wrong:** The e2e test `code-copy.spec.ts` locates the copy button via `codeBlock.getByRole('button', { name: 'Copy code' })` where `codeBlock` is `figure[data-rehype-pretty-code-figure]`. After migration, the copy button is mounted outside the `<figure>` (in the wrapper div around `<pre>`).
**Why it happens:** DOM structure changes when `<pre>` is moved into a wrapper div.
**How to avoid:** Verify the e2e selector still works after migration. The button is inside the wrapper which contains `<pre>`, and the wrapper is inside the `<figure>`. If the wrapper is placed correctly (wrapping `<pre>` but still inside `<figure>`), the existing selector should still scope correctly. Test this.
**Warning signs:** E2E test for copy button fails with "element not found".

## Code Examples

### velite.config.ts After Migration

```typescript
// Source: Verified against Velite 0.3.1 source code
import { defineCollection, defineConfig, s } from 'velite'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeSlug from 'rehype-slug'
import { visit } from 'unist-util-visit'
import type { Root, Element } from 'hast'

// Custom rehype plugin: add role="list" to <ul> and <ol> for VoiceOver
function rehypeListRole() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName === 'ul' || node.tagName === 'ol') {
        node.properties = node.properties || {}
        node.properties.role = 'list'
      }
    })
  }
}

const posts = defineCollection({
  name: 'Post',
  pattern: 'posts/**/*.mdx',  // Keep .mdx extension -- no file rename needed
  schema: s.object({
    // ... same fields ...
    body: s.markdown()  // Was s.mdx()
  }).transform(/* same transform */)
})

const projects = defineCollection({
  name: 'Project',
  pattern: 'projects/**/*.mdx',
  schema: s.object({
    // ... same fields ...
    body: s.markdown()  // Was s.mdx()
  }).transform(/* same transform */)
})

export default defineConfig({
  // ... same root, output, collections ...
  markdown: {  // Was `mdx:`
    rehypePlugins: [
      rehypeSlug,
      [rehypePrettyCode, {
        theme: 'github-dark-dimmed',
        keepBackground: true,
        defaultLang: { block: 'typescript', inline: 'typescript' }
      }],
      rehypeListRole  // New: adds role="list" to <ul>/<ol>
    ]
  }
})
```

### CSP Change in src/proxy.ts

```typescript
// Before:
"script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com",

// After:
"script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x + Playwright |
| Config file | `vitest.config.ts` / `playwright.config.ts` |
| Quick run command | `npm run test` |
| Full suite command | `npm run test && npm run test:e2e` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MDX-01 | Velite compiles with s.markdown() | build | `npm run velite` (build-time validation) | N/A -- config-level |
| MDX-02 | MDXContent renders HTML via dangerouslySetInnerHTML | unit | `npm run test -- src/components/blog/mdx-content.test.tsx` | Exists but needs rewrite |
| MDX-03 | Copy button works on code blocks | e2e | `npx playwright test e2e/code-copy.spec.ts` | Exists |
| MDX-04 | role="list" on ul/ol elements | e2e | Manual VoiceOver or DOM inspection in e2e | No dedicated test |
| MDX-05 | No CSP violations without unsafe-eval | e2e | `npx playwright test` (all e2e tests run against live build) | Implicit via e2e |

### Sampling Rate
- **Per task commit:** `npm run test`
- **Per wave merge:** `npm run test && npm run build`
- **Phase gate:** `npm run test && npm run test:e2e` (full suite including copy button e2e)

### Wave 0 Gaps
- [ ] `src/components/blog/mdx-content.test.tsx` -- needs rewrite to test HTML rendering instead of `new Function()` execution. Current tests mock `CodeBlock` and test error handling for invalid JS -- new tests should verify `dangerouslySetInnerHTML` rendering and copy button injection.
- [ ] Consider adding a lightweight e2e assertion for `role="list"` on blog post list elements.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `s.mdx()` + `new Function()` | `s.markdown()` + `dangerouslySetInnerHTML` | Available since Velite 0.3.x | Eliminates `unsafe-eval` from CSP |
| Component overrides for list roles | rehype plugin at build time | Standard pattern | Moves runtime work to build time |
| `CodeBlock` React wrapper for copy button | `useEffect` + `createRoot` DOM injection | React 18+ (createRoot API) | Decouples copy button from MDX rendering |

## Open Questions

1. **unist-util-visit import availability in velite.config.ts**
   - What we know: `unist-util-visit` is a transitive dependency of unified/Velite. It should be importable.
   - What's unclear: Whether TypeScript can resolve the import in `velite.config.ts` without it being a direct dependency.
   - Recommendation: Try the import first. If it fails, `npm install unist-util-visit` as a dev dependency. Similarly for `hast` types -- may need `npm install -D @types/hast`.

2. **Copy button wrapper placement relative to `<figure>`**
   - What we know: rehype-pretty-code wraps `<pre>` in `<figure>`. The `useEffect` needs to insert a `<div class="group relative">` wrapper.
   - What's unclear: Whether wrapping `<pre>` while it's inside `<figure>` creates the right CSS scoping for `group-hover:opacity-100`.
   - Recommendation: Test the exact DOM structure. The wrapper div should be inserted between `<figure>` and `<pre>`, or should wrap the `<figure>`. Try wrapping `<pre>` first since that matches the current `CodeBlock` pattern.

## Sources

### Primary (HIGH confidence)
- Velite 0.3.1 source code (`node_modules/velite/dist/index.js` lines 4938-4963) -- `s.markdown()` implementation, config key mapping, pipeline structure
- Velite 0.3.1 type definitions (`node_modules/velite/dist/index.d.ts` lines 4927-4951, 6905-6906) -- `MarkdownOptions` interface, `s.markdown()` signature
- Current codebase files -- `velite.config.ts`, `mdx-content.tsx`, `code-block.tsx`, `copy-button.tsx`, `proxy.ts`, `globals.css`
- E2E test (`e2e/code-copy.spec.ts`) -- existing copy button test with DOM selectors

### Secondary (MEDIUM confidence)
- React 19 `createRoot` API -- standard pattern for mounting React components into non-React DOM nodes
- `unist-util-visit` -- standard unified ecosystem utility for AST traversal

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in use, only configuration changes
- Architecture: HIGH -- Velite source code verified, pipeline behavior confirmed
- Pitfalls: HIGH -- identified from source code analysis and DOM structure understanding

**Research date:** 2026-04-04
**Valid until:** 2026-05-04 (stable -- Velite pinned to 0.3.1, no external changes expected)

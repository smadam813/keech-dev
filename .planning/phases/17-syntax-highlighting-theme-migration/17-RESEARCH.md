# Phase 17: Syntax Highlighting Theme Migration - Research

**Researched:** 2026-04-04
**Domain:** Shiki CSS-variables theme, rehype-pretty-code configuration, CSS custom properties for syntax highlighting
**Confidence:** HIGH

## Summary

This phase replaces the bundled `github-dark-dimmed` Shiki theme with Shiki's built-in CSS-variables theme, moving syntax token colors from hardcoded Shiki internals into CSS custom properties in `globals.css`. The migration touches exactly two files: `velite.config.ts` (theme config change + `keepBackground: false`) and `src/app/globals.css` (add `--shiki-*` variable definitions).

The `createCssVariablesTheme()` function from `shiki@3.22.0` (currently installed) produces a theme with 19 token color rules mapping ~40+ TextMate scopes to ~13 CSS variables. The function accepts an optional `variablePrefix` (default `--shiki-`) and `variableDefaults` map. The default variable names align exactly with the D-02 decision.

**Primary recommendation:** Use `createCssVariablesTheme()` with default options (no custom prefix), set `keepBackground: false` in rehype-pretty-code options, and define all `--shiki-*` variables in the Code Block Styles section of `globals.css` with hex values extracted from github-dark-dimmed.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Replace `theme: 'github-dark-dimmed'` with `createCssVariablesTheme()` from `shiki` in `velite.config.ts`
- **D-02:** Use Shiki's default `--shiki-*` CSS variable prefix
- **D-03:** Set `keepBackground: false` in rehype-pretty-code options
- **D-04:** Define `--shiki-*` variables in the Code Block Styles section of `globals.css` (not in `@theme` block)
- **D-05:** Map ~10 CSS variables to colors approximating `github-dark-dimmed`; accept granularity loss (~40 scopes to ~10 vars)
- **D-06:** Set `--shiki-background: #22272e` and apply as background-color on `figure[data-rehype-pretty-code-figure] pre`
- **D-07:** This phase does NOT aim to remove `unsafe-inline` from `style-src` (already decided)
- **D-08:** Visual comparison required after migration; some granularity loss acceptable, jarring regressions not acceptable

### Claude's Discretion
- Exact hex values for each `--shiki-token-*` variable (should approximate github-dark-dimmed's palette)
- Whether to extract github-dark-dimmed colors from the Shiki source or reference documentation
- Whether inline code (`span[data-rehype-pretty-code-figure]`) needs variable adjustments too
- Commit granularity

### Deferred Ideas (OUT OF SCOPE)
None.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SYN-01 | Shiki uses CSS-variables theme via createCssVariablesTheme() | `createCssVariablesTheme()` API verified available in shiki@3.22.0; returns a valid theme object accepted by rehype-pretty-code |
| SYN-02 | Token color variables defined in globals.css | Full variable list and recommended hex values documented in Color Mapping section below |
| SYN-03 | Code block background explicitly set in CSS (keepBackground: false) | `keepBackground: false` confirmed as rehype-pretty-code option; prevents inline background-color injection |
| SYN-04 | Visual parity with current github-dark-dimmed color scheme | Color mapping extracted directly from github-dark-dimmed Shiki theme source; best-fit values for all 13 CSS variables documented |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| shiki | 3.22.0 | Syntax highlighting engine | Already installed; provides `createCssVariablesTheme()` |
| rehype-pretty-code | 0.14.1 | Rehype plugin wrapping Shiki for code blocks | Already installed; accepts CSS-variables theme as `theme` option |

No new packages are needed. This is a configuration change only.

## Architecture Patterns

### Files Changed
```
velite.config.ts          # Theme config: string → createCssVariablesTheme(), keepBackground: false
src/app/globals.css       # Add --shiki-* CSS variable definitions in Code Block Styles section
```

### Pattern: createCssVariablesTheme() in velite.config.ts

The `createCssVariablesTheme()` function returns a theme object with `name: 'css-variables'`, `type: 'dark'`, and 19 tokenColor rules. It maps TextMate scopes to CSS variable references (e.g., `var(--shiki-token-keyword)`). The function signature:

```typescript
import { createCssVariablesTheme } from 'shiki'

const cssVarTheme = createCssVariablesTheme({
  name: 'css-variables',          // optional, default: 'css-variables'
  variablePrefix: '--shiki-',     // optional, default: '--shiki-'
  variableDefaults: {},           // optional, fallback values inline
  fontStyle: true                 // optional, default: true
})
```

For this project, use with no arguments (all defaults match D-02):

```typescript
import { createCssVariablesTheme } from 'shiki'

const cssVarTheme = createCssVariablesTheme()

// In markdown config:
[rehypePrettyCode, {
  theme: cssVarTheme,
  keepBackground: false,
  defaultLang: { block: 'typescript', inline: 'typescript' }
}]
```

### Pattern: CSS Variable Definitions in globals.css

Variables go in the Code Block Styles section (per D-04), as a new rule block scoped to the code block figure or at the `:root` level within that section. Using `:root` is simpler and standard for CSS custom properties:

```css
/* Shiki CSS-variables theme tokens (approximating github-dark-dimmed) */
:root {
  --shiki-foreground: #adbac7;
  --shiki-background: #22272e;
  --shiki-token-comment: #768390;
  --shiki-token-keyword: #f47067;
  /* ... etc */
}
```

Then the pre background (per D-06):

```css
figure[data-rehype-pretty-code-figure] pre {
  background-color: var(--shiki-background);
}
```

### Anti-Patterns to Avoid
- **Putting variables in `@theme` block:** D-04 explicitly says not to. These are code-block-specific, not site-wide design tokens.
- **Using `variableDefaults` for colors:** This embeds fallback hex values as inline styles, defeating the purpose of CSS-first tokens.
- **Forgetting `keepBackground: false`:** Without this, rehype-pretty-code injects an inline `background-color` style that overrides the CSS variable.

## Color Mapping: github-dark-dimmed to CSS Variables

**Source:** Colors extracted programmatically from Shiki's bundled `github-dark-dimmed` theme (shiki@3.22.0). Confidence: HIGH.

The CSS-variables theme uses 13 token variables. Below is the best-fit mapping from github-dark-dimmed's ~40+ scope colors:

| CSS Variable | Hex Value | Source in github-dark-dimmed | Notes |
|---|---|---|---|
| `--shiki-foreground` | `#adbac7` | `editor.foreground` | Default text color |
| `--shiki-background` | `#22272e` | `editor.background` | Code block background |
| `--shiki-token-comment` | `#768390` | `comment` scope: `#768390` | Exact match |
| `--shiki-token-keyword` | `#f47067` | `keyword`, `storage`, `storage.type` scopes: `#f47067` | Exact match |
| `--shiki-token-string` | `#96d0ff` | `string` scope: `#96d0ff` | Exact match |
| `--shiki-token-function` | `#dcbdfb` | `entity.name.function` scope: `#dcbdfb` | Purple/lavender. Exact match |
| `--shiki-token-constant` | `#6cb6ff` | `constant`, `entity`, `support` scopes: `#6cb6ff` | Blue. Covers constants, types, support |
| `--shiki-token-parameter` | `#adbac7` | `variable.parameter.function` scope: `#adbac7` | Same as foreground in github-dark-dimmed |
| `--shiki-token-string-expression` | `#8ddb8c` | `entity.name.tag` scope: `#8ddb8c` | Green. JSX tags, HTML tags, quoted strings in some contexts |
| `--shiki-token-punctuation` | `#adbac7` | No specific punctuation scope in github-dark-dimmed | Falls back to foreground. Reasonable default |
| `--shiki-token-link` | `#539bf5` | `textLink.foreground` in theme colors | For markdown links in code |
| `--shiki-token-inserted` | `#8ddb8c` | `markup.inserted` scope: `#8ddb8c` | Diff: inserted lines (green) |
| `--shiki-token-deleted` | `#ff938a` | `markup.deleted` scope: `#ff938a` | Diff: deleted lines (red) |
| `--shiki-token-changed` | `#f69d50` | `markup.changed` scope: `#f69d50` | Diff: changed lines (orange) |

### Granularity Loss Analysis

The main color mappings that lose fidelity:

| github-dark-dimmed Scope | Original Color | Maps to CSS Variable | CSS Variable Color | Delta |
|---|---|---|---|---|
| `entity.name` (variable names, exports) | `#f69d50` (orange) | `--shiki-token-function` | `#dcbdfb` (purple) | Noticeable: orange becomes purple |
| `variable` | `#f69d50` (orange) | `--shiki-token-constant` | `#6cb6ff` (blue) | Noticeable: orange becomes blue |
| `support.type.property-name.json` | `#8ddb8c` (green) | `--shiki-token-keyword` | `#f47067` (red) | JSON keys: green becomes red |

These are inherent limitations of the ~10-variable approach. The CSS-variables theme maps `entity.name.function` to `--shiki-token-function` but other `entity.name.*` sub-scopes and `variable` scopes that had distinct colors in the full theme will collapse into fewer buckets. This is the accepted trade-off per D-05 and the STATE.md blocker note.

**Verdict:** The mapping preserves the overall dark-dimmed feel. Comments are gray, keywords are red, strings are blue, functions are purple, constants are blue, tags are green. The primary visual character is maintained.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSS-variables theme | Custom Shiki theme JSON | `createCssVariablesTheme()` | Built-in function handles all scope-to-variable mapping correctly |
| Color extraction | Manual hex-picking from screenshots | Programmatic extraction from Shiki theme source | Exact values, reproducible |

## Common Pitfalls

### Pitfall 1: Forgetting keepBackground: false
**What goes wrong:** rehype-pretty-code injects `background-color` as an inline style on the `<pre>` element, overriding your CSS variable.
**Why it happens:** Default `keepBackground` is `true` in rehype-pretty-code.
**How to avoid:** Explicitly set `keepBackground: false` in plugin options (D-03).
**Warning signs:** Code blocks have the old background color despite CSS variable changes, or `background-color: var(--shiki-background)` appears as transparent/white.

### Pitfall 2: Import Path for createCssVariablesTheme
**What goes wrong:** Import from wrong path or sub-module.
**Why it happens:** Shiki has many export paths.
**How to avoid:** Import from the main `shiki` package: `import { createCssVariablesTheme } from 'shiki'`. Verified working with shiki@3.22.0.
**Warning signs:** Build error on import.

### Pitfall 3: Inline Code Styling Regression
**What goes wrong:** Inline code (`span[data-rehype-pretty-code-figure]`) might lose its background color or gain unexpected token coloring.
**Why it happens:** The existing inline code style uses `background-color: rgba(0, 0, 0, 0.69) !important` which should continue to work. However, token colors from the CSS-variables theme will now apply to inline code spans too.
**How to avoid:** Check inline code appearance after migration. The existing `!important` override for background should be sufficient. Token colors in inline code are generally desirable.
**Warning signs:** Inline code looks different than expected.

### Pitfall 4: CSS Variable Scope
**What goes wrong:** Variables defined inside a scoped selector aren't available to Shiki's generated styles.
**Why it happens:** Shiki injects `var(--shiki-*)` references on `<span>` elements inside `<code>`. If variables are only defined on a parent selector that doesn't encompass these spans, they won't resolve.
**How to avoid:** Define variables on `:root` or on the `figure[data-rehype-pretty-code-figure]` selector. `:root` is simplest and most reliable.
**Warning signs:** All code appears in the browser's default color (usually black or inherited page foreground).

### Pitfall 5: Velite Cache
**What goes wrong:** After changing the theme in `velite.config.ts`, old cached output in `.velite/` still has the old inline styles.
**Why it happens:** Velite caches compiled content.
**How to avoid:** Run `npm run velite` or `npm run build` to regenerate. The `.velite/` directory is gitignored and regenerated on every build.
**Warning signs:** Code blocks still show old colors after config change during dev.

## Code Examples

### velite.config.ts Change
```typescript
// Source: Verified against shiki@3.22.0 createCssVariablesTheme API
import { defineCollection, defineConfig, s } from 'velite'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeSlug from 'rehype-slug'
import { createCssVariablesTheme } from 'shiki'
import type { Root } from 'hast'
import { visit } from 'unist-util-visit'

const cssVarTheme = createCssVariablesTheme()

// ... collections unchanged ...

export default defineConfig({
  // ... root, output, collections unchanged ...
  markdown: {
    rehypePlugins: [
      rehypeSlug,
      [
        rehypePrettyCode,
        {
          theme: cssVarTheme,
          keepBackground: false,
          defaultLang: {
            block: 'typescript',
            inline: 'typescript'
          }
        }
      ],
      rehypeListRole
    ]
  }
})
```

### globals.css Addition (in Code Block Styles section)
```css
/* Shiki CSS-variables theme tokens (approximating github-dark-dimmed) */
:root {
  --shiki-foreground: #adbac7;
  --shiki-background: #22272e;
  --shiki-token-comment: #768390;
  --shiki-token-keyword: #f47067;
  --shiki-token-string: #96d0ff;
  --shiki-token-function: #dcbdfb;
  --shiki-token-constant: #6cb6ff;
  --shiki-token-parameter: #adbac7;
  --shiki-token-string-expression: #8ddb8c;
  --shiki-token-punctuation: #adbac7;
  --shiki-token-link: #539bf5;
}

/* Pre element background from CSS variable (keepBackground: false) */
figure[data-rehype-pretty-code-figure] pre {
  /* existing: @apply overflow-x-auto py-4; margin: 0; */
  background-color: var(--shiki-background);
}
```

### Inline Code Consideration
The existing inline code styles should work without changes:
```css
/* Already has explicit background - won't be affected by keepBackground: false */
span[data-rehype-pretty-code-figure] code {
  background-color: rgba(0, 0, 0, 0.69) !important;
}
```
Token colors from CSS variables will apply naturally to inline code spans. This is fine -- inline code benefits from syntax highlighting.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x + Playwright |
| Config file | `vitest.config.ts`, `playwright.config.ts` |
| Quick run command | `npm run test -- --run` |
| Full suite command | `npm run test -- --run && npm run test:e2e` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SYN-01 | createCssVariablesTheme used in velite config | manual | Visual: `npm run velite` succeeds, code blocks render | N/A |
| SYN-02 | Token variables in globals.css | manual | Grep for `--shiki-token-` in globals.css | N/A |
| SYN-03 | keepBackground: false, background from CSS | e2e | `npm run test:e2e -- e2e/code-copy.spec.ts` (existing test verifies code blocks render) | yes |
| SYN-04 | Visual parity | manual-only | Visual comparison of code blocks before/after | N/A - human judgment required |

### Sampling Rate
- **Per task commit:** `npm run test -- --run` + `npm run velite`
- **Per wave merge:** `npm run test -- --run && npm run test:e2e`
- **Phase gate:** Full suite green + visual comparison of code blocks

### Wave 0 Gaps
None -- existing test infrastructure covers functional aspects. SYN-04 (visual parity) is inherently manual. The existing `e2e/code-copy.spec.ts` test validates that code blocks render and the copy button works, which serves as a smoke test that the theme change didn't break rendering.

## Open Questions

1. **Diff token colors (inserted/deleted/changed)**
   - What we know: The CSS-variables theme includes `--shiki-token-inserted`, `--shiki-token-deleted`, and `--shiki-token-changed` variables. These only matter for diff-formatted code blocks.
   - What's unclear: Whether any blog posts currently use diff syntax highlighting.
   - Recommendation: Include the three diff variables in the CSS definitions for completeness (cost is 3 lines of CSS). Values: inserted `#8ddb8c`, deleted `#ff938a`, changed `#f69d50`.

## Sources

### Primary (HIGH confidence)
- shiki@3.22.0 installed locally -- `createCssVariablesTheme()` API verified by direct invocation
- github-dark-dimmed theme colors extracted programmatically from Shiki's bundled theme source
- rehype-pretty-code@0.14.1 -- `keepBackground` option verified in installed package

### Secondary (MEDIUM confidence)
- None needed -- all findings from direct source inspection

### Tertiary (LOW confidence)
- None

## Project Constraints (from CLAUDE.md)

- Build command: `npm run build` (velite && next build -- sequential)
- Velite runs as separate prebuild step (not webpack plugin)
- CSS-first configuration: all design tokens in `globals.css` via `@theme` directive (but these variables go in Code Block Styles section per D-04)
- Single theme only (no dark mode) -- only one set of `--shiki-*` values needed
- Vitest for unit tests, Playwright for e2e
- `npm run velite` for debugging content compilation issues

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new packages, direct API verification
- Architecture: HIGH - two-file change, verified API signatures
- Pitfalls: HIGH - based on understanding of how CSS variables scope and how rehype-pretty-code injects styles
- Color mapping: HIGH - extracted programmatically from Shiki's bundled theme source

**Research date:** 2026-04-04
**Valid until:** 2026-05-04 (stable -- Shiki CSS variables API is well-established)

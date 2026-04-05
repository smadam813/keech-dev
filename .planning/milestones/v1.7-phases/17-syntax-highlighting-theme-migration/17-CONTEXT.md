# Phase 17: Syntax Highlighting Theme Migration - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the bundled `github-dark-dimmed` Shiki theme with a CSS-variables theme so that syntax highlighting token colors are defined as CSS custom properties in `globals.css`, consistent with the site's CSS-first design token approach. `keepBackground: false` is set so the code block background is explicitly controlled via CSS. Visual appearance stays as close to the current github-dark-dimmed look as the ~10 CSS-variable granularity allows.

</domain>

<decisions>
## Implementation Decisions

### Shiki theme configuration
- **D-01:** Replace `theme: 'github-dark-dimmed'` with a CSS-variables theme created via `createCssVariablesTheme()` from `shiki` in `velite.config.ts`. The rehype-pretty-code plugin accepts this as the `theme` option.
- **D-02:** Use Shiki's default `--shiki-*` CSS variable prefix (e.g., `--shiki-foreground`, `--shiki-background`, `--shiki-token-comment`, etc.). This is the standard convention, well-documented, and immediately recognizable to anyone familiar with Shiki.
- **D-03:** Set `keepBackground: false` in the rehype-pretty-code options. This tells the plugin not to inject inline `background-color` styles, so the background is controlled entirely via CSS.

### CSS variable definitions
- **D-04:** Define the `--shiki-*` token color variables in the **Code Block Styles** section of `globals.css`, not in the `@theme` block. These are implementation-specific to code blocks, not site-wide design tokens. They sit alongside the existing `figure[data-rehype-pretty-code-figure]` styles.
- **D-05:** Map the ~10 CSS variables to colors that approximate `github-dark-dimmed` as closely as possible. The variables to define are: `--shiki-foreground`, `--shiki-background`, `--shiki-token-comment`, `--shiki-token-keyword`, `--shiki-token-string`, `--shiki-token-function`, `--shiki-token-constant`, `--shiki-token-parameter`, `--shiki-token-string-expression`, `--shiki-token-punctuation`, and `--shiki-token-link`. Accept that ~40 scopes mapping to ~10 variables means some tokens will share colors — this is expected and noted in STATE.md as a known trade-off.
- **D-06:** Set `--shiki-background: #22272e` (github-dark-dimmed's background color) to maintain visual continuity. The `figure[data-rehype-pretty-code-figure] pre` selector should apply this as its background-color.

### CSP impact
- **D-07:** This phase does NOT aim to remove `unsafe-inline` from `style-src`. The decision to keep `unsafe-inline` was already made (see PROJECT.md key decisions). The migration is motivated by design system consistency (CSS-first tokens), not CSP hardening.

### Visual verification
- **D-08:** After migration, visually compare code blocks against current appearance. Some color granularity loss is expected and acceptable. Jarring regressions (e.g., all tokens same color, unreadable contrast) are not acceptable.

### Claude's Discretion
- Exact hex values for each `--shiki-token-*` variable (should approximate github-dark-dimmed's palette)
- Whether to extract github-dark-dimmed colors from the Shiki source or reference documentation
- Whether inline code (`span[data-rehype-pretty-code-figure]`) needs variable adjustments too
- Commit granularity

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Current implementation
- `velite.config.ts` — Current Velite config with `rehype-pretty-code` using `theme: 'github-dark-dimmed'` and `keepBackground: true`
- `src/app/globals.css` §Code Block Styles — Existing neobrutalist code block styling (figure, pre, code, line numbers, highlighted lines, inline code)

### CSP configuration
- `src/proxy.ts` — Middleware with CSP directives; `unsafe-inline` stays in `style-src` per project decision

### Requirements
- `.planning/REQUIREMENTS.md` §Syntax Highlighting — SYN-01 through SYN-04 define the four acceptance criteria

### Prior phase context
- `.planning/phases/16-mdx-migration/16-CONTEXT.md` — Phase 16 migrated from `s.mdx()` to `s.markdown()` and established the current rehype-pretty-code configuration

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `globals.css` Code Block Styles section: Comprehensive neobrutalist styling for code blocks already exists — only token colors and background need adding
- `velite.config.ts` rehype plugin configuration: Pattern for configuring rehype-pretty-code options is established

### Established Patterns
- CSS-first design tokens: All design tokens live in `globals.css` via `@theme` directive — syntax variables follow the same philosophy (CSS over JS config) though placed in the code block section rather than `@theme`
- `rehype-pretty-code` integration: Already configured with `rehypeSlug` and custom `rehypeListRole` plugin — modifying theme option is a config change, not an architecture change

### Integration Points
- `velite.config.ts` — Change `theme` option from string to `createCssVariablesTheme()` result, set `keepBackground: false`
- `src/app/globals.css` — Add `--shiki-*` CSS variable definitions and background-color on pre element
- No changes needed to `MDXContent`, consuming pages, or CSP

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond matching github-dark-dimmed as closely as the CSS-variables granularity allows. The STATE.md blocker note ("CSS-variables theme is coarser than github-dark-dimmed (~10 vars vs ~40 scopes) — visual check required") is acknowledged and accepted.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 17-syntax-highlighting-theme-migration*
*Context gathered: 2026-04-04*

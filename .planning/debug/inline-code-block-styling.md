---
status: diagnosed
trigger: "Inline code styling issue - renders as block instead of inline in MDX project pages"
created: 2026-02-01T12:00:00Z
updated: 2026-02-01T12:01:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: CONFIRMED - CSS rule for [data-rehype-pretty-code-figure] applies block styling to both code blocks AND inline code
test: examined rendered HTML and CSS rules
expecting: found block-level styling applied to inline code
next_action: diagnosis complete

## Symptoms

expected: Inline code like `@theme` should render inline within paragraph text
actual: Inline code renders as full-width block element, breaking paragraph flow
errors: none (visual styling issue)
reproduction: View any project detail page at /projects/[slug] with inline code in MDX
started: unknown

## Eliminated

## Evidence

- timestamp: 2026-02-01T12:00:30Z
  checked: velite.config.ts rehype-pretty-code configuration
  found: rehype-pretty-code has defaultLang.inline set, meaning it processes inline code
  implication: inline code elements get data-rehype-pretty-code-figure attribute

- timestamp: 2026-02-01T12:00:45Z
  checked: rendered HTML from /projects/keech-dev
  found: inline code is wrapped in <span data-rehype-pretty-code-figure><code>...</code></span>
  implication: rehype-pretty-code wraps inline code in a span with same data attribute as code blocks

- timestamp: 2026-02-01T12:01:00Z
  checked: globals.css lines 45-71
  found: |
    [data-rehype-pretty-code-figure] applies: my-6, overflow-hidden, rounded-lg, border, box-shadow, position:relative
    [data-rehype-pretty-code-figure] code applies: display:grid
  implication: CSS rules for code blocks also apply to inline code because they share the data attribute

## Resolution

root_cause: The CSS selector [data-rehype-pretty-code-figure] in globals.css (lines 45-71) applies block-level styling (my-6, display:grid) to both code blocks AND inline code because rehype-pretty-code uses the same data-rehype-pretty-code-figure attribute for both, just on different elements (figure for blocks, span for inline).
fix:
verification:
files_changed: []

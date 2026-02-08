# Quick Task 004: Restyle inline code to feel lighter and more integrated with prose text

## Result: COMPLETE

## Changes

### src/app/globals.css

**Problem:** Inline code in blog/project posts appeared as heavy black blocks with excessive padding. The `[data-line]` rule applied 16px horizontal padding to all code elements (including inline), and rehype-pretty-code's Shiki theme injected a solid dark background via inline styles.

**Fix (3 targeted changes):**

1. **Uniform padding on `code` element:** Changed `px-1.5 py-0.5` (6px/2px) to `p-0.5` (2px all sides) on both inline code selectors
2. **Semi-transparent background:** Set `background-color: rgba(0, 0, 0, 0.69) !important` on `span[data-rehype-pretty-code-figure] code` — overrides Shiki's opaque dark background so the dusty pink page shows through
3. **Reduced `[data-line]` padding for inline code:** Added `span[data-rehype-pretty-code-figure] [data-line]` rule with `padding: 0.125rem !important` to override the 16px `px-4` from the fenced code block `[data-line]` rule

**Unchanged:** All fenced code block styles (lines 91-148) remain untouched.

## Commits

| Commit | Description |
|--------|-------------|
| d70a9f3 | Plan creation |
| 4d5f5b9 | Initial border/padding softening |
| 3142f9b | Reduce padding to uniform 2px |
| dcd5726 | Final: transparent bg, reverted border, [data-line] fix |

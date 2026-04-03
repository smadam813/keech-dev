# Phase 11: SEO & Branding - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 11-seo-branding
**Areas discussed:** Favicon Design, OG Image Branding, Per-Post OG Variation, Resume Placeholder Resolution
**Mode:** Auto (all decisions auto-selected with recommended defaults)

---

## Favicon Design

| Option | Description | Selected |
|--------|-------------|----------|
| Rune symbol (Othala ᛟ) | Leverages existing Norse theme; Othala already mapped to Home route | ✓ |
| "K" lettermark | Simple initial-based favicon | |
| Full "keech" wordmark | Text-based, may not be legible at small sizes | |

**User's choice:** [auto] Rune symbol (Othala ᛟ) — recommended default
**Notes:** Othala is already the navigation rune for Home in rune-config.ts, creating a direct brand connection.

| Option | Description | Selected |
|--------|-------------|----------|
| SVG + ICO + apple-touch-icon via Metadata API | Maximum browser coverage using Next.js conventions | ✓ |
| ICO only in public/ | Legacy approach, misses modern browsers and iOS | |

**User's choice:** [auto] SVG + ICO + apple-touch-icon — recommended default
**Notes:** Next.js Metadata API handles the routing automatically.

---

## OG Image Branding

| Option | Description | Selected |
|--------|-------------|----------|
| Neobrutalist card (dusty rose, bold border, Norse font) | Matches site identity exactly | ✓ |
| Minimal text-only (white background, clean type) | Clean but doesn't represent the brand | |
| Photo-based (hero image with overlay text) | Visually rich but slow to generate | |

**User's choice:** [auto] Neobrutalist card — recommended default
**Notes:** Preview card should be immediately recognizable as keech.dev.

| Option | Description | Selected |
|--------|-------------|----------|
| Next.js opengraph-image.tsx with @vercel/og | Zero external deps, native Vercel support | ✓ |
| Static image in public/ | Simple but not dynamic | |
| External service (e.g., og-image.vercel.app) | Unnecessary dependency | |

**User's choice:** [auto] Next.js opengraph-image.tsx — recommended default

---

## Per-Post OG Variation

| Option | Description | Selected |
|--------|-------------|----------|
| Same neobrutalist card with post title + date + branding | Consistent identity, title-specific | ✓ |
| Unique color per tag category | Visual variety but brand inconsistency risk | |
| Post-specific hero images | Requires per-post image assets | |

**User's choice:** [auto] Same neobrutalist card with post title — recommended default

| Option | Description | Selected |
|--------|-------------|----------|
| Include tags if layout allows | Adds context without commitment | ✓ |
| Always show tags | May clutter small preview | |
| Never show tags | Misses categorization info | |

**User's choice:** [auto] Claude's discretion on tag inclusion — recommended default

---

## Resume Placeholder Resolution

| Option | Description | Selected |
|--------|-------------|----------|
| Remove placeholder entirely | Clean, no indefinite "coming soon" | ✓ |
| Replace with LinkedIn link | Provides alternative but adds external dependency | |
| Keep as-is | Leaves stale placeholder | |

**User's choice:** [auto] Remove placeholder entirely — recommended default
**Notes:** About page already provides context. Resume can be added later as a real download.

---

## Claude's Discretion

- Exact favicon glyph rendering and weight
- OG image internal layout details (spacing, font sizes, decorative elements)
- Whether tags appear on per-post OG images
- RSS feed metadata details (author, categories)
- Sitemap date strategy for static routes
- Project image `sizes` attribute values

## Deferred Ideas

None — discussion stayed within phase scope

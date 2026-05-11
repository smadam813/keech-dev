# keech.dev

Personal portfolio and blog. The visual identity — dark palette, Elder Futhark runes, neobrutalist aesthetic — is the brand, not decoration.

## Language

### Rune System

**Section Rune**: A rune symbol assigned to a semantic role — a route, section bullet, or action icon (e.g. othala → home, sowilo → live demo link).
_Avoid_: Nav rune, icon rune

**Ambient Rune**: A rune in the hero background constellation, positioned over the hero image with a color, size, and breath duration.
_Avoid_: Glow rune, background rune

**Rune Divider**: A horizontal content separator rendered using the dagaz rune.
_Avoid_: Rune separator, divider

**Aett** (pl. **Aettir**): One of the three traditional Elder Futhark groupings that determines an Ambient Rune's color — Freyr's Aett → amber, Hagal's Aett → teal, Tyr's Aett → gold.
_Avoid_: Group, family, set

### Content

**Post**: A blog article authored in MDX, published under `/blog`.
_Avoid_: Article, blog post, entry

**Project**: A portfolio entry authored in MDX, published under `/projects`.
_Avoid_: Work, case study, portfolio item

**View Count**: The number of times a Post has been viewed, tracked via Redis and treated as non-critical — fetch failures are silent.
_Avoid_: Hit count, page views, analytics

**Draft**: A Post that is authored but not yet published — excluded from listings and feeds.
_Avoid_: Unpublished, hidden, pending

**Tag**: A topic or theme label on a Post, rendered with a deterministic hue from the tag palette.
_Avoid_: Label, keyword

**Stack**: The list of technologies used in a Project.
_Avoid_: Tech stack, technologies, tools

**Category**: The coarse classification of a Project's nature — one of: side project, professional, open source.
_Avoid_: Type, kind, tag

### Visual Identity

**Nocturnal Petrol Palette**: The site's dark-only color scheme — a fixed set of CSS design tokens anchored around deep petrol backgrounds, mint-teal and rose accents, and runic gold.
_Avoid_: Dark theme, dark mode, color scheme

**Neobrutalism**: The layout and component aesthetic — hard offset shadows, bold borders, flat colors, no gradients or soft visual tricks.
_Avoid_: Brutalism, neobrutalist style

**Ambient Background**: The full-bleed atmospheric layer composited from the hero image, color wash, gradient, vignette, film grain, and Ambient Rune constellation.
_Avoid_: Hero background, background, backdrop

## Relationships

- A **Post** has zero or more **Tags**, one **View Count**, and may be a **Draft**
- A **Project** has one **Category** and one or more **Stack** entries
- An **Ambient Rune** belongs to one **Aett**, which determines its color
- The **Ambient Background** contains the full constellation of **Ambient Runes**
- **Section Runes** are assigned to routes and semantic roles (bullets, action icons) within each section

## Example dialogue

> **Dev:** "I want to add a new page for writing recommendations — should it be a **Post** or a new content type?"
> **Domain expert:** "It depends — is it a dated article you'd want in the feed? Then it's a **Post**. If it's more like an evergreen portfolio item, it's a **Project**. A standalone page doesn't fit either."

> **Dev:** "The **Ambient Rune** for berkanan is teal but it's in Freyr's Aett — shouldn't it be amber?"
> **Domain expert:** "Check the **Aett** assignment — berkanan is in Hagal's **Aett**, not Freyr's. Hagal maps to teal."

## Flagged ambiguities

- "rune" was used to mean Section Rune, Ambient Rune, and Rune Divider — resolved: three distinct concepts.
- "nav rune" was used for both route-to-symbol mappings and section-specific semantic assignments — resolved: both are **Section Runes**.

- "rune" was used to mean Section Rune, Ambient Rune, and Rune Divider — resolved: three distinct concepts.

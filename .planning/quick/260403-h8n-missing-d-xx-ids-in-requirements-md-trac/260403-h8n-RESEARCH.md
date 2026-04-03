# Quick Task: Missing D-xx IDs in REQUIREMENTS.md Traceability Table - Research

**Researched:** 2026-04-03
**Domain:** Documentation gap — traceability table completeness
**Confidence:** HIGH

## Summary

Phase 13 (Sticky/Pinned Mobile TOC) introduced 7 requirement IDs (D-01 through D-07) defined in `13-CONTEXT.md` as implementation decisions. These IDs are referenced in `ROADMAP.md` (Phase 13 Requirements line) and verified in `13-VERIFICATION.md`, but were never added to the `REQUIREMENTS.md` traceability table or requirement definitions. The milestone audit (`v1.6-MILESTONE-AUDIT.md`) explicitly flags this as a documentation gap at line 29 and line 86.

**Primary recommendation:** Add D-01 through D-07 as a new "Mobile TOC Enhancement" category in REQUIREMENTS.md (both the definition list and the traceability table), following the existing pattern of category prefix + sequential number.

## Findings

### What D-01 through D-07 Are

These are implementation decision IDs from Phase 13's CONTEXT.md. Unlike other requirement categories (SEC, ERR, QUAL, etc.) which were defined in REQUIREMENTS.md first, the D-xx IDs originated in the discussion/context phase and were never backported. Their definitions, sourced from `13-CONTEXT.md` and verified in `13-VERIFICATION.md`:

| ID | Description | Category |
|----|-------------|----------|
| D-01 | CSS `position: sticky` on mobile TOC — pure CSS, no scroll listeners | Sticky Mechanism |
| D-02 | Sticky behavior only below `lg` breakpoint | Sticky Mechanism |
| D-03 | Collapsed sticky bar shows only the Contents toggle button | Collapsed Appearance |
| D-04 | Visual indicator when in sticky/pinned state | Collapsed Appearance |
| D-05 | Auto-collapse TOC after heading link click | Auto-Collapse |
| D-06 | Smooth scroll to target heading after collapse | Auto-Collapse |
| D-07 | No separate back-to-top floating button | Scope Boundary |

### Naming Convention Issue

The prefix "D" stands for "Decision" — these came from the `<decisions>` block in CONTEXT.md. All other requirement IDs use descriptive category prefixes (SEC, ERR, QUAL, SEO, A11Y, TEST, CLN, DEP). Two options:

1. **Keep D-xx as-is** — They are already referenced in ROADMAP.md, VERIFICATION.md, and SUMMARY.md frontmatter. Renaming would create inconsistency with those files.
2. **Rename to a descriptive prefix** (e.g., TOC-01 through TOC-07) — More consistent with other categories, but requires updating ROADMAP.md Phase 13 requirements line, 13-VERIFICATION.md requirements table, and 13-01-SUMMARY.md frontmatter.

**Recommendation:** Keep D-xx as-is. The IDs are already used in 3+ files. The cost of renaming outweighs the naming consistency benefit for a completed milestone. Add a note that "D" prefix denotes Phase 13 discussion-originated requirements.

### Exact Changes Needed in REQUIREMENTS.md

**1. Add definition section** after the Testing section (before Cleanup), or after Cleanup:

```markdown
### Mobile TOC Enhancement

- [x] **D-01**: Mobile TOC uses CSS `position: sticky` to pin at viewport top — pure CSS, no JavaScript scroll listeners
- [x] **D-02**: Sticky behavior applies only below the `lg` breakpoint (mobile/tablet)
- [x] **D-03**: When sticky, collapsed TOC shows only the "Contents" toggle button
- [x] **D-04**: Visual indicator distinguishes sticky/pinned state from inline position
- [x] **D-05**: TOC auto-collapses after user taps a heading link
- [x] **D-06**: Smooth scroll to target heading after TOC collapse, with scroll-margin-top clearance
- [x] **D-07**: No separate back-to-top floating button — sticky TOC is the sole navigation affordance
```

**2. Add to traceability table** (after CLN-03 row):

```markdown
| D-01 | Phase 13 | Complete |
| D-02 | Phase 13 | Complete |
| D-03 | Phase 13 | Complete |
| D-04 | Phase 13 | Complete |
| D-05 | Phase 13 | Complete |
| D-06 | Phase 13 | Complete |
| D-07 | Phase 13 | Complete |
```

**3. Update coverage count:**

```markdown
**Coverage:**
- v1.6 requirements: 38 total
- Mapped to phases: 38/38
- Unmapped: 0
```

(31 existing + 7 new = 38)

**4. Move D-xx entries to "Recently Validated"** section in PROJECT.md is optional — they are already covered by the A11Y-03 line item for mobile TOC. The D-xx IDs are sub-requirements that elaborate on the Phase 13 enhancement.

### Files That Reference D-xx IDs (no changes needed)

These files already correctly reference D-01 through D-07 and need no modification:

- `.planning/phases/13-sticky-pinned-mobile-toc/13-CONTEXT.md` — defines D-01 through D-07
- `.planning/phases/13-sticky-pinned-mobile-toc/13-VERIFICATION.md` — verifies D-01 through D-07
- `.planning/phases/13-sticky-pinned-mobile-toc/13-01-PLAN.md` — plans against D-xx IDs
- `.planning/phases/13-sticky-pinned-mobile-toc/13-01-SUMMARY.md` — lists D-xx in frontmatter
- `.planning/ROADMAP.md` — Phase 13 requirements line references D-01 through D-07

### Milestone Audit Update

After fixing REQUIREMENTS.md, the tech debt item in `v1.6-MILESTONE-AUDIT.md` (Phase 13 section, line 29 and line 137) should be marked as resolved or removed.

## Common Pitfalls

### Pitfall 1: Miscounting Coverage Total
**What goes wrong:** Updating the traceability table rows but forgetting to update the coverage count at the bottom.
**How to avoid:** After adding rows, count all rows in the table and verify the total matches.

### Pitfall 2: Inconsistent Status Labels
**What goes wrong:** Using "Done" or "Verified" instead of "Complete" which is the convention in the existing table.
**How to avoid:** All existing rows use "Complete" — match this exactly.

## Sources

### Primary (HIGH confidence)
- `.planning/REQUIREMENTS.md` — current traceability table structure and conventions
- `.planning/phases/13-sticky-pinned-mobile-toc/13-CONTEXT.md` — D-xx ID definitions
- `.planning/phases/13-sticky-pinned-mobile-toc/13-VERIFICATION.md` — D-xx verification status
- `.planning/ROADMAP.md` — Phase 13 requirements reference
- `.planning/v1.6-MILESTONE-AUDIT.md` — explicit documentation gap identification

## Metadata

**Confidence:** HIGH — all source files are local documentation with clear, unambiguous content.
**Research date:** 2026-04-03
**Valid until:** Indefinite (documentation fix for completed milestone)

---
phase: quick-5
plan: 01
subsystem: tooling
tags: [claude-code, skills, mdx, blog, writing]

# Dependency graph
requires: []
provides:
  - "/write-blog-post Claude Code skill for generating blog posts"
  - "writing-guide.md distilled writing principles reference"
  - "example-post.mdx format reference for MDX output"
affects: [content-creation, blog-posts]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Claude Code skill with SKILL.md + supporting reference files"
    - "disable-model-invocation for user-triggered-only skills"

key-files:
  created:
    - ".claude/skills/write-blog-post/SKILL.md"
    - ".claude/skills/write-blog-post/writing-guide.md"
    - ".claude/skills/write-blog-post/example-post.mdx"
  modified: []

key-decisions:
  - "Set draft: true as default for all generated posts to require author review before publishing"
  - "Restricted allowed-tools to Read, Write, Glob, Grep, Bash(date *) for minimal permissions"
  - "Distilled research.md into 9 actionable sections in writing-guide.md rather than linking to research.md directly"

patterns-established:
  - "Skill structure: SKILL.md orchestration + writing-guide.md principles + example-post.mdx format reference"
  - "Blog post conventions: no h1 (template renders title), ## for TOC sections, fenced code with language ids, bold key phrases, short paragraphs"

# Metrics
duration: 2min
completed: 2026-02-15
---

# Quick Task 5: Create Claude Code Skill for Writing Blog Posts Summary

**`/write-blog-post` skill with 8-step orchestration, 9-principle writing guide, and tRPC migration example post as format reference**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-15T15:42:55Z
- **Completed:** 2026-02-15T15:45:22Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments
- Created `/write-blog-post` skill invocable in Claude Code with `$ARGUMENTS` topic input
- Distilled research.md writing principles into 9 actionable sections (specificity, frontloading, examples, tone, structure, trust, dual-audience, titles, anti-patterns)
- Built realistic format reference showing correct Velite frontmatter, `##` sections, code blocks, bold phrases, and conversational tone
- All generated posts default to `draft: true` for author review before publishing

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SKILL.md and writing-guide.md** - `7a0a458` (feat)
2. **Task 2: Create example-post.mdx and validate the skill** - `0957511` (feat)

## Files Created/Modified
- `.claude/skills/write-blog-post/SKILL.md` - Main skill definition with frontmatter and 8-step orchestration instructions
- `.claude/skills/write-blog-post/writing-guide.md` - 9 distilled writing principles from research.md (~80 lines)
- `.claude/skills/write-blog-post/example-post.mdx` - tRPC migration format reference (~80 lines including frontmatter)

## Decisions Made
- **Draft by default:** All generated posts set `draft: true` so the author reviews before publishing. The skill reminds users to flip the flag.
- **Minimal tool permissions:** Restricted `allowed-tools` to only what the skill needs (Read, Write, Glob, Grep, Bash for date). No unrestricted Bash access.
- **Distilled guide over direct reference:** Created a standalone writing-guide.md (~80 lines) rather than pointing to the full research.md (~65 lines of dense prose). The guide is organized as numbered actionable sections with test criteria.
- **Velite verification step:** Skill instructs Claude to run `npm run velite` after writing to catch frontmatter or MDX compilation errors before the author sees them.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `/write-blog-post` skill is ready to use immediately
- Invoke with `/write-blog-post [topic]` in any Claude Code session within this project
- First generated post will need author review (draft: true) and `npm run build` verification before deploy

## Self-Check: PASSED

All files verified present on disk. All commit hashes found in git log.

# Writer Agent Instructions

You are writing a complete blog post for keech.dev. The orchestrator has provided you with: a topic, slug, today's date, existing post slugs, user angle/emphasis preference, and the path to research files.

Follow these steps in order.

## Step 1: Read reference materials

1. Read `.claude/skills/write-blog-post/writing-guide.md` for writing principles and tone guidance.
2. Read `.claude/skills/write-blog-post/example-post.mdx` for format reference showing the expected output structure.

## Step 2: Read and synthesize research

Read all research files from the `.research/{slug}/` directory. Review all findings and:
- Identify the strongest 3-5 insights that are specific and well-sourced.
- Select the most concrete examples worth including or adapting.
- Note any contradictions between sources that are worth discussing.
- Determine the specific knowledge gap this post fills that existing content does not.
- Discard anything generic, unsupported, or tangential.

## Step 3: Plan the post structure

Outline 3-5 main sections based on the topic, research findings, and the user's angle/emphasis preference. Each section should earn its place. Ground the outline in specific examples and facts from the research.

## Step 4: Write the complete MDX file

Write the post following the frontmatter requirements and content structure below. Integrate research findings naturally: cite specific facts, use real examples, and acknowledge tradeoffs where relevant.

### Frontmatter Requirements

Every post must start with valid YAML frontmatter matching the Velite Post schema:

```yaml
---
title: "[max 99 chars, descriptive and specific]"
slug: "[kebab-case, use the slug provided by the orchestrator]"
date: "[YYYY-MM-DD, use the date provided by the orchestrator]"
description: "[max 300 chars, one-sentence summary that frontloads value]"
tags:
  - "[relevant lowercase tags]"
draft: false
---
```

Always set `draft: false` so the author can review the post locally with `npm run dev`.

### Content Structure

- Use `##` for main sections. These become Table of Contents entries via rehype-slug.
- Use `###` for subsections.
- Do NOT use `#` (h1). The page template renders the title as h1 automatically.
- Use fenced code blocks with language identifiers (rehype-pretty-code handles syntax highlighting with the github-dark-dimmed theme).
- **Bold key phrases** for scannability.
- Keep paragraphs short (2-4 sentences max).
- Include at least one code example if the topic is technical.

## Step 5: Save the file

Save the completed post to `content/posts/{slug}.mdx` using the Write tool. Confirm the slug is unique among the existing slugs provided by the orchestrator.

## Step 6: Verify compilation

Run `npm run velite` to confirm the post compiles without errors. If it fails:
- Read the error output carefully.
- Fix the issue (usually frontmatter formatting).
- Save the corrected file and retry.
- Retry up to 3 times. If it still fails after 3 attempts, report the error in your summary.

## Step 7: Return your summary

Return a brief summary to the orchestrator containing:
- The file path where the post was saved
- The post title
- A one-line overview of each section
- Compilation status (pass/fail, and error details if failed)

## Quality Checklist

Before saving, verify the post against these criteria:

- [ ] Does the opening paragraph immediately tell the reader what they will learn?
- [ ] Are there concrete examples, not just abstract descriptions?
- [ ] Is the tone conversational but not flippant?
- [ ] Does every section earn its place (no filler)?
- [ ] Are code examples realistic (no foo/bar/baz)?
- [ ] Is the slug unique among existing posts?
- [ ] Is the title under 99 characters?
- [ ] Is the description under 300 characters?

## Anti-Patterns

- Do not use emdashes or `--` as punctuation. Use periods, commas, colons, or parentheses instead. Break the sentence into two if needed.
- Do not use emojis in the post content.
- Do not add import statements (Velite handles MDX compilation).
- Do not use JSX components (only standard markdown + code blocks).
- Do not include a "Conclusion" section that restates everything. End with a forward-looking thought or call to action instead.
- Do not use the word "straightforward" or "simply". These dismiss complexity.
- Do not start with throat-clearing or preamble. Frontload value immediately.
- Do not use foo/bar/baz in examples. Use realistic names and scenarios.

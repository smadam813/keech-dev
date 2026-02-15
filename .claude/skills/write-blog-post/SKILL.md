---
name: write-blog-post
description: Write a blog post for keech.dev. Generates a complete MDX file with valid frontmatter and publishes to content/posts/. Use when asked to write, draft, or create a blog post.
argument-hint: "[topic or description of the blog post]"
disable-model-invocation: true
allowed-tools: Read, Write, Glob, Grep, Bash(date *), Task(blog-researcher)
---

# Write a Blog Post for keech.dev

You are writing a blog post for keech.dev. The topic is: $ARGUMENTS

## Process

Follow these steps in order:

1. **Read the writing guide** at `.claude/skills/write-blog-post/writing-guide.md` for writing principles and tone guidance.

2. **Read the example post** at `.claude/skills/write-blog-post/example-post.mdx` for format reference showing the expected output structure.

3. **Research the topic** -- spawn 2-3 `blog-researcher` subagents in parallel via the Task tool (`subagent_type: "blog-researcher"`), each covering a different research angle:
   - **Agent 1 — Core concepts:** Current best practices, key facts, authoritative definitions, and how the topic fits into the broader ecosystem.
   - **Agent 2 — Practical examples:** Real-world code patterns, case studies, tutorials, and concrete implementations worth referencing.
   - **Agent 3 — Pitfalls & tradeoffs:** Common mistakes, limitations, counterarguments, performance considerations, and what the "other side" looks like.

   Each agent will return structured findings with source URLs. Wait for all agents to complete before proceeding.

4. **Synthesize research** -- review all findings from the research agents and:
   - Identify the strongest 3-5 insights that are specific and well-sourced.
   - Select the most concrete examples worth including or adapting.
   - Note any contradictions between sources that are worth discussing.
   - Determine the specific knowledge gap this post fills that existing content does not.
   - Discard anything generic, unsupported, or tangential.

5. **Check existing posts** with `Glob content/posts/*.mdx` to avoid duplicate slugs and see what topics already exist.

6. **Get today's date** with `date +%Y-%m-%d` for the frontmatter date field.

7. **Plan the post structure** -- outline 3-5 main sections based on the topic and research findings. Each section should earn its place. Ground the outline in specific examples and facts from the research.

8. **Write the complete MDX file** following the frontmatter requirements and content structure below. Integrate research findings naturally — cite specific facts, use real examples, and acknowledge tradeoffs where relevant.

9. **Save the file** to `content/posts/{slug}.mdx` using the Write tool.

10. **Verify compilation** by running `npm run velite` to confirm the post compiles without errors.

## Frontmatter Requirements

Every post must start with valid YAML frontmatter matching the Velite Post schema:

```yaml
---
title: "[max 99 chars, descriptive and specific]"
slug: "[kebab-case, derived from title]"
date: "[YYYY-MM-DD, today's date from step 6]"
description: "[max 300 chars, one-sentence summary that frontloads value]"
tags:
  - "[relevant lowercase tags]"
draft: true
---
```

Always set `draft: true` so the author can review before publishing. Remind the author to set `draft: false` when ready to publish.

## Content Structure Requirements

- Use `##` for main sections -- these become Table of Contents entries via rehype-slug
- Use `###` for subsections
- Do NOT use `#` (h1) -- the page template renders the title as h1 automatically
- Use fenced code blocks with language identifiers (rehype-pretty-code handles syntax highlighting with the github-dark-dimmed theme)
- **Bold key phrases** for scannability
- Keep paragraphs short (2-4 sentences max)
- Include at least one code example if the topic is technical

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

## What NOT to Do

- Do not use emojis in the post content
- Do not add import statements (Velite handles MDX compilation)
- Do not use JSX components (only standard markdown + code blocks)
- Do not include a "Conclusion" section that restates everything -- end with a forward-looking thought or call to action instead
- Do not use the word "straightforward" or "simply" -- these dismiss complexity
- Do not start with throat-clearing or preamble -- frontload value immediately
- Do not use foo/bar/baz in examples -- use realistic names and scenarios

## After Writing

Tell the author:
1. The file path where the post was saved
2. Suggest they review the content and make any personal adjustments
3. Remind them to set `draft: false` when ready to publish
4. Recommend running `npm run build` to verify everything compiles before deploying

---
name: write-blog-post
description: Writes a complete blog post for keech.dev as an MDX file with research-backed content, valid frontmatter, and image generation prompts. Publishes to content/posts/. Use when asked to write, draft, create, or compose a blog post.
argument-hint: "[topic or description of the blog post]"
disable-model-invocation: true
allowed-tools: Read, Write, Glob, Grep, Bash(npm run *), Task(general-purpose), AskUserQuestion
---

# Write a Blog Post for keech.dev

You are writing a blog post for keech.dev. The topic is: $ARGUMENTS

**Today's date:** !`date +%Y-%m-%d`

## Process

Follow these steps in order:

1. **Read the writing guide** at `.claude/skills/write-blog-post/writing-guide.md` for writing principles and tone guidance.

2. **Read the example post** at `.claude/skills/write-blog-post/example-post.mdx` for format reference showing the expected output structure.

3. **Research the topic.** Read the research instructions at `.claude/skills/write-blog-post/research-instructions.md`, then spawn 2-3 `general-purpose` subagents in parallel via the Task tool (`subagent_type: "general-purpose"`). In each agent's prompt, include the full research instructions you just read along with the post slug and assigned angle. Tell each agent: "The post slug is `{slug}`. Save your research to `.research/{slug}/{angle}.md`." Each agent covers a different research angle:
   - **Agent 1 — Core concepts:** Current best practices, key facts, authoritative definitions, and how the topic fits into the broader ecosystem.
   - **Agent 2 — Practical examples:** Real-world code patterns, case studies, tutorials, and concrete implementations worth referencing.
   - **Agent 3 — Pitfalls & tradeoffs:** Common mistakes, limitations, counterarguments, performance considerations, and what the "other side" looks like.

   Each agent will save its full findings to `.research/{slug}/` and return a brief summary with the file path. Wait for all agents to complete before proceeding.

4. **Synthesize research.** Read the research files saved by each agent in `.research/{slug}/`. Review all findings and:
   - Identify the strongest 3-5 insights that are specific and well-sourced.
   - Select the most concrete examples worth including or adapting.
   - Note any contradictions between sources that are worth discussing.
   - Determine the specific knowledge gap this post fills that existing content does not.
   - Discard anything generic, unsupported, or tangential.

5. **Check existing posts** with `Glob content/posts/*.mdx` to avoid duplicate slugs and see what topics already exist.

6. **Plan the post structure.** Outline 3-5 main sections based on the topic and research findings. Each section should earn its place. Ground the outline in specific examples and facts from the research.

7. **Write the complete MDX file** following the frontmatter requirements and content structure below. Integrate research findings naturally — cite specific facts, use real examples, and acknowledge tradeoffs where relevant.

8. **Save the file** to `content/posts/{slug}.mdx` using the Write tool.

9. **Verify compilation** by running `npm run velite` to confirm the post compiles without errors.

10. **Ask about image style.** Use AskUserQuestion to ask the author what visual
    style they want for image generation prompts. If they select the site default
    (neobrutalist), read `src/app/globals.css` to extract the current color tokens
    from the `@theme` block.

    **Question to ask:**

    > "What visual style should the image generation prompts use?"

    **Options:**
    - **Neobrutalist (site default)**: Dusty rose background, teal accents, black borders/shadows, flat colors, geometric sans-serif. Matches keech.dev's existing design system.
    - **Clean/minimal**: White or light gray background, single accent color, thin lines, no drop shadows. Good for professional or documentation-style posts.
    - **Dark mode technical**: Dark background, syntax-highlight-inspired palette, monospace elements. Good for developer-focused posts.
    - **Psychedelic Cosmic**: Psychedelic cosmic illustration style inspired by Parachute Ending animation stills. Void black background (#000000), dusty rose (#D4838A), electric blue (#3B6FC2), gold/amber (#D9A428), neon green (#4ADB5E), crimson (#CC3030), lavender (#9878C0), nebula magenta (#6B2848). Bold flat colors, strong graphic outlines, no gradients or soft shadows.
    - **Custom**: Let the user describe their preferred style in free text.

    If the user selects "Neobrutalist," read `src/app/globals.css` to pull the exact current color tokens rather than hardcoding values.

11. **Generate image prompts.** Review the completed post and identify 3-5 sections
    that would benefit from a diagram, infographic, chart, or visual. Prioritize
    data-heavy sections, process flows, timelines, and comparisons. For each:
    - Write a detailed image generation prompt incorporating the chosen style
    - Include specific data points, labels, and flow steps from the post content
    - Specify aspect ratio (16:9 for wide diagrams, 4:3 for charts) and placement location
    Save all prompts to `.research/{slug}/image-prompts.md` using this format:

    ```markdown
    # Image Prompts for: {post title}

    **Visual style:** {style name and key tokens}
    **Post file:** content/posts/{slug}.mdx
    **Recommended output location:** public/images/posts/

    ---

    ## 1. {Descriptive name}

    **Placement:** {section heading and position}
    **Aspect ratio:** 16:9
    **Suggested filename:** {slug-fragment}.webp

    > {The full image generation prompt}

    ---

    ## 2. {Descriptive name}
    ...
    ```

## Frontmatter Requirements

Every post must start with valid YAML frontmatter matching the Velite Post schema:

```yaml
---
title: "[max 99 chars, descriptive and specific]"
slug: "[kebab-case, derived from title]"
date: "[YYYY-MM-DD, use today's date shown above]"
description: "[max 300 chars, one-sentence summary that frontloads value]"
tags:
  - "[relevant lowercase tags]"
draft: false
---
```

Always set `draft: false` so the author can review the post locally with `npm run dev`. Remind the author to verify the post looks correct before deploying.

## Content Structure Requirements

- Use `##` for main sections. These become Table of Contents entries via rehype-slug.
- Use `###` for subsections
- Do NOT use `#` (h1). The page template renders the title as h1 automatically.
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

- Do not use emdashes or `--` as punctuation. Use periods, commas, colons, or parentheses instead. Break the sentence into two if needed.
- Do not use emojis in the post content
- Do not add import statements (Velite handles MDX compilation)
- Do not use JSX components (only standard markdown + code blocks)
- Do not include a "Conclusion" section that restates everything. End with a forward-looking thought or call to action instead.
- Do not use the word "straightforward" or "simply". These dismiss complexity.
- Do not start with throat-clearing or preamble. Frontload value immediately.
- Do not use foo/bar/baz in examples. Use realistic names and scenarios.

## After Writing

Tell the author:
1. The file path where the post was saved
2. The file path of the image prompts file (`.research/{slug}/image-prompts.md`)
3. That they should generate images using their preferred tool (Gemini, Midjourney, DALL-E, etc.)
4. Suggest running the images through webp conversion before adding to the post
5. Recommend placement: `public/images/posts/{descriptive-name}.webp`
6. Suggest they review the content and make any personal adjustments
7. Remind them to set `draft: false` when ready to publish
8. Recommend running `npm run build` to verify everything compiles before deploying

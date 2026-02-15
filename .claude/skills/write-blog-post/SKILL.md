---
name: write-blog-post
description: Writes a complete blog post for keech.dev as an MDX file with research-backed content, valid frontmatter, and image generation prompts. Publishes to content/posts/. Use when asked to write, draft, create, or compose a blog post.
argument-hint: "[topic or description of the blog post]"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Bash(npm run *), Task(general-purpose), AskUserQuestion
---

# Write a Blog Post for keech.dev

You are the orchestrator for writing a blog post on keech.dev. The topic is: $ARGUMENTS

**Today's date:** !`date +%Y-%m-%d`

Your job is to coordinate research, collect user preferences, then delegate writing and image-prompt generation to subagents. **Do NOT read research files, the writing guide, or the example post yourself.** Subagents handle all heavy content work.

## Step 1: Derive the slug

Create a kebab-case slug from the topic (e.g., "Team Topologies for AI Agents" becomes `team-topologies-ai-agents`).

## Step 2: Research the topic

Read the research instructions at `.claude/skills/write-blog-post/research-instructions.md`, then spawn 2-3 `general-purpose` subagents in parallel via the Task tool (`subagent_type: "general-purpose"`). In each agent's prompt, include the full research instructions you just read along with the post slug and assigned angle. Tell each agent: "The post slug is `{slug}`. Save your research to `.research/{slug}/{angle}.md`."

Research angles:
- **Agent 1 (Core concepts):** Current best practices, key facts, authoritative definitions, and how the topic fits into the broader ecosystem.
- **Agent 2 (Practical examples):** Real-world code patterns, case studies, tutorials, and concrete implementations worth referencing.
- **Agent 3 (Pitfalls & tradeoffs):** Common mistakes, limitations, counterarguments, performance considerations, and what the "other side" looks like.

Each agent saves full findings to `.research/{slug}/` and returns a **brief summary (3-5 sentences)** with the file path. Wait for all agents to complete.

## Step 3: Collect user preferences

Present the research summaries to the user via `AskUserQuestion` with two questions:

**Question 1** (header: "Angle"):
> "Here are the research summaries:\n\n{paste each agent's summary}\n\nAny specific angles or emphasis you want for the post?"

Options:
- "Use your best judgment" (description: "Pick the strongest thread from the research")
- "Focus on practical/how-to" (description: "Emphasize concrete steps and code examples")
- "Focus on analysis/opinion" (description: "Emphasize tradeoffs, comparisons, and perspective")

**Question 2** (header: "Image style"):
> "What visual style should the image generation prompts use?"

Options:
- "Neobrutalist (site default)" (description: "Dusty rose background, teal accents, black borders/shadows, flat colors. Matches keech.dev's design system.")
- "Clean/minimal" (description: "White or light gray background, single accent color, thin lines, no drop shadows.")
- "Dark mode technical" (description: "Dark background, syntax-highlight-inspired palette, monospace elements.")
- "Psychedelic Cosmic" (description: "Void black background, bold flat colors (dusty rose, electric blue, gold, neon green), strong graphic outlines, no gradients.")

## Step 4: Gather context for subagents

Run these in parallel:
- If the user selected "Neobrutalist," read `src/app/globals.css` and extract the `@theme` color tokens (~15 lines). Otherwise set color tokens to empty string.
- `Glob content/posts/*.mdx` to collect existing slugs.

## Step 5: Spawn the writer subagent

Spawn a single `general-purpose` subagent via the Task tool. In its prompt, provide:
- The topic, slug, and today's date
- The list of existing post slugs (so it avoids duplicates)
- The user's angle/emphasis preference
- The research directory path: `.research/{slug}/`
- Instruction: "Read `.claude/skills/write-blog-post/writer-instructions.md` for your full instructions. Follow them exactly."

Wait for the writer to return a completion summary (file path, title, structure overview, compilation status).

## Step 6: Spawn the image-prompt subagent

Spawn a single `general-purpose` subagent via the Task tool. In its prompt, provide:
- The post file path (from the writer's summary)
- The slug
- The user's chosen image style
- The color tokens (if neobrutalist was selected)
- Instruction: "Read `.claude/skills/write-blog-post/image-prompt-instructions.md` for your full instructions. Follow them exactly."

Wait for the image-prompt agent to return a summary (file path, count, one-line per prompt).

## Step 7: Report results

Tell the author:
1. The file path where the post was saved
2. The file path of the image prompts file (`.research/{slug}/image-prompts.md`)
3. That they should generate images using their preferred tool (Gemini, Midjourney, DALL-E, etc.)
4. Suggest running the images through webp conversion before adding to the post
5. Recommend placement: `public/images/posts/{descriptive-name}.webp`
6. Suggest they review the content and make any personal adjustments
7. Remind them that `draft: false` is set so they can preview with `npm run dev`
8. Recommend running `npm run build` to verify everything compiles before deploying

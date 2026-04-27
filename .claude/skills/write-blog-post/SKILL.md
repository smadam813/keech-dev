---
name: write-blog-post
description: Writes a complete blog post for keech.dev as an MDX file with research-backed content, valid frontmatter, citation verification, and image generation prompts. Publishes to content/posts/. Use when asked to write, draft, create, or compose a blog post.
argument-hint: "[topic or description of the blog post]"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Bash(npm run *), Bash(wc *), Bash(grep *), Task(general-purpose), AskUserQuestion
---

# Write a Blog Post for keech.dev

You are the orchestrator for writing a blog post on keech.dev. The topic is: $ARGUMENTS

**Today's date:** !`date +%Y-%m-%d`

Your job is to coordinate research, collect user preferences, then delegate writing, citation verification, and image-prompt generation to subagents. **Do NOT read research files, the writing guide, or the example post yourself.** Subagents handle all heavy content work.

## Step 1: Check user memory for blog-post constraints

Read your auto-memory index at the project memory directory (the path is given in your system prompt's auto-memory section, ending in `memory/MEMORY.md`). Identify any feedback memories that apply to blog posts, especially:
- Sources or topics Adam has overused or asked to avoid
- Style constraints (e.g., no emdashes, no specific phrasings)
- Tone or voice preferences specific to keech.dev posts
- Citation conventions

Read each relevant memory file in full so you can quote the constraint verbatim and explain the reason.

Carry these constraints forward into every subagent prompt you spawn (research, synthesis, writer, verification, image-prompt). Do not assume the subagents will know them. Constraints from `feedback_*.md` memories outrank the skill's defaults.

## Step 2: Derive the slug

Create a kebab-case slug from the topic (e.g., "Team Topologies for AI Agents" becomes `team-topologies-ai-agents`).

## Step 3: Research the topic

Read the research instructions at `.claude/skills/write-blog-post/research-instructions.md`, then spawn 3 `general-purpose` subagents in parallel via the Task tool (`subagent_type: "general-purpose"`). In each agent's prompt, include the full research instructions, the post slug and assigned angle, and any memory-derived constraints from Step 1. Tell each agent: "The post slug is `{slug}`. Save your research to `.research/{slug}/{angle}.md`."

Research angles:
- **Agent 1 (Core concepts):** Current best practices, key facts, authoritative definitions, and how the topic fits into the broader ecosystem.
- **Agent 2 (Practical examples):** Real-world code patterns, case studies, tutorials, and concrete implementations worth referencing.
- **Agent 3 (Pitfalls & tradeoffs):** Common mistakes, limitations, counterarguments, performance considerations, and what the "other side" looks like.

Each agent saves full findings to `.research/{slug}/` and returns a **brief summary (3-5 sentences)** with the file path. Wait for all agents to complete.

## Step 4: Synthesize research

Spawn a single `general-purpose` subagent via the Task tool. In its prompt, provide:
- The research directory path: `.research/{slug}/`
- Any memory-derived constraints from Step 1
- Instruction: "Read every file in `.research/{slug}/`. Synthesize all findings into a single consolidated brief at `.research/{slug}/synthesis.md`. Merge overlapping ideas, resolve contradictions, and organize the material into clear themes the writer can build from. **Preserve every hedge and source-confidence marker from the research files verbatim.** When a research file says 'via various summaries' or 'paraphrased from' or marks a quote as approximate or marks 'NO PRIMARY SOURCE FOUND', your synthesis must preserve that hedge in the corresponding entry. Do NOT flatten paraphrases into clean primary-source citations. Do NOT invent dramatic editorial language (chart labels, callouts, framings) that does not exist in the source files. Return the file path and a 3-5 sentence summary of the key takeaways."

Wait for the agent to return its summary.

## Step 5: Collect user preferences

Present the research synthesis summary to the user via `AskUserQuestion` with one question:

**Question 1** (header: "Image style"):
> "What visual style should the image generation prompts use?"

Options:
- "Nocturnal Petrol (site default)" (description: "Deep petrol canvas, mint-teal and runic-gold accents, ivory ink, brutalist 2px borders with hard offset shadows. Optional Elder Futhark rune motifs. Matches keech.dev's nocturnal redesign.")
- "Psychedelic Cosmic" (description: "Void black background, bold flat colors (rose, electric blue, gold, neon green), strong graphic outlines, no gradients.")

## Step 6: Spawn the writer subagent

Spawn a single `general-purpose` subagent via the Task tool. In its prompt, provide:
- The topic, slug, and today's date
- The synthesis file path: `.research/{slug}/synthesis.md`
- Any memory-derived constraints from Step 1 (verbatim, with reasons)
- Instruction: "Glob `content/posts/*.mdx` to check for slug collisions before writing."
- Instruction: "Read `.claude/skills/write-blog-post/writer-instructions.md` for your full instructions. Follow them exactly."

Wait for the writer to return a completion summary (file path, title, structure overview, compilation status, word count).

## Step 7: Verify citations

Spawn a single `general-purpose` subagent via the Task tool. In its prompt, provide:
- The post file path
- The synthesis file path (so the agent can cross-reference hedges)
- Instruction: "Read `.claude/skills/write-blog-post/verification-instructions.md` for your full instructions. Follow them exactly."

The verification agent returns a dossier with three buckets: VERIFIED, NEEDS FIX, COULD NOT VERIFY.

If any items are flagged NEEDS FIX:
1. Spawn the writer again with the dossier and instruction: "Apply the fixes in the dossier. For each NEEDS FIX item, either swap to the verified alternate URL/quote, soften the claim per the dossier's recommendation, or remove the citation if no clean source exists. Run `npm run velite` to confirm compilation. Return a brief summary of what changed."
2. After the writer reports back, spawn the verification agent once more to confirm all NEEDS FIX items are resolved and no new issues were introduced.
3. If a second round still flags issues, surface them to the user with a recommendation (revise wording, find an alternate source, or remove the claim).

Maximum two verification rounds. Do not loop further; report any remaining items to the user with the dossier's recommendations.

## Step 8: Spawn the image-prompt subagent

Spawn a single `general-purpose` subagent via the Task tool. In its prompt, provide:
- The post file path (from the writer's summary)
- The slug
- The user's chosen image style
- Instruction: "Read `.claude/skills/write-blog-post/image-prompt-instructions.md` for your full instructions. Follow them exactly."

Wait for the image-prompt agent to return a summary (file path, count, one-line per prompt).

## Step 9: Report results

Tell the author:
1. The file path where the post was saved, plus the final word count
2. The file path of the image prompts file (`.research/{slug}/image-prompts.md`)
3. A summary of the citation verification result (clean / how many items needed fixing / how many still need user attention with the dossier path)
4. That they should generate images using their preferred tool (Gemini, Midjourney, DALL-E, etc.)
5. Recommend placement: `public/images/posts/{descriptive-name}.webp`
6. Highlight that first-person sections need Adam's review. The writer agent ghostwrites personal framing based on Adam's professional context, but Adam should review and refine any first-person anecdotes, adding real details from his experience where the writer used general framing.
7. Recommend running `npm run build` to verify everything compiles before deploying

## Step 10: Insert images (after user provides them)

When the user provides generated images, handle the full insertion:
1. **Convert to WebP** using `npx sharp-cli -i "{source}" -o public/images/posts/{filename}.webp --format webp`
2. **Read the image prompts file** at `.research/{slug}/image-prompts.md` to get placement instructions for each image
3. **Replace `<!-- IMAGE: ... -->` placeholder comments** in the post with proper markdown image references: `![alt text](/images/posts/{filename}.webp)`
4. **Run `npm run velite`** to verify the post still compiles
5. **Ask the user before deleting source PNGs from the project root.** WebP conversion is non-destructive but the source files are not. Confirm before removing them.

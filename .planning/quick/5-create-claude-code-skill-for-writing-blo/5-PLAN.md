---
phase: quick-5
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .claude/skills/write-blog-post/SKILL.md
  - .claude/skills/write-blog-post/writing-guide.md
  - .claude/skills/write-blog-post/example-post.mdx
autonomous: true

must_haves:
  truths:
    - "User can invoke /write-blog-post with a topic and get a complete MDX file"
    - "Generated MDX has valid frontmatter matching the Velite Post schema"
    - "Generated content follows the writing principles from research.md"
    - "Output file lands in content/posts/ with correct filename"
  artifacts:
    - path: ".claude/skills/write-blog-post/SKILL.md"
      provides: "Main skill definition with frontmatter and orchestration instructions"
      contains: "write-blog-post"
    - path: ".claude/skills/write-blog-post/writing-guide.md"
      provides: "Distilled writing principles from research.md"
      contains: "frontload"
    - path: ".claude/skills/write-blog-post/example-post.mdx"
      provides: "Reference example showing expected output format"
      contains: "---"
  key_links:
    - from: ".claude/skills/write-blog-post/SKILL.md"
      to: "content/posts/"
      via: "Write tool creating MDX file"
      pattern: "content/posts/"
    - from: ".claude/skills/write-blog-post/SKILL.md"
      to: ".claude/skills/write-blog-post/writing-guide.md"
      via: "Reference link for writing principles"
      pattern: "writing-guide.md"
---

<objective>
Create a Claude Code skill (`/write-blog-post`) that generates complete, publication-ready MDX blog posts for keech.dev. The skill accepts a topic as arguments, applies proven technical writing principles, and outputs a valid MDX file to `content/posts/` with correct Velite-compatible frontmatter.

Purpose: Enable rapid blog content creation with consistent quality, proper formatting, and writing principles baked into the workflow.
Output: A functional Claude Code skill with SKILL.md, writing guide, and example post.
</objective>

<execution_context>
@/home/smada/.claude/get-shit-done/workflows/execute-plan.md
@/home/smada/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@velite.config.ts (Post schema definition — frontmatter fields and constraints)
@src/app/blog/[slug]/page.tsx (How posts render — prose class, TOC, tags, dates)
@CLAUDE.md (Content pipeline, MDX compilation, rehype plugins)
@research.md (Writing principles to distill into the skill)
@claude_skills.md (Skill creation reference — frontmatter options, supporting files, $ARGUMENTS)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create SKILL.md and writing-guide.md</name>
  <files>.claude/skills/write-blog-post/SKILL.md, .claude/skills/write-blog-post/writing-guide.md</files>
  <action>
Create the skill directory at `.claude/skills/write-blog-post/`.

**SKILL.md** — Create with the following structure:

Frontmatter:
- `name: write-blog-post`
- `description: Write a blog post for keech.dev. Generates a complete MDX file with valid frontmatter and publishes to content/posts/. Use when asked to write, draft, or create a blog post.`
- `argument-hint: [topic or description of the blog post]`
- `disable-model-invocation: true` (user-triggered only — writing a blog post is a deliberate action)
- `allowed-tools: Read, Write, Glob, Grep, Bash(date *)` (needs Read for reference files, Write for output, Glob/Grep for checking existing slugs, Bash for getting today's date)

Markdown content — the skill instructions. This is the prompt Claude receives when the skill is invoked. Structure it as:

1. **Role and Goal**: "You are writing a blog post for keech.dev. The topic is: $ARGUMENTS"

2. **Process** (numbered steps):
   - Step 1: Read the writing guide at `.claude/skills/write-blog-post/writing-guide.md` for writing principles
   - Step 2: Read the example post at `.claude/skills/write-blog-post/example-post.mdx` for format reference
   - Step 3: Check existing posts with `Glob content/posts/*.mdx` to avoid duplicate slugs
   - Step 4: Get today's date with `date +%Y-%m-%d` for the frontmatter date field
   - Step 5: Plan the post structure — outline 3-5 main sections based on the topic
   - Step 6: Write the complete MDX file
   - Step 7: Save to `content/posts/{slug}.mdx` using the Write tool
   - Step 8: Run `npm run velite` to verify the post compiles without errors

3. **Frontmatter Requirements** (exact schema from velite.config.ts):
   ```
   ---
   title: [max 99 chars, descriptive and specific]
   slug: [kebab-case, derived from title]
   date: [YYYY-MM-DD, today's date]
   description: [max 300 chars, one-sentence summary that frontloads value]
   tags:
     - [relevant lowercase tags]
   draft: true
   ---
   ```
   Note: Always set `draft: true` so the user can review before publishing. Instruct the user to set `draft: false` when ready.

4. **Content Structure Requirements**:
   - Use `##` for main sections (these become TOC entries via rehype-slug)
   - Use `###` for subsections
   - Do NOT use `#` (h1) — the page template renders the title as h1
   - Use fenced code blocks with language identifiers (rehype-pretty-code handles syntax highlighting with github-dark-dimmed theme)
   - Bold key phrases for scannability
   - Keep paragraphs short (2-4 sentences max)
   - Include at least one code example if the topic is technical

5. **Quality Checklist** (remind Claude to self-check before saving):
   - Does the opening paragraph immediately tell the reader what they will learn?
   - Are there concrete examples, not just abstract descriptions?
   - Is the tone conversational but not flippant?
   - Does every section earn its place (no filler)?
   - Are code examples realistic (no foo/bar/baz)?
   - Is the slug unique among existing posts?

6. **What NOT to do**:
   - Do not use emojis in the post content
   - Do not add import statements (Velite handles MDX compilation)
   - Do not use JSX components (only standard markdown + code blocks)
   - Do not include a "Conclusion" section that just restates everything — end with a forward-looking thought or call to action instead
   - Do not use the word "straightforward" or "simply" — these dismiss complexity

7. **After writing**: Tell the user the file path, suggest they review it, and remind them to set `draft: false` and run `npm run build` to verify before deploying.

**writing-guide.md** — Distill the key principles from research.md into a concise, actionable reference (aim for ~80-100 lines). Organize as:

1. **Specificity Over Abstraction**: Target real knowledge gaps. Ask "what did I struggle with?" not "what do I know about?" Use concrete examples, not theoretical explanations. Every claim should have evidence.

2. **Frontload Value**: State what the post delivers in the opening sentences. No throat-clearing, no preamble. The first paragraph is the make-or-break moment — most readers skim the first sentence and decide.

3. **Concrete Examples**: More examples than feels natural. Use real-world scenarios, not foo/bar/baz. Start from real code and simplify. Complete working code when possible.

4. **Conversational Tone**: Write using ordinary words and simple sentences. Cut caveats unless they add genuine value. Write for one specific person (a friend or coworker), not an abstract audience.

5. **Structure for Scanning**: Short paragraphs. Bold key phrases. Clear section headings that tell readers what they will get. Progressive disclosure — basics first, depth later.

6. **Build Trust**: Acknowledge what you do not know. Discuss tradeoffs and downsides honestly. Provide context about why you are writing this.

7. **Dual-Audience Writing**: Use the inverted pyramid — broadest value first, detail deepening as the reader scrolls. Each section should be valuable on its own (a reader can stop at any point and walk away informed).

8. **Title Craft**: Be specific. Personal framing ("I built...", "How I...") outperforms generic framing. Create genuine curiosity gaps without clickbait.

9. **Common Anti-Patterns** (from Julia Evans' 13 failure modes): Inconsistent reader knowledge expectations, starting abstract instead of concrete, strained analogies, explaining "what" without "why", unrealistic examples.
  </action>
  <verify>
Verify both files exist and have content:
- `ls -la .claude/skills/write-blog-post/SKILL.md .claude/skills/write-blog-post/writing-guide.md`
- Confirm SKILL.md has valid YAML frontmatter (starts with `---`, has `name: write-blog-post`)
- Confirm writing-guide.md has the key sections (Specificity, Frontload, Examples, etc.)
  </verify>
  <done>SKILL.md exists with correct frontmatter (name, description, disable-model-invocation, allowed-tools, argument-hint) and complete orchestration instructions. writing-guide.md exists with distilled writing principles organized into actionable sections.</done>
</task>

<task type="auto">
  <name>Task 2: Create example-post.mdx and validate the skill</name>
  <files>.claude/skills/write-blog-post/example-post.mdx</files>
  <action>
**example-post.mdx** — Create a short but complete example blog post that demonstrates the expected output format. This serves as a concrete reference for Claude when generating posts. Use the actual blog post from the repo's git history (the BMAD post) as inspiration for tone and structure, but create a new, shorter example (~40-60 lines total including frontmatter).

The example should demonstrate:
- Correct frontmatter with all fields populated (title, slug, date, description, tags, draft)
- A strong opening paragraph that frontloads value
- Use of `##` for sections (NOT `#`)
- A code block with language identifier
- Bold text for key phrases
- Short paragraphs
- Conversational but substantive tone
- No emojis, no JSX imports

Use a generic but realistic technical topic (e.g., "Why I switched from REST to tRPC in my Next.js app" or similar). The content does not need to be long — this is a format reference, not a real post. Include a comment at the top: `<!-- This is a format reference for the write-blog-post skill. Not a real post. -->`.

**Validation** — After creating all three files, verify the skill is discoverable:
- Check that the skill directory structure is correct: `.claude/skills/write-blog-post/` containing `SKILL.md`, `writing-guide.md`, `example-post.mdx`
- Verify SKILL.md frontmatter parses as valid YAML (no syntax errors)
- Grep SKILL.md for key elements: `$ARGUMENTS`, `content/posts/`, `draft: true`, `writing-guide.md`, `example-post.mdx`
  </action>
  <verify>
- `ls .claude/skills/write-blog-post/` shows all three files
- `grep -c '$ARGUMENTS' .claude/skills/write-blog-post/SKILL.md` returns at least 1
- `grep -c 'content/posts/' .claude/skills/write-blog-post/SKILL.md` returns at least 1
- `grep -c 'draft: true' .claude/skills/write-blog-post/SKILL.md` returns at least 1
- example-post.mdx starts with `---` (valid frontmatter)
  </verify>
  <done>example-post.mdx exists with realistic format reference. All three skill files are present. SKILL.md references both supporting files. The skill contains $ARGUMENTS for topic input, outputs to content/posts/, and defaults to draft: true.</done>
</task>

</tasks>

<verification>
1. Skill directory exists at `.claude/skills/write-blog-post/` with three files: SKILL.md, writing-guide.md, example-post.mdx
2. SKILL.md frontmatter has: name, description, argument-hint, disable-model-invocation: true, allowed-tools
3. SKILL.md body references $ARGUMENTS, writing-guide.md, example-post.mdx, content/posts/, draft: true
4. writing-guide.md contains distilled principles (specificity, frontloading, examples, tone, structure, trust, dual-audience, titles, anti-patterns)
5. example-post.mdx has valid Velite-compatible frontmatter and demonstrates correct MDX structure
</verification>

<success_criteria>
- `/write-blog-post` skill is invocable in Claude Code
- The skill instructs Claude to read supporting files, generate valid MDX, and save to content/posts/
- Writing principles from research.md are distilled into an actionable reference guide
- An example post demonstrates the exact expected output format
- Generated posts default to draft: true for user review before publishing
</success_criteria>

<output>
After completion, create `.planning/quick/5-create-claude-code-skill-for-writing-blo/5-SUMMARY.md`
</output>

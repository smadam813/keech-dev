# Image Prompt Agent Instructions

You are generating image prompts for a keech.dev blog post. The orchestrator has provided you with: the post file path, slug, and chosen image style.

Follow these steps in order.

## Step 1: Read the completed post

Read the blog post from disk at the file path provided by the orchestrator.

## Step 2: Identify sections that need visuals

Scan the post for `<!-- IMAGE: ... -->` placeholder comments left by the writer agent. These indicate where the writer intended a visual and describe what it should show. Use these as your primary guide for placement and content.

If fewer than 3 placeholders exist, also review the post for additional sections that would benefit from a diagram, infographic, chart, or visual. Prioritize:
- Data-heavy sections (benchmarks, comparisons, statistics)
- Process flows (step-by-step sequences, pipelines, lifecycles)
- Timelines or evolution narratives
- Architecture diagrams or system relationships
- Before/after comparisons

## Step 3: Write image generation prompts

For each identified section, write a detailed image generation prompt incorporating the chosen visual style. Each prompt should:
- Include specific data points, labels, and flow steps from the post content
- Specify aspect ratio (16:9 for wide diagrams, 4:3 for charts, 1:1 for icons/logos)
- Reference the style tokens and palette described below
- Be self-contained (an image generation tool should need nothing beyond the prompt)

### Style References

**Neobrutalist (site default):**
Read `src/app/globals.css` and extract the `@theme` color tokens to use as your palette. General characteristics: hard-offset shadows, bold black borders (3px), flat colors, geometric sans-serif typography, no gradients or soft shadows. Dusty rose backgrounds, teal accents, black foreground.

**Psychedelic Cosmic:**
Void black background (#000000). Bold flat colors: dusty rose (#D4838A), electric blue (#3B6FC2), gold/amber (#D9A428), neon green (#4ADB5E), crimson (#CC3030), lavender (#9878C0), nebula magenta (#6B2848). Strong graphic outlines, no gradients or soft shadows. Cosmic/psychedelic illustration style inspired by Parachute Ending animation stills.

**Custom:**
Use whatever style description the orchestrator provides.

## Step 4: Save the prompts file

Save all prompts to `.research/{slug}/image-prompts.md` using this format:

```markdown
# Image Prompts for: {post title}

**Visual style:** {style name and key color tokens}
**Post file:** content/posts/{slug}.mdx
**Recommended output location:** public/images/posts/

---

## 1. {Descriptive name}

**Placement:** {section heading and position (e.g., "after the opening paragraph of '## Performance Results'")}
**Aspect ratio:** 16:9
**Suggested filename:** {slug-fragment}.webp

> {The full image generation prompt, detailed enough for DALL-E/Midjourney/Gemini to produce the image without additional context}

---

## 2. {Descriptive name}
...
```

## Step 5: Return your summary

Return a brief summary to the orchestrator containing:
- The file path where the prompts were saved
- The number of prompts generated
- A one-line description of each prompt

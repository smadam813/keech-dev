---
phase: 006-replace-hero-background-jpg-with-optimiz
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - public/images/hero.webp
autonomous: true

must_haves:
  truths:
    - "Hero background displays new watermark-free image"
    - "WebP file size is optimized (ideally ≤200KB)"
    - "No leftover source files in repo root"
  artifacts:
    - path: "public/images/hero.webp"
      provides: "Optimized hero background image"
      min_size: 50000
      max_size: 250000
  key_links:
    - from: "src/components/hero.tsx"
      to: "public/images/hero.webp"
      via: "static import"
      pattern: "import.*hero\\.webp"
---

<objective>
Replace the current hero background image with a new watermark-free version, properly optimized for web delivery.

Purpose: User removed watermark from original hero.jpg (491KB) and wants it converted to WebP format to replace the existing public/images/hero.webp (199KB).

Output: Optimized hero.webp file with no code changes required (static import path stays the same).
</objective>

<execution_context>
@/home/smada/.claude/get-shit-done/workflows/execute-plan.md
@/home/smada/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@src/components/hero.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Convert hero.jpg to optimized WebP and replace existing file</name>
  <files>
    public/images/hero.webp
  </files>
  <action>
Convert hero.jpg (491KB at repo root) to WebP format using sharp-cli via npx, then replace public/images/hero.webp with the optimized output.

Steps:
1. Install sharp-cli temporarily: `npx @squoosh/cli` is deprecated, use `npx sharp-cli`
2. Convert with quality optimization: `npx sharp-cli --input hero.jpg --output public/images/hero.webp --quality 80 --format webp`
3. Verify output file size is reasonable (target ≤250KB, ideally similar to existing 199KB)
4. If output is significantly larger, try lower quality (--quality 70) or add --effort 6 for better compression
5. Remove source file from repo root: `rm hero.jpg`

The hero.tsx component uses a static import (`import heroImage from '../../public/images/hero.webp'`) so no code changes are needed — Next.js will automatically pick up the replaced file on next build.

Note: No system image tools (cwebp, convert, ffmpeg) available — must use npx-available tooling.
  </action>
  <verify>
1. Check file exists and size: `ls -lh public/images/hero.webp`
2. Verify source file removed: `ls hero.jpg` should fail
3. Check git status shows modified webp: `git status`
4. Start dev server and visually confirm hero loads: `npm run dev` (optional but recommended)
  </verify>
  <done>
- public/images/hero.webp exists and is ≤250KB
- hero.jpg removed from repo root
- Hero component displays new image (verified via git diff showing binary change or visual check)
  </done>
</task>

</tasks>

<verification>
1. File size check: `ls -lh public/images/hero.webp` shows reasonable size
2. Git status: Only `public/images/hero.webp` modified, `hero.jpg` untracked file removed
3. Visual verification: Hero background displays correctly with no broken image
</verification>

<success_criteria>
- New watermark-free hero image converted to WebP format
- File size optimized (≤250KB)
- Existing hero.webp replaced with no code changes needed
- Source hero.jpg cleaned up from repo root
- Hero component continues working via static import
</success_criteria>

<output>
After completion, create `.planning/quick/006-replace-hero-background-jpg-with-optimiz/006-01-SUMMARY.md`
</output>

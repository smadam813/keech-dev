---
phase: quick-007
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - public/images/headshot.webp
  - src/app/about/page.tsx
autonomous: true
must_haves:
  truths:
    - "About page displays Adam's portrait photo instead of placeholder"
    - "Photo is WebP format matching project convention (public/images/)"
    - "Source PNG is removed from repo root"
  artifacts:
    - path: "public/images/headshot.webp"
      provides: "Optimized portrait photo"
    - path: "src/app/about/page.tsx"
      provides: "About page with Image component rendering headshot"
  key_links:
    - from: "src/app/about/page.tsx"
      to: "public/images/headshot.webp"
      via: "Next.js Image src prop"
      pattern: 'src="/images/headshot.webp"'
---

<objective>
Convert the portrait photo (ak_photo_cropped.png, 1792x2400 RGBA, 6.5MB) to optimized WebP, place it in public/images/, replace the placeholder div on the About page with a Next.js Image component, and remove the source PNG from the repo root.

Purpose: The About page currently shows a gray "Photo" placeholder. Adding the real headshot makes the page personal and complete.
Output: Optimized WebP headshot displayed on the About page.
</objective>

<execution_context>
@/home/smada/.claude/get-shit-done/workflows/execute-plan.md
@/home/smada/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/app/about/page.tsx
@public/images/hero.webp (existing WebP precedent)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Convert PNG to optimized WebP and place in public/images/</name>
  <files>public/images/headshot.webp</files>
  <action>
Use the sharp Node module (already available in the project) to convert ak_photo_cropped.png to WebP.

Run a one-liner Node script:
```
node -e "
const sharp = require('sharp');
sharp('ak_photo_cropped.png')
  .resize(896, 1200)
  .webp({ quality: 80 })
  .toFile('public/images/headshot.webp')
  .then(info => console.log('Output:', info))
  .catch(err => console.error(err));
"
```

Resize to 896x1200 (half the original 1792x2400, maintaining aspect ratio) -- this is more than sufficient for a 192px (w-48) display container while staying sharp on 2x/3x retina. Quality 80 balances file size and visual fidelity.

Target: output file under 100KB (hero.webp is 189KB at much larger dimensions, so a portrait crop should be well under).

After conversion, verify the output file exists and check its size. If over 100KB, re-run with quality 75.

Then delete the source PNG from the repo root:
```
rm ak_photo_cropped.png
```
  </action>
  <verify>
ls -la public/images/headshot.webp (file exists, reasonable size under 100KB)
file public/images/headshot.webp (confirms WebP format)
ls ak_photo_cropped.png should fail (source deleted)
  </verify>
  <done>headshot.webp exists in public/images/ as a properly sized WebP file, source PNG removed from repo root</done>
</task>

<task type="auto">
  <name>Task 2: Replace About page placeholder with Next.js Image component</name>
  <files>src/app/about/page.tsx</files>
  <action>
Edit src/app/about/page.tsx:

1. Add import at top: `import Image from 'next/image'`

2. Replace the placeholder div block (lines 15-20) -- the inner content of the 48x48 bordered container. The outer container div with border-[3px], shadow-brutal, and overflow-hidden stays. Replace only the inner placeholder:

Replace:
```tsx
{/* Replace with: <Image src="/images/headshot.jpg" alt="Adam Keech" fill className="object-cover" priority /> */}
<div className="w-full h-full bg-muted/30 flex items-center justify-center">
  <span className="text-muted font-display text-lg">Photo</span>
</div>
```

With:
```tsx
<Image
  src="/images/headshot.webp"
  alt="Adam Keech"
  width={384}
  height={512}
  className="w-full h-full object-cover"
  priority
/>
```

Use explicit width/height (384x512 matching 2:1 ratio to container at 2x) instead of fill, since the container already has fixed dimensions (w-48 h-48). The className="w-full h-full object-cover" ensures the image fills the square container and crops the portrait to fit.

Make the outer container div position relative to ensure proper image rendering:
Change `className="w-48 h-48 border-[3px] border-black shadow-brutal overflow-hidden"`
to `className="relative w-48 h-48 border-[3px] border-black shadow-brutal overflow-hidden"`

Note: The `relative` class is needed even with width/height (not fill) to ensure the image respects the overflow-hidden clipping correctly in all browsers.
  </action>
  <verify>
npm run build -- confirms no build errors, Image component resolves correctly
Open dev server and visually confirm the photo appears in the About page container
  </verify>
  <done>About page shows Adam's portrait photo in the neobrutalist-bordered container, no placeholder text visible, image properly cropped to square via object-cover</done>
</task>

</tasks>

<verification>
1. `npm run build` passes without errors
2. `public/images/headshot.webp` exists and is under 100KB
3. `ak_photo_cropped.png` does not exist in repo root
4. About page source has Image import and headshot.webp reference
5. No references to the old placeholder "Photo" text remain in about/page.tsx
</verification>

<success_criteria>
- About page displays the real portrait photo instead of placeholder
- Photo is optimized WebP format under 100KB
- Photo fits within the existing 48x48 square container with neobrutalist styling preserved
- Source PNG cleaned up from repo root
- Build passes cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/7-convert-portrait-photo-to-webp-and-add-t/007-SUMMARY.md`
</output>

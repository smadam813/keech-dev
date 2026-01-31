# Phase 1: Foundation & Design - Research

**Researched:** 2026-01-31
**Domain:** Neobrutalist design system, typography, navigation, Tailwind v4
**Confidence:** HIGH

## Summary

This phase establishes the neobrutalist design system, home page, and navigation for keech.dev. Research focused on five key areas: (1) neobrutalist design patterns and color accessibility, (2) Tailwind CSS v4 theme configuration, (3) typography selection for the cosmic neobrutalist vibe, (4) mobile bottom navigation patterns, and (5) Next.js 15 font integration.

The neobrutalist style is well-documented with clear best practices: 2-3 bold colors max, thick borders (4-6px), hard offset shadows, and chunky typography. The critical constraint is WCAG contrast validation - bold colors must meet AA standards (4.5:1 for normal text) before building any components. Based on the reference images (dusty pink/salmon backgrounds, teal accents, cosmic darks), a palette of dusty pink background, black text/borders, and teal accents achieves both the aesthetic and accessibility goals.

**Primary recommendation:** Define and validate the color palette with WCAG contrast checking BEFORE building any components. Use Tailwind v4's `@theme` blocks for design tokens, Space Grotesk for headings (quirky, cosmic vibe), and Inter for body text (excellent readability).

## Standard Stack

The established libraries/tools for this phase:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.5.x | React framework | Stable, App Router mature, Vercel-optimized |
| Tailwind CSS | 4.x | Utility CSS | CSS-first config via @theme, no JS config needed |
| next/font | built-in | Font loading | Self-hosting, no layout shift, CSS variable integration |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tailwindcss/postcss | latest | Build integration | Required for Tailwind v4 |
| colorable | latest | Contrast validation | Validate palette before building |
| color-contrast-checker | latest | WCAG checking | Programmatic contrast checks |

### Fonts (Google Fonts via next/font)
| Font | Weights | Purpose | Why Chosen |
|------|---------|---------|------------|
| Space Grotesk | 400-700 | Display headings | Quirky geometric sans with cosmic vibe, variable font |
| Inter | 400-700 | Body text | Excellent readability, pairs well with Space Grotesk |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Space Grotesk | Syne | More expressive but less readable at smaller sizes |
| Space Grotesk | Unbounded | Bolder but may overwhelm neobrutalist borders |
| Inter | Roboto | Inter has better variable font support |
| colorable | wcag-contrast | colorable checks entire palette at once |

**Installation:**
```bash
npm install -D @tailwindcss/postcss postcss colorable
```

Fonts are loaded via `next/font/google` (no npm install needed).

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── layout.tsx           # Root layout with fonts, metadata
│   ├── page.tsx             # Home page (hero only)
│   ├── globals.css          # Tailwind + @theme design tokens
│   └── not-found.tsx        # 404 page
├── components/
│   ├── ui/                  # Neobrutalist primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── container.tsx
│   └── layout/              # Shell components
│       ├── header.tsx       # Desktop fixed header
│       ├── footer.tsx       # Social links
│       └── mobile-nav.tsx   # Bottom nav bar (client component)
└── lib/
    ├── fonts.ts             # Font configuration
    └── utils.ts             # cn() helper
```

### Pattern 1: CSS-First Design Tokens with @theme
**What:** Define all design tokens in globals.css using Tailwind v4's @theme directive
**When to use:** Always - this is the Tailwind v4 approach
**Example:**
```css
/* Source: https://tailwindcss.com/docs/theme */
@import "tailwindcss";

@theme {
  /* Color palette - cosmic neobrutalist */
  --color-background: #E8B4B8;      /* Dusty pink/salmon */
  --color-foreground: #000000;      /* Pure black text */
  --color-accent: #2D8B8B;          /* Teal accent */
  --color-accent-dark: #1A5252;     /* Darker teal for shadows */
  --color-surface: #F5E6E8;         /* Lighter pink for cards */
  --color-cosmic-dark: #0D0D0D;     /* Space black */
  --color-cosmic-purple: #4A1259;   /* Deep purple accent */
  --color-cosmic-gold: #D4AF37;     /* Gold accent */

  /* Neobrutalist shadows - hard offset */
  --shadow-brutal: 4px 4px 0 0 var(--color-foreground);
  --shadow-brutal-lg: 6px 6px 0 0 var(--color-foreground);
  --shadow-brutal-accent: 4px 4px 0 0 var(--color-accent-dark);

  /* Border widths */
  --border-brutal: 3px;
  --border-brutal-lg: 4px;
}
```

### Pattern 2: Font CSS Variables with next/font
**What:** Load fonts via next/font and expose as CSS variables for Tailwind
**When to use:** For all typography
**Example:**
```typescript
// src/lib/fonts.ts
import { Space_Grotesk, Inter } from 'next/font/google'

export const spaceGrotesk = Space_Grotesk({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const inter = Inter({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})
```

```css
/* globals.css */
@theme inline {
  --font-display: var(--font-display);
  --font-body: var(--font-body);
}
```

```tsx
// layout.tsx
<body className={`${spaceGrotesk.variable} ${inter.variable} font-body`}>
```

### Pattern 3: Mobile Bottom Navigation
**What:** Fixed bottom navigation bar with 3-5 icons for thumb-friendly mobile use
**When to use:** Mobile breakpoint (< 768px)
**Example:**
```tsx
// Source: Material Design + UX research
// components/layout/mobile-nav.tsx
'use client'

export function MobileNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 md:hidden bg-background border-t-brutal border-foreground"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex justify-around items-center h-16">
        <NavIcon href="/" icon={Home} label="Home" />
        <NavIcon href="/blog" icon={FileText} label="Blog" />
        <NavIcon href="/projects" icon={Folder} label="Projects" />
        <NavIcon href="/about" icon={User} label="About" />
      </div>
    </nav>
  )
}
```

### Anti-Patterns to Avoid
- **Gradient backgrounds:** Neobrutalism uses solid colors only, no gradients
- **Soft shadows:** Use hard offset shadows (4px 4px 0 0), not blur-based shadows
- **Thin borders:** Borders should be 3-4px minimum, not 1px
- **Dynamic Tailwind classes:** Never construct `bg-${color}` - use complete class names or safelist
- **Client components for static content:** Keep navigation links as server components where possible

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Color contrast checking | Manual ratio calculations | colorable or color-contrast-checker | WCAG rules are nuanced (large text, UI components) |
| Font loading | Custom @font-face | next/font | Handles preloading, FOUT, self-hosting automatically |
| CSS variable theming | Custom property system | Tailwind @theme | Generates utilities + CSS vars in one declaration |
| Mobile safe areas | Fixed padding values | env(safe-area-inset-*) | Device-specific notches, home indicators |
| Responsive breakpoints | Custom media queries | Tailwind responsive variants | Consistent, tested breakpoints |

**Key insight:** Tailwind v4's @theme directive eliminates the need for tailwind.config.js for most customization. Define tokens in CSS, get utilities automatically.

## Common Pitfalls

### Pitfall 1: Neobrutalist Colors Failing WCAG Contrast
**What goes wrong:** Bold, vibrant color combinations look striking but fail accessibility contrast requirements (4.5:1 for normal text)
**Why it happens:** Neobrutalism emphasizes visual impact; designers pair bright colors without checking contrast ratios
**How to avoid:**
1. Validate EVERY text/background pair before building components
2. Use black (#000) for text on colored backgrounds
3. Reserve bold colors for accents, not text backgrounds
4. Test with colorable to check entire palette at once
**Warning signs:** Lighthouse accessibility warnings, text hard to read in bright light

### Pitfall 2: Tailwind v4 Font Variables Not Working
**What goes wrong:** Custom fonts defined via next/font don't apply when using Tailwind utility classes like `font-display`
**Why it happens:** Tailwind v4 requires explicit mapping of CSS variables in @theme, and the order matters (import tailwindcss BEFORE @theme)
**How to avoid:**
1. Use `@theme inline { --font-display: var(--font-display); }` to map variables
2. Ensure `@import "tailwindcss"` comes before @theme block
3. Apply font variable classes to html/body: `className={fontVariable.variable}`
**Warning signs:** Font classes have no effect, fallback fonts showing

### Pitfall 3: Mobile Bottom Nav Obscuring Content
**What goes wrong:** Page content gets cut off or hidden behind the fixed bottom navigation bar
**Why it happens:** No bottom padding/margin added to account for the nav bar height
**How to avoid:**
1. Add `pb-20 md:pb-0` (or similar) to main content area
2. Use `env(safe-area-inset-bottom)` for devices with home indicators
3. Test on actual mobile devices, not just responsive mode
**Warning signs:** Content cut off on mobile, inability to scroll to bottom items

### Pitfall 4: Inconsistent Border and Shadow Tokens
**What goes wrong:** Components look different because shadow/border values are hardcoded inconsistently
**Why it happens:** Developers copy-paste values instead of using design tokens
**How to avoid:**
1. Define ALL neobrutalist tokens in @theme (shadow-brutal, border-brutal)
2. Never hardcode shadow or border values in components
3. Create a design system audit checklist
**Warning signs:** Visual inconsistencies, "almost matching" components

### Pitfall 5: Missing Safe Area Handling
**What goes wrong:** Mobile navigation overlaps with device home indicators or notches
**Why it happens:** Modern phones (especially iPhones) have safe area insets that need accommodation
**How to avoid:**
1. Always use `env(safe-area-inset-bottom)` for bottom-positioned elements
2. Add `<meta name="viewport" content="viewport-fit=cover">` for full-screen apps
3. Test on devices with notches/home indicators
**Warning signs:** Content obscured by rounded corners or home bar on iOS

## Code Examples

Verified patterns from official sources:

### Complete @theme Configuration for Neobrutalist Design
```css
/* Source: https://tailwindcss.com/docs/theme */
@import "tailwindcss";

@theme {
  /* Cosmic neobrutalist palette */
  --color-background: #E8B4B8;
  --color-foreground: #000000;
  --color-accent: #2D8B8B;
  --color-accent-hover: #3AA3A3;
  --color-surface: #F5E6E8;
  --color-muted: #666666;

  /* Hard offset shadows */
  --shadow-brutal: 4px 4px 0 0 #000000;
  --shadow-brutal-lg: 6px 6px 0 0 #000000;
  --shadow-brutal-hover: 2px 2px 0 0 #000000;

  /* Border widths */
  --border-brutal: 3px;
}

@theme inline {
  --font-display: var(--font-display);
  --font-body: var(--font-body);
}

@layer base {
  html {
    @apply font-body bg-background text-foreground;
  }

  h1, h2, h3, h4, h5, h6 {
    @apply font-display;
  }
}
```

### Neobrutalist Button Component
```tsx
// components/ui/button.tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center font-display font-semibold transition-all',
  {
    variants: {
      variant: {
        default: [
          'bg-accent text-white border-brutal border-foreground',
          'shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px]',
        ],
        outline: [
          'bg-transparent border-brutal border-foreground',
          'shadow-brutal hover:bg-foreground hover:text-background',
        ],
      },
      size: {
        default: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
}
```

### Fixed Desktop Header
```tsx
// components/layout/header.tsx
import Link from 'next/link'

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Blog' },
  { href: '/projects', label: 'Projects' },
  { href: '/about', label: 'About' },
]

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b-brutal border-foreground hidden md:block">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-display font-bold text-2xl">
          keech.dev
        </Link>
        <nav className="flex gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-display font-medium hover:text-accent transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
```

### Mobile Bottom Navigation
```tsx
// components/layout/mobile-nav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, FileText, Folder, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/blog', icon: FileText, label: 'Blog' },
  { href: '/projects', icon: Folder, label: 'Projects' },
  { href: '/about', icon: User, label: 'About' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t-brutal border-foreground"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center w-16 h-full',
                'transition-colors',
                isActive ? 'text-accent' : 'text-foreground'
              )}
            >
              <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

### Color Contrast Validation Script
```typescript
// scripts/validate-colors.ts
// Run before building: npx ts-node scripts/validate-colors.ts

import colorable from 'colorable'

const palette = {
  background: '#E8B4B8',
  foreground: '#000000',
  accent: '#2D8B8B',
  surface: '#F5E6E8',
  muted: '#666666',
}

const result = colorable(palette, { threshold: 4.5 })

console.log('Color Contrast Report (WCAG AA = 4.5:1 minimum)')
console.log('================================================')

result.forEach((color) => {
  console.log(`\n${color.name}:`)
  color.combinations.forEach((combo) => {
    const pass = combo.contrast >= 4.5 ? 'PASS' : 'FAIL'
    console.log(`  vs ${combo.name}: ${combo.contrast.toFixed(2)} [${pass}]`)
  })
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| tailwind.config.js colors | @theme CSS blocks | Tailwind v4 (2024) | No JS config needed for colors |
| Google Fonts CDN | next/font self-hosting | Next.js 13+ | Better performance, privacy |
| Hamburger menu (mobile) | Bottom navigation bar | 2023-2024 UX trend | Thumb-friendly, better reachability |
| rgb() colors | oklch() colors | Tailwind v4 | Wider color gamut, perceptually uniform |

**Deprecated/outdated:**
- tailwind.config.js for colors: Use @theme blocks instead
- Manual @font-face: Use next/font for automatic optimization
- Top hamburger menus: Bottom navigation preferred for mobile UX

## Open Questions

Things that couldn't be fully resolved:

1. **Exact color hex values from reference images**
   - What we know: Dusty pink/salmon, teal, cosmic darks from images
   - What's unclear: Precise hex values that match the reference images
   - Recommendation: Use color picker on reference images to extract exact values, then validate WCAG contrast

2. **Norse geometric accent patterns**
   - What we know: Requirement DSGN-04 mentions Norse geometric accents
   - What's unclear: Specific pattern implementations (SVG? CSS? Decorative borders?)
   - Recommendation: Start with simple geometric border patterns, defer complex Norse designs to polish phase

## Sources

### Primary (HIGH confidence)
- [Tailwind CSS Theme Variables](https://tailwindcss.com/docs/theme) - @theme configuration syntax
- [Next.js Font Optimization](https://nextjs.org/docs/app/getting-started/fonts) - next/font usage
- [NN/g Neobrutalism](https://www.nngroup.com/articles/neobrutalism/) - Design principles and best practices
- [Material Design Bottom Navigation](https://m1.material.io/components/bottom-navigation.html) - Mobile nav patterns

### Secondary (MEDIUM confidence)
- [oWolf: Custom Fonts Next.js 15 + Tailwind v4](https://www.owolf.com/blog/how-to-use-custom-fonts-in-a-nextjs-15-tailwind-4-app) - Font integration pattern
- [Mobile Navigation UX 2026](https://www.designstudiouiux.com/blog/mobile-navigation-ux/) - Bottom nav best practices
- [Space Grotesk + Syne Pairing](https://maxibestof.one/typefaces/syne/pairing/space-grotesk) - Font pairing validation
- [colorable npm package](https://jxnblk.io/colorable/) - Palette contrast validation

### Tertiary (LOW confidence)
- Various Medium articles on Tailwind v4 fonts - Verified against official docs
- Brutalist Themes font list - General font recommendations

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Tailwind v4 and Next.js 15 documentation
- Architecture: HIGH - Patterns verified with official sources
- Typography: MEDIUM - Font pairing based on community recommendations
- Color palette: MEDIUM - Based on reference images, needs contrast validation
- Mobile navigation: HIGH - Material Design guidelines and UX research

**Research date:** 2026-01-31
**Valid until:** 30 days (stable stack, design patterns don't change rapidly)

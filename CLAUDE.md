# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio and blog website at keech.dev. Neobrutalist design aesthetic with a cosmic, Norse-touched theme. Currently in Phase 2 (Content & Blog) of a 4-phase roadmap.

## Commands

```bash
npm run dev     # Start dev server with Turbopack
npm run build   # Production build
npm run lint    # ESLint validation
npm start       # Start production server
```

## Tech Stack

- **Framework:** Next.js 16 with App Router
- **Styling:** Tailwind CSS v4 (CSS-first @theme approach in globals.css, no tailwind.config.js)
- **Fonts:** Space Grotesk (display/headings), Inter (body)
- **Icons:** lucide-react
- **Utilities:** clsx + tailwind-merge via `cn()` helper in `src/lib/utils.ts`

## Architecture

```
src/
├── app/                    # Next.js App Router pages
│   ├── globals.css         # Design tokens via @theme
│   ├── layout.tsx          # Root layout with header/footer
│   └── [route]/page.tsx    # Route pages
├── components/layout/      # Header, Footer, MobileNav
└── lib/                    # Utilities and font config
```

## Design System

Design tokens are defined in `src/app/globals.css` using Tailwind v4's CSS-first `@theme` block:

- **Colors:** dusty pink background (#E8B4B8), deep teal accent (#2D8B8B), black text
- **Shadows:** Hard offset neobrutalist style (4px 4px 0 0 #000)
- **Borders:** 3px solid black

## Key Patterns

- **Mobile-first responsive:** Mobile nav shows by default, desktop header on `md:` breakpoint
- **'use client' directive:** Only on components needing client-side hooks (e.g., MobileNav uses usePathname)
- **Path alias:** `@/*` maps to `./src/*`

## Commit Convention

Format: `type(phase): description`
- Types: feat, fix, docs, test, chore
- Phase references: 01, 02, etc. (or 01-01 for sub-phases)

## Planning Documents

Project planning lives in `.planning/`:
- `PROJECT.md` - Vision, requirements, decisions
- `ROADMAP.md` - Phase delivery plan
- `STATE.md` - Current phase status

# Landing Page Audit — DSA⁴⁰⁴

> Generated: 2026-09-30
> Branch: `redesign/frontend-overhaul`

## 1. Current State
- The current landing page (`app/page.tsx`) is a monolithic 1800-line file containing all components inline.
- The visual language is outdated, relying on simple cards and standard Tailwind colors.
- The hero section uses basic headings and a static "Today's Plan" preview built out of simple divs.
- The "How it Works" section relies on plain text layout with some icons.
- There is an interactive slideshow, but it feels disconnected from a cohesive product narrative.
- The feature section uses basic tabs and bullet points.

## 2. Incomplete / Weak Areas
- **Hero Composition**: Lacks a visually impressive, authentic product preview. The current one feels like a wireframe.
- **Copy**: Over-reliance on bullet points and long text blocks rather than punchy, outcome-focused editorial copy.
- **Visual Rhythm**: The page feels like a stack of horizontal bands without dynamic layout changes (e.g. split panes, overlapping layers, or bento grids).
- **Navigation**: The header is basic and lacks a premium SaaS feel.

## 3. Data & Dependencies to Preserve
The page imports several core data hooks and services:
- `auth`, `onAuthStateChanged`
- `usePWAInstall`
- `enableGuestMode`
- `TOTAL_PROBLEMS`, `ALL_PROBLEMS`, `CORE_SECTIONS`, `seedDays` (from `/lib`)
- Demo capabilities (`DemoShell`)

## 4. CTA Destinations & Routes
- `/auth?mode=signup`
- `/auth?mode=signin`
- `/profile/demo` (Demo)
- `handleEnterDemo()` triggers `enableGuestMode()` and routes to `/today`

## 5. Next Steps
- Move the design system tokens to a new landing page spec.
- Wipe `app/page.tsx` and rebuild using a premium, editorial, modular structure.
- Focus heavily on dynamic mockups and "show, don't tell" visuals in the Hero and Product sections.

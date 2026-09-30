# DSA⁴⁰⁴ Platform — Master Design System

> Version: 1.0 · Created: 2026-09-30
> Stack: Next.js 16 + React 19 + Tailwind CSS v4 + shadcn/ui + Radix UI + Lucide + Recharts

---

## 1. Product Personality

| Attribute | Value |
|-----------|-------|
| **Archetype** | Focused Scholar × Calm Coach |
| **Tone** | Confident, measured, encouraging |
| **Mood** | Focused concentration with moments of celebration |
| **Metaphor** | A well-organized study desk with clear progress markers |
| **Visual Voice** | Editorial precision meets modern software craft |

### Personality Spectrum
```
Playful ────────────●──── Serious
Warm ──────────●──────── Cold
Dense ────────────●──── Spacious
Loud ──────────────●── Quiet
Flat ────●──────────── Dimensional
```

---

## 2. Visual Style

**Style: "Obsidian Scholar"**

A dark-mode-first educational interface that uses depth, contrast, and editorial typography to create a focused, distraction-free learning environment. Light mode is a warm, paper-like surface.

**Principles:**
1. **Ink & Paper**: Deep backgrounds with crisp text, like a quality notebook
2. **Signal Over Noise**: Every visual element earns its place
3. **Progress Is Visible**: Learning state is always contextual and clear
4. **Calm Focus**: No visual anxiety — reduce cognitive load
5. **Celebrate Milestones**: Subtle delight at achievement moments

---

## 3. Color Tokens

### 3.1 Primitive Palette

```css
/* Neutrals — Slate family with warm undertone */
--neutral-50:   oklch(0.98 0.005 250);   /* Near-white */
--neutral-100:  oklch(0.96 0.007 250);   /* Light gray */
--neutral-200:  oklch(0.90 0.010 250);   /* Soft gray */
--neutral-300:  oklch(0.82 0.012 250);   /* Medium-light */
--neutral-400:  oklch(0.65 0.015 250);   /* Medium */
--neutral-500:  oklch(0.50 0.015 250);   /* Mid-gray */
--neutral-600:  oklch(0.40 0.015 250);   /* Dark-medium */
--neutral-700:  oklch(0.28 0.012 250);   /* Dark */
--neutral-800:  oklch(0.20 0.012 250);   /* Very dark */
--neutral-850:  oklch(0.16 0.012 250);   /* Near-black */
--neutral-900:  oklch(0.13 0.010 250);   /* Deep black */
--neutral-950:  oklch(0.09 0.008 250);   /* Deepest */

/* Brand — Teal (primary action, learning progress) */
--brand-300:    oklch(0.82 0.12 175);
--brand-400:    oklch(0.74 0.14 175);
--brand-500:    oklch(0.65 0.16 175);    /* Primary */
--brand-600:    oklch(0.55 0.14 175);

/* Success — Emerald (completion, mastery) */
--success-400:  oklch(0.78 0.16 155);
--success-500:  oklch(0.68 0.17 155);
--success-600:  oklch(0.58 0.15 155);

/* Warning — Amber (attention, review needed) */
--warning-400:  oklch(0.82 0.16 80);
--warning-500:  oklch(0.75 0.17 75);
--warning-600:  oklch(0.65 0.16 70);

/* Danger — Rose (errors, hard difficulty) */
--danger-400:   oklch(0.72 0.18 15);
--danger-500:   oklch(0.62 0.20 15);
--danger-600:   oklch(0.52 0.18 15);

/* Info — Blue (hints, learning context) */
--info-400:     oklch(0.72 0.14 240);
--info-500:     oklch(0.62 0.16 240);

/* Streak — Orange-gold (streaks, fire, motivation) */
--streak-400:   oklch(0.78 0.17 55);
--streak-500:   oklch(0.70 0.18 50);
```

### 3.2 Semantic Tokens — Dark Mode (Default)

```css
.dark, :root {
  --background:           var(--neutral-950);     /* Page background */
  --background-subtle:    var(--neutral-900);     /* Slightly raised */
  --surface:              var(--neutral-850);     /* Cards, panels */
  --surface-raised:       var(--neutral-800);     /* Elevated cards */
  --surface-overlay:      var(--neutral-800);     /* Modals, popovers */

  --foreground:           var(--neutral-100);     /* Primary text */
  --foreground-muted:     var(--neutral-400);     /* Secondary text */
  --foreground-subtle:    var(--neutral-500);     /* Tertiary text */

  --border:               var(--neutral-800);     /* Default borders */
  --border-subtle:        var(--neutral-850);     /* Subtle separators */
  --border-focus:         var(--brand-500);       /* Focus rings */

  --primary:              var(--brand-500);       /* Primary actions */
  --primary-foreground:   var(--neutral-950);     /* Text on primary */
  --primary-hover:        var(--brand-400);       /* Primary hover */
  --primary-muted:        oklch(0.65 0.16 175 / 0.15); /* Primary tint */

  --success:              var(--success-500);
  --success-muted:        oklch(0.68 0.17 155 / 0.15);
  --warning:              var(--warning-500);
  --warning-muted:        oklch(0.75 0.17 75 / 0.15);
  --danger:               var(--danger-500);
  --danger-muted:         oklch(0.62 0.20 15 / 0.12);
  --info:                 var(--info-500);
  --info-muted:           oklch(0.62 0.16 240 / 0.12);
  --streak:               var(--streak-500);
  --streak-muted:         oklch(0.70 0.18 50 / 0.15);
}
```

### 3.3 Semantic Tokens — Light Mode

```css
.light {
  --background:           var(--neutral-50);
  --background-subtle:    var(--neutral-100);
  --surface:              white;
  --surface-raised:       white;
  --surface-overlay:      white;

  --foreground:           var(--neutral-900);
  --foreground-muted:     var(--neutral-500);
  --foreground-subtle:    var(--neutral-400);

  --border:               var(--neutral-200);
  --border-subtle:        var(--neutral-100);
  --border-focus:         var(--brand-500);

  --primary:              var(--brand-600);
  --primary-foreground:   white;
  --primary-hover:        var(--brand-500);
  --primary-muted:        oklch(0.55 0.14 175 / 0.10);
}
```

### 3.4 Difficulty Semantics

| Difficulty | Color | Token |
|------------|-------|-------|
| Easy | Emerald | `--difficulty-easy: var(--success-500)` |
| Medium | Amber | `--difficulty-medium: var(--warning-500)` |
| Hard | Rose | `--difficulty-hard: var(--danger-500)` |

### 3.5 Platform Colors

| Platform | Color |
|----------|-------|
| LeetCode | `oklch(0.75 0.17 75)` (amber) |
| GeeksforGeeks | `oklch(0.68 0.17 155)` (emerald) |
| Codeforces | `oklch(0.62 0.16 240)` (blue) |
| CodeChef | `oklch(0.70 0.18 50)` (orange) |
| HackerRank | `oklch(0.68 0.17 155)` (emerald) |

---

## 4. Typography

### 4.1 Font Pairing

| Role | Family | Weight Range | Fallback |
|------|--------|--------------|----------|
| **Display** | `"Inter"` | 800–900 (Extrabold/Black) | `-apple-system, sans-serif` |
| **Body** | `"Inter"` | 400–600 (Regular–Semibold) | `-apple-system, sans-serif` |
| **Code** | `"JetBrains Mono"` | 400–500 | `"Fira Code", monospace` |

### 4.2 Type Scale

| Token | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `--text-xs` | 0.6875rem (11px) | 1rem | 400–500 | Badges, captions, metadata |
| `--text-sm` | 0.8125rem (13px) | 1.25rem | 400–500 | Secondary text, descriptions |
| `--text-base` | 0.9375rem (15px) | 1.5rem | 400 | Body text |
| `--text-lg` | 1.0625rem (17px) | 1.5rem | 500–600 | Subheadings |
| `--text-xl` | 1.25rem (20px) | 1.75rem | 600–700 | Section headings |
| `--text-2xl` | 1.5rem (24px) | 2rem | 700–800 | Page headings |
| `--text-3xl` | 1.875rem (30px) | 2.25rem | 800 | Hero headings |
| `--text-4xl` | 2.25rem (36px) | 2.5rem | 900 | Display text |

### 4.3 Mobile Type Adjustments

```css
@media (max-width: 767px) {
  html { font-size: 14px; }         /* Was 12px — too small */
  --text-3xl → --text-2xl           /* Scale down one step */
  --text-4xl → --text-3xl
}
```

---

## 5. Spacing Scale

Based on 4px base unit:

| Token | Value | Usage |
|-------|-------|-------|
| `--space-0` | 0 | None |
| `--space-1` | 4px | Tight gaps |
| `--space-1.5` | 6px | Chip padding |
| `--space-2` | 8px | Inline gaps |
| `--space-3` | 12px | Card padding (compact) |
| `--space-4` | 16px | Standard padding |
| `--space-5` | 20px | Section gaps |
| `--space-6` | 24px | Card padding (standard) |
| `--space-8` | 32px | Section spacing |
| `--space-10` | 40px | Large spacing |
| `--space-12` | 48px | Page margins |
| `--space-16` | 64px | Hero spacing |
| `--space-20` | 80px | Landing sections |

---

## 6. Border Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 6px | Badges, chips, small elements |
| `--radius-md` | 8px | Buttons, inputs |
| `--radius-lg` | 12px | Cards, panels |
| `--radius-xl` | 16px | Large cards, modals |
| `--radius-2xl` | 20px | Hero sections |
| `--radius-full` | 9999px | Avatars, pills |

---

## 7. Shadow Scale

```css
--shadow-xs:   0 1px 2px oklch(0 0 0 / 0.06);
--shadow-sm:   0 1px 3px oklch(0 0 0 / 0.10), 0 1px 2px oklch(0 0 0 / 0.06);
--shadow-md:   0 4px 6px oklch(0 0 0 / 0.10), 0 2px 4px oklch(0 0 0 / 0.06);
--shadow-lg:   0 10px 15px oklch(0 0 0 / 0.10), 0 4px 6px oklch(0 0 0 / 0.05);
--shadow-xl:   0 20px 25px oklch(0 0 0 / 0.10), 0 8px 10px oklch(0 0 0 / 0.04);

/* Glow (for primary CTA) */
--shadow-glow: 0 0 20px oklch(0.65 0.16 175 / 0.25);
```

---

## 8. Elevation Rules

| Level | Surface | Shadow | Border | Usage |
|-------|---------|--------|--------|-------|
| 0 | `--background` | None | None | Page background |
| 1 | `--surface` | `--shadow-xs` | `--border` | Cards, panels |
| 2 | `--surface-raised` | `--shadow-sm` | `--border` | Elevated cards, hover |
| 3 | `--surface-overlay` | `--shadow-lg` | `--border` | Modals, dropdowns |
| 4 | `--surface-overlay` | `--shadow-xl` | `--border` | Drawers, command palette |

---

## 9. Grid & Layout Rules

### 9.1 Content Width

| Token | Value | Usage |
|-------|-------|-------|
| `--content-xs` | 480px | Auth forms, modals |
| `--content-sm` | 640px | Settings sections |
| `--content-md` | 768px | Single-column content |
| `--content-lg` | 1024px | Dashboard, problems |
| `--content-xl` | 1280px | Full-width layouts |
| `--content-2xl` | 1440px | Landing page max |

### 9.2 Navigation Widths

| Element | Collapsed | Expanded |
|---------|-----------|----------|
| Desktop sidebar rail | 60px | 240px |
| Mobile bottom nav | — | 100% × 56px |
| Mobile drawer | — | 300px |

### 9.3 Grid System

- Base: CSS Grid with `auto-fit` / `minmax` for responsive cards
- Dashboard: 12-column grid at `≥1024px`, stack below
- Problems: Single-column list (mobile), 2–3 column cards (tablet+)
- Roadmap: Single-column vertical rail

---

## 10. Responsive Breakpoints

| Token | Value | Design Behavior |
|-------|-------|-----------------|
| `sm` | 640px | Small tablets, larger phones |
| `md` | 768px | Tablets — sidebar appears |
| `lg` | 1024px | Desktop — full sidebar |
| `xl` | 1280px | Wide desktop — extra columns |
| `2xl` | 1440px | Ultra-wide — max content width |

### Mobile-First Strategy
- Default styles target `375px`
- Progressive enhancement upward
- Bottom nav on mobile, sidebar on desktop
- Cards stack vertically on mobile
- Tables → cards on mobile

---

## 11. Navigation Rules

### Desktop (≥768px)
- **Sidebar rail**: 60px collapsed (icon only) / 240px expanded
- **Toggle**: Chevron button at sidebar top
- **Sections**: Learn, Practice, Track, Compete, Build, Coach, Account
- **Active state**: Background tint + left accent bar
- **Hover**: Subtle background change + tooltip (collapsed)

### Mobile (<768px)
- **Bottom nav**: 5 primary items — Today, Practice, Search, Track, More
- **"More" drawer**: Full navigation + user info
- **No top hamburger**: Clean header with page title + search
- **Swipe**: Right swipe from left edge opens full nav drawer

### Navigation Item Groups (mapped to existing routes)

| Group | Items | Routes |
|-------|-------|--------|
| **Learn** | Today, Roadmap, Topics | `/today`, `/weeks`, `/topics` |
| **Practice** | Problems, Review, Backlog | `/problems`, `/review`, `/backlog` |
| **Track** | Progress | `/progress` |
| **Compete** | Contests | `/contests` |
| **Build** | Code Editor | `/editor` |
| **Coach** | Messages | `/messages` |
| **Account** | Profile, Settings | `/profile`, `/settings` |

---

## 12. Card Rules

| Variant | Padding | Radius | Border | Shadow | Usage |
|---------|---------|--------|--------|--------|-------|
| **Default** | 16–24px | `--radius-lg` | 1px `--border` | `--shadow-xs` | Standard content cards |
| **Interactive** | 16–24px | `--radius-lg` | 1px `--border` | `--shadow-xs` → `--shadow-sm` on hover | Clickable cards (problems, days) |
| **Stat** | 16px | `--radius-lg` | 1px `--border` | None | Metric display |
| **Feature** | 24–32px | `--radius-xl` | 1px `--border` | `--shadow-sm` | Landing page features |
| **Hero** | 32–48px | `--radius-2xl` | None | `--shadow-lg` | Dashboard hero area |

**Card States:**
- Default: `--surface` background
- Hover: `border-color: var(--primary-muted)`, slight shadow increase
- Active/Selected: `border-color: var(--primary)`, primary-muted background
- Completed: Success-muted background with checkmark
- Disabled: 50% opacity, no interaction

---

## 13. Button Rules

| Variant | Background | Text | Border | Usage |
|---------|------------|------|--------|-------|
| **Primary** | `--primary` | `--primary-foreground` | None | Main CTA |
| **Secondary** | `--surface-raised` | `--foreground` | 1px `--border` | Secondary actions |
| **Ghost** | Transparent | `--foreground-muted` | None | Tertiary, nav items |
| **Danger** | `--danger` | White | None | Destructive actions |
| **Success** | `--success` | White | None | Completion actions |

**Button Sizes:**
| Size | Height | Padding | Font | Min Touch |
|------|--------|---------|------|-----------|
| `sm` | 32px | 12px h | 13px | 44×32px |
| `md` | 40px | 16px h | 14px | 44×40px |
| `lg` | 48px | 24px h | 15px | 48×48px |

**States:** All buttons must show visible focus ring (2px `--brand-500`), loading spinner replaces icon, disabled reduces opacity to 50%.

---

## 14. Form Rules

- Labels always visible above inputs (never placeholder-only)
- Input height: 40px (md), 44px (lg for mobile)
- Error messages appear below the field, styled with `--danger`
- Helper text appears below in `--foreground-subtle`
- Required fields marked with `*` in `--danger`
- Focus: 2px ring with `--brand-500`
- Border radius: `--radius-md`
- Group related fields with fieldsets

---

## 15. Table Rules

- Desktop: Standard table with hover rows
- Mobile (<768px): Transform to card layout (each row becomes a card)
- Header: Sticky, `--surface` background, uppercase `--text-xs` labels
- Row hover: `--primary-muted` background
- Alternating: Not used (rely on border separators)
- Cell padding: 12px vertical, 16px horizontal
- Sortable columns: Clickable header with sort indicator

---

## 16. Chart Rules (Recharts)

| Chart Type | Data Type | Usage |
|------------|-----------|-------|
| Area | Progress over time | Cumulative solved trend |
| Bar | Comparison | Weekly stats, difficulty distribution |
| Radial/Ring | Completion % | Topic mastery, overall progress |
| Heatmap | Activity density | Submission calendar |

**Chart Styling:**
- Use semantic colors from tokens (not hardcoded)
- Always include tooltip on hover
- Always include legend for multi-series
- Use `--foreground-subtle` for axes/grid
- Minimum chart height: 200px (mobile), 300px (desktop)
- Every chart must have an interpretive label (e.g., "You're strongest in Arrays")

---

## 17. Motion Rules

### Duration Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-fast` | 100ms | Micro-interactions (toggles, checks) |
| `--duration-normal` | 200ms | Standard transitions (hover, focus) |
| `--duration-slow` | 300ms | Panel transitions (modals, drawers) |
| `--duration-enter` | 250ms | Element entry |
| `--duration-exit` | 200ms | Element exit |

### Easing

| Token | Value | Usage |
|-------|-------|-------|
| `--ease-default` | `cubic-bezier(0.16, 1, 0.3, 1)` | General |
| `--ease-in` | `cubic-bezier(0.55, 0, 1, 0.45)` | Exit |
| `--ease-out` | `cubic-bezier(0, 0.55, 0.45, 1)` | Entry |
| `--ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Celebration |

### Allowed Animations
- Fade in/out
- Scale (0.95→1 for modals)
- Slide (drawers, panels)
- Progress bar fill
- Streak fire pulse (subtle)
- Skeleton shimmer
- Button press (scale 0.97)

### Prohibited Animations
- Continuous rotation (except loading spinners)
- Parallax scrolling
- Bounce loops
- Background gradient animation
- Auto-playing carousels
- Typewriter text effects

---

## 18. Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

All decorative animations MUST respect this. Only progress indicators and loading spinners may persist with reduced amplitude.

---

## 19. Accessibility Rules

### WCAG 2.2 AA Compliance

| Rule | Requirement |
|------|-------------|
| **Color Contrast** | 4.5:1 for normal text, 3:1 for large text |
| **Focus Indicators** | 2px solid ring, offset by 2px, visible in both themes |
| **Touch Targets** | Minimum 44×44px (iOS) / 48×48dp (Android) |
| **Touch Spacing** | Minimum 8px between touch targets |
| **Keyboard Navigation** | Full tab order, Enter/Space activation, Escape dismissal |
| **Screen Reader** | aria-label for icon-only buttons, semantic heading hierarchy |
| **Color Independence** | Never convey state by color alone — add icons or text |
| **Motion** | Respect `prefers-reduced-motion` |
| **Skip Links** | "Skip to main content" link for keyboard users |
| **Form Labels** | Every input has a visible `<label>` with `for` attribute |
| **Error Messaging** | Error text associated via `aria-describedby` |
| **Live Regions** | Toast notifications use `role="status"` |

---

## 20. Empty State Rules

Each empty state includes:
1. **Illustrative icon** (from Lucide, 48px, muted color)
2. **Headline** (what's empty, in `--foreground`)
3. **Description** (why it's empty + what to do next, in `--foreground-muted`)
4. **Action** (primary CTA button when applicable)

**Template:**
```
┌─────────────────────────────────┐
│                                 │
│          [Icon 48px]            │
│                                 │
│    No problems solved yet       │
│                                 │
│   Start your first topic to     │
│   see your progress here.       │
│                                 │
│      [Start Learning →]         │
│                                 │
└─────────────────────────────────┘
```

---

## 21. Error State Rules

- Show inline error message near the failed element
- Use `--danger` color with `AlertTriangle` icon
- Provide a retry action when possible
- Never show raw error messages to users
- Log detailed errors to console/error-capture service
- Full-page errors: Show branded error page with navigation

---

## 22. Loading State Rules

- **Skeleton screens**: Match the layout shape of loaded content
- **Skeleton color**: `--surface-raised` with shimmer animation
- **Minimum display**: 300ms before showing skeleton (avoid flash)
- **Full-page loading**: `QuoteLoader` with brand animation
- **Inline loading**: Spinner icon (16px) replacing action icon
- **Button loading**: Disable + spinner, preserve button width

---

## 23. Icon Rules

- **Library**: Lucide React (primary), custom SVG when needed
- **Sizes**: 16px (inline), 20px (nav items), 24px (section icons), 48px (empty states)
- **Color**: Inherit from parent text color, or use semantic tokens
- **Stroke width**: Default (2px for Lucide)
- **No emojis** as interface icons (only in user-generated content)
- **Decorative icons**: `aria-hidden="true"`
- **Functional icons**: Require `aria-label` or adjacent text

---

## 24. Content Hierarchy

### Page Structure Pattern
```
[Page Header — title + breadcrumb + primary action]
[Hero/Summary Area — key metric or status]
[Primary Content — main data or interaction]
[Secondary Content — related info]
[Footer Actions — if applicable]
```

### Heading Hierarchy
- `h1`: Page title (one per page)
- `h2`: Major sections
- `h3`: Subsections / card titles
- `h4`: Rarely used — detail labels

---

## 25. Prohibited Visual Patterns

| ❌ Do NOT | ✅ Instead |
|-----------|------------|
| Generic purple/pink AI gradients | Use brand teal for AI features |
| Excessive glassmorphism | Solid surfaces with subtle borders |
| Neon colors as primary palette | Muted, purposeful color use |
| Random decorative gradients | Semantic color meanings |
| Emojis as UI icons | Lucide icons with proper a11y |
| Clickable `<div>` elements | `<button>` or `<a>` elements |
| Placeholder-only labels | Visible `<label>` above inputs |
| Color-only state indicators | Color + icon + text |
| Dense tables on mobile | Card-based mobile layouts |
| Continuous background animations | Static or reduced-motion-safe |
| Horizontal scroll for content | Responsive wrapping/stacking |
| Raw hex colors in components | Design token references |
| Admin-dashboard-style layouts | Learning-focused layouts |
| More than 5 bottom nav items | 5 items max, "More" for rest |

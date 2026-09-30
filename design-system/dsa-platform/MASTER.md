# Design System: DSA Learning Workspace

## 1. Product Personality
- **Concept:** A premium, minimalist educational environment ("DSA Learning Workspace").
- **Vibe:** Calm, deeply focused, editorial, and sophisticated.
- **Anti-Patterns:** No generic SaaS dashboards, no scattered metric cards, no excessive gradients or neon, no emoji-heavy UIs.

## 2. Visual Style & Structure
- **Architecture:** Purposeful workspaces. Pages are not just grids of cards; they are tailored layouts (e.g., split panes, timelines, editorial headers).
- **Navigation:** Deeply simplified. A top-aligned utility header or minimalist navigation rail. The content takes center stage.
- **Borders & Elevation:** Minimal visible borders. Use generous spacing (whitespace) to create separation rather than boxy containers. Shadows are extremely soft and used only to indicate elevated interaction (like modals or floating menus).

## 3. Color Tokens
- **Backgrounds:** Ink-on-paper philosophy.
  - Light mode: Pure white (`#ffffff`) to soft pearl (`#fafafa`).
  - Dark mode: Deep void (`#0a0a0a`) and matte charcoal (`#121212`).
- **Foregrounds/Text:**
  - High contrast primary: Nearly black (`#171717`) or crisp white (`#ededed`).
  - Muted secondary: Slate gray (`#737373`).
- **Semantics & Accents:** Use color strictly for state.
  - Progress/Success: Muted emerald (`#10b981`).
  - Action/Attention: Soft amber (`#f59e0b`) or muted indigo (`#6366f1`).

## 4. Typography Scale & Pairing
- **Fonts:** Clean, geometric sans-serif (e.g., Inter, Geist) mixed with a sophisticated serif for editorial headers if applicable.
- **Hierarchy:**
  - `Display / Header`: Large, tracking-tight, extremely bold.
  - `Body`: Readable, relaxed line-height (1.6).
  - `Mono / Code`: Strict, legible monospace (e.g., Fira Code, JetBrains Mono) for all problem identifiers and code.

## 5. Layout Rules
- **Dashboard (Today):** A narrative timeline. "Today's Mission" -> "Action" -> "Queue". No grid of 4x4 cards.
- **Roadmap:** A curved or vertical progression timeline. Distinct milestone nodes.
- **Problems:** Split-view or dense masonry. Not a standard wide table.

## 6. Motion & Interaction
- **Philosophy:** Purposeful and snappy.
- **Rules:** Use `prefers-reduced-motion`. Micro-interactions on hover (opacity changes, slight translations) rather than large bouncy effects.

## 7. Accessibility
- All text must meet WCAG AA contrast.
- Focus states must be highly visible (e.g., `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`).
- No state communicated by color alone (always pair with an icon or text label).

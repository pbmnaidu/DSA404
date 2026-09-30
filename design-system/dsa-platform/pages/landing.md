# Landing Page Design System — DSA⁴⁰⁴

## 1. Visual Direction
- **Vibe**: Premium, Conversion-focused, Authentic, Academic but modern.
- **Goal**: Communicate that this is a *system* and a *structured journey*, not just a list of problems.
- **Reference**: 21st.dev landing patterns, high-quality developer tools (Vercel, Linear, Supabase).

## 2. Typography
- **Headlines**: Inter / System Sans, black/extrabold. High contrast. Tight tracking.
- **Body**: System Sans, medium/regular. Relaxed leading for readability.
- **Accents**: Monospace tags and badges for coding aesthetic.

## 3. Color Tokens
- **Background**: Deep, calm surfaces (e.g. `bg-background` and `bg-card`).
- **Accents**: 
  - Primary (Emerald/Brand) for progression and CTAs.
  - Secondary/Muted for supporting text.
  - Success/Warning/Error for authentic UI representations (e.g. AI hints, Code completion).

## 4. Section Spacing
- **Vertical Rhythm**: Massive padding between major sections (e.g., `py-24` or `py-32`) to let the page breathe.
- **Internal Rhythm**: Tight grouping for related elements (e.g., heading and subheadline `gap-4`).

## 5. Hero Rules
- Clear, outcome-oriented headline.
- Two distinct CTAs (Primary: Start Learning, Secondary: Demo).
- "Show, don't tell": The hero MUST contain a gorgeous, layered visual mockup of the actual application (e.g. overlapping panels of the Dashboard, Roadmap, and Code Editor).

## 6. Product Preview Rules
- Build mockups using HTML/CSS/Tailwind, NOT static images (unless strictly necessary).
- Use authentic data (e.g., actual topics, real problem names).
- Represent split-pane layouts, code blocks, and AI chats authentically.

## 7. Responsive Behavior
- **Mobile (<768px)**: Stack everything vertically. Keep CTAs sticky or easily accessible. Do not use horizontal scrolling for critical text.
- **Tablet (768px - 1024px)**: 2-column grids where appropriate.
- **Desktop (>1024px)**: Asymmetric bento grids, overlapping mockups, wide layouts.

## 8. Motion Rules
- Subtle fade-in/slide-up on scroll using Tailwind `animate-in` or Framer Motion (if available, otherwise CSS animations).
- Hover effects on cards (border color change, subtle lift).
- Respect `prefers-reduced-motion`.

## 9. Prohibited Patterns
- No fake counters/testimonials.
- No generic SaaS purple gradients unless it directly fits the brand.
- No "3-column feature blocks with generic icons" — use bento boxes or alternating visual-heavy rows.

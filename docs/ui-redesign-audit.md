# UI Redesign Audit — DSA⁴⁰⁴ Platform

> Generated: 2026-09-30 — Phase 0 Repository Audit
> Branch: `redesign/frontend-overhaul`

---

## 1. Route Structure

| Route | Page File | Visual Purpose | Mapped IA Concept |
|-------|-----------|----------------|-------------------|
| `/` | `app/page.tsx` | Landing / marketing page | Entry |
| `/auth` | `app/auth/page.tsx` → `auth-page-content.tsx` | Login / Register / Guest | Auth |
| `/reset-password` | `app/reset-password/` | Password reset | Auth |
| `/today` | `app/(authenticated)/today/page.tsx` → `MergedTodayProfile` | Daily learning dashboard | Learn → Today |
| `/problems` | `app/(authenticated)/problems/page.tsx` | Problem browser + filters | Practice → Problems |
| `/topics` | `app/(authenticated)/topics/page.tsx` | Topic taxonomy & progress | Learn → Topics |
| `/weeks` | `app/(authenticated)/weeks/page.tsx` | Week/month roadmap view | Learn → Roadmap |
| `/progress` | `app/(authenticated)/progress/page.tsx` | Charts, streaks, stats | Track → Progress |
| `/review` | `app/(authenticated)/review/page.tsx` | Flagged-for-review problems | Practice → Review Queue |
| `/backlog` | `app/(authenticated)/backlog/page.tsx` | Incomplete past days | Practice → Backlog |
| `/contests` | `app/(authenticated)/contests/page.tsx` → `ContestsSection` | Contest calendar & results | Compete → Contests |
| `/editor` | `app/(authenticated)/editor/page.tsx` | Code editor workspace | Build → Code Editor |
| `/messages` | `app/(authenticated)/messages/page.tsx` | Broadcast messages & admin | Coach → Messages |
| `/profile` | `app/(authenticated)/profile/page.tsx` → `CoderProfilePage` | User identity & stats | Account → Profile |
| `/profile/[username]` | `app/profile/[username]/` | Public portfolio | Account → Public Profile |
| `/settings` | `app/(authenticated)/settings/page.tsx` | Preferences & account mgmt | Account → Settings |
| `/day/[dayNumber]` | `app/(authenticated)/day/[dayNumber]/` | Single day detail view | Learn → Day Detail |
| `/api/*` | `app/api/` (6 sub-routes) | Backend API routes | **PROTECTED** |

---

## 2. Component Inventory

### A. Layout & Shell (Presentational — Safe to Redesign)

| Component | File | Data Dependencies | Planned Direction |
|-----------|------|-------------------|-------------------|
| `AppShell` | `src/components/AppShell.tsx` (889 lines) | `usePlan`, `useSettings`, `useAuth`, `useThemeCustomizer`, `useInAppBrowser` | Complete redesign of sidebar, header, mobile nav, bottom bar |
| `ThemeToggle` | `src/components/ThemeToggle.tsx` | Theme context | Keep functional, restyle |
| `ThemeCustomizerPanel` | `app/theme-customizer-panel.tsx` | `useThemeCustomizer` | Restyle panel UI |
| `UserMenu` | `src/components/UserMenu.tsx` | User data | Redesign user menu |
| `QuoteLoader` | `src/components/QuoteLoader.tsx` | None (static) | Redesign loading state |
| `DemoHelperBanner` | `src/components/DemoHelperBanner.tsx` | Guest mode state | Restyle banner |
| `GlobalSearchModal` | `src/components/GlobalSearchModal.tsx` | Problem data, nav items | Redesign search modal |
| `NotificationPanel` | `src/components/NotificationPanel.tsx` | Notification state | Redesign notifications |

### B. Feature Components (Mixed — Preserve Logic, Restyle Presentation)

| Component | File | Data Dependencies | Protected Logic |
|-----------|------|-------------------|-----------------|
| `MergedTodayProfile` | `src/components/MergedTodayProfile.tsx` (25k) | `usePlan`, `useSettings`, `useAuth`, activity data | Day progression, problem toggle, streak calc |
| `CoderProfilePage` | `src/components/CoderProfilePage.tsx` (100k) | `useAuth`, `loadUserProfile`, coding profiles | Profile save, avatar upload, platform connections |
| `ContestsSection` | `src/components/ContestsSection.tsx` (46k) | `useContests` | Contest fetch, platform linking |
| `CodeEditor` | `src/components/CodeEditor.tsx` (35k) | Code state, syntax highlighting | Code compilation interface |
| `CodeChefCompilerModal` | `src/components/CodeChefCompilerModal.tsx` (35k) | Compiler API | **FULLY PROTECTED** |
| `OnboardingModal` | `src/components/OnboardingModal.tsx` (18k) | Onboarding handlers | Seed plan, save settings |
| `GitHubRepoLinkModal` | `src/components/GitHubRepoLinkModal.tsx` (21k) | GitHub sync service | **PROTECTED logic** |
| `ProblemRow` | `src/components/ProblemRow.tsx` (14k) | Problem completion state | Toggle completion, review |
| `ProblemCardHorizontal` | `src/components/ProblemCardHorizontal.tsx` (15k) | Problem completion state | Toggle completion, review |
| `DayCard` | `src/components/DayCard.tsx` (3.6k) | Day data | None |
| `DayDetail` | `src/components/DayDetail.tsx` (26k) | `usePlan` | Problem toggle, skip |
| `DayDetailModal` | `src/components/DayDetailModal.tsx` (5k) | Day data | None |
| `SubmissionHeatmap` | `src/components/SubmissionHeatmap.tsx` (12k) | Activity data | None |
| `SolvedProblemsArchive` | `src/components/SolvedProblemsArchive.tsx` (18k) | Completions data | None |
| `BadgesGrid` | `src/components/BadgesGrid.tsx` (2.9k) | Badge computation | None |
| `ContestsPlatformBar` | `src/components/ContestsPlatformBar.tsx` (15k) | Contest data | None |
| `ReminderRunner` | `src/components/ReminderRunner.tsx` (11k) | Push service | **PROTECTED** |
| `TopicReminderSection` | `src/components/TopicReminderSection.tsx` (11k) | Reminder data | Reminder scheduling |
| `SkippedTopicSolveModal` | `src/components/SkippedTopicSolveModal.tsx` (17k) | Plan data | Problem solving logic |
| `InstallApkSection` | `src/components/InstallApkSection.tsx` (9k) | PWA install | None |
| `ChromeInstallModal` | `src/components/ChromeInstallModal.tsx` (8k) | PWA install | None |
| `DailyCombinationsBreakdown` | `src/components/DailyCombinationsBreakdown.tsx` (9k) | Plan data | None |
| `LeetCodeCalendarWidget` | `src/components/LeetCodeCalendarWidget.tsx` (5.4k) | Profile data | None |
| `GitHubContributionHeatmap` | `src/components/GitHubContributionHeatmap.tsx` (7.7k) | Profile data | None |

### C. UI Primitives (shadcn/ui — May Add Variants)

46 components in `src/components/ui/`: accordion, alert-dialog, alert, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input-otp, input, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toggle-group, toggle, tooltip

---

## 3. Protected Files (DO NOT MODIFY)

### Backend & Data Services
- `src/lib/db.ts` — Firestore read/write (53k)
- `src/lib/plan.ts` — Plan generation & manipulation (39k)
- `src/lib/settings.ts` — Settings persistence (7k)
- `src/lib/profileService.ts` — Profile CRUD (3.4k)
- `src/lib/gamification.ts` — Streak/badge computation (5.3k)
- `src/lib/contests-service.ts` — Contest fetch (18k)
- `src/lib/coding-platforms/` — Platform integrations
- `src/lib/github-sync.ts` — GitHub sync (20k)
- `src/lib/codeCompiler.ts` — Code execution (6.5k)
- `src/lib/email.ts` — Email service (1.3k)
- `src/lib/push.ts` — Push notifications (9.9k)
- `src/lib/reminders.ts` — Reminder scheduling (4.4k)
- `src/lib/guest-data.ts` — Guest mode (27k)
- `src/lib/contest-platform-linker.ts` — Platform linking (20k)
- `src/lib/error-capture.ts` — Error reporting
- `src/lib/lovable-error-reporting.ts` — Error reporting
- `src/lib/userActivity.ts` — Activity tracking

### Data Files
- `src/lib/master-problems.ts` — Problem data (88k)
- `src/lib/practice-problems.ts` — Practice data (135k)
- `src/lib/sheets-data.ts` — Sheet data (1.2MB)
- `src/lib/problems.ts` — Problem helpers (6.2k)
- `src/lib/a2z-data.ts` — A2Z sections (1.7k)
- `src/lib/extra-problems-data.ts` — Extra problems (1.2k)
- `src/lib/types.ts` — Type definitions (3.3k)
- `src/types/profile.ts` — Profile types (1.6k)

### Firebase
- `src/integrations/firebase/` — All 4 files
- `firestore.rules`
- `firestore.indexes.json`
- `firebase.json`
- `.firebaserc`

### API Routes
- `app/api/campaigns/`
- `app/api/coding-platforms/`
- `app/api/contests/`
- `app/api/cron/`
- `app/api/push/`
- `app/api/send-email/`

### Cloud Functions
- `functions/` — Entire directory

### Hooks (Data Logic — Preserve)
- `src/hooks/useAuth.tsx`
- `src/hooks/usePlan.tsx`
- `src/hooks/useProblemCompletions.tsx`
- `src/hooks/useSettings.tsx`
- `src/hooks/useContests.tsx`
- `src/hooks/useTopicReminders.ts`
- `src/hooks/useInactivityLogout.ts`
- `src/hooks/usePWAInstall.ts`
- `src/hooks/use-mobile.tsx`

### Context (Theme — Preserve Logic, Restyle UI)
- `app/theme-customizer-context.tsx` — Preserve all logic
- `app/providers.tsx` — Preserve

### Configuration
- `.env`
- `next.config.mjs`
- `tsconfig.json`
- `package.json`
- `components.json`

---

## 4. Hooks & Data Flow Summary

| Hook | Provides | Used By |
|------|----------|---------|
| `usePlan` | `days`, `loading`, `userId`, `lastSynced`, `updateDay`, `toggleReview`, `insertRevisionDay`, `resetAll`, `revertSchedule` | Today, Topics, Weeks, Progress, Review, Backlog, AppShell |
| `useSettings` | `settings`, `update`, `loading` | AppShell, Topics, Settings, Today |
| `useAuth` | `user` | AppShell, Messages, Profile, Settings |
| `useProblemCompletions` | `completed`, `submissions`, `markComplete`, `submitCode` | Problems, Topics, Progress, Editor |
| `useContests` | `contests`, `loading` | Contests, Progress |
| `useTopicReminders` | Reminder data | Review |
| `useInactivityLogout` | Auto-logout | Authenticated layout |
| `usePWAInstall` | Install prompt | Settings, Landing |
| `useMobile` | `isMobile` boolean | Various |
| `useThemeCustomizer` | `openPanel`, theme state | AppShell, Settings |

---

## 5. Planned New Visual Direction

### Design Philosophy
- **Calm Scholar**: Dark-mode-first, muted tones with strategic accent use
- **Editorial clarity**: Strong typography hierarchy, generous whitespace
- **Progress-centric**: Every view answers "what should I do next?"
- **Spatial depth**: Subtle shadows and layering, no glassmorphism overuse

### Key Changes
1. **Navigation**: Collapsible icon rail (desktop) + bottom tab bar with 5 items (mobile)
2. **Dashboard**: Learning command center with today's focus, streak ring, continue-learning CTA
3. **Roadmap**: Vertical progression rail with milestone markers
4. **Problems**: Card-based grid (mobile) / compact table (desktop) with learning context
5. **Editor**: Full-screen split workspace with problem context panel
6. **Progress**: Meaningful analytics with student-focused interpretations
7. **Color**: Ink-on-paper philosophy — near-white backgrounds, deep foregrounds, emerald/blue accents for success/info

### New Reusable Components (Planned)
- `ProgressRing` — Circular progress indicator
- `StreakBadge` — Animated streak display
- `MilestoneRail` — Vertical progression visualization
- `LearningCard` — Problem card with context
- `MetricTile` — Stat display with interpretation
- `EmptyState` — Consistent empty state pattern
- `LoadingPulse` — Consistent skeleton pattern
- `PageHeader` — Consistent page header with breadcrumb
- `NavigationRail` — Icon-only sidebar for desktop
- `BottomNav` — 5-item mobile navigation

---

## 6. Potential Regression Risks

| Risk | Mitigation |
|------|------------|
| Breaking `usePlan` data flow when restyling MergedTodayProfile | Preserve all hook calls, only change JSX wrapping |
| Losing problem completion toggle when restyling ProblemRow | Keep `onToggle`, `onReview` handlers intact |
| Breaking auth redirect on layout change | Don't touch authenticated layout auth logic |
| Losing search functionality | Keep GlobalSearchModal data flow, restyle UI |
| Breaking CodeChef compiler | Don't modify CodeChefCompilerModal logic |
| Guest mode breaking | Don't modify guest-data.ts or guest checks |
| Theme customizer losing custom colors | Preserve theme-customizer-context.tsx logic |
| Breaking onboarding plan seed | Keep OnboardingModal handlers, restyle UI |
| Mobile navigation losing swipe | Preserve touch event handlers in AppShell |

---

## 7. Initial Git Status

```
Branch: redesign/frontend-overhaul (created from master)
Working tree: Clean (only .agents/ untracked)
```

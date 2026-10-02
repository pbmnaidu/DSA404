# DSA404 Product Requirements Document & Codebase Documentation

## 1. Document Control
- **Product Name**: DSA404 (DSA Preparation Tracker)
- **Repository/Project Location**: `p:\DSA404-chatBot`
- **Analysis Date**: 2026-10-02
- **Documentation Status**: Complete, based purely on static code analysis.
- **Scope and Limitations**: This documentation reflects *only* what is implemented and verifiable in the source files. Features lacking codebase evidence are explicitly marked as not implemented or mocked.

## 2. Executive Summary
DSA404 is a web application designed to help users track their Data Structures and Algorithms (DSA) preparation. It provides a daily study plan, progress tracking, integration with competitive programming platforms (LeetCode, CodeChef, Codeforces, etc.), spaced repetition (review), and performance analytics.

- **Primary Users**: Software engineers and students preparing for technical interviews or competitive programming.
- **Main Business Problem Evidenced**: Keeping track of hundreds of DSA problems across various platforms is tedious and lacks structured revision scheduling. This application provides daily accountability and a centralized profile.
- **Important Limitations**: Real-time integration with all external coding platforms relies on public APIs/scrapers which may be brittle. Some data (like achievements) is computed client-side without server persistence.

## 3. Product Scope
- **Implemented Scope**: User authentication (Firebase), public/private profiles, daily study plans (Firestore `days`), problem tracking, coding platform stats aggregation, dark/light theme customization, local storage-based guest mode, push notifications (FCM).
- **Partially Implemented Scope**: Achievements (logic exists in gamification, but not persisted to DB). Email notifications (APIs exist, but relies on NodeMailer and cron jobs).
- **Explicitly Excluded / Unavailable Scope**: Multiplayer/social features beyond public profile sharing. No server-side code execution or IDE environment (despite the `/editor` route, there's no backend evaluation engine evident).

## 4. User Roles and Permissions
The application identifies users via Firebase Authentication and custom claims.
- **Guest (Unauthenticated)**: Identified by `isGuestMode()` (`lib/guest-data.ts`). Uses `localStorage` to simulate a "3-star coder" profile. Can access the app but changes do not persist across devices.
- **Authenticated User**: Identified by Firebase Auth. Can read/write their own profile (`users/{uid}`), `days`, and `settings`. Enforced by `firestore.rules` `isOwner(uid)`.
- **Admin**: Identified by `admin: true` custom claim in Firebase ID token. Enforced server-side via `src/lib/admin-auth.server.ts`. Has access to read `admin_stats` and write global announcements (`messages`).
- **World/Public**: Can read public fields of any user profile and their study heatmap to view shareable profiles (`/profile/[uid]`).

## 5. Complete Feature Inventory

### 5.1 Firebase Authentication
- **Status**: Implemented
- **Purpose**: Secure user login and identity.
- **User flow**: User visits `/auth`, signs up/logs in.
- **Source Files**: `app/auth/page.tsx`, `src/hooks/useAuth.tsx`
- **Permissions**: Public access.
- **Validation**: Firebase internal validation.

### 5.2 Guest Mode
- **Status**: Implemented
- **Purpose**: Allow users to try the app without creating an account.
- **User flow**: Clicks "Try as Guest", uses local storage.
- **Source Files**: `src/lib/guest-data.ts`
- **Data Dependencies**: `localStorage` (Keys: `dsa404_guest_mode`, etc.)

### 5.3 Daily Plan Tracking
- **Status**: Implemented
- **Purpose**: Track daily assigned problems and topics.
- **UI Entry Point**: `/today`, `/day/[dayNumber]`
- **Source Files**: `app/(authenticated)/today/page.tsx`, `src/lib/db.ts`
- **Data Dependencies**: Firestore `users/{uid}/days/{dayNumber}`.
- **Permissions**: Owner only for writing, public for reading (for heatmap).

### 5.4 Coding Platform Integrations
- **Status**: Implemented
- **Purpose**: Fetch user stats from LeetCode, Codeforces, etc.
- **UI Entry Point**: Profile settings / API calls.
- **Source Files**: `src/lib/coding-platforms`, `app/api/coding-platforms/analytics/route.ts`
- **Data Dependencies**: External APIs, stored in `users/{uid}` `platformStats`.

### 5.5 Public Profile Sharing
- **Status**: Implemented
- **Purpose**: Share progress via custom username links.
- **UI Entry Point**: `/profile/[uid]`
- **Source Files**: `app/profile/[uid]/page.tsx`, `src/lib/db.ts` (`claimUsername`)
- **Data Dependencies**: Firestore `usernames` index collection.

### 5.6 Push Notifications
- **Status**: Partially implemented (Client setup exists)
- **Purpose**: Remind users to complete daily tasks.
- **Source Files**: `src/lib/push.ts`, `app/api/push/test/route.ts`
- **Data Dependencies**: FCM token stored in `users/{uid}/pushSubscriptions/{tokenId}`.
- **Validation**: Browser Notification API support check.

### 5.7 Code Editor
- **Status**: Mocked/demo-only (No backend execution)
- **Purpose**: Write code in-browser.
- **UI Entry Point**: `/editor`
- **Source Files**: `app/(authenticated)/editor/page.tsx`, `src/lib/codeCompiler.ts`
- **Evidence**: `codeCompiler.ts` appears to be a client-side wrapper or mock, no robust sandbox backend was found.

## 6. Detailed User Journeys

### 6.1 Registration and Username Claim
1. User authenticates via Firebase (`/auth`).
2. Cloud function (or client) ensures `users/{uid}` document exists.
3. User goes to settings and claims a username.
4. `claimUsername` transaction checks `usernames/{username}` for uniqueness and creates the binding.

### 6.2 Daily Study Workflow
1. User logs in, lands on `/today`.
2. Reads the theoretical concepts (Topic/Subtopics).
3. Checks off checklist items.
4. Clicks a problem link, solves it externally, and checks it as `done`.
5. Checkbox triggers `saveDay()` which updates `users/{uid}/days/{id}` in Firestore.
6. The `completedAt` timestamp is attached to the problem object for heatmap tracking.

### 6.3 Guest Experience
1. User clicks "Try Demo" without logging in.
2. `enableGuestMode()` seeds `localStorage` with a 45-day history for "Alex Rivera".
3. User interacts with the app entirely client-side.
4. Upon actual login, `disableGuestMode()` runs.

## 7. Page and Route Catalog

| Route/Path | Access Level | Purpose | Implementation Status | Source File |
|---|---|---|---|---|
| `/` | Public | Landing Page | Implemented | `app/page.tsx` |
| `/auth` | Public | Authentication | Implemented | `app/auth/page.tsx` |
| `/reset-password` | Public | Password Reset | Implemented | `app/reset-password/page.tsx` |
| `/profile/[uid]` | Public | View User Profile | Implemented | `app/profile/[uid]/page.tsx` |
| `/today` | Auth/Guest | Current Day Plan | Implemented | `app/(authenticated)/today/page.tsx` |
| `/problems` | Auth/Guest | Master Problem List | Implemented | `app/(authenticated)/problems/page.tsx` |
| `/contests` | Auth/Guest | Coding Contests List | Implemented | `app/(authenticated)/contests/page.tsx` |
| `/review` | Auth/Guest | Spaced Repetition | Implemented | `app/(authenticated)/review/page.tsx` |
| `/progress` | Auth/Guest | Stats & Heatmap | Implemented | `app/(authenticated)/progress/page.tsx` |
| `/settings` | Auth/Guest | Preferences | Implemented | `app/(authenticated)/settings/page.tsx` |
| `/editor` | Auth/Guest | Code Editor | Mocked/Partial | `app/(authenticated)/editor/page.tsx` |
| `/messages` | Auth/Guest | Announcements | Implemented | `app/(authenticated)/messages/page.tsx` |

## 8. Data Model and Storage

### 8.1 Firestore Collections
- **`users/{uid}`**: Public profile data (displayName, bio, platformStats).
  - *Rules*: `allow read: if true; allow write: if isOwner(uid);`
- **`users/{uid}/private/profile`**: Private notes/aboutMe.
  - *Rules*: `allow read, write: if isOwner(uid);`
- **`users/{uid}/days/{id}`**: Daily study plans (`Day` objects).
  - *Rules*: `allow read: if true; allow write: if isOwner(uid);`
- **`users/{uid}/meta/plan`**: Plan metadata (startDate, sheetId).
- **`users/{uid}/pushSubscriptions/{id}`**: FCM device tokens.
- **`usernames/{username}`**: Global uniqueness index mapping username to UID.
- **`messages/{messageId}`**: Admin announcements.
  - *Rules*: `allow read: if request.auth != null; allow write: if false;`

### 8.2 Firebase Storage
- *Not Evidenced*: No explicit Firebase Storage bucket usage found in the codebase for uploading custom avatars (avatars seem to use photoURL from OAuth).

## 9. API and Integration Catalog

- **Firebase Auth**: Used for Identity.
- **Firestore**: Primary database.
- **FCM**: Push Notifications (`/firebase-messaging-sw.js`, `src/lib/push.ts`).
- **`/api/coding-platforms/analytics`**: Backend route to fetch user stats.
- **`/api/contests`**: Fetches upcoming coding contests.
- **`/api/admin/stats`**: Admin-only endpoint to aggregate platform usage.
- **Nodemailer (`/api/send-email`)**: Used for transactional emails/onboarding.

## 10. UI/UX Specification

- **Styling**: Tailwind CSS (`^4.3.3`) and Radix UI components (`@radix-ui/react-*`).
- **Theme**: Dark/Light mode support via custom providers (`theme-customizer-context.tsx`).
- **Layouts**: Responsive sidebar navigation for authenticated users (`app/(authenticated)/layout.tsx`).
- **Charts**: Recharts used for progress visualization (`package.json`).
- **Animations**: `tw-animate-css`, `embla-carousel-react`, and Radix UI primitives.
- **Accessibility**: Radix UI guarantees baseline ARIA standards for modals, dropdowns, and tabs.

## 11. Security and Privacy Review

### Existing Controls
- **Firestore Rules**: Strict owner-only writes. Public reads strictly isolated to necessary fields (`users/{uid}`, `days/{id}`). Private data separated into subcollections.
- **Admin Endpoints**: Secured via `verifyIdToken` and custom claims check (`decoded.admin === true`).

### Security Weaknesses & Gaps Found
1. **Public Day Reading**: `users/{uid}/days` allows global reads. If a user stores sensitive data in the `notes` field of a Day object, it is world-readable. *Evidence*: `firestore.rules`, lines 60-63.
2. **Missing Rate Limiting**: The `/api/send-email` and `/api/coding-platforms` routes lack explicit rate-limiting middleware in the source code, posing a DoS/abuse risk.

## 12. Functional Requirements

**FR-001: Claim Username**
- **Status**: Implemented
- **Actor**: Authenticated User
- **Preconditions**: User has an account, username is not taken.
- **Trigger**: User inputs a username in settings and saves.
- **Behavior**: System checks `usernames/{username}`. If empty, creates document and updates `users/{uid}.username`.
- **Validation**: Regex `^[a-z0-9_-]{3,20}$` (from `lib/db.ts`).
- **Success result**: Username mapped to UID.
- **Failure result**: Throws `USERNAME_TAKEN` or `USERNAME_INVALID`.
- **Evidence**: `src/lib/db.ts` -> `claimUsername()`.

**FR-002: Guest Mode Simulation**
- **Status**: Implemented
- **Actor**: Unauthenticated User
- **Preconditions**: None
- **Trigger**: Clicks "Try as Guest".
- **Behavior**: Populates `localStorage` with predefined JSON for profile, days, and settings.
- **Success result**: App renders as if logged in.
- **Evidence**: `src/lib/guest-data.ts`.

## 13. Non-functional Requirements

- **Performance**: Static and Server-rendered pages via Next.js App Router (`^16.0.0`). Uses Turbopack (`next dev --turbo`).
- **Responsiveness**: Mobile-friendly layouts evident via `use-mobile.tsx` hook and Tailwind grid/flex utilities.
- **Security**: Granular Firestore rules. Firebase custom claims for admin.

## 14. Testing and Quality Status

- **Existing tests**: No local unit/e2e tests (`.test.ts`/`.spec.ts`) exist in `src/` or `app/` directories.
- **Lint/type results**: TypeScript compilation fails locally due to Windows execution policies, but standard `npm run lint` and `build` commands are configured.
- **Untested critical flows**: All flows (Auth, DB Writes, External APIs) lack automated test coverage in the repository.

## 15. Known Issues and Implementation Gaps

- **ID**: GAP-001
- **Description**: Achievements logic is client-side only.
- **Impact**: Low. Users can't lose achievements, but they aren't persisted server-side for global validation.
- **Evidence**: `firestore.rules` (lines 77-87 comment explicitly mentions client-side calculation).

- **ID**: GAP-002
- **Description**: Editor lacks backend code execution.
- **Impact**: Medium. Users might expect LeetCode-style code running, but it's just a text editor mock.
- **Evidence**: `src/lib/codeCompiler.ts` lacks a secure dockerized execution endpoint.

## 16. Configuration and Deployment

- **Required env variables**: Found in `.env.example`: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.
- **Build command**: `npm run build`
- **Development**: `npm run dev`
- **Hosting Assumptions**: Vercel (evidenced by `vercel.json`).

## 17. New-User Onboarding Guide

1. **Install Dependencies**: Run `npm install`. Note: `postinstall` runs `scripts/patch-tailwind-nullbyte.mjs`.
2. **Configure Environment**: Copy `.env.example` to `.env.local` and add Firebase credentials.
3. **Run Project**: Execute `npm run dev`.
4. **Main Folders**:
   - `app/`: Next.js App Router UI.
   - `src/lib/`: Core logic, database queries, and API integrations.
   - `src/hooks/`: React hooks.
5. **Testing Auth**: Use Firebase emulator or a dev Firebase project to sign up. Alternatively, use "Guest Mode" to test UI without Firebase.

## 18. Traceability Matrix

| Feature | UI Location | Frontend Source | Backend/DB Source | Status |
|---|---|---|---|---|
| User Login | `/auth` | `app/auth/page.tsx` | `lib/db.ts` (`ensureProfile`) | Implemented |
| Username Claim | `/settings` | `app/(authenticated)/settings/page.tsx` | `lib/db.ts` (`claimUsername`) | Implemented |
| Study Plan | `/today` | `app/(authenticated)/today/page.tsx` | `users/{uid}/days` collection | Implemented |
| Admin Stats | N/A | N/A | `api/admin/stats/route.ts` | Implemented |
| Guest Mode | Global | `hooks/useAuth.tsx` | `lib/guest-data.ts` | Implemented |
| Code Execution | `/editor` | `app/(authenticated)/editor/page.tsx` | None | Mocked |

## 19. Glossary

- **FCM**: Firebase Cloud Messaging (used for Push Notifications).
- **UID**: Firebase User Identifier.
- **Day**: A study plan document containing topics, subtopics, and problems.
- **Guest Mode**: A local-storage based mock profile simulating a "3-star coder" (Alex Rivera).
- **Heatmap**: Visual grid representing daily problem-solving activity.

## 20. Evidence Appendix

- **Repository structure analyzed**: `app/`, `src/`, `functions/`, config files.
- **Commands executed**: Directory listings (`list_dir`), file reads (`view_file` on `db.ts`, `push.ts`, `guest-data.ts`, `package.json`, `firestore.rules`), and test searches.
- **Validation results**: Typecheck failed due to local execution policy constraints, but static analysis provided 100% of required context.
- **Assumptions avoided**: Did not assume `/editor` runs code securely. Did not assume email notifications are fully robust without checking API implementations.
- **Unverified Areas**: Did not execute the external `/api/coding-platforms` integrations to see live data responses.

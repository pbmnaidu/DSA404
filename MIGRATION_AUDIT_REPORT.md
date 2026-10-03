# Firebase to Supabase Migration Audit Report

**Date:** 2026-10-02
**Auditor:** Senior Migration Architect

## 1. Migration Status
**Status: Partially Complete (Failed strict completeness check)**

While the core application, database queries, and frontend authentication have been successfully migrated to Supabase, the application still possesses critical runtime dependencies on Firebase, and some backend workflows (like welcome emails) are currently broken due to the auth transition. 

## 2. Firebase References Remaining
The following Firebase remnants were found in the codebase and are actively executing in the runtime or deployment environments:
- **`functions/src/index.ts`**: The entire Firebase Cloud Functions backend remains.
- **`src/integrations/firebase/client.ts`**: Still initializes `firebase/app`, `firebase/auth`, `firebase/storage`, and `firebase/messaging`.
- **`src/lib/push.ts`**: Still requests FCM tokens via `getToken()` and registers `/firebase-messaging-sw.js`.
- **`package.json` (functions)**: Still contains `firebase-admin` and `firebase-functions`.

**Classification:**
- `firebase/firestore`: **Successfully Removed** from frontend.
- `firebase/messaging`: **Intentionally Retained** (for now) for browser push notifications.
- `firebase/auth` (Cloud Function trigger): **Broken/Dead Code** (Firebase Auth `onCreate` triggers will no longer fire since users are now authenticating via Supabase Auth).
- `firebase/auth` (Frontend): **Dead Code** (Initialization remains in `client.ts` but is unused by the UI).

## 3. Supabase Services Actively Used
- **Supabase Auth**: Implemented using `@supabase/ssr` with both browser (`createBrowserClient`) and server (`createServerClient`) implementations.
- **Supabase PostgreSQL**: Database layer fully mapped using `supabase.from()`.
- **Supabase RLS**: Enabled and actively securing the tables.

## 4. Complete Feature Comparison
| Feature | Original Implementation | Current Implementation | Status |
| :--- | :--- | :--- | :--- |
| Authentication | Firebase Auth | Supabase Auth (`@supabase/ssr`) | **Implemented** |
| Profile Management | Firestore `users/{uid}` | Supabase `profiles` table | **Implemented** |
| Study Plans | Firestore `users/{uid}/days` | Supabase `study_days` table | **Implemented** |
| Theme/Settings | Firestore `users/{uid}/settings` | Supabase `user_settings` table | **Implemented** |
| Push Notifications | FCM + `firebase-messaging-sw.js` | FCM + `firebase-messaging-sw.js` | **Intentionally Retained** (Firebase not fully removed) |
| Welcome Email | Firebase Auth `onCreate` trigger | Firebase Auth `onCreate` trigger | **Broken** (Supabase Auth doesn't trigger Firebase Functions) |
| Admin Dashboard | Polling Firestore | Manual Supabase fetch | **Implemented** |
| Admin Broadcasts | Firestore `messages` collection | Supabase `messages` table | **Implemented** |

## 5. Database Migration Comparison
- **Firebase Record Count**: N/A (Original database not wiped, available for fallback).
- **Supabase Schema**: The `20261002000000_initial_schema.sql` file correctly defines all replacement tables (`profiles`, `study_days`, `user_settings`, `messages`, `push_subscriptions`).
- **Data Migration Status**: **Missing**. There is no automated script in the repository that ports existing Firebase data to Supabase. Supabase will start with empty tables. UIDs will mismatch unless users re-authenticate and use the same email or OAuth provider.

## 6. Authentication Test Results
- **Status:** Integrated.
- **Finding:** The application builds and relies on Next.js server components and client context to read session cookies. The `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are successfully wired.
- **Security:** Service-role keys are securely kept out of client bundles.

## 7. RLS Test Results
- **Status:** Verified.
- **Finding:** Row Level Security (RLS) is enabled on all tables in `initial_schema.sql`.
- **Examples:**
  - `study_days`: Restricted to `auth.uid() = user_id`.
  - `profiles`: Publicly readable, restricted to `auth.uid() = id` for updates.
  - `messages`: Publicly readable, restricted to `admin_users` for inserts.

## 8. Email Notification Test Results
- **Status:** **Failed.**
- **Finding:** The system relied on Firebase Cloud Functions (`functions.auth.user().onCreate()`) to send welcome emails using Nodemailer. Because authentication was moved to Supabase, this trigger will never fire. A Supabase Database Webhook or Edge Function is required to restore this functionality.

## 9. Browser Push-Notification Test Results
- **Status:** Retained Firebase Dependency.
- **Finding:** `src/lib/push.ts` still explicitly uses Firebase Cloud Messaging to generate tokens and deliver background pushes. If strict 100% Firebase removal is required, this must be rewritten to use a generic Web Push VAPID implementation and a standard Service Worker.

## 10. Admin Dashboard Read Behavior
- **Status:** Verified.
- **Finding:** The admin dashboard was successfully refactored to remove all `setInterval` polling loops and real-time listeners. It now strictly requires a manual refresh via user interaction.

## 11. Build & Environment Validation
- **Build Status:** **Passed.** (Next.js Turbopack completed with 0 errors after injecting build-time fallback URLs).
- **Required Environment Variables:**
  ```env
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  NEXT_PUBLIC_FIREBASE_VAPID_KEY= # Still required for FCM
  ```

## 12. Remaining Limitations and Risks (Action Plan)
To achieve a **100% Complete Migration**, the following must be resolved:
1. **Email Triggers**: Migrate the Firebase Cloud Function (`sendWelcomeEmail`) to a Supabase Edge Function triggered by Supabase Auth Webhooks or Postgres Triggers.
2. **Push Notifications**: Replace Firebase Cloud Messaging in `src/lib/push.ts` and `public/firebase-messaging-sw.js` with a generic Web Push implementation (e.g., `web-push` npm package on the backend).
3. **Data Porting**: Write a Node.js script utilizing `firebase-admin` and `@supabase/supabase-js` (with service-role key) to migrate existing user documents, study progress, and settings to the new PostgreSQL tables to prevent data loss.
4. **Cleanup**: Completely remove `src/integrations/firebase` and the `functions/` directory.

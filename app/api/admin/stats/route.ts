/**
 * GET /api/admin/stats
 *
 * Returns platform statistics for the admin dashboard.
 * Protected by Firebase ID token + admin custom claim verification.
 *
 * All statistics are calculated server-side using the Firebase Admin SDK.
 * No sensitive data is returned to unauthorized users.
 *
 * Response shape:
 * {
 *   users: { total, today, last7, last30 },
 *   projects: { total, storageEstimate },
 *   firestore: { documentsEstimate, source },
 *   storage: { usage, source },
 *   quotas: { firestoreReads, firestoreWrites, ... },
 *   refreshedAt: ISO string
 * }
 */

import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth.server";
import { createClient } from "@/integrations/supabase/server";

// Simple in-memory cache to avoid expensive reads on rapid refreshes
let cachedStats: any = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60_000; // 1 minute

export async function GET(request: Request) {
  // ── Authorization ────────────────────────────────────────────
  const result = await verifyAdmin(request);
  if (!result.authorized) return result.response;

  // ── Cache check ──────────────────────────────────────────────
  const now = Date.now();
  if (cachedStats && now - cachedAt < CACHE_TTL_MS) {
    return NextResponse.json({ ...cachedStats, cached: true });
  }

  try {
    const supabase = await createClient();

    // ── 1. User statistics ───────────────────────────────────────
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const last7Start = new Date();
    last7Start.setDate(last7Start.getDate() - 7);
    last7Start.setHours(0, 0, 0, 0);

    const last30Start = new Date();
    last30Start.setDate(last30Start.getDate() - 30);
    last30Start.setHours(0, 0, 0, 0);

    const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true });
    const { count: todayUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", todayStart.toISOString());
    const { count: last7Users } = await supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", last7Start.toISOString());
    const { count: last30Users } = await supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", last30Start.toISOString());

    const { data: recentProfiles } = await supabase
      .from("profiles")
      .select("id, email, display_name, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    const recentUsers = recentProfiles?.map(user => ({
      uid: user.id,
      email: user.email || "",
      displayName: user.display_name || "",
      createdAt: user.created_at,
      provider: "supabase"
    })) || [];

    // ── 2. Project statistics ─────────
    const totalProjects = totalUsers || 0;
    const estimatedTotalBytes = 0; 

    // ── 3. Document count estimate ─────────────────────
    const { count: usernameDocuments } = await supabase.from("profiles").select("username", { count: "exact", head: true }).not("username", "is", null);
    const { count: messageDocuments } = await supabase.from("messages").select("*", { count: "exact", head: true });
    const { count: studyDaysDocuments } = await supabase.from("study_days").select("*", { count: "exact", head: true });
    const { count: revisionEventsDocuments } = await supabase.from("revision_events").select("*", { count: "exact", head: true });

    const totalDocEstimate = totalProjects + (usernameDocuments || 0) + (messageDocuments || 0) + (studyDaysDocuments || 0) + (revisionEventsDocuments || 0);

    // ── 4. Firebase quotas (Mocked for Supabase) ─────────────────────────────────────
    const sparkLimits = {
      firestoreStorage: { limitBytes: 1_073_741_824, source: "supabase_postgres_unlimited" as const },
      firestoreReadsPerDay: { limit: 50_000, source: "supabase_postgres_unlimited" as const },
      firestoreWritesPerDay: { limit: 20_000, source: "supabase_postgres_unlimited" as const },
      firestoreDeletesPerDay: { limit: 20_000, source: "supabase_postgres_unlimited" as const },
      authUsers: { limit: null, source: "not_applicable" as const },
      storageBytes: { limitBytes: 5_368_709_120, source: "supabase_storage_unlimited" as const },
    };

    // ── 5. Fetch Notifications ───────────────────────────────────
    const { data: notificationsData } = await supabase
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    const notificationsList = notificationsData?.map(doc => ({
      id: doc.id,
      type: doc.type,
      title: doc.title,
      message: doc.message,
      read: doc.read,
      createdAt: doc.created_at,
    })) || [];

    // ── 6. Build response ────────────────────────────────────────
    const stats = {
      notifications: notificationsList,
      users: {
        total: totalUsers || 0,
        today: todayUsers || 0,
        last7: last7Users || 0,
        last30: last30Users || 0,
        source: "supabase_profiles" as const,
        list: recentUsers,
      },
      projects: {
        total: totalProjects,
        storageEstimateBytes: estimatedTotalBytes,
        source: "supabase_postgres" as const,
      },
      firestore: {
        documentsEstimate: totalDocEstimate,
        usernameDocuments: usernameDocuments || 0,
        messageDocuments: messageDocuments || 0,
        source: "supabase_postgres" as const,
        note: "Document count is mapped to Postgres rows.",
      },
      storage: {
        usage: "unavailable",
        source: "supabase_storage" as const,
        note: "Storage usage via API is unavailable.",
      },
      quotas: {
        plan: "Supabase Postgres",
        firestoreStorage: sparkLimits.firestoreStorage,
        firestoreReadsPerDay: { ...sparkLimits.firestoreReadsPerDay, currentUsage: "unavailable" },
        firestoreWritesPerDay: { ...sparkLimits.firestoreWritesPerDay, currentUsage: "unavailable" },
        cloudStorage: sparkLimits.storageBytes,
        authUsers: {
          current: totalUsers || 0,
          limit: "No hard limit",
          source: "supabase_auth" as const,
        },
      },
      refreshedAt: new Date().toISOString(),
      cached: false,
    };

    cachedStats = stats;
    cachedAt = now;

    return NextResponse.json(stats);
  } catch (err: any) {
    console.error("[admin/stats] Error:", err.message || err);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}

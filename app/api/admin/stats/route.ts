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
import { getAdminDb, getAdminAuth } from "@/integrations/firebase/admin.server";

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
    const db = getAdminDb();
    const auth = await getAdminAuth();

    // ── 1. User statistics ───────────────────────────────────────
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const last7Start = new Date();
    last7Start.setDate(last7Start.getDate() - 7);
    last7Start.setHours(0, 0, 0, 0);

    const last30Start = new Date();
    last30Start.setDate(last30Start.getDate() - 30);
    last30Start.setHours(0, 0, 0, 0);

    // List all auth users to get accurate counts
    // Firebase Auth listUsers returns up to 1000 per page
    let totalUsers = 0;
    let todayUsers = 0;
    let last7Users = 0;
    let last30Users = 0;
    let pageToken: string | undefined;
    
    const userList: any[] = [];

    do {
      const listResult = await auth.listUsers(1000, pageToken);
      for (const user of listResult.users) {
        totalUsers++;
        const createdAt = new Date(user.metadata.creationTime);
        if (createdAt >= todayStart) todayUsers++;
        if (createdAt >= last7Start) last7Users++;
        if (createdAt >= last30Start) last30Users++;
        
        userList.push({
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName || "",
          createdAt: user.metadata.creationTime,
          provider: (user.providerData && user.providerData.length > 0)
            ? user.providerData.map(p => p.providerId).join(", ")
            : "email/password"
        });
      }
      pageToken = listResult.pageToken;
    } while (pageToken);
    
    // Sort descending by creation date and limit to recent 100
    userList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const recentUsers = userList.slice(0, 100);

    // ── 2. Project (Firestore user documents) statistics ─────────
    // Use .count() which is vastly cheaper (1 read per 1000 index entries)
    // instead of .select().get() which reads every document.
    const usersCountSnap = await db.collection("users").count().get();
    const totalProjects = usersCountSnap.data().count;

    // We cannot safely estimate storage size without triggering massive read quotas
    // or using Cloud Monitoring. We will explicitly label it as unavailable.
    const estimatedTotalBytes = 0; 

    // ── 3. Firestore document count estimate ─────────────────────
    // Count only top-level collections using aggregation queries
    let totalDocEstimate = totalProjects;
    
    const usernamesCountSnap = await db.collection("usernames").count().get();
    const usernameDocuments = usernamesCountSnap.data().count;
    totalDocEstimate += usernameDocuments;
    
    const messagesCountSnap = await db.collection("messages").count().get();
    const messageDocuments = messagesCountSnap.data().count;
    totalDocEstimate += messageDocuments;

    // ── 4. Firebase quotas ─────────────────────────────────────
    // Firebase Spark plan limits (as of 2024):
    // These are well-known public limits, NOT invented numbers.
    // Source: https://firebase.google.com/docs/firestore/quotas
    const sparkLimits = {
      firestoreStorage: {
        limitBytes: 1_073_741_824, // 1 GiB
        source: "firebase_spark_plan_documented_limit" as const,
      },
      firestoreReadsPerDay: {
        limit: 50_000,
        source: "firebase_spark_plan_documented_limit" as const,
      },
      firestoreWritesPerDay: {
        limit: 20_000,
        source: "firebase_spark_plan_documented_limit" as const,
      },
      firestoreDeletesPerDay: {
        limit: 20_000,
        source: "firebase_spark_plan_documented_limit" as const,
      },
      authUsers: {
        limit: null, // No documented hard limit for Auth users on Spark
        source: "not_applicable" as const,
      },
      storageBytes: {
        limitBytes: 5_368_709_120, // 5 GiB
        source: "firebase_spark_plan_documented_limit" as const,
      },
    };

    // ── 5. Fetch Notifications ───────────────────────────────────
    const notificationsSnap = await db
      .collection("admin_notifications")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const notificationsList = notificationsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // ── 6. Build response ────────────────────────────────────────
    const stats = {
      notifications: notificationsList,
      users: {
        total: totalUsers,
        today: todayUsers,
        last7: last7Users,
        last30: last30Users,
        source: "firebase_auth_admin_sdk" as const,
        list: recentUsers,
      },
      projects: {
        total: totalProjects,
        storageEstimateBytes: estimatedTotalBytes,
        source: "firestore_admin_sdk_sampled" as const,
      },
      firestore: {
        documentsEstimate: totalDocEstimate,
        usernameDocuments: usernameDocuments,
        messageDocuments: messageDocuments,
        source: "firestore_admin_sdk_sampled" as const,
        note: "Document count is estimated using safe top-level .count() aggregations to avoid quota exhaustion.",
      },
      storage: {
        usage: "unavailable",
        source: "not_available_without_cloud_monitoring" as const,
        note: "Firebase Storage usage requires Google Cloud Monitoring API or the Cloud Console. It cannot be reliably queried via the Admin SDK alone.",
      },
      quotas: {
        plan: "Determine from Firebase Console (Spark or Blaze)",
        firestoreStorage: sparkLimits.firestoreStorage,
        firestoreReadsPerDay: {
          ...sparkLimits.firestoreReadsPerDay,
          currentUsage: "unavailable",
          note: "Daily read/write counts require Cloud Monitoring API (metrics: firestore.googleapis.com/document/read_count). Not available via Admin SDK.",
        },
        firestoreWritesPerDay: {
          ...sparkLimits.firestoreWritesPerDay,
          currentUsage: "unavailable",
          note: "Daily write counts require Cloud Monitoring API.",
        },
        cloudStorage: sparkLimits.storageBytes,
        authUsers: {
          current: totalUsers,
          limit: "No hard limit on Spark plan",
          source: "firebase_auth_admin_sdk" as const,
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

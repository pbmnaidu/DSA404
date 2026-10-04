import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth.server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

/**
 * GET /api/admin/data?type=<type>&limit=50&offset=0
 *
 * Fetches admin dashboard data. Each type maps to a specific Supabase table.
 * Uses the service-role client to bypass RLS (safe because verifyAdmin checks first).
 *
 * Types:
 *   - feedback:       user_feedback where category = 'feedback'
 *   - improvements:   user_feedback where category = 'improvement'
 *   - all_feedback:   all user_feedback (no category filter)
 *   - users:          profiles
 *   - user_messages:  user_messages
 *   - broadcasts:     messages
 *   - notifications:  admin_notifications
 */

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("[api/admin/data] SUPABASE_SERVICE_ROLE_KEY is not set! Falling back to anon key. Admin queries may fail due to RLS.");
  }
  return createSupabaseAdmin(url, key);
}

export async function GET(request: Request) {
  // 1. Authorization
  const result = await verifyAdmin(request);
  if (!result.authorized) return result.response;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  // 2. Service role client
  const supabase = getServiceClient();

  try {
    // ── Feedback (category = 'feedback') ──────────────────────
    if (type === "feedback") {
      const { data, error, count } = await supabase
        .from("user_feedback")
        .select("id, user_id, email, category, subject, message, status, admin_reply, created_at, updated_at", { count: "exact" })
        .eq("category", "feedback")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
        
      if (error) {
        console.error(`[api/admin/data] Error fetching feedback:`, { code: error.code, message: error.message });
        return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
      }
      return NextResponse.json({ data: data || [], total: count });
    }

    // ── Improvements (category = 'improvement') ───────────────
    if (type === "improvements") {
      const { data, error, count } = await supabase
        .from("user_feedback")
        .select("id, user_id, email, category, subject, message, status, admin_reply, created_at, updated_at", { count: "exact" })
        .eq("category", "improvement")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
        
      if (error) {
        console.error(`[api/admin/data] Error fetching improvements:`, { code: error.code, message: error.message });
        return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
      }
      return NextResponse.json({ data: data || [], total: count });
    }

    // ── All Feedback (no filter) ──────────────────────────────
    if (type === "all_feedback") {
      const { data, error, count } = await supabase
        .from("user_feedback")
        .select("id, user_id, email, category, subject, message, status, admin_reply, created_at, updated_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
        
      if (error) {
        console.error(`[api/admin/data] Error fetching all_feedback:`, { code: error.code, message: error.message });
        return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
      }
      return NextResponse.json({ data: data || [], total: count });
    }

    // ── Users ─────────────────────────────────────────────────
    if (type === "users") {
      const { data, error, count } = await supabase
        .from("profiles")
        .select("id, email, display_name, username, created_at, updated_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("[api/admin/data] Error fetching users:", { code: error.code, message: error.message });
        return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
      }
      return NextResponse.json({ data: data || [], total: count });
    }

    // ── User Messages ─────────────────────────────────────────
    if (type === "user_messages") {
      const { data, error, count } = await supabase
        .from("user_messages")
        .select("id, sender_id, recipient_id, subject, body, status, created_at, updated_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        if (error.code === "PGRST205") {
          // Table does not exist yet — return empty gracefully
          console.warn("[api/admin/data] user_messages table does not exist. Run the migration.");
          return NextResponse.json({ data: [], total: 0 });
        }
        console.error("[api/admin/data] Error fetching user_messages:", { code: error.code, message: error.message });
        return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
      }
      return NextResponse.json({ data: data || [], total: count });
    }

    // ── Broadcasts (messages table) ───────────────────────────
    if (type === "broadcasts") {
      const { data, error, count } = await supabase
        .from("messages")
        .select("id, title, body, url, author, created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("[api/admin/data] Error fetching broadcasts:", { code: error.code, message: error.message });
        return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
      }
      // The messages table doesn't have a status column — default to "published"
      return NextResponse.json({
        data: data ? data.map(d => ({ ...d, status: "published" })) : [],
        total: count,
      });
    }

    // ── Notifications ─────────────────────────────────────────
    if (type === "notifications") {
      const { data, error, count } = await supabase
        .from("admin_notifications")
        .select("id, type, title, message, read, created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("[api/admin/data] Error fetching admin_notifications:", { code: error.code, message: error.message });
        return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
      }
      return NextResponse.json({ data: data || [], total: count });
    }

    return NextResponse.json({ error: `Invalid type parameter: ${type}` }, { status: 400 });
  } catch (err: any) {
    console.error("[api/admin/data] Unexpected error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

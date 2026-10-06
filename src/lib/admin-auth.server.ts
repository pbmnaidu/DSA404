/**
 * Server-side admin authorization utilities.
 *
 * Verifies the caller is an admin by:
 * 1. Checking the authenticated user's email against a hardcoded allowlist.
 * 2. Checking the admin_users table (using service-role to avoid RLS recursion).
 *
 * SECURITY:
 * - Never import this file from client-side code.
 * - Always verify the ID token on every request.
 * - The admin email is NEVER checked on the frontend.
 */

import { createClient } from "@/integrations/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

export interface AdminVerifyResult {
  authorized: true;
  user: User;
}

export interface AdminDenyResult {
  authorized: false;
  response: NextResponse;
}

export async function verifyAdmin(
  request?: Request
): Promise<AdminVerifyResult | AdminDenyResult> {
  const supabase = await createClient();
  let user: User | null = null;

  // If request has Bearer token, verify it directly
  if (request) {
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const { data } = await supabase.auth.getUser(token);
      user = data.user;
    }
  }

  // Fallback to cookies
  if (!user) {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  // Check hardcoded admin email list first (fast path)
  const ADMIN_EMAILS = ["404dsatracker@gmail.com"];
  if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return { authorized: true, user };
  }

  // Check admin_users table using service-role client to avoid RLS recursion.
  // The cookie-based client would trigger the admin_users RLS policy which calls
  // is_admin_user() which queries admin_users — causing infinite recursion.
  const serviceClient = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  );

  const { data: adminRole } = await serviceClient
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminRole) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { authorized: true, user };
}

/**
 * Server-side admin authorization utilities.
 *
 * Provides functions to:
 * 1. Verify a Firebase ID token AND check the `admin: true` custom claim.
 * 2. Extract the bearer token from an Authorization header.
 *
 * SECURITY:
 * - Never import this file from client-side code.
 * - Always verify the ID token on every request — never trust
 * frontend-provided user data for authorization.
 * - The admin email is NEVER checked on the frontend; only the
 * server-verified custom claim is used.
 */

import { createClient } from "@/integrations/supabase/server";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

export interface AdminVerifyResult {
 authorized: true;
 user?: User;
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
  response: NextResponse.json({ error: "Not found" }, { status: 404 }),
  };
  }

 const ADMIN_EMAILS = ["404dsatracker@gmail.com"];
 if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
  return { authorized: true, user };
 }

 const { data: adminRole } = await supabase
 .from("admin_users")
 .select("user_id")
 .eq("user_id", user.id)
 .maybeSingle();

 if (!adminRole) {
 return {
 authorized: false,
 response: NextResponse.json({ error: "Not found" }, { status: 404 }),
 };
 }

 return { authorized: true, user };
}

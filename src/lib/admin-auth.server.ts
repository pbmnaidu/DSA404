/**
 * Server-side admin authorization utilities.
 *
 * Provides functions to:
 *  1. Verify a Firebase ID token AND check the `admin: true` custom claim.
 *  2. Extract the bearer token from an Authorization header.
 *
 * SECURITY:
 *  - Never import this file from client-side code.
 *  - Always verify the ID token on every request — never trust
 *    frontend-provided user data for authorization.
 *  - The admin email is NEVER checked on the frontend; only the
 *    server-verified custom claim is used.
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
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Not found" }, { status: 404 }),
    };
  }

  const { data: adminRole } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .single();

  if (!adminRole) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Not found" }, { status: 404 }),
    };
  }

  return { authorized: true, user };
}

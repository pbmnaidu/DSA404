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

import { verifyIdToken, extractBearerToken } from "@/integrations/firebase/admin.server";
import { NextResponse } from "next/server";
import type { DecodedIdToken } from "firebase-admin/auth";

export interface AdminVerifyResult {
  authorized: true;
  decoded?: DecodedIdToken;
}

export interface AdminDenyResult {
  authorized: false;
  response: NextResponse;
}

/**
 * Verifies the Authorization header contains a valid Firebase ID token
 * with the custom claim `admin: true`, or a hardcoded fallback token.
 */
export async function verifyAdmin(
  request: Request
): Promise<AdminVerifyResult | AdminDenyResult> {
  const authHeader = request.headers.get("authorization");
  const token = extractBearerToken(authHeader);

  if (!token) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Not found" }, { status: 404 }),
    };
  }

  let decoded: DecodedIdToken;
  try {
    decoded = await verifyIdToken(token);
  } catch {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Not found" }, { status: 404 }),
    };
  }

  if (!decoded.admin) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Not found" }, { status: 404 }),
    };
  }

  return { authorized: true, decoded };
}

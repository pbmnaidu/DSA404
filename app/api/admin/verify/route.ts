/**
 * GET /api/admin/verify
 *
 * Lightweight endpoint for the admin dashboard to verify that
 * the current user has admin privileges before rendering.
 *
 * Returns { admin: true } or a 404 for non-admins.
 */

import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth.server";

export async function GET(request: Request) {
  const result = await verifyAdmin(request);
  if (!result.authorized) return result.response;
  return NextResponse.json({ admin: true });
}

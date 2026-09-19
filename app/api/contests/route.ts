import { NextResponse } from "next/server";
import { syncContestsIfNeeded } from "@/lib/contests-service";

export const dynamic = "force-dynamic";

// ─── GET /api/contests (Database-backed read endpoint, synced only on starting day) ────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "true";

  const contests = await syncContestsIfNeeded(force);

  return NextResponse.json(contests, {
    headers: {
      "Cache-Control": "public, max-age=1800, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}

import { NextResponse } from "next/server";
import { syncContestsToFirestore } from "@/lib/contests-service";

export const dynamic = "force-dynamic";

function indiaHour() {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", hour12: false }).format(new Date()));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret");
  const headerSecret = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const secret = querySecret || headerSecret;
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!searchParams.has("force") && indiaHour() !== 4) {
    return NextResponse.json({ ok: true, skipped: true, reason: "Contest sync runs at 04:00 Asia/Kolkata" });
  }
  const contests = await syncContestsToFirestore();
  return NextResponse.json({ ok: true, synced: contests.length, syncedAt: new Date().toISOString() });
}

// @ts-nocheck
import { NextResponse } from "next/server";
import { getMessaging } from "firebase-admin/messaging";
import { getAdminDb } from "@/integrations/firebase/admin.server";
import { createClient } from "@/integrations/supabase/server";

const ADMIN_EMAILS = [
  "404dsatracker@gmail.com",
  ...(process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase()) : []),
];

async function isAdminUser(supabase: any, userId: string, email?: string | null): Promise<boolean> {
  if (email && ADMIN_EMAILS.includes(email.toLowerCase())) return true;
  // Check Supabase admin_users table
  const { data } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .single();
  return !!data;
}

export async function POST(req: Request) {
  try {
    // Verify user via Supabase session (cookie-based)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn("[api/campaigns/publish] Unauthorized: No valid Supabase session.");
      return NextResponse.json(
        { success: false, reason: "UNAUTHORIZED", message: "Not authenticated" },
        { status: 401 }
      );
    }

    const uid = user.id;
    const email = user.email;

    if (!(await isAdminUser(supabase, uid, email))) {
      console.warn(`[api/campaigns/publish] Unauthorized publish attempt by uid=${uid}, email=${email}`);
      return NextResponse.json(
        {
          success: false,
          reason: "FORBIDDEN",
          message: "Only authorized administrators are permitted to publish notification campaigns.",
        },
        { status: 403 }
      );
    }

    const bodyJson = await req.json().catch(() => ({}));
    const { title, body, url } = bodyJson;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { success: false, reason: "BAD_REQUEST", message: "Title is required" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "string" || !body.trim()) {
      return NextResponse.json(
        { success: false, reason: "BAD_REQUEST", message: "Message body is required" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const messageRef = db.collection("messages").doc();
    const nowIso = new Date().toISOString();
    const targetUrl = (url && typeof url === "string" && url.trim()) ? url.trim() : "/messages";
    const tag = `campaign-${messageRef.id}`;

    await messageRef.set({
      id: messageRef.id,
      title: title.trim(),
      body: body.trim(),
      url: targetUrl,
      createdAt: nowIso,
      createdBy: uid,
      createdByName: user.user_metadata?.full_name || email?.split("@")[0] || "Admin",
      status: "sending",
      tag,
    });

    const subsSnap = await db.collectionGroup("pushSubscriptions").get();
    const tokenDocs = subsSnap.docs;
    const tokens = tokenDocs
      .map((d) => (d.data().token as string) ?? d.id)
      .filter(Boolean);

    if (tokens.length === 0) {
      await messageRef.update({
        status: "published",
        sentAt: nowIso,
        tokensFound: 0,
        successCount: 0,
        failureCount: 0,
        invalidTokensRemoved: 0,
      });

      return NextResponse.json({
        success: true,
        messageId: messageRef.id,
        tokensFound: 0,
        successCount: 0,
        failureCount: 0,
        invalidTokensRemoved: 0,
        message: "Message published. No registered push tokens found to broadcast to.",
      });
    }

    const BATCH_SIZE = 500;
    let totalSuccessCount = 0;
    let totalFailureCount = 0;
    let invalidTokensRemoved = 0;

    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      const batchTokens = tokens.slice(i, i + BATCH_SIZE);
      const batchDocs = tokenDocs.slice(i, i + BATCH_SIZE);

      const multicastResult = await getMessaging().sendEachForMulticast({
        tokens: batchTokens,
        notification: {
          title: title.trim(),
          body: body.trim(),
        },
        data: {
          type: "campaign",
          messageId: messageRef.id,
          title: title.trim(),
          body: body.trim(),
          url: targetUrl,
          tag,
          sentAt: nowIso,
        },
        webpush: {
          fcmOptions: {
            link: targetUrl,
          },
          notification: {
            title: title.trim(),
            body: body.trim(),
            icon: "/icon.png",
            badge: "/icon.png",
            tag,
          },
        },
      });

      totalSuccessCount += multicastResult.successCount;
      totalFailureCount += multicastResult.failureCount;

      await Promise.all(
        multicastResult.responses.map(async (resp, idx) => {
          if (!resp.success) {
            const errCode = resp.error?.code || "";
            if (
              errCode === "messaging/registration-token-not-registered" ||
              errCode === "messaging/invalid-registration-token"
            ) {
              const docRef = batchDocs[idx].ref;
              await docRef.delete().catch(() => {});
              invalidTokensRemoved += 1;
            }
          }
        })
      );
    }

    await messageRef.update({
      status: "published",
      sentAt: new Date().toISOString(),
      tokensFound: tokens.length,
      successCount: totalSuccessCount,
      failureCount: totalFailureCount,
      invalidTokensRemoved,
    });

    console.info(`[api/campaigns/publish] Broadcast finished: id=${messageRef.id}, tokens=${tokens.length}, success=${totalSuccessCount}, failures=${totalFailureCount}, pruned=${invalidTokensRemoved}`);

    return NextResponse.json({
      success: true,
      messageId: messageRef.id,
      tokensFound: tokens.length,
      successCount: totalSuccessCount,
      failureCount: totalFailureCount,
      invalidTokensRemoved,
      message: `Announcement broadcast successfully to ${totalSuccessCount}/${tokens.length} token(s).`,
    });
  } catch (err: any) {
    console.error("[api/campaigns/publish] Unexpected error:", err);
    return NextResponse.json(
      {
        success: false,
        reason: "INTERNAL_ERROR",
        message: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}

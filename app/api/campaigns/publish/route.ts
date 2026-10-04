// @ts-nocheck
import { NextResponse } from "next/server";
import { getMessaging } from "firebase-admin/messaging";
import { verifyAdmin } from "@/lib/admin-auth.server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { getAdminApp } from "@/integrations/firebase/admin.server";

/**
 * Service-role Supabase client — bypasses RLS.
 * Safe to use here because verifyAdmin() has already confirmed the caller is an admin.
 */
function getServiceClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  );
}

export async function POST(req: Request) {
  try {
    // 1. Authenticate & Verify Admin
    const authResult = await verifyAdmin(req);
    if (!authResult.authorized) {
      console.warn("[api/campaigns/publish] Unauthorized publish attempt");
      return NextResponse.json(
        {
          success: false,
          reason: "FORBIDDEN",
          message: "Only authorized administrators are permitted to publish notification campaigns.",
        },
        { status: 403 }
      );
    }
    
    const user = authResult.user;
    const uid = user.id;

    // 2. Validate input
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

    // 3. Insert message using service-role client (bypasses RLS)
    const supabaseAdmin = getServiceClient();
    const nowIso = new Date().toISOString();
    const targetUrl = (url && typeof url === "string" && url.trim()) ? url.trim() : "/messages";
    
    const { data: insertedMessage, error: insertError } = await supabaseAdmin
      .from("messages")
      .insert({
        title: title.trim(),
        body: body.trim(),
        url: targetUrl,
        author: uid,
      })
      .select("id")
      .single();

    if (insertError) {
       console.error("[api/campaigns/publish] Database insert failed:", {
         code: insertError.code,
         message: insertError.message,
         details: insertError.details,
         hint: insertError.hint
       });
       return NextResponse.json(
         { 
           success: false, 
           reason: "DATABASE_ERROR", 
           message: "Failed to save message to database: " + insertError.message 
         },
         { status: 500 }
       );
    }
    
    const messageId = insertedMessage.id;
    const tag = `campaign-${messageId}`;

    // 4. Send Push Notifications (Message is preserved even if this fails partially)
    const { data: subsSnap, error: subsError } = await supabaseAdmin
      .from("push_subscriptions")
      .select("token, id:token");

    const tokenDocs = subsSnap || [];
    const tokens = tokenDocs
      .map((d) => d.token as string)
      .filter(Boolean);

    if (tokens.length === 0) {
      return NextResponse.json({
        success: true,
        messageId,
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

      const multicastResult = await getMessaging(getAdminApp()).sendEachForMulticast({
        tokens: batchTokens,
        notification: {
          title: title.trim(),
          body: body.trim(),
        },
        data: {
          type: "campaign",
          messageId: messageId,
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
              const invalidToken = batchTokens[idx];
              await supabaseAdmin
                .from("push_subscriptions")
                .delete()
                .eq("token", invalidToken);
              invalidTokensRemoved += 1;
            }
          }
        })
      );
    }

    console.info(`[api/campaigns/publish] Broadcast finished: id=${messageId}, tokens=${tokens.length}, success=${totalSuccessCount}, failures=${totalFailureCount}, pruned=${invalidTokensRemoved}`);

    return NextResponse.json({
      success: true,
      messageId: messageId,
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

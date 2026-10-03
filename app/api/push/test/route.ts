// @ts-nocheck
import { NextResponse } from "next/server";
import { getMessaging } from "firebase-admin/messaging";
import { createClient } from "@/integrations/supabase/server";

export async function POST(req: Request) {
  try {
    // Verify user via Supabase session (cookie-based)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn("[api/push/test] Unauthorized: No valid Supabase session.");
      return NextResponse.json(
        { success: false, reason: "UNAUTHORIZED", message: "Not authenticated" },
        { status: 401 }
      );
    }

    const uid = user.id;
    console.info(`[api/push/test] Authenticated user uid=${uid.slice(0, 8)}... Querying stored FCM tokens...`);

    const { data: pushSnap, error: dbError } = await supabase
      .from("push_subscriptions")
      .select("token")
      .eq("user_id", uid);

    if (dbError || !pushSnap || pushSnap.length === 0) {
      console.info(`[api/push/test] No stored FCM tokens found in Supabase for uid=${uid}`);
      return NextResponse.json({
        success: false,
        stage: "B",
        reason: "NO_TOKENS_STORED",
        message: "No FCM tokens found for this user. Ensure notification permission is granted in Settings.",
        tokensFound: 0,
      });
    }

    const tokens = pushSnap.map((row) => row.token).filter(Boolean);
    if (tokens.length === 0) {
      return NextResponse.json({
        success: false,
        stage: "B",
        reason: "NO_VALID_TOKENS",
        message: "Push subscription rows existed but contained no valid token string.",
        tokensFound: 0,
      });
    }

    const testTag = `dsa-test-${Date.now()}`;
    const messagePayload = {
      tokens,
      notification: {
        title: "🚀 FCM Direct Push Test",
        body: "Direct FCM server-push notification working successfully!",
      },
      data: {
        title: "🚀 FCM Direct Push Test",
        body: "Direct FCM server-push notification working successfully!",
        tag: testTag,
        url: "/today",
        sentAt: new Date().toISOString(),
      },
      webpush: {
        fcmOptions: {
          link: "/today",
        },
      },
    };

    console.info(`[api/push/test] Sending FCM multicast test to ${tokens.length} token(s) for uid=${uid.slice(0, 8)}...`);
    const multicastResult = await getMessaging().sendEachForMulticast(messagePayload);

    let successCount = multicastResult.successCount;
    let failureCount = multicastResult.failureCount;
    const errors: string[] = [];

    // Safely prune dead/expired tokens
    await Promise.all(
      multicastResult.responses.map(async (resp, i) => {
        if (!resp.success) {
          const errCode = resp.error?.code || "unknown";
          errors.push(`Token ${i + 1} (${tokens[i].slice(0, 8)}...): ${errCode}`);
          if (
            errCode === "messaging/registration-token-not-registered" ||
            errCode === "messaging/invalid-registration-token"
          ) {
            console.info(`[api/push/test] Pruning invalid token row for uid=${uid}`);
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("token", tokens[i]);
          }
        }
      })
    );

    console.info(`[api/push/test] Multicast Result: successCount=${successCount}, failureCount=${failureCount}`);

    return NextResponse.json({
      success: successCount > 0,
      stage: successCount > 0 ? "C" : "C_FAILED",
      tokensFound: tokens.length,
      successCount,
      failureCount,
      errors,
      testTag,
      message:
        successCount > 0
          ? `FCM send succeeded for ${successCount}/${tokens.length} token(s).`
          : `FCM send failed for all tokens. See errors array for details.`,
    });
  } catch (err: any) {
    console.error("[api/push/test] Unexpected error:", err);
    return NextResponse.json(
      {
        success: false,
        stage: "C_ERROR",
        reason: "INTERNAL_ERROR",
        message: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}

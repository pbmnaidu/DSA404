import { NextResponse } from "next/server";
import { createClient } from "@/integrations/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { getMessaging } from "firebase-admin/messaging";
import { getAdminApp } from "@/integrations/firebase/admin.server";

const OFFICIAL_EMAIL = "404dsatracker@gmail.com";

/**
 * Helper: get a Supabase client that bypasses RLS.
 * Falls back to the anon key if SUPABASE_SERVICE_ROLE_KEY is not set,
 * which means RLS will apply and admin operations will fail.
 */
function getServiceClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  );
}

export async function POST(req: Request) {
  try {
    // 1. Authenticate the user via cookies
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.email) {
      console.warn("[feedback] Auth failed:", authError?.message);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse and validate input
    const payload = await req.json();
    const category = String(payload.category || "feedback").trim().slice(0, 40);
    const subject = String(payload.subject || "").trim().slice(0, 120);
    const message = String(payload.message || "").trim().slice(0, 4000);
    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
    }

    // 3. Fetch user profile for display name
    const db = getServiceClient();
    const { data: profile } = await db
      .from("profiles")
      .select("username, display_name")
      .eq("id", user.id)
      .maybeSingle();

    const username = profile?.username || user.user_metadata?.username || user.email.split("@")[0];
    const displayName = profile?.display_name || user.user_metadata?.full_name || username;

    // 4. Insert feedback using service-role client to bypass RLS
    //    The service-role client is safe here because we already authenticated
    //    the user in step 1. We set user_id to the verified auth.uid.
    const { data: savedFeedback, error: insertError } = await db
      .from("user_feedback")
      .insert({
        user_id: user.id,
        email: user.email,
        category,
        subject,
        message,
      })
      .select("id")
      .single();

    if (insertError || !savedFeedback?.id) {
      console.error("[feedback] Database insert failed:", {
        code: insertError?.code,
        message: insertError?.message,
        details: insertError?.details,
      });
      return NextResponse.json(
        {
          success: false,
          savedToDatabase: false,
          error: insertError?.message || "Feedback was not stored",
        },
        { status: 500 }
      );
    }

    const feedbackId = savedFeedback.id;
    console.info(`[feedback] Saved feedback ${feedbackId} from ${user.email} (${category})`);

    // 5. Create admin notification
    let notificationCreated = false;
    const { error: notifError } = await db
      .from("admin_notifications")
      .insert({
        type: "user_feedback",
        title: `${category === "improvement" ? "Improvement idea" : "User feedback"}: ${subject}`,
        message: `Feedback ID: ${feedbackId}\nFrom: ${displayName} (@${username})\nEmail: ${user.email}\nCategory: ${category}\nSubject: ${subject}\n\n${message}`,
      });
    if (notifError) {
      console.error("[feedback] Admin notification insert failed:", notifError.code, notifError.message);
    } else {
      notificationCreated = true;
    }

    // 6. Send email notification
    let emailSent = true;
    try {
      await sendEmail(
        OFFICIAL_EMAIL,
        `[DSA404 ${category}] ${subject}`,
        `New ${category} from ${displayName} (@${username})\nEmail: ${user.email}\n\nSubject: ${subject}\n\n${message}`
      );
    } catch (emailError) {
      emailSent = false;
      console.error("[feedback] Official email failed:", emailError);
    }

    // 7. Send Web Push Notification to all admins
    try {
      const { data: adminUsers } = await db.from("admin_users").select("user_id");
      if (adminUsers && adminUsers.length > 0) {
        const adminUserIds = adminUsers.map((a: any) => a.user_id);
        const { data: pushSubs } = await db.from("push_subscriptions").select("token").in("user_id", adminUserIds);
        
        if (pushSubs && pushSubs.length > 0) {
          const adminTokens = pushSubs.map((s: any) => s.token);
          await getMessaging(getAdminApp()).sendEachForMulticast({
            tokens: adminTokens,
            notification: {
              title: `📝 New ${category === 'improvement' ? 'Improvement' : 'Feedback'} from ${username}`,
              body: `${subject}\nBy: ${user.email}`,
            },
            data: { link: "/admin", tag: `feedback_${feedbackId}` },
            webpush: { fcmOptions: { link: "/admin" } }
          });
        }
      }
    } catch (pushErr) {
      console.error("[feedback] Failed to send admin push notification:", pushErr);
    }

    return NextResponse.json({
      success: true,
      feedbackId,
      savedToDatabase: true,
      adminNotificationCreated: notificationCreated,
      emailSent,
    });
  } catch (error: any) {
    console.error("[feedback] Submit failed:", error);
    return NextResponse.json(
      { error: error?.message || "Unable to submit feedback" },
      { status: 500 }
    );
  }
}

// @ts-nocheck
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { createClient } from "@/integrations/supabase/server";

/**
 * POST /api/send-email/test
 * Sends a test email to the authenticated user to verify Gmail SMTP is working.
 * Only works for the authenticated user's own email address.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = user.email;
    if (!userEmail) {
      return NextResponse.json({ error: "No email address on account" }, { status: 400 });
    }

    const result = await sendEmail(
      userEmail,
      "✅ DSA⁴⁰⁴ Email Test — Connection Working!",
      `Hello!\n\nThis is a test email from DSA⁴⁰⁴ to verify your email notifications are working.\n\nIf you received this, your email reminders are configured correctly!\n\n- DSA⁴⁰⁴ Team`,
      `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0f172a;border-radius:12px;padding:28px;color:#f8fafc;border:1px solid #1e293b;">
  <div style="font-size:20px;font-weight:900;color:#38bdf8;margin-bottom:12px;">DSA<span style="color:#f97316;">⁴⁰⁴</span></div>
  <h2 style="margin-top:0;color:#22c55e;">✅ Email Notifications Working!</h2>
  <p style="color:#94a3b8;line-height:1.6;">Your email is correctly configured. You will receive daily reminders, revision alerts, and contest notifications at <strong style="color:#f8fafc;">${userEmail}</strong>.</p>
  <p style="margin-top:24px;font-size:12px;color:#475569;">Sent from DSA⁴⁰⁴ Settings → Test Email</p>
</div>`
    );

    if (!result) {
      return NextResponse.json({ error: "Email sending failed. Check server logs for GMAIL credentials." }, { status: 500 });
    }

    return NextResponse.json({ success: true, sentTo: userEmail, messageId: result.messageId });
  } catch (err: any) {
    console.error("[send-email/test] Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

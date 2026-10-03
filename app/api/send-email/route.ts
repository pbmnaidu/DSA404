// @ts-nocheck
import { NextResponse } from "next/server";
import { sendEmail } from "../../../src/lib/email";
import { createClient } from "@/integrations/supabase/server";

// NOTE: We no longer force the recipient to the owner email.
// The caller must provide the target email address (e.g., the logged‑in user).
export async function POST(req: Request) {
  try {
    // Verify user via Supabase session (cookie-based)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, subject, message } = await req.json();
    const recipient = email?.trim();
    if (!recipient) {
      return NextResponse.json({ error: "Missing recipient email" }, { status: 400 });
    }

    if (user.email !== recipient) {
      return NextResponse.json({ error: "Forbidden: Cannot send email to a different address" }, { status: 403 });
    }

    const emailSubject = subject || "👋 Welcome to DSA⁴⁰⁴!";
    const emailText =
      message ||
      `Hello!\n\nThanks for logging in to our website. Your email reminders and contest alerts are now active.\n\nKeep grinding your DSA goals!\n\n- DSA⁴⁰⁴ Team`;

    // Use Nodemailer utility
    await sendEmail(recipient, emailSubject, emailText);

    return NextResponse.json({ success: true, sentTo: recipient });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

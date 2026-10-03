// @ts-nocheck
import { NextResponse } from "next/server";
import { sendEmail } from "../../../src/lib/email";
import { getAdminAuth } from "../../../src/integrations/firebase/admin.server";

// NOTE: We no longer force the recipient to the owner email.
// The caller must provide the target email address (e.g., the logged‑in user).
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    
    const auth = await getAdminAuth();
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { email, subject, message } = await req.json();
    const recipient = email?.trim();
    if (!recipient) {
      return NextResponse.json({ error: "Missing recipient email" }, { status: 400 });
    }

    if (decodedToken.email !== recipient) {
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

import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { buildGuideEmail, buildGuideText, buildWelcomeEmail } from "@/lib/onboarding-email";

const OFFICIAL_EMAIL = "404dsatracker@gmail.com";

export async function POST(req: Request) {
  try {
    const { email, name, username } = await req.json();
    const recipient = String(email || "").trim();
    if (!recipient) return NextResponse.json({ error: "Missing recipient email" }, { status: 400 });

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify the user actually exists in the database and was created recently
    const { data: profile, error: dbError } = await supabaseAdmin
      .from("profiles")
      .select("created_at")
      .eq("email", recipient)
      .single();

    if (dbError || !profile) {
      return NextResponse.json({ error: "User profile not found in system" }, { status: 403 });
    }

    // Ensure the user was created recently (e.g., within the last 15 minutes) to prevent abuse
    const createdTime = new Date(profile.created_at).getTime();
    if (Date.now() - createdTime > 15 * 60 * 1000) {
      return NextResponse.json({ error: "Onboarding emails can only be triggered immediately after registration" }, { status: 403 });
    }

    const displayName = String(name || username || "Learner");
    const handle = username ? `@${username}` : "DSA Student";
    
    // Send emails
    await sendEmail(recipient, `Welcome to DSA⁴⁰⁴, ${displayName}! 🚀`, `Hello ${displayName} (${handle}),\n\nWelcome to the DSA⁴⁰⁴ community!\n\nSet your pace. Stay consistent. Control the controllables.\n\n- The 404 DSA Team`, buildWelcomeEmail(displayName, handle));
    await sendEmail(recipient, "📖 Your DSA⁴⁰⁴ guide", buildGuideText(), buildGuideEmail());
    await sendEmail(OFFICIAL_EMAIL, `🆕 New User Registered: ${displayName} (${handle})`, `A new user signed up on DSA⁴⁰⁴.\n\nName: ${displayName}\nUsername: ${handle}\nEmail: ${recipient}\nRegistered at: ${new Date().toISOString()}\n\n- DSA⁴⁰⁴ System`);
    
    return NextResponse.json({ success: true, sentTo: recipient });
  } catch (err: any) {
    console.error("Onboarding emails API error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

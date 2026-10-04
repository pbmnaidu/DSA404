import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { createClient } from "@/integrations/supabase/server";
import { buildGuideEmail, buildGuideText, buildWelcomeEmail } from "@/lib/onboarding-email";

const OFFICIAL_EMAIL = "404dsatracker@gmail.com";

export async function POST(req: Request) {
 try {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, name, username } = await req.json();
  const recipient = String(email || "").trim();
  if (!recipient) return NextResponse.json({ error: "Missing recipient email" }, { status: 400 });
  if (user.email?.toLowerCase() !== recipient.toLowerCase()) return NextResponse.json({ error: "Forbidden: Cannot send email to a different address" }, { status: 403 });

  const displayName = String(name || username || "Learner");
  const handle = username ? `@${username}` : "DSA Student";
  await sendEmail(recipient, `Welcome to DSA⁴⁰⁴, ${displayName}! 🚀`, `Hello ${displayName} (${handle}),\n\nWelcome to the DSA⁴⁰⁴ community!\n\nSet your pace. Stay consistent. Control the controllables.\n\n- The 404 DSA Team`, buildWelcomeEmail(displayName, handle));
  await sendEmail(recipient, "📖 Your DSA⁴⁰⁴ guide", buildGuideText(), buildGuideEmail());
  await sendEmail(OFFICIAL_EMAIL, `🆕 New User Registered: ${displayName} (${handle})`, `A new user signed up on DSA⁴⁰⁴.\n\nName: ${displayName}\nUsername: ${handle}\nEmail: ${recipient}\nRegistered at: ${new Date().toISOString()}\n\n- DSA⁴⁰⁴ System`);
  return NextResponse.json({ success: true, sentTo: recipient });
 } catch (err: any) {
  console.error("Onboarding emails API error:", err);
  return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
 }
}

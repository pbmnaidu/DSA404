import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth.server";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  const result = await verifyAdmin(request);
  if (!result.authorized) return result.response;

  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Missing email address" }, { status: 400 });
    }

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #333;">Admin Email Test 🚀</h2>
        <p>If you are seeing this, the email delivery system for DSA⁴⁰⁴ is working perfectly!</p>
        <p style="color: #555;">Time: ${new Date().toLocaleString()}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">This is an automated test from the Admin Dashboard.</p>
      </div>
    `;

    await sendEmail(email, "System Diagnostics: Test Email 🚀", "If you are seeing this, the email delivery system is working perfectly!", htmlContent);

    return NextResponse.json({ success: true, message: "Test email sent successfully" });
  } catch (error: any) {
    console.error("Test email API error:", error);
    return NextResponse.json({ error: error.message || "Failed to send test email" }, { status: 500 });
  }
}

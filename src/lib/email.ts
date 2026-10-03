// src/lib/email.ts
// @ts-ignore
import nodemailer from "nodemailer";

// Load credentials from environment variables (Vercel and local .env)
const GMAIL_USER = process.env.GMAIL_USER?.trim();
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD?.trim();

if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
 console.error(
 "[email] Gmail credentials are missing. Ensure GMAIL_USER and GMAIL_APP_PASSWORD are set in the environment."
 );
}

// Create a reusable transport with explicit SMTP settings for reliability
// Using port 465 (SSL) instead of service:"gmail" which can fail in some environments.
const transporter = nodemailer.createTransport({
 host: "smtp.gmail.com",
 port: 465,
 secure: true, // use TLS (port 465)
 auth: {
 user: GMAIL_USER,
 pass: GMAIL_APP_PASSWORD,
 },
 tls: {
 // Do not fail on invalid certs (prevents issues in some Node environments)
 rejectUnauthorized: true,
 },
 // Connection pool for performance when sending many emails in cron job
 pool: true,
 maxConnections: 3,
 maxMessages: 100,
});

/**
 * Sends an email via Gmail SMTP.
 * @param to Recipient email address
 * @param subject Email subject line
 * @param text Plain-text body
 * @param html Optional HTML body
 */
export async function sendEmail(
 to: string,
 subject: string,
 text: string,
 html?: string
): Promise<any> {
 if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
 console.warn("[email] Gmail credentials not configured. Skipping email send to:", to);
 return null;
 }

 // Basic recipient validation
 if (!to || !to.includes("@")) {
 console.warn("[email] Invalid recipient address:", to);
 return null;
 }

 try {
 const info = await transporter.sendMail({
 from: `"DSA⁴⁰⁴ Team" <${GMAIL_USER}>`,
 to,
 subject,
 text,
 ...(html ? { html } : {}),
 });
 console.info("[email] Sent successfully", { to, messageId: info.messageId });
 return info;
 } catch (err: any) {
 // Provide clearer error messages for common failures
 if (err?.code === "EAUTH") {
 console.error(
 "[email] Authentication failed. The Gmail App Password may be invalid or 2FA is not enabled.",
 { user: GMAIL_USER }
 );
 } else if (err?.code === "ECONNREFUSED" || err?.code === "ETIMEDOUT") {
 console.error("[email] SMTP connection failed. Check network or Gmail SMTP settings.", err.code);
 } else {
 console.error("[email] Failed to send email to " + to, err?.message || err);
 }
 return null;
 }
}

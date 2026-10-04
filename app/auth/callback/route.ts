import { createClient } from '@/integrations/supabase/server';
import { sendEmail } from '@/lib/email';
import { NextResponse } from 'next/server';

const ADMIN_EMAILS = ["404dsatracker@gmail.com"];
const OFFICIAL_EMAIL = "404dsatracker@gmail.com";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/today';

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const user = data?.session?.user;
      const userEmail = user?.email?.toLowerCase();

      // If admin email, redirect to admin dashboard
      if (userEmail && ADMIN_EMAILS.includes(userEmail)) {
        return NextResponse.redirect(`${origin}/admin`);
      }

      // For OAuth (Google) signups: check if this is a brand-new user
      // Supabase sets created_at == last_sign_in_at on first login
      if (user) {
        const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0;
        const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : 0;
        const isNewUser = Math.abs(createdAt - lastSignIn) < 10_000; // within 10 seconds = brand new

        if (isNewUser && user.email) {
          const displayName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email.split('@')[0] ||
            'Learner';

          // Fire onboarding emails in background (don't block the redirect)
          void sendWelcomeEmails(user.email, displayName).catch(() => {});
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error("Auth callback error:", error.message, error);
    }
  }

  return NextResponse.redirect(`${origin}/auth?mode=signin&error=auth_callback_failed`);
}

async function sendWelcomeEmails(email: string, displayName: string) {
  const subject1 = `Welcome to DSA⁴⁰⁴, ${displayName}! 🚀`;
  const text1 = `Hello ${displayName},\n\nWelcome to the DSA⁴⁰⁴ community! We are thrilled to have you join us.\n\nCore Motto:\n"Set your pace. Stay consistent. Control the controllables."\n\nSuccess in technical interviews is not about blindly solving 1000 problems—it is about mastering core patterns, building daily consistency, and tracking your growth.\n\nYou have taken the first step toward structured DSA mastery.\n\nHappy Coding!\n- The 404 DSA Team`;
  const html1 = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:'Segoe UI',sans-serif;background:#090d16;color:#f8fafc;margin:0;padding:20px}.card{max-width:600px;margin:0 auto;background:#0f172a;border:1px solid #1e293b;border-radius:16px;padding:32px}.logo{font-size:24px;font-weight:900;color:#38bdf8}.logo-orange{color:#f97316}.quote-box{background:linear-gradient(135deg,#0284c7 0%,#0f172a 100%);border:1px solid #38bdf8;border-radius:12px;padding:20px;text-align:center;margin:24px 0}.quote-text{margin:0;font-size:17px;color:#fbbf24;font-weight:800;font-family:monospace}.footer{margin-top:32px;font-size:12px;color:#64748b;text-align:center;border-top:1px solid #1e293b;padding-top:16px}</style></head><body><div class="card"><div class="logo">DSA<span class="logo-orange">⁴⁰⁴</span></div><h2 style="margin-top:16px;font-size:22px;color:#f8fafc">Welcome to DSA⁴⁰⁴, ${displayName}! 🚀</h2><p style="color:#94a3b8;font-size:15px;line-height:1.6">Hello <strong>${displayName}</strong>,<br/><br/>Welcome to the <strong>DSA⁴⁰⁴</strong> community! We are super excited to help you prepare systematically for your coding interviews and master Data Structures &amp; Algorithms.</p><div class="quote-box"><p class="quote-text">"Set your pace. Stay consistent. Control the controllables."</p><p style="margin-top:8px;font-size:13px;color:#cbd5e1;font-style:italic">— The 404 DSA Team Core Principle</p></div><p style="color:#cbd5e1;font-size:14px;line-height:1.6">Remember: The goal isn't just to solve problems. The goal is to <strong>master the patterns</strong> behind them. Take it one day at a time, stick to your daily pace, and let the plan rebalance automatically when life happens.</p><p style="color:#94a3b8;font-size:14px;margin-top:20px">Warm regards,<br/><strong style="color:#38bdf8">The 404 DSA Team</strong></p><div class="footer">DSA⁴⁰⁴ · Built for structured, consistent DSA practice</div></div></body></html>`;

  // Send welcome email to the user
  await sendEmail(email, subject1, text1, html1);

  // Keep OAuth and email-confirmation onboarding consistent: both receive the
  // greeting and the feature guide.
  await sendEmail(
    email,
    '📖 Complete Guide: DSA⁴⁰⁴ Features & Settings',
    `Your DSA⁴⁰⁴ guide is ready. Explore Today, Roadmap, Problems, Review, Backlog, Progress, Contests, Profile, Settings, AI Tutor, GitHub Sync, reminders, PWA installation, theme customization, and guest mode.\n\nOpen the app to get started.\n\n- The 404 DSA Team`
  );

  // Notify official team
  await sendEmail(
    OFFICIAL_EMAIL,
    `🆕 New Google User Registered: ${displayName}`,
    `A new user just signed up via Google OAuth on DSA⁴⁰⁴!\n\nName: ${displayName}\nEmail: ${email}\nRegistered at: ${new Date().toISOString()}\n\n- DSA⁴⁰⁴ System`
  );
}

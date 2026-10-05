import { createClient } from '@/integrations/supabase/server';
import { sendEmail } from '@/lib/email';
import { buildGuideEmail, buildGuideText, buildWelcomeEmail } from '@/lib/onboarding-email';
import { NextResponse } from 'next/server';

const ADMIN_EMAILS = ['404dsatracker@gmail.com'];
const OFFICIAL_EMAIL = '404dsatracker@gmail.com';

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
   if (userEmail && ADMIN_EMAILS.includes(userEmail)) return NextResponse.redirect(`${origin}/admin`);
   if (user) {
    const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0;
    const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : 0;
    // Allow up to 1 hour difference for Magic Link logins, and ensure we only send it once
     const isBrandNew = Math.abs(createdAt - lastSignIn) < 60 * 60 * 1000 && !user.user_metadata?.welcome_email_sent;
    if (isBrandNew && user.email) {
     const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0] || 'Learner';
     void sendWelcomeEmails(user.email, displayName).catch((sendError) => console.error('OAuth welcome email failed:', sendError));
      
      // Mark as sent so we don't send again if they re-login within the hour
      await supabase.auth.updateUser({
        data: { welcome_email_sent: true }
      });
     return NextResponse.redirect(`${origin}${next}?new_registration=true`);
    }
   }
   return NextResponse.redirect(`${origin}${next}`);
  }
  console.error('Auth callback error:', error.message, error);
 }
 return NextResponse.redirect(`${origin}/auth?mode=signin&error=auth_callback_failed`);
}

async function sendWelcomeEmails(email: string, displayName: string) {
 const subject = `Welcome to DSA⁴⁰⁴, ${displayName}! 🚀`;
 await sendEmail(email, subject, `Hello ${displayName},\n\nWelcome to the DSA⁴⁰⁴ community!\n\nSet your pace. Stay consistent. Control the controllables.\n\n- The 404 DSA Team`, buildWelcomeEmail(displayName));
 await sendEmail(email, '📖 Your DSA⁴⁰⁴ guide', buildGuideText(), buildGuideEmail());
 await sendEmail(OFFICIAL_EMAIL, `🆕 New Google User Registered: ${displayName}`, `A new user signed up via Google OAuth on DSA⁴⁰⁴.\n\nName: ${displayName}\nEmail: ${email}\nRegistered at: ${new Date().toISOString()}\n\n- DSA⁴⁰⁴ System`);
}

import { NextResponse } from 'next/server';
// The client you created from the Supabase SSR guide
import { createClient } from '@/integrations/supabase/server';

const ADMIN_EMAILS = ["404dsatracker@gmail.com"];

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/today';

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // If this is an admin email, redirect to admin dashboard instead
      const userEmail = data?.session?.user?.email?.toLowerCase();
      if (userEmail && ADMIN_EMAILS.includes(userEmail)) {
        return NextResponse.redirect(`${origin}/admin`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error("Auth callback error:", error.message, error);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth?mode=signin&error=auth_callback_failed`);
}

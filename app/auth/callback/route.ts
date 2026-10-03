import { NextResponse } from 'next/server';
// The client you created from the Supabase SSR guide
import { createClient } from '@/integrations/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/today';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error("Auth callback error:", error.message, error);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth?mode=signin&error=auth_callback_failed`);
}

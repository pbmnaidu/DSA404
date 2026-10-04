import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body?.userId;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // 1. Mark onboarding_completed in Supabase Auth user_metadata
    try {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          onboarding_completed: true,
        },
      });
    } catch (metaErr) {
      console.warn('[complete-onboarding] user_metadata update warning:', metaErr);
    }

    // 2. Mark in user_settings table
    try {
      const { data: existingSettings } = await supabaseAdmin
        .from('user_settings')
        .select('counts, start_date')
        .eq('user_id', userId)
        .maybeSingle();

      const existingCounts = (existingSettings?.counts as any) || {};
      const updatedCounts = { ...existingCounts, onboarding_completed: true };

      await supabaseAdmin.from('user_settings').upsert(
        {
          user_id: userId,
          counts: updatedCounts,
          start_date: existingSettings?.start_date || new Date().toISOString().slice(0, 10),
          last_active_date: new Date().toISOString().slice(0, 10),
        },
        { onConflict: 'user_id' }
      );
    } catch (settingsErr) {
      console.warn('[complete-onboarding] user_settings update warning:', settingsErr);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[complete-onboarding] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

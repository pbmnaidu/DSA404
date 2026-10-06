import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/integrations/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function DELETE(req: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Explicitly delete from all related tables to ensure no orphaned data remains
    // just in case ON DELETE CASCADE is not configured correctly on the foreign keys.
    const tables = ["user_settings", "study_days", "push_subscriptions", "user_feedback", "profiles"];
    
    for (const table of tables) {
      const { error } = await supabaseAdmin.from(table).delete().eq("user_id", user.id);
      if (error && table !== "profiles") {
        console.warn(`[api/auth/delete-account] Could not delete from ${table}:`, error);
      }
    }
    
    // Profiles table uses 'id' instead of 'user_id' as the primary key reference to auth.users
    const { error: profileError } = await supabaseAdmin.from("profiles").delete().eq("id", user.id);
    if (profileError) {
      console.error("[api/auth/delete-account] Failed to delete profile:", profileError);
    }

    // Then completely delete the auth user from Supabase.
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error("[api/auth/delete-account] Failed to delete user:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete account from backend." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Account deleted." });
  } catch (err: any) {
    console.error("[api/auth/delete-account] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

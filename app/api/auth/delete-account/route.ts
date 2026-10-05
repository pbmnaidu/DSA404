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

    // Explicitly delete the profile first. Because of ON DELETE CASCADE,
    // this will immediately wipe study_days, settings, push_subscriptions, etc.
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", user.id);

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

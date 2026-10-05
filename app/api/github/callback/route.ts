import { NextResponse } from "next/server";
import { getServerUser, encryptToken, createServerSupabase } from "@/lib/server/github";
import { cookies } from "next/headers";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    const cookieStore = await cookies();
    const storedState = cookieStore.get("github_oauth_state")?.value;

    if (!code || !state || state !== storedState) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?error=Invalid_OAuth_State`);
    }

    // Delete state cookie exactly once after validation
    cookieStore.delete("github_oauth_state");

    const user = await getServerUser();
    if (!user) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?error=Unauthorized`);
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?error=Missing_Github_Secrets`);
    }

    try {
        // Exchange code for access token
        const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/github/callback`,
            }),
        });

        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        if (!accessToken) {
            console.error("GitHub token exchange failed.");
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?error=Token_Exchange_Failed`);
        }

        // Fetch user info from GitHub to get account ID
        const userRes = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
        });
        const githubUser = await userRes.json();

        // Save connection in database
        const supabase = await createServerSupabase();
        
        const encryptedToken = encryptToken(accessToken);

        const { error } = await supabase.from("github_connections").upsert({
            user_id: user.id,
            github_account_id: githubUser.id.toString(),
            encrypted_access_token: encryptedToken,
            updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

        if (error) {
            console.error("Failed to save GitHub connection.");
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?error=Database_Error`);
        }

        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?github_connected=true`);
    } catch (error) {
        console.error("GitHub callback error:", error instanceof Error ? error.message : "Unknown error");
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?error=Internal_Error`);
    }
}

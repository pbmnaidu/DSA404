import { NextResponse } from "next/server";
import { getServerUser, createServerSupabase, decryptToken } from "@/lib/server/github";

export async function GET(req: Request) {
    const user = await getServerUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerSupabase();
    const { data, error } = await supabase
        .from("github_connections")
        .select("id, owner, repository, branch, folder_path, updated_at")
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) {
        console.error("Error fetching connection:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!data) {
        return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
        connected: true,
        owner: data.owner,
        repository: data.repository,
        branch: data.branch,
        folderPath: data.folder_path,
        notesFolderPath: user.user_metadata?.notes_folder_path || "notes",
        updatedAt: data.updated_at,
    });
}

export async function POST(req: Request) {
    const user = await getServerUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
        return NextResponse.json({ error: "Unsupported Media Type." }, { status: 415 });
    }

    let payload;
    try {
        payload = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }
    
    const { owner, repository, branch, folderPath, notesFolderPath } = payload;

    if (!owner || typeof owner !== "string" || owner.length > 100 || !repository || typeof repository !== "string" || repository.length > 100) {
        return NextResponse.json({ error: "Invalid owner or repository names." }, { status: 400 });
    }
    
    // Prevent traversal
    const hasTraversal = (path: string) => /(^|\/)\.\.(\/|$)/.test(path) || path.startsWith('/') || /[\0\r\n]/.test(path);
    if (hasTraversal(folderPath || "") || hasTraversal(branch || "")) {
        return NextResponse.json({ error: "Invalid path parameters." }, { status: 400 });
    }

    const supabase = await createServerSupabase();
    const { data: existing, error: fetchError } = await supabase
        .from("github_connections")
        .select("id, encrypted_access_token")
        .eq("user_id", user.id)
        .maybeSingle();

    if (fetchError || !existing) {
        return NextResponse.json({ error: "Not connected to GitHub" }, { status: 400 });
    }
    
    // Validate repository access
    try {
        const token = decryptToken(existing.encrypted_access_token);
        const res = await fetch(`https://api.github.com/repos/${owner}/${repository}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
        });

        if (!res.ok) {
            return NextResponse.json({ error: "Could not access repository or lack permissions." }, { status: 400 });
        }
    } catch (error) {
        return NextResponse.json({ error: "Error verifying repository access." }, { status: 500 });
    }

    const { error: updateError } = await supabase
        .from("github_connections")
        .update({
            owner,
            repository,
            branch: branch || "main",
            folder_path: folderPath || "solutions",
            updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

    // Store notesFolderPath in user metadata since we can't alter the table safely right now
    if (!updateError) {
        await supabase.auth.updateUser({
            data: { notes_folder_path: notesFolderPath || "notes" }
        });
    }

    if (updateError) {
        return NextResponse.json({ error: "Failed to update connection" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
    const user = await getServerUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerSupabase();
    
    // Fetch connection first to revoke token
    const { data: connection } = await supabase
        .from("github_connections")
        .select("encrypted_access_token")
        .eq("user_id", user.id)
        .maybeSingle();

    if (connection?.encrypted_access_token) {
        try {
            const token = decryptToken(connection.encrypted_access_token);
            const clientId = process.env.GITHUB_CLIENT_ID;
            const clientSecret = process.env.GITHUB_CLIENT_SECRET;
            
            if (clientId && clientSecret) {
                const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
                await fetch(`https://api.github.com/applications/${clientId}/token`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Basic ${credentials}`,
                        'Accept': 'application/vnd.github+json',
                        'X-GitHub-Api-Version': '2022-11-28',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ access_token: token })
                });
            }
        } catch (e) {
            console.error("Failed to revoke token on GitHub.");
        }
    }

    const { error } = await supabase
        .from("github_connections")
        .delete()
        .eq("user_id", user.id);

    if (error) {
        return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
    }
    
    // Clean up legacy user_metadata
    try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser?.user_metadata?.github_sync_config) {
            const newMeta = { ...currentUser.user_metadata };
            delete newMeta.github_sync_config;
            await supabase.auth.updateUser({ data: newMeta });
        }
    } catch (e) {
        // Non-fatal
    }

    // Clean up state cookie if any left over
    try {
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        cookieStore.delete("github_oauth_state");
    } catch(e) { }

    return NextResponse.json({ success: true });
}

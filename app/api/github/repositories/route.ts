import { NextResponse } from "next/server";
import { getServerUser, createServerSupabase, decryptToken } from "@/lib/server/github";

export async function GET(req: Request) {
    const user = await getServerUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerSupabase();
    const { data: connection, error } = await supabase
        .from("github_connections")
        .select("encrypted_access_token")
        .eq("user_id", user.id)
        .maybeSingle();

    if (error || !connection) {
        return NextResponse.json({ error: "Not connected to GitHub" }, { status: 400 });
    }

    try {
        const token = decryptToken(connection.encrypted_access_token);
        const res = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
        });

        if (!res.ok) {
            return NextResponse.json({ error: "Failed to fetch repositories from GitHub." }, { status: res.status });
        }

        const repos = await res.json();
        if (!Array.isArray(repos)) {
            return NextResponse.json([]);
        }

        const mappedRepos = repos.map((r: any) => ({
            fullName: r.full_name,
            owner: r.owner?.login || "",
            name: r.name,
            defaultBranch: r.default_branch || "main",
            isPrivate: Boolean(r.private),
        }));

        return NextResponse.json(mappedRepos);
    } catch (err) {
        console.error("Error fetching repositories from GitHub API.");
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

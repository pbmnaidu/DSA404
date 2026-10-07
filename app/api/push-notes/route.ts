import { NextResponse } from "next/server";
import { getServerUser, createServerSupabase, decryptToken } from "@/lib/server/github";
import { format } from "date-fns";

export async function POST(req: Request) {
    const user = await getServerUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let payload;
    try {
        payload = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const { notes, date } = payload;
    
    if (!notes || typeof notes !== "string" || notes.trim() === "") {
        return NextResponse.json({ error: "Notes are empty. Add something to push!" }, { status: 400 });
    }

    const supabase = await createServerSupabase();
    const { data: connection, error: fetchError } = await supabase
        .from("github_connections")
        .select("encrypted_access_token, owner, repository, branch")
        .eq("user_id", user.id)
        .maybeSingle();

    if (fetchError || !connection) {
        return NextResponse.json({ error: "GitHub not connected. Please connect from settings." }, { status: 400 });
    }

    const token = decryptToken(connection.encrypted_access_token);
    const { owner, repository, branch } = connection;
    const notes_folder_path = user.user_metadata?.notes_folder_path || "notes";
    
    // File format: Day_Date.md e.g. 07_Oct_2026.md
    const dateObj = new Date(date || new Date().toISOString());
    const formattedDate = format(dateObj, "dd_MMM_yyyy");
    const fileName = `Day_${formattedDate}.md`;
    
    const folderPath = notes_folder_path || "notes";
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;
    
    const fileContent = `# Today's Notes & Takeaways - ${format(dateObj, "MMM dd, yyyy")}\n\n${notes}`;
    const encodedContent = Buffer.from(fileContent).toString("base64");

    try {
        // 1. Get file SHA if it exists
        const fileRes = await fetch(`https://api.github.com/repos/${owner}/${repository}/contents/${filePath}?ref=${branch}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
        });

        let sha;
        if (fileRes.ok) {
            const fileData = await fileRes.json();
            sha = fileData.sha;
        }

        // 2. Commit the file
        const commitMessage = `docs: add notes for ${formattedDate}`;
        const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repository}/contents/${filePath}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
            body: JSON.stringify({
                message: commitMessage,
                content: encodedContent,
                branch: branch,
                ...(sha ? { sha } : {}),
            }),
        });

        if (!commitRes.ok) {
            const errorData = await commitRes.json();
            return NextResponse.json({ error: errorData.message || "Failed to push notes" }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: "Notes pushed successfully!" });

    } catch (err: any) {
        return NextResponse.json({ error: "Network error occurred." }, { status: 500 });
    }
}

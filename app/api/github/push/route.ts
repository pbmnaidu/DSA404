import { NextResponse } from "next/server";
import { getServerUser, createServerSupabase, decryptToken } from "@/lib/server/github";

const MAX_PAYLOAD_SIZE = 1024 * 1024; // 1MB limit for safety
const PUSH_RATE_LIMIT_MS = 2000;

const userPushTimestamps = new Map<string, number>();

/** Safe Base64 encoding supporting Unicode characters */
function utf8ToBase64(str: string): string {
    return Buffer.from(str, 'utf8').toString('base64');
}

/** Sanitize problem name to be safe as a filename across all OSes and Git */
function sanitizeFileName(name: string): string {
    return name
        .replace(/[\/\\?%*:|"<>#]/g, "-")
        .replace(/\s+/g, "_")
        .replace(/-+/g, "-")
        .replace(/^[-_]+|[-_]+$/g, "");
}

export async function POST(req: Request) {
    const user = await getServerUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > MAX_PAYLOAD_SIZE) {
        return NextResponse.json({ error: "Payload too large." }, { status: 413 });
    }

    const now = Date.now();
    const lastPush = userPushTimestamps.get(user.id) || 0;
    if (now - lastPush < PUSH_RATE_LIMIT_MS) {
        return NextResponse.json({ error: "Rate limit exceeded. Please wait a moment." }, { status: 429 });
    }
    userPushTimestamps.set(user.id, now);

    const supabase = await createServerSupabase();
    const { data: connection, error: connError } = await supabase
        .from("github_connections")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

    if (connError || !connection || !connection.owner || !connection.repository) {
        return NextResponse.json({ error: "GitHub not connected or configured properly." }, { status: 400 });
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

    const { problemName, code, keyPoints = "", link = "", date, topic, section, dayNumber, difficulty } = payload;
    
    if (!problemName || typeof problemName !== "string" || problemName.length > 200 || !code || typeof code !== "string" || code.length > MAX_PAYLOAD_SIZE) {
        return NextResponse.json({ error: "Invalid or missing required fields." }, { status: 400 });
    }

    const currentDate = date || new Date().toISOString().slice(0, 10);
    const cleanName = sanitizeFileName(problemName);
    const fileName = `${currentDate}_${cleanName}.txt`;
    
    const baseFolder = connection.folder_path?.trim().replace(/^\/+|\/+$/g, "") || "solutions";
    const topicFolder = topic ? sanitizeFileName(String(topic)) : "General";
    
    // Prevent directory traversal attacks and invalid chars
    const hasTraversal = (path: string) => /(^|\/)\.\.(\/|$)/.test(path) || path.startsWith('/') || /[\0\r\n]/.test(path);
    if (hasTraversal(baseFolder) || hasTraversal(topicFolder) || hasTraversal(fileName)) {
        return NextResponse.json({ error: "Invalid file path detected." }, { status: 400 });
    }

    const fullFilePath = `${baseFolder}/${topicFolder}/${fileName}`;
    const branch = connection.branch || "main";

    const problemLink = link.trim();
    const linkSection = problemLink
        ? `\n--------------------------------------------------------------------------------\nPROBLEM / SUBMISSION LINK:\n--------------------------------------------------------------------------------\n${problemLink}\n`
        : "";

    const topicLine = topic ? `TOPIC: ${topic}` : "";
    const sectionLine = section ? `SECTION: ${section}` : "";
    const dayLine = dayNumber ? `DAY: Day ${dayNumber}` : "";
    const difficultyLine = difficulty ? `DIFFICULTY: ${difficulty}` : "";

    const metaBlock = [topicLine, sectionLine, dayLine, difficultyLine].filter(Boolean).join("\n");

    const fileContent = `================================================================================
PROBLEM: ${problemName}
DATE: ${currentDate}
${metaBlock ? metaBlock + "\n" : ""}TRACKER: DSA404 Milestone Tracker
================================================================================
${linkSection}
--------------------------------------------------------------------------------
KEY PATTERNS & INSIGHTS:
--------------------------------------------------------------------------------
${keyPoints.trim() ? keyPoints.trim() : "No key patterns provided."}

--------------------------------------------------------------------------------
SOLUTION CODE:
--------------------------------------------------------------------------------
${code.trim()}

================================================================================
`;

    const encodedPath = fullFilePath.split("/").map((seg) => encodeURIComponent(seg)).join("/");
    
    try {
        const token = decryptToken(connection.encrypted_access_token);
        
        // 1. Fetch current SHA
        let currentSha: string | undefined;
        const checkRes = await fetch(`https://api.github.com/repos/${connection.owner}/${connection.repository}/contents/${encodedPath}?ref=${branch}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github+json",
                "Cache-Control": "no-cache",
                "X-GitHub-Api-Version": "2022-11-28",
            },
        });
        
        if (checkRes.ok) {
            const existingData = await checkRes.json();
            currentSha = existingData?.sha;
        }

        // 2. Commit file
        const topicTag = topic ? ` [${topic}]` : "";
        const commitMessage = currentSha
            ? `Update solution: ${problemName}${topicTag} (${currentDate}) - DSA404`
            : `Add solution: ${problemName}${topicTag} (${currentDate}) - DSA404`;

        const putRes = await fetch(`https://api.github.com/repos/${connection.owner}/${connection.repository}/contents/${encodedPath}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github+json",
                "Content-Type": "application/json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
            body: JSON.stringify({
                message: commitMessage,
                content: utf8ToBase64(fileContent),
                branch,
                ...(currentSha ? { sha: currentSha } : {}),
            }),
        });

        if (!putRes.ok) {
            return NextResponse.json({ error: "Failed to push file to GitHub." }, { status: putRes.status });
        }

        const putData = await putRes.json();
        const fileUrl = putData?.content?.html_url || `https://github.com/${connection.owner}/${connection.repository}/blob/${branch}/${fullFilePath}`;

        // Update last_used_at
        await supabase
            .from("github_connections")
            .update({ last_used_at: new Date().toISOString() })
            .eq("id", connection.id);

        return NextResponse.json({ success: true, fileUrl, filePath: fullFilePath });
    } catch (err) {
        console.error("GitHub push error:", err instanceof Error ? err.message : "Unknown error");
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

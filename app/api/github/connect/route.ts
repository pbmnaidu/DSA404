import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/server/github";
import crypto from "crypto";

export async function GET(req: Request) {
    const user = await getServerUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
        return NextResponse.json({ error: "GitHub OAuth App is not configured on the server." }, { status: 500 });
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/github/callback`;
    const state = crypto.randomBytes(16).toString("hex");
    
    const response = NextResponse.redirect(
        `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=repo`
    );
    response.cookies.set("github_oauth_state", state, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production", 
        path: "/", 
        maxAge: 600,
        sameSite: "lax"
    });
    return response;
}

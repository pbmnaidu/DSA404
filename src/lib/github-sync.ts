// src/lib/github-sync.ts

export interface GitHubSyncConfig {
    enabled: boolean;
    owner: string;
    repo: string;
    branch: string;
    folderPath?: string;
    notesFolderPath?: string;
    lastSyncedAt?: string;
    autoPromptDismissed?: boolean;
}

export interface PushSolutionParams {
    problemName: string;
    code: string;
    keyPoints?: string;
    link?: string;
    date?: string;
    topic?: string;
    section?: string;
    dayNumber?: number;
    difficulty?: string;
}

/** Loads sync config from server API */
export async function loadCloudGitHubSyncConfig(userId?: string | null): Promise<GitHubSyncConfig | null> {
    if (typeof window === "undefined" || !userId) return null;
    
    try {
        const res = await fetch("/api/github/connection");
        if (!res.ok) return null;
        
        const data = await res.json();
        if (data.connected) {
            return {
                enabled: true,
                owner: data.owner,
                repo: data.repository,
                branch: data.branch,
                folderPath: data.folderPath,
                notesFolderPath: data.notesFolderPath,
                lastSyncedAt: data.updatedAt,
                autoPromptDismissed: true
            };
        }
        return null;
    } catch (err) {
        console.error("Failed to load GitHub config", err);
        return null;
    }
}

/** Legacy Local Storage functions for compatibility checks and cleanup */
export function getLocalGitHubSyncConfig(userId?: string | null): GitHubSyncConfig | null {
    if (typeof window === "undefined") return null;
    const targetUid = userId || "default";
    try {
        const key = `dsa404_github_sync_config_${targetUid}`;
        const raw = localStorage.getItem(key);
        if (raw) {
            const parsed = JSON.parse(raw);
            // Don't return the token if it exists in local storage
            delete parsed.token;
            return parsed;
        }
    } catch {}
    return null;
}

export async function saveGitHubSyncConfig(userId: string | null | undefined, config: GitHubSyncConfig): Promise<void> {
    if (typeof window !== "undefined") {
        const targetUid = userId || "default";
        const key = `dsa404_github_sync_config_${targetUid}`;
        localStorage.setItem(key, JSON.stringify(config));
    }
}

export async function pushProblemSolutionToGitHub(
    config: GitHubSyncConfig,
    params: PushSolutionParams
): Promise<{ success: boolean; fileUrl?: string; filePath: string; error?: string }> {
    if (!config.enabled) {
        return { success: false, filePath: "", error: "GitHub auto-sync is disabled." };
    }

    try {
        const res = await fetch("/api/github/push", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(params),
        });

        const data = await res.json();
        
        if (!res.ok) {
            return { success: false, filePath: "", error: data.error || "Failed to push to GitHub" };
        }

        return {
            success: true,
            fileUrl: data.fileUrl,
            filePath: data.filePath,
        };
    } catch (err: any) {
        return { success: false, filePath: "", error: err.message || "Failed to communicate with server." };
    }
}

/** Cleans up old tokens from local storage and user metadata */
export async function cleanupOldGitHubTokens(userId: string) {
    if (typeof window === "undefined") return;
    
    // Remove the global default fallback that leaks between users
    localStorage.removeItem("dsa404_github_sync_config_default");
    
    const key = `dsa404_github_sync_config_${userId}`;
    const raw = localStorage.getItem(key);
    
    if (raw) {
        try {
            const config = JSON.parse(raw);
            if (config.token) {
                delete config.token;
                localStorage.setItem(key, JSON.stringify(config));
            }
        } catch {}
    }

    // Try to remove from Supabase user metadata
    try {
        const { createClient } = await import("@/integrations/supabase/client");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.user_metadata?.github_sync_config?.token) {
            const newConfig = { ...user.user_metadata.github_sync_config };
            delete newConfig.token;
            await supabase.auth.updateUser({ data: { github_sync_config: newConfig } });
        }
    } catch (err) {
        console.warn("Could not clean up user metadata token:", err);
    }
}

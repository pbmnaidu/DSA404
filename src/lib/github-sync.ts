// src/lib/github-sync.ts

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db as firestore } from "@/integrations/firebase/client";

export interface GitHubSyncConfig {
  enabled: boolean;
  token: string;
  owner: string;
  repo: string;
  branch: string;
  folderPath?: string; // e.g., "solutions" or "DSA"
  lastSyncedAt?: string;
  autoPromptDismissed?: boolean;
}

const STORAGE_KEY_PREFIX = "dsa404_github_sync_config_";

/** Safe Base64 encoding supporting Unicode characters */
function utf8ToBase64(str: string): string {
  try {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16)),
      ),
    );
  } catch {
    return btoa(unescape(encodeURIComponent(str)));
  }
}

/** Sanitize problem name to be safe as a filename across all OSes and Git */
export function sanitizeFileName(name: string): string {
  return name
    .replace(/[/\\?%*:|"<>#]/g, "-")
    .replace(/\s+/g, "_")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");
}

/** Reads config from localStorage */
export function getLocalGitHubSyncConfig(userId?: string | null): GitHubSyncConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const key = `${STORAGE_KEY_PREFIX}${userId || "default"}`;
    const raw = localStorage.getItem(key) || localStorage.getItem("dsa404_github_sync_config_default");
    if (!raw) return null;
    return JSON.parse(raw) as GitHubSyncConfig;
  } catch {
    return null;
  }
}

/** Saves config to both localStorage and Firestore (if userId provided) */
export async function saveGitHubSyncConfig(
  userId: string | null | undefined,
  config: GitHubSyncConfig,
): Promise<void> {
  if (typeof window !== "undefined") {
    const key = `${STORAGE_KEY_PREFIX}${userId || "default"}`;
    localStorage.setItem(key, JSON.stringify(config));
    localStorage.setItem("dsa404_github_sync_config_default", JSON.stringify(config));
  }

  if (userId && firestore) {
    try {
      const ref = doc(firestore, "users", userId, "private", "githubSync");
      await setDoc(ref, { ...config, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.warn("Could not persist GitHub sync config to cloud:", err);
    }
  }
}

/** Loads sync config from cloud Firestore, falling back to local storage */
export async function loadCloudGitHubSyncConfig(userId: string): Promise<GitHubSyncConfig | null> {
  const local = getLocalGitHubSyncConfig(userId);
  if (!userId || !firestore) return local;

  try {
    const ref = doc(firestore, "users", userId, "private", "githubSync");
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as GitHubSyncConfig;
      if (typeof window !== "undefined") {
        const key = `${STORAGE_KEY_PREFIX}${userId}`;
        localStorage.setItem(key, JSON.stringify(data));
      }
      return data;
    }
  } catch (err) {
    console.warn("Failed to load GitHub sync config from cloud:", err);
  }
  return local;
}

/** Fetch all repositories accessible to the personal access token */
export async function fetchUserRepositories(
  token: string,
): Promise<{ fullName: string; owner: string; name: string; defaultBranch: string; isPrivate: boolean }[]> {
  const cleanToken = token.trim();
  if (!cleanToken) throw new Error("GitHub token is required.");

  const res = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
    headers: {
      Authorization: `Bearer ${cleanToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Invalid GitHub token. Please verify token permissions.");
    }
    throw new Error(`GitHub API error (${res.status}): ${res.statusText}`);
  }

  const repos = await res.json();
  if (!Array.isArray(repos)) return [];

  return repos.map((r: any) => ({
    fullName: r.full_name,
    owner: r.owner?.login || "",
    name: r.name,
    defaultBranch: r.default_branch || "main",
    isPrivate: Boolean(r.private),
  }));
}

/** Validates that repository exists and token has write permissions */
export async function validateGitHubRepo(
  token: string,
  owner: string,
  repo: string,
): Promise<{ valid: boolean; defaultBranch: string; error?: string }> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        return { valid: false, defaultBranch: "main", error: `Repository "${owner}/${repo}" not found or token has no access.` };
      }
      if (res.status === 401) {
        return { valid: false, defaultBranch: "main", error: "Invalid GitHub personal access token." };
      }
      return { valid: false, defaultBranch: "main", error: `GitHub error: ${res.statusText}` };
    }

    const data = await res.json();
    return {
      valid: true,
      defaultBranch: data.default_branch || "main",
    };
  } catch (err: any) {
    return { valid: false, defaultBranch: "main", error: err.message || "Failed to validate repository." };
  }
}

/** Creates a new GitHub repository for the authenticated user */
export async function createGitHubRepository(
  token: string,
  repoName: string,
  isPrivate: boolean = false,
  description: string = "DSA Solutions and Key Patterns - DSA404",
): Promise<{ success: boolean; fullName?: string; owner?: string; name?: string; defaultBranch?: string; error?: string }> {
  const cleanToken = token.trim();
  const cleanName = repoName.trim().replace(/\s+/g, "-");
  if (!cleanToken) return { success: false, error: "GitHub token is required." };
  if (!cleanName) return { success: false, error: "Repository name is required." };

  try {
    const res = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cleanToken}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        name: cleanName,
        description,
        private: isPrivate,
        auto_init: true, // Creates initial commit with README.md so main branch exists immediately!
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err.message || (err.errors?.[0]?.message) || `Error ${res.status}: ${res.statusText}`;
      return { success: false, error: msg };
    }

    const data = await res.json();
    return {
      success: true,
      fullName: data.full_name,
      owner: data.owner?.login,
      name: data.name,
      defaultBranch: data.default_branch || "main",
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create repository on GitHub." };
  }
}

export interface PushSolutionParams {
  problemName: string;
  code: string;
  keyPoints?: string;
  link?: string;
  date?: string;
}

// Global deduplication & in-flight cache to prevent concurrent/rapid duplicate commits
const recentPushes = new Map<string, { time: number; res: { success: boolean; fileUrl?: string; filePath: string; error?: string } }>();
const inFlightPushes = new Map<string, Promise<{ success: boolean; fileUrl?: string; filePath: string; error?: string }>>();

/**
 * Pushes a problem solution .txt file into the selected GitHub repository.
 * File contains Problem Link, Key Patterns and Code sections.
 */
export async function pushProblemSolutionToGitHub(
  config: GitHubSyncConfig,
  params: PushSolutionParams,
): Promise<{ success: boolean; fileUrl?: string; filePath: string; error?: string }> {
  const { problemName, code, keyPoints = "", link = "", date } = params;

  if (!config.enabled) {
    return { success: false, filePath: "", error: "GitHub auto-sync is disabled in settings." };
  }
  if (!config.token || !config.owner || !config.repo) {
    return { success: false, filePath: "", error: "GitHub sync configuration is incomplete." };
  }

  const currentDate = date || new Date().toISOString().slice(0, 10);
  const cleanName = sanitizeFileName(problemName);
  const fileName = `${cleanName}.txt`;
  const folder = config.folderPath?.trim().replace(/^\/+|\/+$/g, "");
  const fullFilePath = folder ? `${folder}/${fileName}` : fileName;

  const cleanToken = config.token.trim();
  const owner = config.owner.trim();
  const repo = config.repo.trim();
  const branch = config.branch?.trim() || "main";

  // Deduplication / In-flight check
  const cacheKey = `${owner}/${repo}/${branch}/${fullFilePath}`;
  const cached = recentPushes.get(cacheKey);
  if (cached && Date.now() - cached.time < 6000) {
    return cached.res;
  }
  const inFlight = inFlightPushes.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const executePush = async (): Promise<{ success: boolean; fileUrl?: string; filePath: string; error?: string }> => {
    // Build the requested text file format containing Problem Link, Key Patterns, and Code
    const problemLink = link.trim();
    const linkSection = problemLink
      ? `
--------------------------------------------------------------------------------
PROBLEM / SUBMISSION LINK:
--------------------------------------------------------------------------------
${problemLink}
`
      : "";

    const fileContent = `================================================================================
PROBLEM: ${problemName}
DATE: ${currentDate}
TRACKER: DSA404 Milestone Tracker
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

    // Encode path segment by segment so slashes remain directory separators in GitHub API
    const encodedPath = fullFilePath
      .split("/")
      .map((seg) => encodeURIComponent(seg))
      .join("/");

    try {
      // Helper to fetch the latest SHA with cache-busting
      const fetchLatestSha = async (): Promise<string | undefined> => {
        try {
          const checkRes = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}?ref=${branch}&_cb=${Date.now()}`,
            {
              headers: {
                Authorization: `Bearer ${cleanToken}`,
                Accept: "application/vnd.github+json",
                "Cache-Control": "no-cache, no-store",
                "X-GitHub-Api-Version": "2022-11-28",
              },
            },
          );
          if (checkRes.ok) {
            const existingData = await checkRes.json();
            return existingData?.sha;
          }
        } catch { }
        return undefined;
      };

      // Helper to commit the file
      const commitFile = async (sha?: string) => {
        const commitMessage = sha
          ? `Update solution for ${problemName} - DSA404`
          : `Add solution for ${problemName} - DSA404`;

        return fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${cleanToken}`,
              Accept: "application/vnd.github+json",
              "Content-Type": "application/json",
              "X-GitHub-Api-Version": "2022-11-28",
            },
            body: JSON.stringify({
              message: commitMessage,
              content: utf8ToBase64(fileContent),
              branch,
              ...(sha ? { sha } : {}),
            }),
          },
        );
      };

      // 1. Fetch current SHA
      let currentSha = await fetchLatestSha();

      // 2. Commit file
      let putRes = await commitFile(currentSha);

      // 3. Resilient retry on 409 Conflict ("is at ... but expected ...")
      if (putRes.status === 409) {
        currentSha = await fetchLatestSha();
        putRes = await commitFile(currentSha);
      }

      if (!putRes.ok) {
        const errData = await putRes.json().catch(() => ({}));
        const errMsg = errData.message || `GitHub error ${putRes.status}: ${putRes.statusText}`;
        return { success: false, filePath: fullFilePath, error: errMsg };
      }

      const putData = await putRes.json();
      const fileUrl = putData?.content?.html_url || `https://github.com/${owner}/${repo}/blob/${branch}/${fullFilePath}`;

      const result = {
        success: true,
        fileUrl,
        filePath: fullFilePath,
      };
      recentPushes.set(cacheKey, { time: Date.now(), res: result });
      return result;
    } catch (err: any) {
      return {
        success: false,
        filePath: fullFilePath,
        error: err.message || "Failed to communicate with GitHub API.",
      };
    } finally {
      inFlightPushes.delete(cacheKey);
    }
  };

  const pushPromise = executePush();
  inFlightPushes.set(cacheKey, pushPromise);
  return pushPromise;
}

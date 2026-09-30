// src/lib/github-sync.ts

import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db as firestore } from "@/integrations/firebase/client";

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
const PEPPER = "_DSA404_SECURE_KEY_ENC_v1_";

/** Derive an AES-GCM key securely using PBKDF2 with user UID & internal pepper */
async function getDerivedAesKey(uid: string): Promise<CryptoKey | null> {
  if (typeof window === "undefined" || !window.crypto?.subtle) return null;
  try {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(`${uid}${PEPPER}`),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
    return await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: enc.encode(`salt_${uid.slice(0, 8)}`),
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  } catch {
    return null;
  }
}

/** Encrypts the GitHub token using AES-GCM before storing to Firestore */
export async function encryptSecret(secret: string, uid: string): Promise<string> {
  if (!secret || typeof window === "undefined" || !window.crypto?.subtle) return secret;
  try {
    const key = await getDerivedAesKey(uid);
    if (!key) return secret;
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const ciphertext = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      enc.encode(secret)
    );
    const ivStr = btoa(String.fromCharCode(...iv));
    const ctStr = btoa(String.fromCharCode(...new Uint8Array(ciphertext)));
    return `enc:v1:${ivStr}:${ctStr}`;
  } catch (err) {
    console.warn("Could not encrypt secret:", err);
    return secret;
  }
}

/** Decrypts the encrypted token using AES-GCM on any device signed in as the user */
export async function decryptSecret(encrypted: string, uid: string): Promise<string> {
  if (!encrypted) return "";
  if (!encrypted.startsWith("enc:v1:")) return encrypted; // legacy plaintext
  if (typeof window === "undefined" || !window.crypto?.subtle) return "";
  try {
    const parts = encrypted.split(":");
    const ivStr = parts[2];
    const ctStr = parts[3];
    if (!ivStr || !ctStr) return "";
    const iv = new Uint8Array(atob(ivStr).split("").map((c) => c.charCodeAt(0)));
    const ct = new Uint8Array(atob(ctStr).split("").map((c) => c.charCodeAt(0)));
    const key = await getDerivedAesKey(uid);
    if (!key) return "";
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ct
    );
    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.warn("Could not decrypt secret:", err);
    return "";
  }
}

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
    const targetUid = userId || auth?.currentUser?.uid || "default";
    const key = `${STORAGE_KEY_PREFIX}${targetUid}`;
    const raw = localStorage.getItem(key) || localStorage.getItem("dsa404_github_sync_config_default");
    if (!raw) return null;
    return JSON.parse(raw) as GitHubSyncConfig;
  } catch {
    return null;
  }
}

/** Saves config to both localStorage and Firestore (AES-GCM encrypted in private collection) */
export async function saveGitHubSyncConfig(
  userId: string | null | undefined,
  config: GitHubSyncConfig,
): Promise<void> {
  const targetUid = userId || auth?.currentUser?.uid || null;

  if (typeof window !== "undefined") {
    const key = `${STORAGE_KEY_PREFIX}${targetUid || "default"}`;
    localStorage.setItem(key, JSON.stringify(config));
    localStorage.setItem("dsa404_github_sync_config_default", JSON.stringify(config));
  }

  if (targetUid && firestore) {
    try {
      const ref = doc(firestore, "users", targetUid, "private", "githubSync");
      let encryptedToken = "";
      if (config.token) {
        encryptedToken = await encryptSecret(config.token, targetUid);
      }
      const maskedToken = config.token
        ? `${config.token.slice(0, 4)}••••••••${config.token.slice(-4)}`
        : "";

      await setDoc(
        ref,
        {
          enabled: config.enabled ?? true,
          owner: config.owner || "",
          repo: config.repo || "",
          branch: config.branch || "main",
          folderPath: config.folderPath ?? "solutions",
          lastSyncedAt: config.lastSyncedAt || new Date().toISOString(),
          autoPromptDismissed: config.autoPromptDismissed ?? false,
          encryptedToken,
          maskedToken,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn("Could not persist GitHub sync config to cloud:", err);
    }
  }
}

/** Loads sync config from cloud Firestore with automatic AES decryption, syncing to local storage */
export async function loadCloudGitHubSyncConfig(userId?: string | null): Promise<GitHubSyncConfig | null> {
  const targetUid = userId || auth?.currentUser?.uid || null;
  const local = getLocalGitHubSyncConfig(targetUid);
  if (!targetUid || !firestore) return local;

  try {
    const ref = doc(firestore, "users", targetUid, "private", "githubSync");
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as any;
      let token = "";

      if (data.encryptedToken) {
        token = await decryptSecret(data.encryptedToken, targetUid);
      } else if (data.token) {
        // Legacy unencrypted token fallback
        token = data.token;
      }

      // If token decrypt produced nothing, fallback to local token
      if (!token && local?.token) {
        token = local.token;
      }

      const cloudConfig: GitHubSyncConfig = {
        enabled: data.enabled ?? true,
        token: token || "",
        owner: data.owner || "",
        repo: data.repo || "",
        branch: data.branch || "main",
        folderPath: data.folderPath ?? "solutions",
        lastSyncedAt: data.lastSyncedAt,
        autoPromptDismissed: data.autoPromptDismissed ?? false,
      };

      if (typeof window !== "undefined" && token) {
        const key = `${STORAGE_KEY_PREFIX}${targetUid}`;
        localStorage.setItem(key, JSON.stringify(cloudConfig));
        localStorage.setItem("dsa404_github_sync_config_default", JSON.stringify(cloudConfig));
      }

      return cloudConfig;
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
    if (res.status === 403) {
      throw new Error(
        "GitHub token lacks required permissions. Please ensure your Personal Access Token has the 'repo' scope enabled (Settings → Developer settings → Personal access tokens)."
      );
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
      if (res.status === 403) {
        return {
          valid: false,
          defaultBranch: "main",
          error:
            "GitHub token lacks required permissions. Please ensure your Personal Access Token has the 'repo' scope enabled (Settings → Developer settings → Personal access tokens).",
        };
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
      if (res.status === 403) {
        return {
          success: false,
          error:
            "GitHub token lacks required permissions to create repositories. Please ensure your Personal Access Token has the 'repo' scope enabled (Settings → Developer settings → Personal access tokens).",
        };
      }
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
  /** Topic name from the Day (e.g. "Arrays", "Binary Search") */
  topic?: string;
  /** Section / chapter (e.g. "Step 3: Solve Problems on Arrays") */
  section?: string;
  /** Day number in the plan (e.g. 14) */
  dayNumber?: number;
  /** Problem difficulty */
  difficulty?: string;
}

// Global deduplication & in-flight cache to prevent concurrent/rapid duplicate commits
const recentPushes = new Map<string, { time: number; res: { success: boolean; fileUrl?: string; filePath: string; error?: string } }>();
const inFlightPushes = new Map<string, Promise<{ success: boolean; fileUrl?: string; filePath: string; error?: string }>>();

/**
 * Pushes a problem solution .txt file into the selected GitHub repository.
 * File path: {folderPath}/{Topic}/{YYYY-MM-DD}_{ProblemName}.txt
 * File header includes Topic, Section, Day #, Date, Difficulty.
 */
export async function pushProblemSolutionToGitHub(
  config: GitHubSyncConfig,
  params: PushSolutionParams,
): Promise<{ success: boolean; fileUrl?: string; filePath: string; error?: string }> {
  const { problemName, code, keyPoints = "", link = "", date, topic, section, dayNumber, difficulty } = params;

  if (!config.enabled) {
    return { success: false, filePath: "", error: "GitHub auto-sync is disabled in settings." };
  }
  if (!config.token || !config.owner || !config.repo) {
    return { success: false, filePath: "", error: "GitHub sync configuration is incomplete." };
  }

  const currentDate = date || new Date().toISOString().slice(0, 10);
  const cleanName = sanitizeFileName(problemName);
  // File name: YYYY-MM-DD_ProblemName.txt
  const fileName = `${currentDate}_${cleanName}.txt`;
  const baseFolder = config.folderPath?.trim().replace(/^\/+|\/+$/g, "") || "solutions";
  // Topic sub-folder: sanitize topic name, fallback to "General"
  const topicFolder = topic ? sanitizeFileName(topic) : "General";
  const fullFilePath = `${baseFolder}/${topicFolder}/${fileName}`;

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
    // Build the file content
    const problemLink = link.trim();
    const linkSection = problemLink
      ? `
--------------------------------------------------------------------------------
PROBLEM / SUBMISSION LINK:
--------------------------------------------------------------------------------
${problemLink}
`
      : "";

    const topicLine      = topic      ? `TOPIC:      ${topic}`      : "";
    const sectionLine    = section    ? `SECTION:    ${section}`    : "";
    const dayLine        = dayNumber  ? `DAY:        Day ${dayNumber}` : "";
    const difficultyLine = difficulty ? `DIFFICULTY: ${difficulty}` : "";

    const metaBlock = [topicLine, sectionLine, dayLine, difficultyLine]
      .filter(Boolean)
      .join("\n");

    const fileContent = `================================================================================
PROBLEM:    ${problemName}
DATE:       ${currentDate}
${metaBlock ? metaBlock + "\n" : ""}TRACKER:    DSA404 Milestone Tracker
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
        const topicTag = topic ? ` [${topic}]` : "";
        const commitMessage = sha
          ? `Update solution: ${problemName}${topicTag} (${currentDate}) - DSA404`
          : `Add solution: ${problemName}${topicTag} (${currentDate}) - DSA404`;

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
        if (putRes.status === 403) {
          return {
            success: false,
            filePath: fullFilePath,
            error:
              "GitHub token lacks required permissions to push files. Please ensure your Personal Access Token has the 'repo' scope enabled (Settings → Developer settings → Personal access tokens).",
          };
        }
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

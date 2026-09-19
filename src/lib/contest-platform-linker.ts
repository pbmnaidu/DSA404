// src/lib/contest-platform-linker.ts
import { PlatformId, NormalizedCodingProfile, RatingRecord } from "./coding-platforms/types";
import { Contest } from "./contests-service";
import { detectPlatformAndUsername } from "./coding-platforms/detector";
import { CodingProfiles } from "./db";

// ─── Platform Metadata ────────────────────────────────────────────────────────

export interface ContestPlatformMeta {
  id: PlatformId;
  contestPlatformName: "LeetCode" | "Codeforces" | "CodeChef" | "HackerRank" | "HackerEarth";
  label: string;
  icon: string;
  color: string;
  bgBadge: string;
  textBadge: string;
  borderBadge: string;
  profileBaseUrl: string;
  placeholder: string;
  exampleUrl: string;
}

export const SUPPORTED_CONTEST_PLATFORMS: ContestPlatformMeta[] = [
  {
    id: "leetcode",
    contestPlatformName: "LeetCode",
    label: "LeetCode",
    icon: "⚡",
    color: "#FFA116",
    bgBadge: "bg-yellow-500/10 dark:bg-yellow-500/15",
    textBadge: "text-yellow-700 dark:text-yellow-400",
    borderBadge: "border-yellow-500/30",
    profileBaseUrl: "https://leetcode.com/u/",
    placeholder: "your-leetcode-username or profile URL",
    exampleUrl: "https://leetcode.com/u/tourist",
  },
  {
    id: "codeforces",
    contestPlatformName: "Codeforces",
    label: "Codeforces",
    icon: "🔵",
    color: "#1F8ACB",
    bgBadge: "bg-blue-500/10 dark:bg-blue-500/15",
    textBadge: "text-blue-700 dark:text-blue-400",
    borderBadge: "border-blue-500/30",
    profileBaseUrl: "https://codeforces.com/profile/",
    placeholder: "your-codeforces-handle or profile URL",
    exampleUrl: "https://codeforces.com/profile/tourist",
  },
  {
    id: "codechef",
    contestPlatformName: "CodeChef",
    label: "CodeChef",
    icon: "👨‍🍳",
    color: "#5B4638",
    bgBadge: "bg-orange-500/10 dark:bg-orange-500/15",
    textBadge: "text-orange-700 dark:text-orange-400",
    borderBadge: "border-orange-500/30",
    profileBaseUrl: "https://www.codechef.com/users/",
    placeholder: "your-codechef-username or profile URL",
    exampleUrl: "https://www.codechef.com/users/tourist",
  },
  {
    id: "hackerrank",
    contestPlatformName: "HackerRank",
    label: "HackerRank",
    icon: "🏆",
    color: "#00EA64",
    bgBadge: "bg-emerald-500/10 dark:bg-emerald-500/15",
    textBadge: "text-emerald-700 dark:text-emerald-400",
    borderBadge: "border-emerald-500/30",
    profileBaseUrl: "https://www.hackerrank.com/profile/",
    placeholder: "your-hackerrank-username or profile URL",
    exampleUrl: "https://www.hackerrank.com/profile/tourist",
  },
  {
    id: "hackerearth",
    contestPlatformName: "HackerEarth",
    label: "HackerEarth",
    icon: "🌐",
    color: "#2C3454",
    bgBadge: "bg-cyan-500/10 dark:bg-cyan-500/15",
    textBadge: "text-cyan-700 dark:text-cyan-400",
    borderBadge: "border-cyan-500/30",
    profileBaseUrl: "https://www.hackerearth.com/@",
    placeholder: "your-hackerearth-username or profile URL",
    exampleUrl: "https://www.hackerearth.com/@tourist",
  },
];

export const CONTEST_PLATFORM_LOOKUP: Record<string, ContestPlatformMeta> = {};
for (const p of SUPPORTED_CONTEST_PLATFORMS) {
  CONTEST_PLATFORM_LOOKUP[p.contestPlatformName.toLowerCase()] = p;
  CONTEST_PLATFORM_LOOKUP[p.id.toLowerCase()] = p;
}

export function getPlatformMeta(contestPlatform: string): ContestPlatformMeta | undefined {
  if (!contestPlatform) return undefined;
  return CONTEST_PLATFORM_LOOKUP[contestPlatform.toLowerCase().trim()];
}

// ─── Username / URL Extraction ────────────────────────────────────────────────

export function extractHandleFromInput(platformId: PlatformId, input: string): string {
  if (!input) return "";
  let clean = input.trim().split("?")[0].replace(/\/+$/, "");

  // Check generic detector first
  const detection = detectPlatformAndUsername(clean);
  if (detection.username && detection.username !== clean && detection.confidence > 0.5) {
    return detection.username.replace(/^@/, "");
  }

  // Specific regexes
  if (platformId === "leetcode") {
    const m = clean.match(/leetcode\.com\/(?:u\/)?([a-zA-Z0-9_.-]+)/i);
    if (m && m[1]) return m[1];
  } else if (platformId === "codeforces") {
    const m = clean.match(/codeforces\.com\/profile\/([a-zA-Z0-9_.-]+)/i);
    if (m && m[1]) return m[1];
  } else if (platformId === "codechef") {
    const m = clean.match(/codechef\.com\/users\/([a-zA-Z0-9_.-]+)/i);
    if (m && m[1]) return m[1];
  } else if (platformId === "hackerrank") {
    const m = clean.match(/hackerrank\.com\/(?:profile\/)?([a-zA-Z0-9_.-]+)/i);
    if (m && m[1]) return m[1];
  } else if (platformId === "hackerearth") {
    const m = clean.match(/hackerearth\.com\/@?([a-zA-Z0-9_.-]+)/i);
    if (m && m[1]) return m[1];
  }

  // Fallback: strip leading @ and slashes
  const parts = clean.split("/").filter(Boolean);
  const cand = parts[parts.length - 1] || clean;
  return cand.replace(/^@/, "").trim();
}

export function getCanonicalProfileUrl(platformId: PlatformId, handle: string): string {
  const meta = SUPPORTED_CONTEST_PLATFORMS.find((p) => p.id === platformId);
  if (!meta || !handle) return "";
  const clean = handle.replace(/^@/, "");
  return `${meta.profileBaseUrl}${clean}`;
}

// ─── Contest Matching ─────────────────────────────────────────────────────────

export interface AttendanceMatchResult {
  attended: boolean;
  record?: RatingRecord;
  rank?: number;
  rating?: number;
  newRating?: number;
  contestTitle?: string;
  source: "ratingHistory" | "submissions" | "platformContestHistory" | "none";
}

function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Checks if a user attended a specific contest on LeetCode.
 */
function matchLeetCodeContest(
  contest: Contest,
  profile: NormalizedCodingProfile
): AttendanceMatchResult {
  const normTitle = normalizeTitle(contest.title);

  // 1. Check rating history (rated contests user attended)
  if (Array.isArray(profile.ratingHistory)) {
    for (const rec of profile.ratingHistory) {
      const recNorm = normalizeTitle(rec.contestName);

      // Exact or substring match (e.g. "weekly contest 435")
      if (
        recNorm === normTitle ||
        recNorm.includes(normTitle) ||
        normTitle.includes(recNorm)
      ) {
        return {
          attended: true,
          record: rec,
          rank: rec.rank,
          rating: rec.rating,
          contestTitle: rec.contestName,
          source: "ratingHistory",
        };
      }

      // Check contest number match: e.g. "Weekly Contest 435" vs "Weekly Contest 435"
      const contestNumMatch = contest.title.match(/(Weekly|Biweekly)\s*Contest\s*(\d+)/i);
      const recNumMatch = rec.contestName.match(/(Weekly|Biweekly)\s*Contest\s*(\d+)/i);
      if (
        contestNumMatch &&
        recNumMatch &&
        contestNumMatch[1].toLowerCase() === recNumMatch[1].toLowerCase() &&
        contestNumMatch[2] === recNumMatch[2]
      ) {
        return {
          attended: true,
          record: rec,
          rank: rec.rank,
          rating: rec.rating,
          contestTitle: rec.contestName,
          source: "ratingHistory",
        };
      }

      // Proximity check on timestamp (within ±3 hours of startMs)
      if (rec.timestamp && Math.abs(rec.timestamp - contest.startMs) <= 3 * 3600 * 1000) {
        return {
          attended: true,
          record: rec,
          rank: rec.rank,
          rating: rec.rating,
          contestTitle: rec.contestName,
          source: "ratingHistory",
        };
      }
    }
  }

  // 2. Check platform-specific contest history if available
  const rawHistory = profile.platformSpecificData?.contestHistory;
  if (Array.isArray(rawHistory)) {
    for (const c of rawHistory) {
      if (c.attended) {
        const cTitle = c.contest?.title || "";
        const cNorm = normalizeTitle(cTitle);
        if (cNorm && (cNorm.includes(normTitle) || normTitle.includes(cNorm))) {
          return {
            attended: true,
            rank: c.ranking,
            rating: Math.round(c.rating || 0),
            contestTitle: cTitle,
            source: "platformContestHistory",
          };
        }
      }
    }
  }

  // 3. Check recent submissions during contest window
  if (Array.isArray(profile.recentSubmissions)) {
    const contestStart = contest.startMs;
    const contestEnd = contest.startMs + contest.durationMs;
    for (const sub of profile.recentSubmissions) {
      if (sub.timestamp) {
        const subMs = new Date(sub.timestamp).getTime();
        if (subMs >= contestStart && subMs <= contestEnd) {
          return {
            attended: true,
            contestTitle: contest.title,
            source: "submissions",
          };
        }
      }
    }
  }

  return { attended: false, source: "none" };
}

/**
 * Checks if a user attended a specific contest on Codeforces.
 */
function matchCodeforcesContest(
  contest: Contest,
  profile: NormalizedCodingProfile
): AttendanceMatchResult {
  // Extract numeric contestId from contest.id (e.g. "cf-2044" -> "2044") or url
  const idMatch = contest.id.match(/\d+/) || contest.url.match(/contest\/(\d+)/);
  const targetCfId = idMatch ? idMatch[0] : "";
  const normTitle = normalizeTitle(contest.title);

  // 1. Check rating history
  if (Array.isArray(profile.ratingHistory)) {
    for (const rec of profile.ratingHistory) {
      // Check contestId match
      if (targetCfId && (rec.contestId === targetCfId || String(rec.contestId) === targetCfId)) {
        return {
          attended: true,
          record: rec,
          rank: rec.rank,
          rating: rec.rating,
          contestTitle: rec.contestName,
          source: "ratingHistory",
        };
      }

      // Check contestName match
      const recNorm = normalizeTitle(rec.contestName);
      if (
        recNorm &&
        (recNorm === normTitle || recNorm.includes(normTitle) || normTitle.includes(recNorm))
      ) {
        return {
          attended: true,
          record: rec,
          rank: rec.rank,
          rating: rec.rating,
          contestTitle: rec.contestName,
          source: "ratingHistory",
        };
      }

      // Check round number match (e.g. "Round 998")
      const roundMatch1 = contest.title.match(/Round\s*(\d+)/i);
      const roundMatch2 = rec.contestName.match(/Round\s*(\d+)/i);
      if (roundMatch1 && roundMatch2 && roundMatch1[1] === roundMatch2[1]) {
        // Also verify Div or Educational
        const isDivMatch =
          contest.title.toLowerCase().includes("div") === rec.contestName.toLowerCase().includes("div");
        if (isDivMatch) {
          return {
            attended: true,
            record: rec,
            rank: rec.rank,
            rating: rec.rating,
            contestTitle: rec.contestName,
            source: "ratingHistory",
          };
        }
      }

      // Check timestamp within ±12 hours
      if (rec.timestamp && Math.abs(rec.timestamp - contest.startMs) <= 12 * 3600 * 1000) {
        return {
          attended: true,
          record: rec,
          rank: rec.rank,
          rating: rec.rating,
          contestTitle: rec.contestName,
          source: "ratingHistory",
        };
      }
    }
  }

  // 2. Check submissions during contest or on targetCfId
  if (Array.isArray(profile.recentSubmissions)) {
    for (const sub of profile.recentSubmissions) {
      if (targetCfId && sub.problemId && sub.problemId.startsWith(`${targetCfId}-`)) {
        return {
          attended: true,
          contestTitle: contest.title,
          source: "submissions",
        };
      }
      if (targetCfId && sub.problemUrl && sub.problemUrl.includes(`/${targetCfId}/`)) {
        return {
          attended: true,
          contestTitle: contest.title,
          source: "submissions",
        };
      }
    }
  }

  return { attended: false, source: "none" };
}

/**
 * Checks if a user attended a specific contest on CodeChef.
 */
function matchCodeChefContest(
  contest: Contest,
  profile: NormalizedCodingProfile
): AttendanceMatchResult {
  // Extract CodeChef contest code (e.g. "START170", "COOK144")
  const codeMatch =
    contest.id.replace(/^cc-/, "").toUpperCase() ||
    (contest.url.match(/codechef\.com\/([a-zA-Z0-9_-]+)/i)?.[1] || "").toUpperCase();
  const normTitle = normalizeTitle(contest.title);

  if (Array.isArray(profile.ratingHistory)) {
    for (const rec of profile.ratingHistory) {
      const recCode = (rec.contestId || "").toUpperCase();
      const recName = rec.contestName || "";
      const recNorm = normalizeTitle(recName);

      // Match contest code
      if (codeMatch && recCode && (recCode === codeMatch || recCode.includes(codeMatch) || codeMatch.includes(recCode))) {
        return {
          attended: true,
          record: rec,
          rank: rec.rank,
          rating: rec.rating,
          contestTitle: rec.contestName,
          source: "ratingHistory",
        };
      }

      // Match Starters number (e.g. "Starters 170" vs "START170")
      const startersMatch1 = contest.title.match(/Starters\s*(\d+)/i) || codeMatch.match(/START(\d+)/i);
      const startersMatch2 = recName.match(/Starters\s*(\d+)/i) || recCode.match(/START(\d+)/i);
      if (startersMatch1 && startersMatch2 && startersMatch1[1] === startersMatch2[1]) {
        return {
          attended: true,
          record: rec,
          rank: rec.rank,
          rating: rec.rating,
          contestTitle: rec.contestName,
          source: "ratingHistory",
        };
      }

      // Title similarity
      if (recNorm && (recNorm.includes(normTitle) || normTitle.includes(recNorm))) {
        return {
          attended: true,
          record: rec,
          rank: rec.rank,
          rating: rec.rating,
          contestTitle: rec.contestName,
          source: "ratingHistory",
        };
      }

      // Proximity check on timestamp (within ±24 hours)
      if (rec.timestamp && Math.abs(rec.timestamp - contest.startMs) <= 24 * 3600 * 1000) {
        return {
          attended: true,
          record: rec,
          rank: rec.rank,
          rating: rec.rating,
          contestTitle: rec.contestName,
          source: "ratingHistory",
        };
      }
    }
  }

  return { attended: false, source: "none" };
}

/**
 * Generic matcher for HackerRank / HackerEarth.
 */
function matchGenericContest(
  contest: Contest,
  profile: NormalizedCodingProfile
): AttendanceMatchResult {
  const normTitle = normalizeTitle(contest.title);

  if (Array.isArray(profile.ratingHistory)) {
    for (const rec of profile.ratingHistory) {
      const recNorm = normalizeTitle(rec.contestName);
      if (recNorm && (recNorm.includes(normTitle) || normTitle.includes(recNorm))) {
        return {
          attended: true,
          record: rec,
          rank: rec.rank,
          rating: rec.rating,
          contestTitle: rec.contestName,
          source: "ratingHistory",
        };
      }
    }
  }

  return { attended: false, source: "none" };
}

/**
 * Universal contest attendance checker.
 */
export function checkContestAttendance(
  contest: Contest,
  profile: NormalizedCodingProfile | undefined | null
): AttendanceMatchResult {
  if (!profile || !profile.username) {
    return { attended: false, source: "none" };
  }

  const platformId = profile.platform;
  if (platformId === "leetcode") {
    return matchLeetCodeContest(contest, profile);
  } else if (platformId === "codeforces") {
    return matchCodeforcesContest(contest, profile);
  } else if (platformId === "codechef") {
    return matchCodeChefContest(contest, profile);
  } else {
    return matchGenericContest(contest, profile);
  }
}

// ─── High-Level Evaluator ─────────────────────────────────────────────────────

export type UserMark = "attended" | "missed_intentional" | null;

export interface ContestAttendanceEvaluation {
  isLinked: boolean;
  platformMeta?: ContestPlatformMeta;
  handle?: string;
  profileUrl?: string;
  mark: UserMark;
  statusText: string;
  source: "auto_platform" | "manual";
  verified: boolean;
  rank?: number;
  rating?: number;
  isPastContest: boolean;
  canUndo: boolean;
}

/**
 * Evaluates the final attendance state for a contest.
 * - If platform NOT linked: returns manualMark, source="manual", normal behavior.
 * - If platform IS linked:
 *   - If contest is ended:
 *     - If attended on platform -> mark="attended", source="auto_platform", verified=true.
 *     - If not attended on platform -> mark="missed_intentional", source="auto_platform", verified=true.
 *   - If manual override exists: respects user override while retaining linked info.
 */
export function evaluateContestAttendance(
  contest: Contest,
  codingProfiles: CodingProfiles | undefined | null,
  platformStats: Record<string, NormalizedCodingProfile> | undefined | null,
  manualMark: UserMark,
  nowMs: number = Date.now()
): ContestAttendanceEvaluation {
  const meta = getPlatformMeta(contest.platform);
  const isPastContest = nowMs >= contest.startMs + contest.durationMs;

  if (!meta) {
    return {
      isLinked: false,
      mark: manualMark,
      statusText: manualMark === "attended" ? "Attended" : manualMark === "missed_intentional" ? "Marked missed" : "Unmarked",
      source: "manual",
      verified: false,
      isPastContest,
      canUndo: manualMark !== null,
    };
  }

  const platformKey = meta.id as keyof CodingProfiles;
  const rawProfileInput = codingProfiles ? (codingProfiles[platformKey] as string | undefined) : undefined;
  const cleanHandle = rawProfileInput ? extractHandleFromInput(meta.id, rawProfileInput) : "";

  // CASE 1: Platform is NOT linked
  if (!cleanHandle) {
    return {
      isLinked: false,
      platformMeta: meta,
      mark: manualMark,
      statusText:
        manualMark === "attended"
          ? "Attended ✓"
          : manualMark === "missed_intentional"
          ? "Marked missed"
          : "Unmarked",
      source: "manual",
      verified: false,
      isPastContest,
      canUndo: manualMark !== null,
    };
  }

  // CASE 2: Platform IS linked
  const profileUrl = getCanonicalProfileUrl(meta.id, cleanHandle);
  const profileData = platformStats ? platformStats[meta.id] : undefined;

  // If user explicitly made a manual override
  // Note: if manualMark is set, we still check if platform detected attended
  const match = profileData ? checkContestAttendance(contest, profileData) : { attended: false, source: "none" as const };

  // Upcoming or Live contests
  if (!isPastContest) {
    return {
      isLinked: true,
      platformMeta: meta,
      handle: cleanHandle,
      profileUrl,
      mark: manualMark,
      statusText: `Linked (@${cleanHandle}) · Auto-tracks when contest ends`,
      source: manualMark ? "manual" : "auto_platform",
      verified: false,
      isPastContest,
      canUndo: manualMark !== null,
    };
  }

  // Past / Ended contest
  if (match.attended) {
    return {
      isLinked: true,
      platformMeta: meta,
      handle: cleanHandle,
      profileUrl,
      mark: manualMark === "missed_intentional" ? "missed_intentional" : "attended",
      statusText: match.rank
        ? `Attended (Verified via ${meta.label} · Rank #${match.rank}${match.rating ? ` · Rating ${match.rating}` : ""})`
        : `Attended (Verified via ${meta.label})`,
      source: manualMark === "missed_intentional" ? "manual" : "auto_platform",
      verified: true,
      rank: match.rank,
      rating: match.rating,
      isPastContest,
      canUndo: true,
    };
  } else {
    // Ended, account linked, but user did NOT attend
    return {
      isLinked: true,
      platformMeta: meta,
      handle: cleanHandle,
      profileUrl,
      mark: manualMark === "attended" ? "attended" : "missed_intentional",
      statusText:
        manualMark === "attended"
          ? `Attended (Manually overridden · ${meta.label} account linked)`
          : `Not Attended (Synced from ${meta.label})`,
      source: manualMark === "attended" ? "manual" : "auto_platform",
      verified: true,
      isPastContest,
      canUndo: true,
    };
  }
}

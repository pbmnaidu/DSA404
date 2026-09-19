import { getAdminDb } from "@/integrations/firebase/admin.server";

export interface Contest {
  id: string;
  platform: "Codeforces" | "CodeChef" | "LeetCode" | "HackerRank" | "HackerEarth";
  title: string;
  startMs: number;
  durationMs: number;
  url: string;
}

const CF_NON_CP_REGEX = /training|marathon|onsite|hiring\s*test|welcome\s*round/i;

export const CONTEST_RETENTION_MS = 7 * 24 * 60 * 60 * 1000; // 1 week retention window

interface ContestsMemoryCache {
  date: string; // YYYY-MM-DD
  fetchedAtMs: number;
  contests: Contest[];
}

let serverMemoryCache: ContestsMemoryCache | null = null;

// ─── Strict Contest Validation ────────────────────────────────────────────────
export function validateContest(c: any): Contest | null {
  if (!c || typeof c !== "object") return null;

  const validPlatforms = ["Codeforces", "CodeChef", "LeetCode", "HackerRank", "HackerEarth"];
  if (!c.platform || !validPlatforms.includes(c.platform)) return null;

  const title = typeof c.title === "string" ? c.title.trim() : "";
  if (!title) return null;

  const id = typeof c.id === "string" ? c.id.trim() : "";
  if (!id) return null;

  const startMs = Number(c.startMs);
  if (isNaN(startMs) || startMs <= 0) return null;

  const durationMs = Number(c.durationMs);
  if (isNaN(durationMs) || durationMs <= 0) return null;

  const url = typeof c.url === "string" ? c.url.trim() : "";
  if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) return null;

  return {
    id,
    platform: c.platform as Contest["platform"],
    title,
    startMs,
    durationMs,
    url,
  };
}

// ─── CodeChef Fetcher ──────────────────────────────────────────────────────────
export async function fetchCodeChef(): Promise<Contest[]> {
  try {
    const res = await fetch("https://www.codechef.com/api/list/contests/all", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(3500),
    });

    if (!res.ok) return [];
    const json = await res.json();
    const now = Date.now();
    const windowMs = CONTEST_RETENTION_MS;

    const present = json.present_contests ?? [];
    const future = json.future_contests ?? [];
    const past = json.past_contests ?? [];

    const rawList = [...present, ...future, ...past];

    return rawList
      .filter((c: any) => {
        const startIso = c.contest_start_date_iso || c.contest_start_date;
        if (!startIso) return false;
        const startMs = new Date(startIso).getTime();
        if (isNaN(startMs)) return false;
        return startMs > now || (now - startMs < windowMs);
      })
      .map((c: any) => {
        const startMs = new Date(c.contest_start_date_iso || c.contest_start_date).getTime();
        const endMs = new Date(c.contest_end_date_iso || c.contest_end_date).getTime();
        const fallbackDuration = parseInt(c.contest_duration || "120", 10) * 60 * 1000;
        const durationMs = (!isNaN(endMs) && endMs > startMs) ? (endMs - startMs) : fallbackDuration;

        return {
          id: `cc-${c.contest_code || c.contest_name}`,
          platform: "CodeChef" as const,
          title: c.contest_name,
          startMs,
          durationMs,
          url: `https://www.codechef.com/${c.contest_code}`,
        };
      });
  } catch (e: any) {
    if (e?.name === "TimeoutError" || e?.code === 23) {
      console.warn("CodeChef API timed out, skipping CodeChef contests fetch.");
    } else {
      console.warn("CodeChef fetch warning:", e?.message ?? e);
    }
    return [];
  }
}

// ─── Codeforces Fetcher ────────────────────────────────────────────────────────
export async function fetchCodeforces(): Promise<Contest[]> {
  try {
    const res = await fetch("https://codeforces.com/api/contest.list?gym=false", {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    if (json.status !== "OK") return [];

    const now = Date.now();
    const windowMs = CONTEST_RETENTION_MS;

    return (json.result as any[])
      .filter((c: any) => {
        const startMs = c.startTimeSeconds * 1000;
        const inWindow = c.phase !== "FINISHED" || (now - startMs < windowMs);
        const isCoreCp = !CF_NON_CP_REGEX.test(c.name || "");
        return inWindow && isCoreCp;
      })
      .map((c: any) => ({
        id: `cf-${c.id}`,
        platform: "Codeforces" as const,
        title: c.name,
        startMs: c.startTimeSeconds * 1000,
        durationMs: c.durationSeconds * 1000,
        url: `https://codeforces.com/contest/${c.id}`,
      }));
  } catch (e) {
    console.error("Codeforces fetch error:", e);
    return [];
  }
}

function generateCalculatedLeetCodeContests(): Contest[] {
  const contests: Contest[] = [];
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const ONE_WEEK = 7 * ONE_DAY;

  const refWeeklyNum = 435;
  const refWeeklyTime = 1738463400000;
  const weeksDiff = Math.floor((now - refWeeklyTime) / ONE_WEEK);

  for (let i = weeksDiff - 2; i <= weeksDiff + 2; i++) {
    const num = refWeeklyNum + i;
    const startMs = refWeeklyTime + i * ONE_WEEK;
    contests.push({
      id: `lc-weekly-contest-${num}`,
      platform: "LeetCode",
      title: `Weekly Contest ${num}`,
      startMs,
      durationMs: 5400 * 1000,
      url: `https://leetcode.com/contest/weekly-contest-${num}`,
    });
  }

  const refBiweeklyNum = 149;
  const refBiweeklyTime = 1738420200000;
  const biweeksDiff = Math.floor((now - refBiweeklyTime) / (2 * ONE_WEEK));

  for (let i = biweeksDiff - 2; i <= biweeksDiff + 2; i++) {
    const num = refBiweeklyNum + i;
    const startMs = refBiweeklyTime + i * (2 * ONE_WEEK);
    contests.push({
      id: `lc-biweekly-contest-${num}`,
      platform: "LeetCode",
      title: `Biweekly Contest ${num}`,
      startMs,
      durationMs: 5400 * 1000,
      url: `https://leetcode.com/contest/biweekly-contest-${num}`,
    });
  }

  return contests;
}

// ─── LeetCode Fetcher (Weekly / Biweekly) ──────────────────────────────────────
export async function fetchLeetCode(): Promise<Contest[]> {
  try {
    const res = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({
        query: `{
          topTwoContests {
            title
            titleSlug
            startTime
            duration
          }
          pastContests(pageNo: 1, numPerPage: 12) {
            data {
              title
              titleSlug
              startTime
              duration
            }
          }
        }`,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return generateCalculatedLeetCodeContests();
    const json = await res.json();
    const upcoming: any[] = json?.data?.topTwoContests ?? [];
    const past: any[] = json?.data?.pastContests?.data ?? [];
    const all = [...upcoming, ...past];

    if (!all.length) return generateCalculatedLeetCodeContests();

    return all.map((c: any) => ({
      id: `lc-${c.titleSlug}`,
      platform: "LeetCode" as const,
      title: c.title,
      startMs: c.startTime * 1000,
      durationMs: (c.duration || 5400) * 1000,
      url: `https://leetcode.com/contest/${c.titleSlug}`,
    }));
  } catch {
    return generateCalculatedLeetCodeContests();
  }
}

// ─── HackerRank Fetcher ────────────────────────────────────────────────────────
export async function fetchHackerRank(): Promise<Contest[]> {
  try {
    const res = await fetch("https://www.hackerrank.com/rest/contests/upcoming?offset=0&limit=20", {
      cache: "no-store",
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const models: any[] = json?.models ?? [];
    const now = Date.now();
    const windowMs = 14 * 24 * 60 * 60 * 1000;

    return models
      .filter((c: any) => {
        const startMs = (c.epoch_starttime || new Date(c.get_starttimeiso).getTime() / 1000) * 1000;
        return !isNaN(startMs) && (startMs > now || now - startMs < windowMs);
      })
      .map((c: any) => {
        const startMs = (c.epoch_starttime || new Date(c.get_starttimeiso).getTime() / 1000) * 1000;
        const endMs = (c.epoch_endtime || new Date(c.get_endtimeiso).getTime() / 1000) * 1000;
        const durationMs = (!isNaN(endMs) && endMs > startMs) ? (endMs - startMs) : 7200000;

        return {
          id: `hr-${c.slug || c.id}`,
          platform: "HackerRank" as const,
          title: c.name,
          startMs,
          durationMs,
          url: `https://www.hackerrank.com/contests/${c.slug}`,
        };
      });
  } catch (e) {
    console.error("HackerRank fetch error:", e);
    return [];
  }
}

// ─── HackerEarth Fetcher ───────────────────────────────────────────────────────
export async function fetchHackerEarth(): Promise<Contest[]> {
  try {
    const res = await fetch("https://www.hackerearth.com/chrome-extension/events/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const data: any[] = json?.response ?? (Array.isArray(json) ? json : []);
    const now = Date.now();
    const windowMs = 14 * 24 * 60 * 60 * 1000;

    return data
      .filter((c: any) => {
        const startMs = new Date(c.start_utc_tz || c.start_timestamp || c.start_time).getTime();
        return !isNaN(startMs) && (startMs > now || now - startMs < windowMs);
      })
      .map((c: any) => {
        const startMs = new Date(c.start_utc_tz || c.start_timestamp || c.start_time).getTime();
        const endMs = new Date(c.end_utc_tz || c.end_timestamp || c.end_time).getTime();
        const durationMs = (!isNaN(endMs) && endMs > startMs) ? (endMs - startMs) : 7200000;

        return {
          id: `he-${c.id || c.title}`,
          platform: "HackerEarth" as const,
          title: c.title || c.name,
          startMs,
          durationMs,
          url: c.url || c.challenge_type_url || `https://www.hackerearth.com/challenges/`,
        };
      });
  } catch (e) {
    console.error("HackerEarth fetch error:", e);
    return [];
  }
}

export function dedupContests(contests: Contest[]): Contest[] {
  const seen = new Set<string>();
  const titleSeen = new Set<string>();
  return contests.filter((c) => {
    const titleKey = `${c.platform}-${c.title.toLowerCase().trim()}`;
    if (seen.has(c.id) || titleSeen.has(titleKey)) return false;
    seen.add(c.id);
    titleSeen.add(titleKey);
    return true;
  });
}

// ─── Backend Sync & Firestore Persistence ──────────────────────────────────────
export async function syncContestsToFirestore(): Promise<Contest[]> {
  try {
    const results = await Promise.allSettled([
      fetchCodeChef(),
      fetchCodeforces(),
      fetchLeetCode(),
      fetchHackerRank(),
      fetchHackerEarth(),
    ]);

    const rawAll = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
    const validated = rawAll.map(validateContest).filter((c): c is Contest => c !== null);
    const sorted = dedupContests(validated).sort((a, b) => a.startMs - b.startMs);

    if (sorted.length > 0) {
      const db = getAdminDb();
      const batchSize = 400;
      const nowIso = new Date().toISOString();
      const todayIso = nowIso.slice(0, 10);

      // 1. Save fresh contests to DB
      for (let i = 0; i < sorted.length; i += batchSize) {
        const batch = db.batch();
        const chunk = sorted.slice(i, i + batchSize);
        for (const contest of chunk) {
          const docRef = db.collection("contests").doc(contest.id);
          batch.set(docRef, { ...contest, updatedAt: nowIso }, { merge: true });
        }
        await batch.commit();
      }

      // 2. Prune & remove contests older than 1 week from DB
      try {
        const allDocsSnap = await db.collection("contests").get();
        const nowMs = Date.now();
        const expiredDocRefs: FirebaseFirestore.DocumentReference[] = [];

        for (const doc of allDocsSnap.docs) {
          if (doc.id === "meta") continue;
          const data = doc.data();
          const startMs = Number(data.startMs) || 0;
          const durationMs = Number(data.durationMs) || 0;
          const endMs = startMs + durationMs;
          // If ended more than 1 week ago, remove from DB
          if (endMs > 0 && endMs < nowMs - CONTEST_RETENTION_MS) {
            expiredDocRefs.push(doc.ref);
          }
        }

        if (expiredDocRefs.length > 0) {
          console.info(`[contests-service] Removing ${expiredDocRefs.length} contests older than 1 week from DB...`);
          for (let i = 0; i < expiredDocRefs.length; i += batchSize) {
            const delBatch = db.batch();
            const chunk = expiredDocRefs.slice(i, i + batchSize);
            for (const ref of chunk) {
              delBatch.delete(ref);
            }
            await delBatch.commit().catch(() => {});
          }
        }
      } catch (pruneErr) {
        console.warn("[contests-service] Contests 1-week pruning warning:", pruneErr);
      }

      // 3. Record lastFetchedDate for starting day tracking
      await db.doc("contests/meta").set(
        {
          lastFetchedDate: todayIso,
          lastFetchedAt: nowIso,
          count: sorted.length,
        },
        { merge: true }
      ).catch(() => {});
    }

    return sorted;
  } catch (err) {
    console.error("[contests-service] Error syncing contests to Firestore:", err);
    return [];
  }
}

/**
 * Fetches contests only once at the starting day and stores them in DB.
 * If already fetched today, loads immediately from fast memory cache or DB.
 */
export async function syncContestsIfNeeded(force: boolean = false): Promise<Contest[]> {
  const todayIso = new Date().toISOString().slice(0, 10);
  const nowMs = Date.now();

  // 1. In-memory cache hit for today (0ms response time)
  if (!force && serverMemoryCache && serverMemoryCache.date === todayIso && serverMemoryCache.contests.length > 0) {
    return serverMemoryCache.contests;
  }

  try {
    const db = getAdminDb();
    const metaSnap = await db.doc("contests/meta").get();

    // 2. If DB was already synced on this starting day, return from Firestore
    if (!force && metaSnap.exists) {
      const meta = metaSnap.data();
      if (meta?.lastFetchedDate === todayIso && (meta?.count ?? 0) > 0) {
        const stored = await getContestsFromFirestore();
        if (stored.length > 0) {
          serverMemoryCache = {
            date: todayIso,
            fetchedAtMs: nowMs,
            contests: stored,
          };
          return stored;
        }
      }
    }
  } catch (err) {
    console.warn("[contests-service] Failed reading contests meta:", err);
  }

  // 3. First fetch of starting day or DB empty: fetch external platforms & save to DB
  console.info(`[contests-service] Fetching contests on starting day (${todayIso}) and saving to DB...`);
  const fresh = await syncContestsToFirestore();
  serverMemoryCache = {
    date: todayIso,
    fetchedAtMs: nowMs,
    contests: fresh,
  };
  return fresh;
}

export async function getContestsFromFirestore(): Promise<Contest[]> {
  try {
    const db = getAdminDb();
    const snap = await db.collection("contests").get();
    if (snap.empty) return [];

    const now = Date.now();
    const list: Contest[] = [];
    const expiredDocRefs: FirebaseFirestore.DocumentReference[] = [];

    for (const docSnap of snap.docs) {
      if (docSnap.id === "meta") continue;
      const data = docSnap.data();
      const valid = validateContest(data);
      if (valid) {
        const endMs = valid.startMs + valid.durationMs;
        if (endMs >= now - CONTEST_RETENTION_MS) {
          list.push(valid);
        } else {
          expiredDocRefs.push(docSnap.ref);
        }
      } else {
        expiredDocRefs.push(docSnap.ref);
      }
    }

    // Auto-remove any expired contests (> 1 week) in background
    if (expiredDocRefs.length > 0) {
      (async () => {
        try {
          const batch = db.batch();
          for (const ref of expiredDocRefs.slice(0, 400)) {
            batch.delete(ref);
          }
          await batch.commit();
        } catch { }
      })();
    }

    return dedupContests(list).sort((a, b) => a.startMs - b.startMs);
  } catch (err) {
    console.error("[contests-service] Firestore read error:", err);
    return [];
  }
}

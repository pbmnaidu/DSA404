"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "./useAuth";
import {
  evaluateContestAttendance,
  extractHandleFromInput,
  type ContestAttendanceEvaluation,
  type UserMark,
  SUPPORTED_CONTEST_PLATFORMS,
} from "@/lib/contest-platform-linker";
import {
  type CodingProfiles,
  loadUserProfile,
  saveUserProfile,
  savePlatformStats,
} from "@/lib/db";
import { type NormalizedCodingProfile, type PlatformId } from "@/lib/coding-platforms/types";
import { fetchBatchProfilesApi, fetchUserProfileApi } from "@/lib/coding-platforms/client-api";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface Contest {
  id: string; // unique: platform + start time / slug
  platform: "Codeforces" | "CodeChef" | "LeetCode" | "HackerRank" | "HackerEarth";
  title: string;
  startMs: number; // UTC epoch ms
  durationMs: number;
  url: string;
}

export type ContestStatus = "live" | "upcoming" | "missed";
export { type UserMark };

export interface ContestWithStatus extends Contest {
  status: ContestStatus;
  endMs: number;
  mark: UserMark;
  attendanceInfo?: ContestAttendanceEvaluation;
}

interface StoredData {
  marks: Record<string, UserMark>; // contestId -> mark
  lastFetchedMs: number;
  cachedContests: Contest[];
}

const LOCAL_STORAGE_KEY_CONTESTS = "ldt_cached_contests_v3";
const LOCAL_STORAGE_KEY_MARKS = "ldt_cached_marks_v3";

function dedup(contests: Contest[]): Contest[] {
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

async function fetchApiRoute(force: boolean = false): Promise<Contest[]> {
  try {
    const url = force ? "/api/contests?force=true" : "/api/contests";
    const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) return [];
    return await r.json();
  } catch {
    return [];
  }
}

async function fetchAllContests(force: boolean = false): Promise<Contest[]> {
  const apiContests = await fetchApiRoute(force);
  if (apiContests.length > 0) {
    return dedup(apiContests).sort((a, b) => a.startMs - b.startMs);
  }
  return [];
}

// ─── Status classifier ────────────────────────────────────────────────────────

export function getContestStatus(c: Contest, now: number): ContestStatus {
  const end = c.startMs + c.durationMs;
  if (now >= c.startMs && now < end) return "live";
  if (now < c.startMs) return "upcoming";
  return "missed";
}

// ─── Firestore & LocalStorage helpers ─────────────────────────────────────────

function storeDoc(uid: string) {
  return doc(db!, "users", uid, "contestMeta", "tracking");
}

async function loadStored(uid: string): Promise<StoredData | null> {
  try {
    const snap = await getDoc(storeDoc(uid));
    if (!snap.exists()) return null;
    return snap.data() as StoredData;
  } catch {
    return null;
  }
}

async function saveStored(uid: string, data: Partial<StoredData>) {
  try {
    await setDoc(storeDoc(uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  } catch {
    // non-critical
  }
}

function getLocalData(): {
  contests: Contest[];
  marks: Record<string, UserMark>;
  lastFetchedMs: number;
  lastFetchedDate: string;
} {
  if (typeof window === "undefined") return { contests: [], marks: {}, lastFetchedMs: 0, lastFetchedDate: "" };
  try {
    const rawC = localStorage.getItem(LOCAL_STORAGE_KEY_CONTESTS);
    const rawM = localStorage.getItem(LOCAL_STORAGE_KEY_MARKS);
    const contests = rawC ? JSON.parse(rawC) : [];
    const marks = rawM ? JSON.parse(rawM) : {};
    const lastFetchedMs = parseInt(localStorage.getItem(`${LOCAL_STORAGE_KEY_CONTESTS}_ts`) || "0", 10);
    const lastFetchedDate = localStorage.getItem(`${LOCAL_STORAGE_KEY_CONTESTS}_date`) || "";
    return { contests, marks, lastFetchedMs, lastFetchedDate };
  } catch {
    return { contests: [], marks: {}, lastFetchedMs: 0, lastFetchedDate: "" };
  }
}

function setLocalData(contests: Contest[], marks: Record<string, UserMark>, ts?: number) {
  if (typeof window === "undefined") return;
  try {
    if (contests.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY_CONTESTS, JSON.stringify(contests));
    }
    localStorage.setItem(LOCAL_STORAGE_KEY_MARKS, JSON.stringify(marks));
    const nowMs = ts || Date.now();
    localStorage.setItem(`${LOCAL_STORAGE_KEY_CONTESTS}_ts`, String(nowMs));
    localStorage.setItem(`${LOCAL_STORAGE_KEY_CONTESTS}_date`, new Date(nowMs).toISOString().slice(0, 10));
  } catch {
    // ignore quota issues
  }
}

function getLocalCodingProfiles(uid?: string): CodingProfiles {
  if (typeof window === "undefined") return {};
  try {
    const key = uid ? `dsa_coding_profiles_${uid}` : "dsa_coding_profiles_v2";
    const raw = localStorage.getItem(key) || localStorage.getItem("dsa_coding_profiles_v2");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setLocalCodingProfiles(profiles: CodingProfiles, uid?: string) {
  if (typeof window === "undefined") return;
  try {
    if (uid) localStorage.setItem(`dsa_coding_profiles_${uid}`, JSON.stringify(profiles));
    localStorage.setItem("dsa_coding_profiles_v2", JSON.stringify(profiles));
  } catch {}
}

function getLocalPlatformStats(uid?: string): Record<string, NormalizedCodingProfile> {
  if (typeof window === "undefined") return {};
  try {
    const key = `dsa_platform_stats_${uid || "default"}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setLocalPlatformStats(stats: Record<string, NormalizedCodingProfile>, uid?: string) {
  if (typeof window === "undefined") return;
  try {
    const key = `dsa_platform_stats_${uid || "default"}`;
    localStorage.setItem(key, JSON.stringify(stats));
  } catch {}
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useContests() {
  const { user } = useAuth();
  const [contests, setContests] = useState<Contest[]>([]);
  const [marks, setMarks] = useState<Record<string, UserMark>>({});
  const [codingProfiles, setCodingProfiles] = useState<CodingProfiles>(() => getLocalCodingProfiles(user?.uid));
  const [platformStats, setPlatformStats] = useState<Record<string, NormalizedCodingProfile>>(() => getLocalPlatformStats(user?.uid));
  const [isSyncingProfiles, setIsSyncingProfiles] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const fetchedRef = useRef(false);

  // Tick every second for live countdowns
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Listen to mark updates across components
  useEffect(() => {
    const handleMarkEvent = (e: CustomEvent<{ contestId: string; mark: UserMark }>) => {
      if (e.detail) {
        setMarks((prev) => ({ ...prev, [e.detail.contestId]: e.detail.mark }));
      }
    };
    window.addEventListener("ldt_contest_mark_updated" as any, handleMarkEvent as any);
    return () => {
      window.removeEventListener("ldt_contest_mark_updated" as any, handleMarkEvent as any);
    };
  }, []);

  // Listen to coding profiles updates across components
  useEffect(() => {
    const handleProfilesEvent = (e: CustomEvent<{ codingProfiles: CodingProfiles }>) => {
      if (e.detail?.codingProfiles) {
        const next = e.detail.codingProfiles;
        setCodingProfiles(next);
        setLocalCodingProfiles(next, user?.uid);

        // Instantly trigger background fetch for updated platforms
        const toSync: { platform: PlatformId; username: string }[] = [];
        for (const p of SUPPORTED_CONTEST_PLATFORMS) {
          const raw = next[p.id as keyof CodingProfiles];
          if (raw && typeof raw === "string" && raw.trim()) {
            const clean = extractHandleFromInput(p.id, raw);
            if (clean) toSync.push({ platform: p.id, username: clean });
          }
        }
        if (toSync.length > 0) {
          fetchBatchProfilesApi(toSync, false)
            .then((res) => {
              if (res && Object.keys(res).length > 0) {
                setPlatformStats((prev) => {
                  const merged = { ...prev, ...res };
                  setLocalPlatformStats(merged, user?.uid);
                  if (user?.uid) {
                    void savePlatformStats(user.uid, merged).catch(console.warn);
                  }
                  return merged;
                });
              }
            })
            .catch((err) => console.warn("[useContests] Profile batch sync warning:", err));
        }
      }
    };
    window.addEventListener("ldt_coding_profiles_updated" as any, handleProfilesEvent as any);
    return () => {
      window.removeEventListener("ldt_coding_profiles_updated" as any, handleProfilesEvent as any);
    };
  }, [user?.uid]);

  // Hydrate user-specific data from Firestore whenever authenticated user is available
  const userHydratedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    if (userHydratedRef.current === user.uid) return;
    userHydratedRef.current = user.uid;

    (async () => {
      try {
        const [stored, profileDoc] = await Promise.all([
          loadStored(user.uid),
          loadUserProfile(user.uid),
        ]);

        if (stored?.marks) {
          setMarks((prev) => ({ ...prev, ...stored.marks }));
        }

        if (profileDoc?.codingProfiles && Object.keys(profileDoc.codingProfiles).length > 0) {
          setCodingProfiles((prev) => {
            const merged = { ...prev, ...profileDoc.codingProfiles };
            setLocalCodingProfiles(merged, user.uid);
            return merged;
          });

          // Instantly sync participation history & ratings for all linked platforms from DB
          const profilesToSync: { platform: PlatformId; username: string }[] = [];
          for (const p of SUPPORTED_CONTEST_PLATFORMS) {
            const raw = profileDoc.codingProfiles[p.id as keyof CodingProfiles];
            if (raw && typeof raw === "string" && raw.trim()) {
              const clean = extractHandleFromInput(p.id, raw);
              if (clean) profilesToSync.push({ platform: p.id, username: clean });
            }
          }

          if (profilesToSync.length > 0) {
            setIsSyncingProfiles(true);
            fetchBatchProfilesApi(profilesToSync, false)
              .then((res) => {
                if (res && Object.keys(res).length > 0) {
                  setPlatformStats((prev) => {
                    const next = { ...prev, ...res };
                    setLocalPlatformStats(next, user.uid);
                    void savePlatformStats(user.uid, next).catch(console.warn);
                    return next;
                  });
                }
              })
              .catch((err) => console.warn("[useContests] Profile batch sync warning:", err))
              .finally(() => setIsSyncingProfiles(false));
          }
        }

        if (profileDoc?.platformStats && Object.keys(profileDoc.platformStats).length > 0) {
          setPlatformStats((prev) => {
            const next = { ...prev, ...profileDoc.platformStats };
            setLocalPlatformStats(next, user.uid);
            return next;
          });
        }
      } catch (err) {
        console.warn("[useContests] Error hydrating user profile contest data:", err);
      }
    })();
  }, [user?.uid]);

  // Load contests from local storage immediately (zero-lag), then refresh asynchronously
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    // Fast initial load from localStorage
    const local = getLocalData();
    if (local.contests.length > 0) {
      setContests(local.contests);
      setMarks(local.marks);
      setLoading(false);
    }

    const localProfiles = getLocalCodingProfiles(user?.uid);
    if (Object.keys(localProfiles).length > 0) {
      setCodingProfiles(localProfiles);
    }

    const localStats = getLocalPlatformStats(user?.uid);
    if (Object.keys(localStats).length > 0) {
      setPlatformStats(localStats);
    }

    (async () => {
      setError(null);

      try {
        let marksData = local.marks;
        let stored: StoredData | null = null;

        if (user) {
          stored = await loadStored(user.uid);
          if (stored?.marks) {
            marksData = { ...marksData, ...stored.marks };
          }
        }

        setMarks(marksData);

        const nowMs = Date.now();
        const todayIso = new Date(nowMs).toISOString().slice(0, 10);
        const cachedList = stored?.cachedContests?.length ? stored.cachedContests : local.contests;

        if (cachedList.length > 0) {
          setContests(cachedList);
          setLoading(false);
        }

        // Only fetch fresh contests if not yet fetched for today's starting day (or if cache is empty)
        const alreadyFetchedToday = local.lastFetchedDate === todayIso && local.contests.length > 0;
        if (!alreadyFetchedToday || cachedList.length === 0) {
          const fresh = await fetchAllContests(false);
          if (fresh.length > 0) {
            setContests(fresh);
            setLocalData(fresh, marksData, nowMs);
            if (user) {
              await saveStored(user.uid, {
                cachedContests: fresh,
                lastFetchedMs: nowMs,
                marks: marksData,
              });
            }
          }
        }
        setLoading(false);
      } catch (e) {
        if (!contests.length && !local.contests.length) {
          setError("Could not load contests. Check your connection.");
        }
        setLoading(false);
      }
    })();
  }, []);

  // Manual refetch function for contests (forces fresh sync)
  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fresh = await fetchAllContests(true);
      if (fresh.length > 0) {
        setContests(fresh);
        setLocalData(fresh, marks, Date.now());
      }
    } catch {
      setError("Failed to refresh contests.");
    } finally {
      setLoading(false);
    }
  }, [marks]);

  // Mark a contest as attended or missed-intentional (manual override)
  const markContest = useCallback(
    async (contestId: string, mark: UserMark) => {
      setMarks((prev) => {
        const next = { ...prev, [contestId]: mark };

        // Defer side effects to next tick so they don't run during React's render phase
        setTimeout(() => {
          setLocalData(contests, next);
          if (user) {
            saveStored(user.uid, { marks: next });
          }
          // Broadcast custom event so all active components sync instantly
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("ldt_contest_mark_updated", {
                detail: { contestId, mark },
              })
            );
          }
        }, 0);

        return next;
      });
    },
    [user, contests]
  );

  // Update or connect a coding platform handle/URL
  const updateCodingProfile = useCallback(
    async (platform: PlatformId, input: string) => {
      const cleanHandle = extractHandleFromInput(platform, input);
      const nextProfiles: CodingProfiles = {
        ...codingProfiles,
        [platform]: cleanHandle || undefined,
      };

      setCodingProfiles(nextProfiles);
      setLocalCodingProfiles(nextProfiles, user?.uid);

      if (user?.uid) {
        await saveUserProfile(user.uid, { codingProfiles: nextProfiles });
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("ldt_coding_profiles_updated", {
            detail: { codingProfiles: nextProfiles },
          })
        );
      }

      // Immediately fetch fresh profile & contest history
      if (cleanHandle) {
        setIsSyncingProfiles(true);
        try {
          const freshData = await fetchUserProfileApi(platform, cleanHandle, true);
          setPlatformStats((prev) => {
            const next = { ...prev, [platform]: freshData };
            setLocalPlatformStats(next, user?.uid);
            if (user?.uid) {
              void savePlatformStats(user.uid, next).catch(console.warn);
            }
            return next;
          });
        } catch (err) {
          console.warn(`[useContests] Error fetching ${platform} profile:`, err);
        } finally {
          setIsSyncingProfiles(false);
        }
      } else {
        // If unlinked, remove from stats
        setPlatformStats((prev) => {
          const next = { ...prev };
          delete next[platform];
          setLocalPlatformStats(next, user?.uid);
          if (user?.uid) {
            void savePlatformStats(user.uid, next).catch(console.warn);
          }
          return next;
        });
      }
    },
    [codingProfiles, user]
  );

  // Remove / unlink a coding platform profile
  const removeCodingProfile = useCallback(
    async (platform: PlatformId) => {
      await updateCodingProfile(platform, "");
    },
    [updateCodingProfile]
  );

  // Force sync all connected platforms
  const syncAllProfiles = useCallback(async () => {
    const profilesToSync: { platform: PlatformId; username: string }[] = [];
    for (const p of SUPPORTED_CONTEST_PLATFORMS) {
      const raw = codingProfiles[p.id as keyof CodingProfiles];
      if (raw && typeof raw === "string" && raw.trim()) {
        const clean = extractHandleFromInput(p.id, raw);
        if (clean) profilesToSync.push({ platform: p.id, username: clean });
      }
    }

    if (profilesToSync.length === 0) return;

    setIsSyncingProfiles(true);
    try {
      const res = await fetchBatchProfilesApi(profilesToSync, true);
      if (res && Object.keys(res).length > 0) {
        setPlatformStats((prev) => {
          const next = { ...prev, ...res };
          setLocalPlatformStats(next, user?.uid);
          if (user?.uid) {
            void savePlatformStats(user.uid, next).catch(console.warn);
          }
          return next;
        });
      }
    } catch (err) {
      console.warn("[useContests] Force sync error:", err);
    } finally {
      setIsSyncingProfiles(false);
    }
  }, [codingProfiles, user]);

  // Derive final list with evaluated statuses and auto attendance
  const enriched: ContestWithStatus[] = useMemo(() => {
    return contests.map((c) => {
      const status = getContestStatus(c, now);
      const manualMark = marks[c.id] ?? null;
      const attendanceInfo = evaluateContestAttendance(c, codingProfiles, platformStats, manualMark, now);

      return {
        ...c,
        endMs: c.startMs + c.durationMs,
        status,
        mark: attendanceInfo.mark,
        attendanceInfo,
      };
    });
  }, [contests, now, marks, codingProfiles, platformStats]);

  return {
    contests: enriched,
    loading,
    error,
    now,
    markContest,
    refetch,
    codingProfiles,
    platformStats,
    updateCodingProfile,
    removeCodingProfile,
    syncAllProfiles,
    isSyncingProfiles,
  };
}

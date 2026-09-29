"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ConnectedPlatform, NormalizedCodingProfile, PlatformId } from "@/lib/coding-platforms/types";
import { fetchBatchProfilesApi, fetchUserProfileApi } from "@/lib/coding-platforms/client-api";
import { analyzeCodingProfiles } from "@/lib/coding-platforms/analytics";
import { PlatformProfileCard, resolvePlatformUrl } from "./PlatformProfileCard";
import { PlatformConnectCard } from "./PlatformConnectCard";
import { ContestHistoryChart } from "./ContestHistoryChart";
import { savePlatformStats, saveUserProfile } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Globe,
  RefreshCw,
  Trophy,
  CheckCircle2,
  ExternalLink,
  ArrowDown,
  Layers,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PLATFORM_META: Record<string, { name: string; color: string }> = {
  leetcode: { name: "LeetCode", color: "#FFA116" },
  codeforces: { name: "Codeforces", color: "#1F8ACB" },
  codechef: { name: "CodeChef", color: "#8B5CF6" },
  atcoder: { name: "AtCoder", color: "#10B981" },
  hackerrank: { name: "HackerRank", color: "#22C55E" },
  gfg: { name: "GeeksforGeeks", color: "#22C55E" },
  hackerearth: { name: "HackerEarth", color: "#3B82F6" },
  code360: { name: "Code360", color: "#F97316" },
  interviewbit: { name: "InterviewBit", color: "#06B6D4" },
  cses: { name: "CSES", color: "#6366F1" },
  spoj: { name: "SPOJ", color: "#3B82F6" },
  topcoder: { name: "Topcoder", color: "#00A3E0" },
  kattis: { name: "Kattis", color: "#4F46E5" },
  codewars: { name: "Codewars", color: "#EF4444" },
  exercism: { name: "Exercism", color: "#0EA5E9" },
  kaggle: { name: "Kaggle", color: "#06B6D4" },
  github: { name: "GitHub", color: "#94A3B8" },
  linkedin: { name: "LinkedIn", color: "#0A66C2" },
};

interface UnifiedProfileDashboardProps {
  initialProfiles?: Record<string, string>; // platformId -> username
  initialStats?: Record<string, NormalizedCodingProfile | any>;
  userId?: string;
  onSaveProfiles?: (profiles: Record<string, string>) => void;
  readOnly?: boolean;
}

import { isGuestMode } from "@/lib/guest-data";

export function UnifiedProfileDashboard({
  initialProfiles = {},
  initialStats = {},
  userId,
  onSaveProfiles,
  readOnly = false,
}: UnifiedProfileDashboardProps) {
  const [connectedProfiles, setConnectedProfiles] = useState<Record<string, string>>(initialProfiles);
  const attemptedRef = React.useRef<Set<string>>(new Set());

  const getLocalCachedStats = (): Record<string, NormalizedCodingProfile> => {
    if (initialStats && Object.keys(initialStats).length > 0) return initialStats;
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(`dsa_platform_stats_${userId || "default"}`);
        return raw ? JSON.parse(raw) : {};
      } catch {
        return {};
      }
    }
    return {};
  };

  const [fetchedData, setFetchedData] = useState<Record<string, NormalizedCodingProfile>>(getLocalCachedStats);
  const [loading, setLoading] = useState(false);
  const [refreshingPlatform, setRefreshingPlatform] = useState<string | null>(null);
  const [showConnectedModal, setShowConnectedModal] = useState(false);

  useEffect(() => {
    setConnectedProfiles(initialProfiles);
  }, [JSON.stringify(initialProfiles)]);

  useEffect(() => {
    if (initialStats && Object.keys(initialStats).length > 0) {
      setFetchedData((prev) => ({ ...initialStats, ...prev }));
      Object.keys(initialStats).forEach((p) => {
        if (connectedProfiles[p]) {
          attemptedRef.current.add(`${p}:${connectedProfiles[p]}`);
        }
      });
    }
  }, [initialStats]);

  // Fetch initial profile stats only once per unique platform+username pair
  useEffect(() => {
    if (isGuestMode()) {
      setLoading(false);
      return;
    }

    const list = Object.entries(connectedProfiles)
      .filter(([k, u]) => k !== "customLinks" && k !== "platformStats" && k !== "github" && typeof u === "string" && Boolean(u.trim()))
      .map(([p, u]) => ({ platform: p as PlatformId, username: u as string }));

    if (list.length === 0) {
      setLoading(false);
      return;
    }

    // Filter to only items that haven't been successfully fetched yet or are missing calendar data
    const missing = list.filter((item) => {
      const key = `${item.platform}:${item.username}`;
      if (attemptedRef.current.has(key)) return false;
      const existing = fetchedData[item.platform];
      if (
        existing &&
        existing.status === "SUCCESS" &&
        (existing.submissionCalendar !== undefined || item.platform === "linkedin")
      ) {
        return false;
      }
      return true;
    });

    if (missing.length === 0) {
      setLoading(false);
      return;
    }

    // Mark as attempted to avoid duplicate parallel requests
    missing.forEach((item) => attemptedRef.current.add(`${item.platform}:${item.username}`));

    setLoading(true);
    fetchBatchProfilesApi(missing, true)
      .then((res) => {
        setFetchedData((prev) => {
          const next = { ...prev, ...res };
          if (typeof window !== "undefined") {
            localStorage.setItem(`dsa_platform_stats_${userId || "default"}`, JSON.stringify(next));
          }
          if (userId) {
            void savePlatformStats(userId, next).catch(console.warn);
          }
          return next;
        });
      })
      .catch((err) => {
        console.warn("Failed to sync connected profiles:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [JSON.stringify(connectedProfiles), userId]);

  const handleConnect = async (platform: PlatformId, username: string) => {
    const next = { ...connectedProfiles, [platform]: username };
    setConnectedProfiles(next);

    // Sync to contest tracking local cache & broadcast update
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("dsa_coding_profiles_v2", JSON.stringify(next));
        if (userId) {
          localStorage.setItem(`dsa_coding_profiles_${userId}`, JSON.stringify(next));
        }
        window.dispatchEvent(
          new CustomEvent("ldt_coding_profiles_updated", {
            detail: { codingProfiles: next },
          })
        );
      } catch {}
    }

    if (onSaveProfiles) onSaveProfiles(next);

    // Save coding profile directly to user doc in DB
    if (userId) {
      void saveUserProfile(userId, { codingProfiles: next }).catch(console.warn);
    }

    setRefreshingPlatform(platform);
    try {
      const res = await fetchUserProfileApi(platform, username, true);
      setFetchedData((prev) => {
        const updated = { ...prev, [platform]: res };
        if (typeof window !== "undefined") {
          localStorage.setItem(`dsa_platform_stats_${userId || "default"}`, JSON.stringify(updated));
        }
        if (userId) {
          void savePlatformStats(userId, updated).catch(console.warn);
        }
        return updated;
      });
    } catch (err: any) {
      toast.error(`Could not sync ${platform}`, { description: err.message });
    } finally {
      setRefreshingPlatform(null);
    }
  };

  const handleRefreshSingle = async (platform: PlatformId) => {
    const username = connectedProfiles[platform];
    if (!username) return;

    setRefreshingPlatform(platform);
    try {
      const res = await fetchUserProfileApi(platform, username, true);
      setFetchedData((prev) => {
        const updated = { ...prev, [platform]: res };
        if (typeof window !== "undefined") {
          localStorage.setItem(`dsa_platform_stats_${userId || "default"}`, JSON.stringify(updated));
        }
        if (userId) {
          void savePlatformStats(userId, updated).catch(console.warn);
        }
        return updated;
      });
      toast.success(`Updated ${platform.toUpperCase()} profile stats!`);
    } catch (err: any) {
      toast.error(`Refresh failed for ${platform}`, { description: err.message });
    } finally {
      setRefreshingPlatform(null);
    }
  };

  const handleRefreshAll = async () => {
    const list = Object.entries(connectedProfiles)
      .filter(([k, u]) => k !== "customLinks" && k !== "platformStats" && k !== "github" && typeof u === "string" && Boolean(u.trim()))
      .map(([p, u]) => ({ platform: p as PlatformId, username: u as string }));

    if (list.length === 0) return;
    setLoading(true);
    try {
      const res = await fetchBatchProfilesApi(list, true);
      setFetchedData((prev) => {
        const merged = { ...prev, ...res };
        if (typeof window !== "undefined") {
          localStorage.setItem(`dsa_platform_stats_${userId || "default"}`, JSON.stringify(merged));
        }
        if (userId) {
          void savePlatformStats(userId, merged).catch(console.warn);
        }
        return merged;
      });
      toast.success("All connected platform stats updated and saved!");
    } catch (err: any) {
      toast.error("Refresh failed", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Only calculate analytics and charts for platforms that are ACTUALLY linked in connectedProfiles (excluding github)
  const activeFetchedData = useMemo(() => {
    const active: Record<string, NormalizedCodingProfile> = {};
    for (const [k, u] of Object.entries(connectedProfiles)) {
      if (k !== "customLinks" && k !== "platformStats" && k !== "github" && typeof u === "string" && Boolean(u.trim())) {
        if (fetchedData[k]) {
          active[k] = fetchedData[k];
        }
      }
    }
    return active;
  }, [connectedProfiles, fetchedData]);

  // Compute aggregate analytics strictly from active connected platforms
  const analytics = useMemo(() => analyzeCodingProfiles(activeFetchedData), [activeFetchedData]);

  // Aggregate contest histories strictly from active connected platforms
  const activeContestHistories = useMemo(() => {
    const items: { platform: string; history: any[]; color: string }[] = [];
    for (const [key, p] of Object.entries(activeFetchedData)) {
      if (p.ratingHistory && p.ratingHistory.length > 0) {
        items.push({
          platform: p.platform.toUpperCase(),
          history: p.ratingHistory,
          color: key === "leetcode" ? "#FFA116" : key === "codeforces" ? "#1F8ACB" : "#5B4638",
        });
      }
    }
    return items;
  }, [activeFetchedData]);

  // Only display cards for platforms with accessible, successfully fetched data (excluding github)
  const visibleProfiles = useMemo(() => {
    return Object.entries(connectedProfiles)
      .filter(([k, u]) => k !== "customLinks" && k !== "platformStats" && k !== "github" && typeof u === "string" && Boolean(u.trim()))
      .filter(([platformKey]) => {
        const profile = fetchedData[platformKey];
        if (!profile) return false;
        // If platform didn't give access, rate limited, or failed, do NOT show in cards
        if (
          profile.status === "FETCH_FAILED" ||
          profile.status === "PROFILE_NOT_FOUND" ||
          profile.status === "NOT_AVAILABLE" ||
          profile.status === "RATE_LIMITED"
        ) {
          return false;
        }
        const hasStats =
          (typeof profile.totalSolved === "number" && profile.totalSolved > 0) ||
          (profile.rating !== null && profile.rating !== undefined) ||
          (profile.easySolved !== null || profile.mediumSolved !== null || profile.hardSolved !== null) ||
          (profile.contestsParticipated !== null && profile.contestsParticipated > 0) ||
          Boolean(profile.submissionCalendar && Object.keys(profile.submissionCalendar).length > 0) ||
          Boolean(profile.recentSubmissions && profile.recentSubmissions.length > 0);
        return hasStats || profile.status === "SUCCESS";
      });
  }, [connectedProfiles, fetchedData]);

  // List of all connected platform profiles configured by the user
  const connectedPlatformsList = useMemo(() => {
    return Object.entries(connectedProfiles)
      .filter(
        ([k, u]) =>
          k !== "customLinks" &&
          k !== "platformStats" &&
          typeof u === "string" &&
          Boolean(u.trim())
      )
      .map(([platformKey, username]) => {
        const profile = fetchedData[platformKey];
        const meta = PLATFORM_META[platformKey.toLowerCase()] || {
          name: platformKey.charAt(0).toUpperCase() + platformKey.slice(1),
          color: "#6366F1",
        };
        const cleanUsername = username.trim().replace(/^@+/, "");
        const profileUrl = resolvePlatformUrl(platformKey, cleanUsername, profile?.profileUrl);
        return {
          key: platformKey,
          username: cleanUsername,
          profile,
          meta,
          profileUrl,
        };
      });
  }, [connectedProfiles, fetchedData]);

  const scrollToPlatform = (key: string) => {
    setShowConnectedModal(false);
    setTimeout(() => {
      const el = document.getElementById(`platform-card-${key}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-primary", "ring-offset-2", "ring-offset-background");
        setTimeout(() => {
          el.classList.remove("ring-2", "ring-primary", "ring-offset-2", "ring-offset-background");
        }, 2200);
      }
    }, 180);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Summary Bar ── */}
      <section className="rounded-3xl border border-white/15 bg-card/80 p-6 backdrop-blur-xl shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <Globe className="size-6 text-primary" />
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-foreground">Unified Coding Profile</h2>
              <p className="text-xs text-muted-foreground">Multi-Platform Coding Identity Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              disabled={loading}
              className="gap-2 rounded-xl border-white/10 text-xs font-bold"
            >
              <RefreshCw className={cn("size-3.5 text-primary", loading && "animate-spin")} />
              <span>{loading ? "Refreshing..." : "Refresh All Platforms"}</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* ── Connected Platforms Clickable Card ── */}
          <button
            type="button"
            onClick={() => setShowConnectedModal(true)}
            id="connected-platforms-summary-card"
            className="group relative flex flex-col justify-between text-left rounded-2xl border border-white/10 bg-background/50 p-4 transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 hover:scale-[1.02] active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm hover:shadow-lg overflow-hidden"
            title="Click to view all connected platforms"
          >
            <div className="flex items-center justify-between w-full">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider group-hover:text-primary transition-colors flex items-center gap-1.5">
                <Globe className="size-3 text-primary animate-pulse" />
                <span>Connected Platforms</span>
              </p>
              <span className="text-[10px] font-semibold text-primary/70 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex items-center gap-0.5">
                View all &rarr;
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <p className="font-black text-2xl tabular-nums text-primary">
                {analytics.activePlatformsCount > 0 ? analytics.activePlatformsCount : connectedPlatformsList.length}
              </p>
              {connectedPlatformsList.length > 0 && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  {connectedPlatformsList.length} linked
                </span>
              )}
            </div>
          </button>
          <div className="rounded-2xl border border-white/10 bg-background/50 p-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Solved</p>
            <p className="font-black text-2xl tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">{analytics.totalSolvedAcrossPlatforms}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-background/50 p-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Peak Platform Rating</p>
            <p className="font-black text-2xl tabular-nums text-amber-600 dark:text-amber-400 mt-1">
              {analytics.highestReportedRating
                ? `${analytics.highestReportedRating.rating} (${analytics.highestReportedRating.platform.toUpperCase()})`
                : "N/A"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-background/50 p-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Contests</p>
            <p className="font-black text-2xl tabular-nums text-purple-600 dark:text-purple-400 mt-1">{analytics.totalContestsAcrossPlatforms}</p>
          </div>
        </div>
      </section>

      {/* ── Connect New Platform ── */}
      {!readOnly && <PlatformConnectCard onConnect={handleConnect} existingPlatforms={connectedProfiles} />}

      {/* ── Platform Profile Cards ── */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
          Connected Platform Stats
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleProfiles.map(([platformKey]) => {
            const profile = fetchedData[platformKey];
            if (!profile) return null;

            return (
              <div
                key={platformKey}
                id={`platform-card-${platformKey}`}
                className="rounded-3xl transition-all duration-300 scroll-mt-24"
              >
                <PlatformProfileCard
                  profile={profile}
                  onRefresh={() => handleRefreshSingle(platformKey as PlatformId)}
                  isRefreshing={refreshingPlatform === platformKey}
                />
              </div>
            );
          })}
          {visibleProfiles.length === 0 && (
            <p className="col-span-full text-xs text-muted-foreground italic p-6 text-center border border-dashed border-white/10 rounded-2xl">
              {loading
                ? "Syncing platform profile statistics..."
                : readOnly
                ? "No coding platform statistics available."
                : "No active platform stats available. Connect your LeetCode, Codeforces, or CodeChef profiles above!"}
            </p>
          )}
        </div>
      </section>

      {/* ── Contest Rating Graphs ── */}
      {activeContestHistories.length > 0 && (
        <section className="space-y-4 rounded-3xl border border-white/10 bg-card/60 p-6 backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Trophy className="size-5 text-amber-600 dark:text-amber-400" />
            <h3 className="text-base font-bold text-foreground">Contest Rating Progression</h3>
          </div>
          <div className="space-y-4">
            {activeContestHistories.map((item) => (
              <ContestHistoryChart
                key={item.platform}
                platformName={item.platform}
                history={item.history}
                color={item.color}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Connected Platforms Modal ── */}
      <Dialog open={showConnectedModal} onOpenChange={setShowConnectedModal}>
        <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col p-0 overflow-hidden border border-white/15 bg-card/95 backdrop-blur-2xl shadow-2xl rounded-3xl">
          <DialogHeader className="p-6 pb-4 border-b border-white/10 shrink-0 bg-background/50 text-left">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner shrink-0">
                <Globe className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                  <span>Connected Platforms</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 tabular-nums">
                    {connectedPlatformsList.length} Connected
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Overview of all coding profiles and accounts linked to your unified identity.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* List of Platforms */}
          <div className="p-6 overflow-y-auto space-y-3 flex-1 min-h-0">
            {connectedPlatformsList.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-white/10 bg-background/30 space-y-3">
                <div className="size-12 rounded-2xl bg-white/5 mx-auto flex items-center justify-center text-muted-foreground">
                  <Globe className="size-6 opacity-40" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-foreground text-sm">No Platforms Connected Yet</h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Link your LeetCode, Codeforces, CodeChef, or other profiles using the connection form below to track your unified progress.
                  </p>
                </div>
              </div>
            ) : (
              connectedPlatformsList.map((item) => {
                const isRefreshing = refreshingPlatform === item.key;
                const canJumpToCard = visibleProfiles.some(([pk]) => pk === item.key);
                const hasSolved = item.key !== "github" && typeof item.profile?.totalSolved === "number" && item.profile.totalSolved > 0;
                const hasRating = typeof item.profile?.rating === "number" && item.profile.rating > 0;
                const hasContests = typeof item.profile?.contestsParticipated === "number" && item.profile.contestsParticipated > 0;
                const hasStreak = typeof item.profile?.streak === "number" && item.profile.streak > 0;

                return (
                  <div
                    key={item.key}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 rounded-2xl border border-white/10 bg-background/40 hover:bg-background/80 hover:border-white/20 transition-all duration-200 shadow-sm"
                  >
                    {/* Platform Brand + Handle */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="size-11 rounded-2xl flex items-center justify-center text-xs font-black shrink-0 border shadow-inner"
                        style={{
                          borderColor: `${item.meta.color}40`,
                          backgroundColor: `${item.meta.color}18`,
                          color: item.meta.color,
                        }}
                      >
                        {item.meta.name.slice(0, 3).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-foreground">
                            {item.meta.name}
                          </span>

                          {/* Status Badge */}
                          {isRefreshing ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                              <RefreshCw className="size-2.5 animate-spin" /> Syncing
                            </span>
                          ) : item.profile?.status === "SUCCESS" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" /> Synced
                            </span>
                          ) : item.profile?.status === "PROFILE_NOT_FOUND" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                              Not Found
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full">
                              Connected
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono truncate mt-0.5">
                          <span>@{item.username}</span>
                          {item.profile?.country && (
                            <span className="text-[11px] text-muted-foreground/80">• {item.profile.country}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats pills */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
                      {hasSolved && (
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs tabular-nums">
                          {item.profile!.totalSolved} solved
                        </span>
                      )}
                      {item.key === "github" && (item.profile as any)?.totalContributions && (
                        <span className="px-2.5 py-1 rounded-xl bg-slate-500/10 border border-slate-500/20 text-slate-300 font-bold text-xs tabular-nums">
                          {(item.profile as any).totalContributions} contribs
                        </span>
                      )}
                      {hasRating && (
                        <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs tabular-nums">
                          ★ {item.profile!.rating}
                        </span>
                      )}
                      {hasContests && (
                        <span className="px-2.5 py-1 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 font-bold text-xs tabular-nums">
                          🏆 {item.profile!.contestsParticipated}
                        </span>
                      )}
                      {hasStreak && (
                        <span className="px-2.5 py-1 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 font-bold text-xs tabular-nums">
                          🔥 {item.profile!.streak}d
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      {item.profileUrl && item.profileUrl !== "#" && (
                        <a
                          href={item.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-white/5 hover:bg-primary/20 text-foreground hover:text-primary border border-white/10 hover:border-primary/40 transition-all cursor-pointer"
                          title={`Open ${item.meta.name} profile in new tab`}
                        >
                          <span>Visit</span>
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                      {canJumpToCard && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => scrollToPlatform(item.key)}
                          className="h-8 px-2.5 text-xs font-semibold rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/10"
                          title="Scroll to platform card"
                        >
                          <span>Details</span>
                          <ArrowDown className="size-3 ml-1" />
                        </Button>
                      )}
                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isRefreshing || loading}
                          onClick={() => handleRefreshSingle(item.key as PlatformId)}
                          className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-primary hover:bg-white/10"
                          title={`Refresh ${item.meta.name}`}
                        >
                          <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin text-primary")} />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Dialog Footer */}
          <div className="p-4 px-6 border-t border-white/10 bg-background/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                Total Solved: <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{analytics.totalSolvedAcrossPlatforms}</strong>
              </span>
              <span>
                Contests: <strong className="text-purple-600 dark:text-purple-400 font-mono font-bold">{analytics.totalContestsAcrossPlatforms}</strong>
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConnectedModal(false)}
              className="rounded-xl border-white/10 text-xs font-bold"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

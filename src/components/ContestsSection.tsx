"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Trophy,
  Clock,
  Timer,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Zap,
  BarChart3,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useContests,
  type ContestWithStatus,
  type UserMark,
} from "@/hooks/useContests";
import { ContestsPlatformBar } from "./ContestsPlatformBar";
import { type PlatformId } from "@/lib/coding-platforms/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCountdown(msLeft: number): string {
  if (msLeft <= 0) return "00:00:00";
  const totalSec = Math.floor(msLeft / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (d > 0) return `${d}d ${pad(h)}h ${pad(m)}m ${pad(s)}s`;
  if (h > 0) return `${h}h ${pad(m)}m ${pad(s)}s`;
  return `${pad(m)}m ${pad(s)}s`;
}

function fmtDuration(ms: number): string {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function fmtDateIST(ms: number): string {
  return new Date(ms).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }) + " IST";
}

export function isToday(ms: number): boolean {
  if (!ms || isNaN(ms)) return false;
  const dateObj = new Date(ms);
  const nowObj = new Date();

  // Local browser date check
  const isLocalToday =
    nowObj.getFullYear() === dateObj.getFullYear() &&
    nowObj.getMonth() === dateObj.getMonth() &&
    nowObj.getDate() === dateObj.getDate();

  if (isLocalToday) return true;

  // IST date check fallback
  try {
    const istNow = new Date(nowObj.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const istStart = new Date(dateObj.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    return (
      istNow.getFullYear() === istStart.getFullYear() &&
      istNow.getMonth() === istStart.getMonth() &&
      istNow.getDate() === istStart.getDate()
    );
  } catch {
    return false;
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const PLATFORM_STYLES: Record<string, string> = {
  LeetCode:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  Codeforces:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  CodeChef:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  HackerRank:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  HackerEarth:
    "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300",
};

const STATUS_STYLES = {
  live: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 animate-pulse",
  upcoming:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  missed:
    "bg-gray-100 text-gray-500 dark:bg-gray-800/60 dark:text-gray-400",
} as const;

// ─── Countdown display ────────────────────────────────────────────────────────

function Countdown({
  targetMs,
  label,
  now,
}: {
  targetMs: number;
  label: string;
  now: number;
}) {
  const left = targetMs - now;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 font-mono text-[12px] font-semibold tabular-nums",
        left < 60_000 && left > 0 && "text-red-500 dark:text-red-400"
      )}
    >
      <Timer className="size-3 shrink-0" aria-hidden="true" />
      {label}: {fmtCountdown(left)}
    </span>
  );
}

// ─── Mark bar ────────────────────────────────────────────────────────────────

function MarkBar({
  contest,
  onMark,
  onOpenLinkModal,
}: {
  contest: ContestWithStatus;
  onMark: (id: string, m: UserMark) => void;
  onOpenLinkModal?: (platformId: PlatformId) => void;
}) {
  const { id: contestId, mark, status, attendanceInfo } = contest;

  // Only show mark bar for live or missed (after end)
  if (status === "upcoming") {
    if (attendanceInfo?.isLinked) {
      return (
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t border-border/40">
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="size-3 text-emerald-500" />
            Linked: @{attendanceInfo.handle}
          </span>
          <span className="text-[10px]">Auto-tracks on completion</span>
        </div>
      );
    }
    return null;
  }

  // ── CASE 1: Coding Platform Details ARE NOT Entered (Show Normal UI) ──
  if (!attendanceInfo?.isLinked) {
    if (mark === "attended") {
      return (
        <div className="mt-2 flex items-center justify-between gap-2 pt-1.5 border-t border-border/40">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3" />
            Attended ✓
          </span>
          <button
            onClick={(e) => {
              e.preventDefault();
              onMark(contestId, null);
            }}
            className="text-[10px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Undo
          </button>
        </div>
      );
    }

    if (mark === "missed_intentional") {
      return (
        <div className="mt-2 flex items-center justify-between gap-2 pt-1.5 border-t border-border/40">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 dark:text-gray-500">
            <XCircle className="size-3" />
            Marked missed
          </span>
          <button
            onClick={(e) => {
              e.preventDefault();
              onMark(contestId, null);
            }}
            className="text-[10px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Undo
          </button>
        </div>
      );
    }

    // Normal unmarked state: "Did you attend? [Attended] [Missed]"
    return (
      <div className="mt-2 flex flex-col gap-1.5 pt-1.5 border-t border-border/40" onClick={(e) => e.preventDefault()}>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">Did you attend?</span>
          <button
            onClick={(e) => {
              e.preventDefault();
              onMark(contestId, "attended");
            }}
            className="flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-800/60"
          >
            <CheckCircle2 className="size-3" />
            Attended
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              onMark(contestId, "missed_intentional");
            }}
            className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800/60 dark:text-gray-400 dark:hover:bg-gray-700/60"
          >
            <XCircle className="size-3" />
            Missed
          </button>
        </div>
        {attendanceInfo?.isLinked && attendanceInfo.handle ? (
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
            <CheckCircle2 className="size-3 text-emerald-500" />
            <span>Auto-tracking active for @{attendanceInfo.handle}</span>
          </div>
        ) : !attendanceInfo?.isLinked && onOpenLinkModal && attendanceInfo?.platformMeta ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              onOpenLinkModal(attendanceInfo.platformMeta!.id);
            }}
            className="text-[10px] text-primary/80 hover:text-primary hover:underline text-left inline-flex items-center gap-1"
          >
            <span>+ Link {contest.platform} account for auto-tracking</span>
          </button>
        ) : null}
      </div>
    );
  }

  // ── CASE 2: Coding Platform Details ARE Entered (Auto Linked) ──
  if (mark === "attended") {
    return (
      <div className="mt-2 flex flex-col gap-1 pt-1.5 border-t border-border/40">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              <CheckCircle2 className="size-3" />
              Attended ✓
            </span>
            {attendanceInfo.source === "auto_platform" ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                Verified ({attendanceInfo.platformMeta?.label})
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground">(Manual override)</span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              onMark(contestId, attendanceInfo.source === "auto_platform" ? "missed_intentional" : null);
            }}
            className="text-[10px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
            title="Override or change attendance mark"
          >
            {attendanceInfo.source === "auto_platform" ? "Mark Missed" : "Undo"}
          </button>
        </div>

        {(attendanceInfo.rank || attendanceInfo.rating) && (
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
            {attendanceInfo.rank && <span>Rank #{attendanceInfo.rank}</span>}
            {attendanceInfo.rating && <span>· Rating {attendanceInfo.rating}</span>}
            {attendanceInfo.handle && <span>· @{attendanceInfo.handle}</span>}
          </div>
        )}
      </div>
    );
  }

  if (mark === "missed_intentional") {
    return (
      <div className="mt-2 flex items-center justify-between gap-2 flex-wrap pt-1.5 border-t border-border/40">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:bg-gray-800/60 dark:text-gray-400">
            <XCircle className="size-3" />
            Not Attended
          </span>
          {attendanceInfo.source === "auto_platform" ? (
            <span className="text-[10px] text-muted-foreground">
              Synced from {attendanceInfo.platformMeta?.label}
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground">(Manual mark)</span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            onMark(contestId, "attended");
          }}
          className="text-[10px] text-primary underline underline-offset-2 hover:text-primary/80"
          title="Mark as attended (override)"
        >
          Mark Attended
        </button>
      </div>
    );
  }

  return null;
}

// ─── Contest card ─────────────────────────────────────────────────────────────

function ContestCard({
  c,
  now,
  onMark,
  onOpenLinkModal,
}: {
  c: ContestWithStatus;
  now: number;
  onMark: (id: string, m: UserMark) => void;
  onOpenLinkModal?: (platformId: PlatformId) => void;
}) {
  const attended = c.mark === "attended";
  const info = c.attendanceInfo;

  return (
    <div
      className={cn(
        "group flex flex-col gap-2 rounded-xl border border-border bg-card p-4 transition-all shadow-2xs hover:shadow-xs",
        c.status === "missed" && !attended && "opacity-75 hover:opacity-100",
        attended && "border-emerald-400/60 bg-emerald-50/40 dark:bg-emerald-950/20"
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
              PLATFORM_STYLES[c.platform] ?? "bg-muted text-muted-foreground"
            )}
          >
            {c.platform}
          </span>
          {info?.isLinked && info.handle && (
            <a
              href={info.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 font-mono text-[10px] text-muted-foreground hover:text-primary transition-colors"
              title={`View @${info.handle} on ${c.platform}`}
              onClick={(e) => e.stopPropagation()}
            >
              <span>@{info.handle}</span>
              <ExternalLink className="size-2.5 opacity-60" />
            </a>
          )}
          {!info?.isLinked && onOpenLinkModal && info?.platformMeta && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenLinkModal(info.platformMeta!.id);
              }}
              className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/80 hover:text-primary transition-colors underline"
              title={`Link your ${c.platform} handle`}
            >
              + Link Acc
            </button>
          )}
        </div>

        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
            STATUS_STYLES[c.status]
          )}
        >
          {c.status === "live" ? "🔴 Live" : c.status === "upcoming" ? "Upcoming" : "Ended"}
        </span>
      </div>

      {/* Title + link */}
      <a
        href={c.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start justify-between gap-1 text-sm font-semibold leading-snug text-foreground hover:text-primary"
      >
        <span>{c.title}</span>
        <ExternalLink className="mt-0.5 size-3 shrink-0 opacity-50 group-hover:opacity-100" />
      </a>

      {/* Time info */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="size-3" />
          {fmtDateIST(c.startMs)}
        </span>
        <span className="flex items-center gap-1">
          <Timer className="size-3" />
          {fmtDuration(c.durationMs)}
        </span>
      </div>

      {/* Live countdown */}
      {c.status === "live" && (
        <Countdown targetMs={c.endMs} label="Ends in" now={now} />
      )}

      {/* Upcoming countdown */}
      {c.status === "upcoming" && c.startMs - now <= 7 * 24 * 60 * 60 * 1000 && (
        <Countdown targetMs={c.startMs} label="Starts in" now={now} />
      )}

      {/* Practice mode note for ended */}
      {c.status === "missed" && (
        <a
          href={c.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-0.5 text-[11px] text-blue-500 underline underline-offset-2 hover:text-blue-700 dark:text-blue-400"
          onClick={(e) => e.stopPropagation()}
        >
          Practice in virtual/upsolve mode →
        </a>
      )}

      {/* Mark bar */}
      <MarkBar
        contest={c}
        onMark={onMark}
        onOpenLinkModal={onOpenLinkModal}
      />
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  title,
  count,
  icon,
  onRefresh,
  isRefreshing,
}: {
  title: string;
  count: number;
  icon?: React.ReactNode;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon ?? <Trophy className="size-4 text-primary" />}
        <h2 className="text-base font-semibold">{title}</h2>
        <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
          {count}
        </span>
      </div>
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Refresh contest list"
        >
          <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
          <span>Refresh</span>
        </button>
      )}
    </div>
  );
}

// ─── Progress section ─────────────────────────────────────────────────────────

export function ContestProgress({ contests }: { contests: ContestWithStatus[] }) {
  const allEnded = contests.filter((c) => c.status === "missed");
  const attended = allEnded.filter((c) => c.mark === "attended");
  const autoAttended = attended.filter((c) => c.attendanceInfo?.source === "auto_platform");
  const missedMark = allEnded.filter((c) => c.mark === "missed_intentional");
  const autoMissed = missedMark.filter((c) => c.attendanceInfo?.source === "auto_platform");
  const unmarked = allEnded.filter((c) => c.mark === null);
  const total = allEnded.length;
  const pct = total === 0 ? 0 : Math.round((attended.length / total) * 100);

  // Platform breakdown
  const platforms = ["Codeforces", "CodeChef", "LeetCode", "HackerRank", "HackerEarth"] as const;
  const platformStats = platforms
    .map((p) => {
      const pEnded = allEnded.filter((c) => c.platform === p);
      const pAttended = pEnded.filter((c) => c.mark === "attended");
      const isLinked = pEnded.some((c) => c.attendanceInfo?.isLinked);
      return {
        platform: p,
        total: pEnded.length,
        attended: pAttended.length,
        isLinked,
      };
    })
    .filter((s) => s.total > 0);

  if (total === 0) return null;

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-primary" />
          <h2 className="text-base font-semibold">Contest Attendance &amp; Upsolve Progress</h2>
        </div>
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          {attended.length} / {total} Completed ({pct}%)
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3 flex items-center gap-3">
        <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="w-12 text-right font-mono text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
          {pct}%
        </span>
      </div>

      {/* Summary stats */}
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs">
        <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-3.5" />
          {attended.length} Completed / Attended
          {autoAttended.length > 0 && (
            <span className="opacity-80 text-[11px]">({autoAttended.length} auto-verified)</span>
          )}
        </span>
        <span className="flex items-center gap-1 font-medium text-gray-500">
          <XCircle className="size-3.5" />
          {missedMark.length} Not Attended
          {autoMissed.length > 0 && (
            <span className="opacity-80 text-[11px]">({autoMissed.length} auto-synced)</span>
          )}
        </span>
        {unmarked.length > 0 && (
          <span className="flex items-center gap-1 font-medium text-amber-500">
            <AlertCircle className="size-3.5" />
            {unmarked.length} Unmarked (Upsolve Available)
          </span>
        )}
        <span className="ml-auto text-muted-foreground">
          {total} Total Past Contests
        </span>
      </div>

      {/* Platform breakdown badges */}
      {platformStats.length > 0 && (
        <div className="pt-2 border-t border-border">
          <p className="mb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Platform Breakdown
          </p>
          <div className="flex flex-wrap gap-2">
            {platformStats.map((s) => (
              <div
                key={s.platform}
                className="flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2.5 py-1 text-[11px]"
              >
                <span className="font-semibold text-foreground">{s.platform}</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  {s.attended}/{s.total}
                </span>
                {s.isLinked && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium" title="Account connected for auto-attendance">
                    ✓ Linked
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="h-36 animate-pulse rounded-lg border border-border bg-muted"
        />
      ))}
    </div>
  );
}

// ─── Source footer ────────────────────────────────────────────────────────────

function SourceFooter() {
  return (
    <p className="mt-4 text-right text-[11px] text-muted-foreground">
      Sources: Codeforces · CodeChef · LeetCode · HackerRank · HackerEarth · All times in IST (UTC +5:30)
    </p>
  );
}

// ─── Today contests (shown in Today tab) ─────────────────────────────────────

export function TodayContestsSection() {
  const {
    contests,
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
  } = useContests();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalPlatform, setModalPlatform] = useState<PlatformId | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
  // 52-hour buffer covers standard 48h-50h weekend rounds (e.g. CodeChef Weekend Prep)
  const TWO_DAYS_BUFFER_MS = 52 * 60 * 60 * 1000;

  const todaysContests = contests.filter((c) => {
    const totalDuration = c.durationMs || (c.endMs - c.startMs);

    // CASE 1: Contest is LIVE right now
    if (c.status === "live") {
      const remainingMs = c.endMs - now;
      const isShortDuration = totalDuration <= TWO_DAYS_BUFFER_MS;
      const endsWithinTwoDays = remainingMs <= TWO_DAYS_MS;

      // Show if duration is <= 2 days OR if it ends within 2 days
      if (isShortDuration || endsWithinTwoDays) {
        // Exclude massive 7+ day marathon hackathons that happen to end soon
        if (totalDuration > 7 * 24 * 60 * 60 * 1000) return false;
        return true;
      }
      return false;
    }

    // CASE 2: Contest is UPCOMING
    if (c.status === "upcoming") {
      if (totalDuration > TWO_DAYS_BUFFER_MS) return false;
      if (c.endMs - now > TWO_DAYS_MS) return false;
      return isToday(c.startMs);
    }

    // CASE 3: Contest ENDED earlier today
    if (c.status === "missed") {
      if (totalDuration > TWO_DAYS_BUFFER_MS) return false;
      return isToday(c.startMs) || isToday(c.endMs);
    }

    return false;
  });

  const remainingContestsCount = contests.length - todaysContests.length;
  const liveCount = todaysContests.filter((c) => c.status === "live").length;

  if (loading) {
    return (
      <section
        aria-label="Today's Contests & Competitions"
        className="rounded-3xl border border-border/80 dark:border-white/15 bg-card/80 backdrop-blur-xl p-5 sm:p-6 shadow-xl space-y-5 relative overflow-hidden mt-6"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500/70 via-yellow-500/50 to-orange-500/40" />
        <div className="flex items-center justify-between gap-3 border-b border-border/70 dark:border-white/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-500/20 p-2.5 border border-amber-500/30 text-amber-400 shrink-0">
              <Trophy className="size-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight text-foreground">
                Today's Contests & Competitions
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Fetching live schedules from LeetCode, Codeforces, CodeChef, and AtCoder...
              </p>
            </div>
          </div>
        </div>
        <LoadingGrid />
      </section>
    );
  }

  if (error) {
    return (
      <section
        aria-label="Today's Contests & Competitions"
        className="rounded-3xl border border-rose-500/30 bg-card/80 backdrop-blur-xl p-5 sm:p-6 shadow-xl space-y-4 relative overflow-hidden mt-6"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-rose-500/20 p-2.5 border border-rose-500/30 text-rose-400 shrink-0">
              <AlertCircle className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Could not load today's contests</h3>
              <p className="text-xs text-rose-400/80">{error}</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors"
          >
            <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
            Retry
          </button>
        </div>
      </section>
    );
  }

  if (todaysContests.length === 0) {
    return (
      <section
        aria-label="Today's Contests & Competitions"
        className="rounded-3xl border border-border/80 dark:border-white/15 bg-card/80 backdrop-blur-xl p-5 sm:p-6 shadow-xl space-y-5 relative overflow-hidden mt-6"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500/70 via-yellow-500/50 to-orange-500/40" />

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 dark:border-white/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-500/20 p-2.5 border border-amber-500/30 text-amber-400 shrink-0">
              <Trophy className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black tracking-tight text-foreground">
                  Today's Contests & Competitions
                </h3>
                <span className="rounded-full bg-white/10 border border-white/10 px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
                  0 Today
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Coding matches from LeetCode, Codeforces, CodeChef & AtCoder
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
              <span>Refresh</span>
            </button>
            <Link
              href="/contests"
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-3 py-1.5 text-xs font-semibold transition-all hover:scale-[1.02]"
            >
              <span>View All Contests ({contests.length})</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* Empty state card inside the container */}
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 sm:p-8 text-center space-y-2.5">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-inner">
            <Trophy className="size-6" />
          </div>
          <h4 className="text-sm sm:text-base font-bold text-foreground">No Short Contests Starting Today</h4>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            No short rounds scheduled to start today and end within 2 days. Focus on mastering your Core DSA Problems above! You have {contests.length} upcoming rounds and multi-day challenges listed in the Contests tab.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/contests"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors underline-offset-4 hover:underline"
            >
              <span>View All Contests in Contests Tab ({contests.length})</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Today's Contests & Competitions"
      className="rounded-3xl border border-amber-500/20 bg-card/80 backdrop-blur-xl p-5 sm:p-6 shadow-xl space-y-5 relative overflow-hidden mt-6"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500/80 via-yellow-500/60 to-orange-500/40" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 dark:border-white/15 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-amber-500/20 p-2.5 border border-amber-500/30 text-amber-400 shrink-0">
            <Trophy className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg sm:text-xl font-black tracking-tight text-foreground">
                Today's Contests & Competitions
              </h3>
              <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold text-amber-400">
                {todaysContests.length} Today
              </span>
              {liveCount > 0 && (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-400 animate-pulse">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  {liveCount} Live Now
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live & scheduled contests from LeetCode, Codeforces, CodeChef & AtCoder
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
            <span>Refresh</span>
          </button>
          <Link
            href="/contests"
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-3 py-1.5 text-xs font-semibold transition-all hover:scale-[1.02]"
          >
            <span>All Contests</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>

      {/* Grid of Contest Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-1">
        {todaysContests.map((c) => (
          <ContestCard
            key={c.id}
            c={c}
            now={now}
            onMark={markContest}
            onOpenLinkModal={(plat) => setModalPlatform(plat)}
          />
        ))}
      </div>

      {/* Button to view all remaining contests in Contests tab */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-white/10 bg-white/[0.03] mt-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Trophy className="size-4 text-amber-400 shrink-0" />
          <span>
            Showing short rounds (starts today, ends within 2 days).
            {remainingContestsCount > 0 && (
              <strong className="text-foreground font-semibold">
                {" "}{remainingContestsCount} more contest{remainingContestsCount === 1 ? "" : "s"}
              </strong>
            )}
            {" "}listed in the Contests tab.
          </span>
        </div>
        <Link
          href="/contests"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 px-4 py-2 text-xs font-bold transition-all shrink-0 hover:scale-[1.01]"
        >
          <Trophy className="size-3.5" />
          <span>View All Contests in Contests Tab ({contests.length})</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <SourceFooter />

      {/* Platform bar rendered in modal-only mode so accounts box is hidden from Today page */}
      <ContestsPlatformBar
        codingProfiles={codingProfiles}
        platformStats={platformStats}
        onUpdateProfile={updateCodingProfile}
        onRemoveProfile={removeCodingProfile}
        onSyncAll={syncAllProfiles}
        isSyncing={isSyncingProfiles}
        modalPlatform={modalPlatform}
        setModalPlatform={setModalPlatform}
        modalOnly={true}
      />
    </section>
  );
}

const PRACTICE_HUB_LINKS = [
  {
    platform: "Codeforces",
    url: "https://codeforces.com/contests",
    label: "Contest Archive & Upsolve",
    bg: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20",
  },
  {
    platform: "LeetCode",
    url: "https://leetcode.com/contest/",
    label: "Past Contests & Virtual Rounds",
    bg: "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-500/20",
  },
  {
    platform: "CodeChef",
    url: "https://www.codechef.com/contests",
    label: "Past Contests & Practice",
    bg: "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300 hover:bg-orange-500/20",
  },
  {
    platform: "HackerRank",
    url: "https://www.hackerrank.com/contests",
    label: "Contest Archives",
    bg: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20",
  },
  {
    platform: "HackerEarth",
    url: "https://www.hackerearth.com/challenges/",
    label: "Past Challenges & Hackathons",
    bg: "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20",
  },
];

// ─── Full contests page ───────────────────────────────────────────────────────

export function ContestsPageSection() {
  const {
    contests,
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
  } = useContests();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalPlatform, setModalPlatform] = useState<PlatformId | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 animate-pulse rounded-xl border border-border bg-muted" />
        <LoadingGrid />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-5">
        <p className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Live data comes from Codeforces, LeetCode, CodeChef, HackerRank, and HackerEarth. Check
          your internet connection or try refreshing.
        </p>
      </div>
    );
  }

  const LOOKAHEAD_MS = 30 * 24 * 60 * 60 * 1000;
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000; // Last 3 days missed contests

  const live = contests.filter((c) => c.status === "live");
  const upcoming = contests.filter((c) => c.status === "upcoming" && c.startMs - now <= LOOKAHEAD_MS);

  // Sort missed contests DESCENDING (newest first)
  const missed = contests
    .filter((c) => c.status === "missed")
    .sort((a, b) => b.startMs - a.startMs);

  // Unmarked contests from the last 3 days (only for unlinked platforms where user hasn't marked yet)
  const recentMissed = missed.filter(
    (c) => c.mark !== "missed_intentional" && c.mark !== "attended" && now - c.endMs <= THREE_DAYS_MS
  );

  // Not attended / Skipped contests (both auto-synced not attended and manually skipped) from last 3 days
  const markedMissed = missed.filter(
    (c) => c.mark === "missed_intentional" && now - c.endMs <= THREE_DAYS_MS
  );

  // Attended contests (both auto-verified and manually marked attended)
  const attendedMissed = missed.filter((c) => c.mark === "attended");

  return (
    <div className="space-y-10">
      {/* ── Linked Platform Accounts & Auto-Attendance Bar ── */}
      <ContestsPlatformBar
        codingProfiles={codingProfiles}
        platformStats={platformStats}
        onUpdateProfile={updateCodingProfile}
        onRemoveProfile={removeCodingProfile}
        onSyncAll={syncAllProfiles}
        isSyncing={isSyncingProfiles}
        modalPlatform={modalPlatform}
        setModalPlatform={setModalPlatform}
      />

      {/* Progress bar */}
      <ContestProgress contests={contests} />

      {/* Live */}
      {live.length > 0 && (
        <section>
          <SectionHeader
            title="Live Now"
            count={live.length}
            icon={<span className="size-4 text-base leading-none">🔴</span>}
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {live.map((c) => (
              <ContestCard
                key={c.id}
                c={c}
                now={now}
                onMark={markContest}
                onOpenLinkModal={(plat) => setModalPlatform(plat)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section>
          <SectionHeader
            title="Upcoming Contests"
            count={upcoming.length}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((c) => (
              <ContestCard
                key={c.id}
                c={c}
                now={now}
                onMark={markContest}
                onOpenLinkModal={(plat) => setModalPlatform(plat)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Attended (Auto-verified + Manually Marked) */}
      {attendedMissed.length > 0 && (
        <section>
          <SectionHeader
            title="Attended Contests"
            count={attendedMissed.length}
            icon={<CheckCircle2 className="size-4 text-emerald-500" />}
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {attendedMissed.map((c) => (
              <ContestCard
                key={c.id}
                c={c}
                now={now}
                onMark={markContest}
                onOpenLinkModal={(plat) => setModalPlatform(plat)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Not Attended / Skipped Contests (Last 3 Days) */}
      {markedMissed.length > 0 && (
        <section>
          <SectionHeader
            title="Not Attended / Skipped (Last 3 Days)"
            count={markedMissed.length}
            icon={<XCircle className="size-4 text-orange-400" />}
          />
          <p className="mb-3 text-xs text-muted-foreground">
            Contests from the last 3 days where you were not detected as participating or marked skipped. You can practice them in virtual mode!
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {markedMissed.map((c) => (
              <ContestCard
                key={c.id}
                c={c}
                now={now}
                onMark={markContest}
                onOpenLinkModal={(plat) => setModalPlatform(plat)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Unmarked Contests (Last 3 Days - where platform is not linked yet) */}
      {recentMissed.length > 0 && (
        <section>
          <SectionHeader
            title="Unmarked Contests (Last 3 Days)"
            count={recentMissed.length}
            icon={<AlertCircle className="size-4 text-amber-500" />}
          />
          <p className="mb-3 text-xs text-muted-foreground">
            Contests without linked platform accounts. Mark whether you attended, or link your account above to auto-detect attendance.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentMissed.map((c) => (
              <ContestCard
                key={c.id}
                c={c}
                now={now}
                onMark={markContest}
                onOpenLinkModal={(plat) => setModalPlatform(plat)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Older Contests & Platform Practice Hub */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="size-4 text-primary" />
            <h2 className="text-base font-semibold">Older Contests &amp; Platform Practice Hub</h2>
          </div>
          <span className="text-xs text-muted-foreground">
            Official Archives
          </span>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Want to practice older contests from past weeks or months? Use the official contest archives below:
        </p>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {PRACTICE_HUB_LINKS.map((link) => (
            <a
              key={link.platform}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "group flex items-center justify-between rounded-lg border p-3 text-xs font-medium transition-all hover:scale-[1.01]",
                link.bg
              )}
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold">{link.platform}</span>
                <span className="text-[11px] opacity-80">{link.label}</span>
              </div>
              <ExternalLink className="size-3.5 opacity-60 transition-opacity group-hover:opacity-100" />
            </a>
          ))}
        </div>
      </section>

      {contests.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No contests fetched. Check your connection.
        </p>
      )}

      <SourceFooter />
    </div>
  );
}
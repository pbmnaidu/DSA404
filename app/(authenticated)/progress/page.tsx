"use client";



import { useEffect, useMemo, useState } from "react";
import { usePlan } from "@/hooks/usePlan";
import { useProblemCompletions } from "@/hooks/useProblemCompletions";
import { useContests } from "@/hooks/useContests";
import { ContestProgress } from "@/components/ContestsSection";
import { dayProgress, isDayComplete, todayIso } from "@/lib/plan";
import { listEvents, parseDaySnapshot, type ScheduleEventRow } from "@/lib/db";
import { EXTRA_PROBLEMS } from "@/lib/extra-problems-data";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Undo2, History, Calendar, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  computeBadges,
  currentStreak,
  difficultySplit,
  longestStreak,
  solvedTrend,
  weeklyStats,
} from "@/lib/gamification";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export default function ProgressPage() {
  const { days, loading, userId, resetAll, revertSchedule } = usePlan();
  const { completed: pbCompleted } = useProblemCompletions();
  const { contests } = useContests();
  const [events, setEvents] = useState<ScheduleEventRow[]>([]);
  const [revertingId, setRevertingId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    void listEvents(userId).then((rows) => setEvents(rows));
  }, [userId, days]);

  const stats = useMemo(() => {
    const counted = days.filter((d) => !d.skipped);
    const skippedDays = days.filter((d) => d.skipped);
    const total = counted.reduce((a, d) => a + dayProgress(d).total, 0);
    const done = counted.reduce((a, d) => a + dayProgress(d).done, 0);
    // Skipped problems (problems on skipped days — not completed, just skipped)
    const skippedProblems = skippedDays.reduce((a, d) => a + d.problems.length, 0);
    const completedDays = counted.filter(isDayComplete).length;
    const iso = todayIso();
    let streak = 0;
    for (const d of [...counted].filter((d) => d.date <= iso).reverse()) {
      if (isDayComplete(d)) streak += 1;
      else break;
    }
    const finish = days.length ? days[days.length - 1].date : "";
    // Practice / Extra Problems Tab (566)
    const pbTotal = EXTRA_PROBLEMS.length;
    const pbDone = EXTRA_PROBLEMS.filter((p) => pbCompleted.has(p.name)).length;

    // Combined All Problems (337 Core Plan + 566 Practice Problems = 903 Total)
    const combinedTotal = total + pbTotal;
    const combinedDone = done + pbDone;
    const grandTotal = combinedTotal + skippedProblems;
    const remaining = combinedTotal - combinedDone;

    return {
      total,
      done,
      pct: total ? Math.round((done / total) * 100) : 0,
      completedDays,
      countedDays: counted.length,
      skippedProblems,
      skippedDaysCount: skippedDays.length,
      streak,
      finish,
      pbDone,
      pbTotal,
      combinedDone,
      combinedTotal,
      combinedPct: combinedTotal ? Math.round((combinedDone / combinedTotal) * 100) : 0,
      grandTotal,
      remaining,
    };
  }, [days, pbCompleted]);

  const sections = useMemo(() => {
    const map = new Map<string, { done: number; total: number }>();
    days
      .filter((d) => !d.skipped)
      .forEach((d) => {
        const cur = map.get(d.section) ?? { done: 0, total: 0 };
        const p = dayProgress(d);
        map.set(d.section, { done: cur.done + p.done, total: cur.total + p.total });
      });
    return [...map.entries()];
  }, [days]);

  const streaks = useMemo(
    () => ({ current: currentStreak(days), longest: longestStreak(days) }),
    [days],
  );
  const week = useMemo(() => weeklyStats(days), [days]);
  const trend = useMemo(() => {
    const pbDoneTotal = EXTRA_PROBLEMS.filter((p) => pbCompleted.has(p.name)).length;
    const pbTotalCount = EXTRA_PROBLEMS.length;
    return solvedTrend(days).map((row) => ({
      ...row,
      pbCompleted: pbDoneTotal,
      pbTotal: pbTotalCount,
    }));
  }, [days, pbCompleted]);
  const split = useMemo(() => {
    // Start from plan-days split
    const base = difficultySplit(days);
    // Add problems-tab completions on top (from EXTRA_PROBLEMS only)
    const pbByDiff: Record<string, { done: number; remaining: number }> = {};
    EXTRA_PROBLEMS.forEach((p) => {
      if (!pbByDiff[p.difficulty]) pbByDiff[p.difficulty] = { done: 0, remaining: 0 };
      if (pbCompleted.has(p.name)) pbByDiff[p.difficulty].done += 1;
      else pbByDiff[p.difficulty].remaining += 1;
    });
    return base.map((row) => ({
      difficulty: row.difficulty,
      done: row.done + (pbByDiff[row.difficulty]?.done ?? 0),
      remaining: row.remaining + (pbByDiff[row.difficulty]?.remaining ?? 0),
    }));
  }, [days, pbCompleted]);
  const badges = useMemo(() => computeBadges(days), [days]);
  const earned = badges.filter((b) => b.earned);

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold tracking-tight">Progress</h1>

      <div className="mb-6 rounded-xl border border-border bg-card p-4">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="font-display font-semibold">Overall (Plan + Problems tab)</span>
          <span className="text-sm tabular-nums text-muted-foreground">
            {stats.combinedDone}/{stats.combinedTotal} problems · {stats.combinedPct}%
          </span>
        </div>
        <Progress value={stats.combinedPct} className="h-2" />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Core Plan (Today) Solved" value={`${stats.done}/${stats.total}`} />
        <Stat label="Problems Tab Solved" value={`${stats.pbDone}/${stats.pbTotal}`} />
        <Stat label="Total Problems Left" value={String(stats.remaining)} />
        <Stat label="Days Completed" value={`${stats.completedDays}/${stats.countedDays}`} />
      </div>

      {/* New Contests Section with Attendance Progress Bar */}
      <div className="mb-8">
        <ContestProgress contests={contests} />
      </div>

      {/* Skipped problems card — shown only when the student has skipped topics */}
      {stats.skippedProblems > 0 && (
        <div className="mb-8 rounded-xl border border-warning/40 bg-warning/8 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-warning">
                ⏭ {stats.skippedProblems} problem{stats.skippedProblems === 1 ? "" : "s"} skipped
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Across {stats.skippedDaysCount} skipped day{stats.skippedDaysCount === 1 ? "" : "s"} — these are not counted in your completion or graph.
                Go to <strong>Topics → Skipped</strong> to restore them anytime.
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold tabular-nums text-warning">{stats.skippedProblems}</p>
              <p className="text-xs text-muted-foreground">skipped</p>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade 4 — weekly snapshot + charts */}
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="This week solved" value={String(week.problemsSolved + stats.pbDone)} />
        <Stat label="Time invested (7d)" value={`${Math.round(week.minutesSpent / 60)}h`} />
        <Stat label="Active days (7d)" value={`${week.daysActive}/7`} />
        <Stat label="Longest streak" value={`${streaks.longest} days`} />
      </div>

      <h2 className="mb-3 font-display text-lg font-semibold">Solving trend</h2>
      <div className="mb-8 h-64 rounded-xl border border-border bg-card p-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trend} margin={{ left: -20, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="solvedFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.6} />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="pbFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
            <RTooltip
              contentStyle={{
                background: "var(--color-popover)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                color: "var(--color-popover-foreground)",
                fontSize: 12,
              }}
              formatter={(value, name) => {
                if (name === "Plan solved") return [`${value} problems`, "Plan (day)"];
                if (name === "Problems tab") return [`${value} / ${trend[0]?.pbTotal ?? 0} total`, "Problems tab (all-time)"];
                return [value, name];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area
              type="monotone"
              dataKey="solved"
              name="Plan solved"
              stroke="var(--color-primary)"
              fill="url(#solvedFill)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="pbCompleted"
              name="Problems tab"
              stroke="#22c55e"
              fill="url(#pbFill)"
              strokeWidth={2}
              strokeDasharray="5 3"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <h2 className="mb-3 font-display text-lg font-semibold">Difficulty split</h2>
      <div className="mb-8 h-64 rounded-xl border border-border bg-card p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={split} margin={{ left: -20, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="difficulty" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
            <RTooltip
              contentStyle={{
                background: "var(--color-popover)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                color: "var(--color-popover-foreground)",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="done" name="Done" stackId="a" fill="var(--color-success)" radius={[0, 0, 4, 4]} />
            <Bar dataKey="remaining" name="Remaining" stackId="a" fill="var(--color-muted)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h2 className="mb-3 font-display text-lg font-semibold">
        Badges <span className="text-sm font-normal text-muted-foreground">({earned.length}/{badges.length})</span>
      </h2>
      <ul className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {badges.map((b, i) => (
          <li
            key={b.code}
            style={{ "--i": i } as React.CSSProperties}
            className={
              b.earned
                ? "stagger-item rounded-lg border border-primary/40 bg-primary/10 p-3"
                : "stagger-item rounded-lg border border-border bg-card p-3 opacity-60"
            }
          >
            <p className="text-sm font-semibold">{b.label}</p>
            <p className="text-xs text-muted-foreground">{b.description}</p>
          </li>
        ))}
      </ul>

      <h2 className="mb-3 font-display text-lg font-semibold">By section</h2>
      <div className="mb-8 space-y-3">
        {sections.map(([section, s]) => (
          <div key={section} className="rounded-lg border border-border bg-card p-3">
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium">{section}</span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {s.done}/{s.total}
              </span>
            </div>
            <Progress
              value={s.total ? Math.round((s.done / s.total) * 100) : 0}
              className="h-1.5"
            />
          </div>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <History className="size-5 text-primary" />
          <h2 className="font-display text-lg font-semibold">Schedule History</h2>
        </div>
        <span className="text-[11px] text-muted-foreground font-mono bg-muted/60 px-2.5 py-1 rounded-full border border-border/50">
          Saved for 1 week · Auto-pruned permanently after 7 days
        </span>
      </div>

      {events.length === 0 ? (
        <div className="mb-8 rounded-xl border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
          <History className="mx-auto size-8 opacity-40 mb-2" />
          <p className="font-medium text-foreground">No schedule changes recorded yet.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Modifications like postponing days, rebalancing daily pace, skipping, or inserting revisions will appear here with 1-week revert capability.
          </p>
        </div>
      ) : (
        <ul className="mb-8 space-y-3">
          {events.map((e) => {
            const dateObj = new Date(e.createdAtIso);
            const isValidDate = !isNaN(dateObj.getTime());
            const dateStr = isValidDate
              ? dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
              : "Recent";
            const timeStr = isValidDate
              ? dateObj.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
              : "";
            
            const isRevertingThis = revertingId === e.id;

            return (
              <li
                key={e.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-xs hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      {e.kind}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                      <Calendar className="size-3 text-muted-foreground/70" />
                      <span>{dateStr}</span>
                      {timeStr && (
                        <>
                          <Clock className="size-3 text-muted-foreground/70 ml-1" />
                          <span>{timeStr}</span>
                        </>
                      )}
                    </span>
                    {e.canRevert ? (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="size-2.5" />
                        Revert Eligible (within 7 days)
                      </span>
                    ) : e.isWithinWeek ? (
                      <span className="text-[10px] font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        No Revert Snapshot
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        Expired (&gt; 1 week)
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-medium text-foreground leading-snug">
                    {e.detail}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {e.canRevert ? (
                    <ConfirmDialog
                      title="Revert this schedule change?"
                      description={`This will restore your entire schedule back to the state prior to this action: "${e.detail}". You can only revert changes within 1 week.`}
                      confirmWord="REVERT"
                      confirmLabel="Yes, Revert Schedule"
                      onConfirm={async () => {
                        if (!e.snapshot) return;
                        try {
                          setRevertingId(e.id);
                          const targetDays = parseDaySnapshot(e.snapshot);
                          await revertSchedule(targetDays, e.detail);
                          if (userId) {
                            const refreshed = await listEvents(userId);
                            setEvents(refreshed);
                          }
                        } catch (err: any) {
                          toast.error("Could not revert schedule", { description: err.message });
                        } finally {
                          setRevertingId(null);
                        }
                      }}
                      trigger={
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isRevertingThis}
                          className="h-8 gap-1.5 rounded-xl border-primary/30 text-xs font-bold text-primary hover:bg-primary/10 hover:text-primary transition-all cursor-pointer shadow-xs"
                          title="Restore schedule to the state before this change"
                        >
                          <Undo2 className="size-3.5" />
                          <span>{isRevertingThis ? "Reverting..." : "Revert this change"}</span>
                        </Button>
                      }
                    />
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="h-8 gap-1.5 rounded-xl text-xs font-semibold opacity-50 cursor-not-allowed"
                      title={
                        e.isWithinWeek
                          ? "Snapshot was not saved for this action."
                          : "Changes older than 1 week cannot be reverted and will be permanently deleted."
                      }
                    >
                      <Undo2 className="size-3.5" />
                      <span>{e.isWithinWeek ? "Revert Unavailable" : "Revert Expired"}</span>
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        title="Reset all progress?"
        description="This regenerates the full 120-day plan from scratch. Every tick, note, AI explainer and chat message is deleted."
        confirmWord="RESET"
        confirmLabel="Reset everything"
        onConfirm={resetAll}
        trigger={<Button variant="outline" className="text-destructive">Reset all progress</Button>}
      />
    </>
  );
}

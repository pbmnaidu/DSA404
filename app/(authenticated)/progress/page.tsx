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
import { Undo2, History, Calendar, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
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
    <div className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-border">
      <p className="text-[11px] uppercase tracking-wider text-foreground font-medium">{label}</p>
      <p className="mt-1.5 font-display text-2xl font-bold tabular-nums text-foreground">{value}</p>
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
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Editorial Header */}
      <div className="rounded-lg border border-border bg-card p-6 md:p-8 shadow-sm flex flex-col lg:flex-row items-start justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8  pointer-events-none">
          <History className="size-48" />
        </div>
        
        <div className="space-y-4 relative z-10 lg:w-1/2">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-muted border border-border text-primary flex items-center justify-center shrink-0">
              <History className="size-5" />
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-foreground">Analytics & Progress</h1>
          </div>
          <p className="text-sm text-foreground">
            Your overall learning analytics, achievement milestones, and schedule modifications.
          </p>

          <div className="pt-4 space-y-2">
            <div className="flex items-baseline justify-between text-sm font-semibold">
              <span>Overall Completion</span>
              <span className="tabular-nums text-primary">{stats.combinedPct}%</span>
            </div>
            <Progress value={stats.combinedPct} className="h-3 rounded-full" />
            <p className="text-xs text-foreground font-mono">
              {stats.combinedDone} of {stats.combinedTotal} problems solved across all modules
            </p>
          </div>
        </div>

        <div className="relative z-10 w-full lg:w-1/2 grid grid-cols-2 gap-4">
          <Stat label="Plan Solved" value={`${stats.done}/${stats.total}`} />
          <Stat label="Extra Solved" value={`${stats.pbDone}/${stats.pbTotal}`} />
          <Stat label="Days Complete" value={`${stats.completedDays}/${stats.countedDays}`} />
          <Stat label="Current Streak" value={`${streaks.current} Days`} />
        </div>
      </div>

      {stats.skippedProblems > 0 && (
        <div className="rounded-lg border border-border bg-muted p-6 flex items-center justify-between gap-4 shadow-sm">
          <div>
            <p className="text-sm font-bold text-warning flex items-center gap-2">
              <AlertTriangle className="size-4" /> {stats.skippedProblems} Problems Skipped
            </p>
            <p className="text-xs text-foreground mt-1">
              Across {stats.skippedDaysCount} skipped days. Restore them in Topics to count towards completion.
            </p>
          </div>
          <div className="text-2xl font-black text-warning bg-muted px-4 py-2 rounded-lg">
            {stats.skippedProblems}
          </div>
        </div>
      )}

      {/* Two Column Layout for Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COL: Charts & Weekly */}
        <div className="lg:col-span-8 space-y-8">
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-lg border border-border bg-card p-4 text-center">
              <p className="text-xs text-foreground uppercase font-bold">This Week</p>
              <p className="text-2xl font-black text-foreground mt-1">{week.problemsSolved + stats.pbDone}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 text-center">
              <p className="text-xs text-foreground uppercase font-bold">Time (7d)</p>
              <p className="text-2xl font-black text-foreground mt-1">{Math.round(week.minutesSpent / 60)}h</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 text-center">
              <p className="text-xs text-foreground uppercase font-bold">Active (7d)</p>
              <p className="text-2xl font-black text-foreground mt-1">{week.daysActive}/7</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 text-center">
              <p className="text-xs text-foreground uppercase font-bold">Longest</p>
              <p className="text-2xl font-black text-foreground mt-1">{streaks.longest}d</p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-6 flex items-center gap-2">
              <History className="size-4 text-primary" /> Solving Trajectory
            </h2>
            <div className="h-64 w-full bg-secondary rounded-lg p-2">
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
                  <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, color: "var(--color-popover-foreground)", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="solved" name="Plan solved" stroke="var(--color-primary)" fill="url(#solvedFill)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="pbCompleted" name="Extra solved" stroke="#22c55e" fill="url(#pbFill)" strokeWidth={2.5} strokeDasharray="5 3" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-6 flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" /> Difficulty Split
            </h2>
            <div className="h-64 w-full bg-secondary rounded-lg p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={split} margin={{ left: -20, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="difficulty" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                  <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, color: "var(--color-popover-foreground)", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="done" name="Done" stackId="a" fill="var(--color-primary)" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="remaining" name="Remaining" stackId="a" fill="var(--color-muted)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <History className="size-4 text-primary" /> Schedule History
              </h2>
              <span className="text-[10px] text-foreground font-mono bg-secondary px-2.5 py-1 rounded-md">
                1-week revert window
              </span>
            </div>
            
            {events.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-secondary p-8 text-center text-sm text-foreground">
                <History className="mx-auto size-8  mb-3" />
                <p className="font-bold text-foreground">No schedule changes recorded yet.</p>
                <p className="text-xs mt-1">Actions like postponing or skipping will appear here.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {events.map((e) => {
                  const dateObj = new Date(e.createdAtIso);
                  const isValidDate = !isNaN(dateObj.getTime());
                  const dateStr = isValidDate ? dateObj.toLocaleDateString() : "Recent";
                  
                  return (
                    <li key={e.id} className="rounded-lg border border-border bg-secondary p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-border transition-colors">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-muted text-primary border border-border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">{e.kind}</span>
                          <span className="text-xs font-mono text-foreground">{dateStr}</span>
                          {e.canRevert && (
                            <span className="text-[10px] font-bold text-success bg-muted px-2 py-0.5 rounded-full">Revertible</span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-foreground">{e.detail}</p>
                      </div>
                      <div className="shrink-0">
                        {e.canRevert ? (
                          <ConfirmDialog
                            title="Revert schedule change?"
                            description={`Restore schedule to before: "${e.detail}"`}
                            confirmWord="REVERT"
                            confirmLabel="Yes, Revert"
                            onConfirm={async () => {
                              if (!e.snapshot) return;
                              setRevertingId(e.id);
                              try {
                                await revertSchedule(parseDaySnapshot(e.snapshot), e.detail);
                                if (userId) setEvents(await listEvents(userId));
                              } catch (err: any) {
                                toast.error("Error", { description: err.message });
                              } finally {
                                setRevertingId(null);
                              }
                            }}
                            trigger={<Button variant="outline" size="sm" disabled={revertingId === e.id} className="h-8 gap-2 border-border text-primary hover:bg-muted hover:text-primary"><Undo2 className="size-3" /> Revert</Button>}
                          />
                        ) : (
                          <Button variant="outline" size="sm" disabled className="h-8 gap-2 "><Undo2 className="size-3" /> Expired</Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* RIGHT COL: Badges, Section Split, Danger Zone */}
        <div className="lg:col-span-4 space-y-8">
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-6 flex items-center justify-between">
              <span>Badges</span>
              <span className="text-primary">{earned.length}/{badges.length}</span>
            </h2>
            <ul className="grid grid-cols-2 gap-3">
              {badges.map((b, i) => (
                <li key={b.code} className={b.earned ? "rounded-lg border border-border bg-muted p-4 text-center" : "rounded-lg border border-border bg-secondary p-4 text-center  grayscale"}>
                  <div className="text-2xl mb-1">{b.earned ? '🏆' : '🔒'}</div>
                  <p className="text-[10px] font-black uppercase text-foreground leading-tight">{b.label}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-6">Topic Progress</h2>
            <div className="space-y-4">
              {sections.map(([section, s]) => (
                <div key={section} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-foreground truncate pr-2">{section}</span>
                    <span className="text-primary tabular-nums shrink-0">{s.done}/{s.total}</span>
                  </div>
                  <Progress value={s.total ? Math.round((s.done / s.total) * 100) : 0} className="h-1.5 bg-secondary" />
                </div>
              ))}
            </div>
          </div>
          
          <div className="rounded-lg border border-border bg-muted p-6 text-center">
            <h2 className="text-sm font-bold text-destructive mb-2">Danger Zone</h2>
            <p className="text-xs text-foreground mb-4">Resetting will permanently wipe your plan, notes, and progress.</p>
            <ConfirmDialog
              title="Reset all progress?"
              description="This regenerates the full 120-day plan from scratch. Every tick, note, and chat message is deleted."
              confirmWord="RESET"
              confirmLabel="Reset everything"
              onConfirm={resetAll}
              trigger={<Button variant="destructive" className="w-full font-bold">Reset Schedule</Button>}
            />
          </div>
        </div>

      </div>
    </div>
  );
}

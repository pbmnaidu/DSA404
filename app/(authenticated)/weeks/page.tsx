"use client";

import { useEffect, useMemo, useState } from "react";
import { usePlan } from "@/hooks/usePlan";
import { addDays, diffDays, formatDate, todayIso } from "@/lib/plan";
import type { Day } from "@/lib/types";
import { DayCard } from "@/components/DayCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ChevronDown, CalendarDays, LayoutGrid, Calendar, Code2, Map, Target, BookOpen, Clock, PlayCircle } from "lucide-react";
import { SkippedTopicSolveModal } from "@/components/SkippedTopicSolveModal";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ViewMode = "week" | "month" | "all";

/** Group days into clean 7-calendar-day weeks so every single scheduled date is properly shown */
function groupIntoWeeks(days: Day[]): Day[][] {
  if (!days || days.length === 0) return [];
  // Sort strictly by date in chronological order
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));

  const firstDate = sorted[0].date;
  const result: Day[][] = [];
  let currentWeek: Day[] = [];
  let currentWeekStartDate = firstDate;

  for (const day of sorted) {
    const diff = diffDays(currentWeekStartDate, day.date);
    if (diff >= 7 && currentWeek.length > 0) {
      result.push(currentWeek);
      currentWeek = [];
      const weeksPassed = Math.floor(diff / 7);
      currentWeekStartDate = addDays(currentWeekStartDate, weeksPassed * 7);
    }
    currentWeek.push(day);
  }
  if (currentWeek.length > 0) {
    result.push(currentWeek);
  }
  return result;
}

/** Group days by "YYYY-MM" */
function groupIntoMonths(days: Day[]): Record<string, Day[]> {
  const result: Record<string, Day[]> = {};
  for (const day of days) {
    const month = day.date.slice(0, 7); // e.g. "2026-08"
    if (!result[month]) result[month] = [];
    result[month].push(day);
  }
  return result;
}

function monthLabel(yearMonth: string) {
  const [year, month] = yearMonth.split("-");
  return new Date(`${year}-${month}-01T00:00:00Z`).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatDayDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function WeeksPage() {
  const { days, loading, skipTopic } = usePlan();
  const today = todayIso();

  // Scheduled days that form the active calendar timeline — includes content and weekly revision days
  const scheduledDays = useMemo(() => days.filter((d) => !d.skipped), [days]);
  const skippedDays = useMemo(
    () => days.filter((d) => d.skipped).sort((a, b) => a.dayNumber - b.dayNumber),
    [days],
  );

  // Group scheduled days into clean 7-calendar-day weeks so every single scheduled date is properly shown
  const weeks = useMemo(() => groupIntoWeeks(scheduledDays), [scheduledDays]);
  const monthsMap = useMemo(() => groupIntoMonths(scheduledDays), [scheduledDays]);
  const monthKeys = useMemo(() => Object.keys(monthsMap).sort(), [monthsMap]);

  // Find the current week index (the week that contains today, or the first upcoming week)
  const currentWeekIdx = useMemo(() => {
    if (weeks.length === 0) return 0;
    const idx = weeks.findIndex((week) =>
      week.some((d) => d.date === today),
    );
    if (idx >= 0) return idx;
    const nextIdx = weeks.findIndex((week) => week.some((d) => d.date >= today));
    return nextIdx >= 0 ? nextIdx : Math.max(0, weeks.length - 1);
  }, [weeks, today]);

  // Find the current month key
  const currentMonthKey = today.slice(0, 7);

  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [selectedWeekIdx, setSelectedWeekIdx] = useState<number>(() => Math.max(0, currentWeekIdx));
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(
    monthKeys.includes(currentMonthKey) ? currentMonthKey : monthKeys[0] ?? "",
  );
  const [selectedSkippedDay, setSelectedSkippedDay] = useState<Day | null>(null);

  // Sync selectedWeekIdx safely whenever weeks array changes (e.g. after skips/unskips)
  useEffect(() => {
    if (weeks.length > 0) {
      setSelectedWeekIdx((prev) => {
        if (prev < 0 || prev >= weeks.length) {
          return currentWeekIdx >= 0 && currentWeekIdx < weeks.length ? currentWeekIdx : 0;
        }
        return prev;
      });
    }
  }, [weeks.length, currentWeekIdx]);

  // Keep selectedWeekIdx in sync and safely bounded
  const safeWeekIdx = weeks.length > 0
    ? Math.max(0, Math.min(selectedWeekIdx < 0 ? (currentWeekIdx >= 0 ? currentWeekIdx : 0) : selectedWeekIdx, weeks.length - 1))
    : 0;

  // Compute progress stats for a week safely
  function weekStats(week: Day[] = []) {
    if (!week || week.length === 0) return { total: 0, done: 0, pct: 0 };
    const activeInWeek = week.filter((d) => !d.skipped && !d.isRevisionDay);
    const total = activeInWeek.reduce((s, d) => s + (d.problems?.length ?? 0), 0);
    const done = activeInWeek.reduce((s, d) => s + (d.problems?.filter((p) => p.done)?.length ?? 0), 0);
    return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  }

  function monthStats(mDays: Day[] = []) {
    if (!mDays || mDays.length === 0) return { total: 0, done: 0, pct: 0 };
    const total = mDays.reduce((s, d) => s + (d.problems?.length ?? 0), 0);
    const done = mDays.reduce((s, d) => s + (d.problems?.filter((p) => p.done)?.length ?? 0), 0);
    return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  }

  const SkippedSection = ({ list }: { list: Day[] }) =>
    list.length > 0 ? (
      <div className="rounded-lg border border-dashed border-border bg-card p-4">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold text-foreground">Skipped Topics</h3>
            <span className="text-[11px] font-medium text-success bg-muted border border-border px-2 py-0.5 rounded-full">
              Click to solve anytime
            </span>
          </div>
          <span className="text-xs tabular-nums text-foreground">
            {list.length} topic{list.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((d) => {
            const total = d.problems.length;
            const done = d.problems.filter((p) => p.done).length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            const isAllDone = done === total && total > 0;
            return (
              <div
                key={d.id}
                onClick={() => setSelectedSkippedDay(d)}
                className="group rounded-lg border border-dashed border-border bg-secondary hover:bg-secondary hover:border-border transition-all p-3.5 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider font-mono text-foreground">{d.section}</p>
                      <h4 className="mt-0.5 truncate text-sm font-bold text-foreground group-hover:text-primary transition-colors">{d.topic}</h4>
                    </div>
                    {total > 0 && (
                      <span className={cn(
                        "shrink-0 text-xs font-semibold tabular-nums px-2 py-0.5 rounded-md border",
                        isAllDone
                          ? "bg-muted text-success border-border"
                          : "bg-muted text-foreground border-border"
                      )}>
                        {done}/{total}
                      </span>
                    )}
                  </div>
                  {d.subtopics.length > 0 && (
                    <p className="mt-1.5 line-clamp-1 text-xs text-foreground">
                      {d.subtopics.join(" · ")}
                    </p>
                  )}
                  {total > 0 && (
                    <div className="mt-2.5 space-y-1">
                      <Progress value={pct} className="h-1 bg-muted" />
                    </div>
                  )}
                </div>

                <div className="mt-3.5 flex items-center justify-between gap-2 pt-2 border-t border-border">
                  <Button
                    size="sm"
                    className="h-7 px-2.5 text-xs bg-muted hover:bg-muted text-primary border border-border font-semibold gap-1.5 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSkippedDay(d);
                    }}
                  >
                    <Code2 className="size-3.5" />
                    <span>{isAllDone ? "Review Solutions" : "Solve Problems"}</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-foreground hover:text-foreground cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      void skipTopic(d.dayNumber, false);
                    }}
                  >
                    Un-skip
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    ) : null;

  const router = useRouter();

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto pt-10">
        <Skeleton className="h-16 w-3/4" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  // Calculate overall stats for the header
  const totalProbs = scheduledDays.reduce((s, d) => s + d.problems.length, 0);
  const doneProbs = scheduledDays.reduce((s, d) => s + d.problems.filter((p) => p.done).length, 0);
  const totalPct = totalProbs > 0 ? Math.round((doneProbs / totalProbs) * 100) : 0;

  return (
    <div className="min-h-screen text-foreground pb-20 animate-fade-in">
      <div className="mx-auto max-w-4xl space-y-12">
        
        {/* ── EDITORIAL HEADER ── */}
        <header className="space-y-6 pt-4">
          <div className="flex items-center gap-3 text-primary font-semibold text-sm tracking-widest uppercase">
            <Map className="size-4" />
            <span>Curriculum Map</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h1 className="font-display text-4xl sm:text-5xl font-black tracking-tight leading-none">
              Your Learning Journey
            </h1>
            <div className="text-right shrink-0">
              <div className="text-3xl font-black text-foreground tabular-nums leading-none mb-1">{totalPct}%</div>
              <div className="text-xs font-mono text-foreground uppercase tracking-widest">{doneProbs} / {totalProbs} Completed</div>
            </div>
          </div>
          <Progress value={totalPct} className="h-2 w-full bg-secondary" />
        </header>

        {/* ── PROGRESSION TIMELINE ── */}
        <div className="relative pl-6 sm:pl-10 space-y-16 before:absolute before:inset-y-0 before:left-[11px] sm:before:left-[19px] before:w-[2px] before:bg-border">
          {weeks.map((week, weekIdx) => {
            const stats = weekStats(week);
            const isCurrent = weekIdx === currentWeekIdx;
            const isCompleted = stats.pct === 100 && week.length > 0;
            const isFuture = weekIdx > currentWeekIdx;

            return (
              <div key={weekIdx} className="relative">
                {/* Timeline Node Indicator */}
                <div className={cn(
                  "absolute -left-[31px] sm:-left-[39px] top-1.5 flex size-5 items-center justify-center rounded-full border-2 bg-background z-10 transition-colors",
                  isCompleted ? "border-success" : isCurrent ? "border-primary" : "border-border"
                )}>
                  {isCompleted && <div className="size-2 rounded-full bg-success" />}
                  {isCurrent && <div className="size-2 rounded-full bg-primary animate-pulse" />}
                </div>

                {/* Week Header */}
                <div className="mb-6 space-y-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className={cn(
                      "font-display text-2xl font-bold tracking-tight",
                      isFuture ? "text-foreground" : "text-foreground"
                    )}>
                      Milestone {weekIdx + 1}
                    </h2>
                    {isCurrent && (
                      <span className="rounded-full bg-muted border border-border px-3 py-0.5 text-xs font-bold text-primary">
                        Current Focus
                      </span>
                    )}
                    {isCompleted && (
                      <span className="rounded-full bg-muted border border-border px-3 py-0.5 text-xs font-bold text-success">
                        Mastered
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-mono text-foreground uppercase tracking-wider">
                    {formatDate(week[0].date)} — {formatDate(week[week.length - 1].date)}
                  </p>
                </div>

                {/* Day Items (Vertical Stack instead of Card Grid) */}
                <div className="space-y-4">
                  {week.map((d, i) => {
                    const dTotal = d.problems.length;
                    const dDone = d.problems.filter(p => p.done).length;
                    const dPct = dTotal > 0 ? Math.round((dDone / dTotal) * 100) : 0;
                    const dCompleted = dTotal > 0 && dDone === dTotal;
                    const isToday = d.date === today;

                    return (
                      <div 
                        key={d.id} 
                        onClick={() => router.push(`/day/${d.dayNumber}`)}
                        className={cn(
                          "group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border p-4 sm:p-5 transition-all cursor-pointer shadow-sm hover:shadow-sm",
                          isToday
                            ? "border-primary bg-muted ring-1 ring-primary/20 hover:border-primary"
                            : dCompleted 
                            ? "border-border bg-card hover:border-border" 
                            : isCurrent 
                              ? "border-border bg-card hover:border-border"
                              : "border-border bg-card hover:bg-card hover:border-border"
                        )}
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono font-bold text-foreground uppercase">
                              Day {d.dayNumber}
                            </span>
                            <span className="text-xs text-foreground border-l border-border pl-2">
                              {d.section}
                            </span>
                            {isToday && (
                              <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                                Current
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                            {d.topic}
                          </h3>
                          <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
                            <CalendarDays className="size-4" aria-hidden="true" />
                            <span>{formatDayDate(d.date)}</span>
                          </div>
                          {d.subtopics.length > 0 && (
                            <p className="text-sm text-foreground line-clamp-1">
                              {d.subtopics.join(" · ")}
                            </p>
                          )}
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 sm:w-32">
                          <div className={cn(
                            "text-sm font-bold tabular-nums",
                            dCompleted ? "text-success" : "text-foreground"
                          )}>
                            {dDone} / {dTotal}
                          </div>
                          <Progress value={dPct} className="h-1.5 w-24" />
                        </div>

                        <div className="hidden sm:flex shrink-0 items-center justify-center pl-2">
                          <div className="rounded-full bg-secondary p-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <PlayCircle className="size-4" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── SKIPPED TOPICS ── */}
        <SkippedSection list={skippedDays} />
        <SkippedTopicSolveModal
          open={!!selectedSkippedDay}
          onOpenChange={(op) => !op && setSelectedSkippedDay(null)}
          day={selectedSkippedDay}
        />
      </div>
    </div>
  );
}

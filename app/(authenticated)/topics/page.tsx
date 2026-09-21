"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { usePlan } from "@/hooks/usePlan";
import { useSettings } from "@/hooks/useSettings";
import { useProblemCompletions } from "@/hooks/useProblemCompletions";
import {
  dayProgress,
  DEFAULT_DAILY_COUNTS,
  formatDate,
  normalizeDailyCounts,
  daysNeeded,
  type DailyCounts,
} from "@/lib/plan";
import {
  CURATED_SHEETS,
  getSectionsForSheet,
  getProblemsForSheet,
  getSheetMeta,
  getRespectedChannelForProblem,
  type SheetMeta,
} from "@/lib/sheets-data";
import type { MasterProblem } from "@/lib/master-problems";
import { getCanonicalProblemLink } from "@/lib/problems";
import { DayCard } from "@/components/DayCard";
import { CodeModal } from "@/components/CodeModal";
import { SkippedTopicSolveModal } from "@/components/SkippedTopicSolveModal";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Ban,
  Undo2,
  FileSpreadsheet,
  Download,
  BookOpen,
  Layers,
  Video,
  CheckCircle2,
  Circle,
  Check,
  Settings,
  Sparkles,
  ExternalLink,
  Code2,
  Eye,
  Flame,
  LayoutGrid,
  ListOrdered,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Day } from "@/lib/types";

function normalizeLevel(lvl?: string): "Level 1" | "Level 2" | "Level 3" {
  if (!lvl) return "Level 1";
  const s = lvl.toLowerCase();
  if (s.includes("3") || s.includes("advanced") || s.includes("hard")) return "Level 3";
  if (s.includes("2") || s.includes("intermediate") || s.includes("medium")) return "Level 2";
  return "Level 1";
}

/** How many problems of each difficulty appear in a day */
function diffCounts(day: Day) {
  const easy = day.problems.filter((p) => p.difficulty === "Easy").length;
  const medium = day.problems.filter((p) => p.difficulty === "Medium").length;
  const hard = day.problems.filter((p) => p.difficulty === "Hard").length;
  return { easy, medium, hard };
}

/** How many days this topic needs given the user's daily target */
function daysRequired(days: Day[], counts: DailyCounts) {
  const norm = normalizeDailyCounts(counts);
  const problems = days.flatMap((d) => d.problems);
  if (problems.length === 0) return 0;
  return daysNeeded(problems, norm);
}

const PLATFORM_COLORS: Record<string, string> = {
  LeetCode: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  GeeksforGeeks: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  GFG: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  Codeforces: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  CodeChef: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  HackerRank: "bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border-emerald-600/20",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  Medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  Hard: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
};

export default function TopicsPage() {
  const { days, loading: planLoading, skipSection, skipTopic, activeSheet, updateDay, startDate } = usePlan();
  const { settings } = useSettings();
  const { completed, submissions, submitCode, removeCode, loading: compLoading } = useProblemCompletions();

  const counts = useMemo(() => normalizeDailyCounts(settings?.counts), [settings?.counts]);
  const activePlanSheetId = activeSheet || settings?.activeSheet || "core404";
  const activePlanMeta = getSheetMeta(activePlanSheetId);

  // In Topic View, selecting a sheet is for VIEW PURPOSE ONLY (Settings is where the active plan is switched)
  const [viewedSheetId, setViewedSheetId] = useState<string>(activePlanSheetId);
  const [viewMode, setViewMode] = useState<"problems" | "days">("problems");
  const [selectedProblemForModal, setSelectedProblemForModal] = useState<{
    name: string;
    difficulty?: string;
    platform?: string;
    link?: string;
  } | null>(null);
  const [selectedSkippedDay, setSelectedSkippedDay] = useState<Day | null>(null);

  // Sync viewedSheetId with activeSheet initially or restore from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dsa_topics_viewed_sheet");
      if (saved && CURATED_SHEETS.some((s) => s.id === saved)) {
        setViewedSheetId(saved);
        return;
      }
    }
    setViewedSheetId(activePlanSheetId);
  }, [activePlanSheetId]);

  const viewedMeta = getSheetMeta(viewedSheetId);
  const isViewingActivePlan = viewedSheetId === activePlanSheetId;

  const handleSelectViewSheet = (sheetId: string) => {
    setViewedSheetId(sheetId);
    if (typeof window !== "undefined") {
      localStorage.setItem("dsa_topics_viewed_sheet", sheetId);
    }
    const meta = getSheetMeta(sheetId);
    toast.info(`Viewing ${meta.name}`, {
      description: `Exploring ${meta.topicCount} topics & problem progress. (Active daily plan: ${activePlanMeta.name})`,
      duration: 2500,
    });
  };

  // Combine problem completions from Firestore completions, submissions, and active days
  const allCompletedNames = useMemo(() => {
    const set = new Set<string>(completed);
    days.forEach((d) => {
      d.problems.forEach((p) => {
        if (p.done) set.add(p.name);
      });
    });
    return set;
  }, [completed, days]);

  // Compute progress across ALL curated sheets so user sees real-time progress for every sheet
  const sheetsProgress = useMemo(() => {
    const map: Record<string, { done: number; total: number; pct: number }> = {};
    for (const sheet of CURATED_SHEETS) {
      const sheetProbs = getProblemsForSheet(sheet.id);
      const total = sheetProbs.length;
      const done = sheetProbs.filter((p) => allCompletedNames.has(p.name)).length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      map[sheet.id] = { done, total, pct };
    }
    return map;
  }, [allCompletedNames]);

  // Toggle problem completion directly from Topic View and save to DB
  const handleToggleProblem = async (problem: { name: string; link?: string; platform?: string; difficulty?: string }) => {
    const isCurrentlyDone = allCompletedNames.has(problem.name);
    try {
      if (isCurrentlyDone) {
        await removeCode(problem.name);
        // Also update in active days if present
        const dayWithProb = days.find((d) => d.problems.some((p) => p.name === problem.name));
        if (dayWithProb) {
          void updateDay(dayWithProb.id, (d) => ({
            ...d,
            problems: d.problems.map((p) => (p.name === problem.name ? { ...p, done: false } : p)),
          }));
        }
        toast.info(`Marked "${problem.name}" as undone`);
      } else {
        const canonical = getCanonicalProblemLink(problem.name) || problem.link || "";
        // Resolve the day first so we can pass topic metadata to GitHub
        const dayWithProb = days.find((d) => d.problems.some((p) => p.name === problem.name));
        await submitCode(
          problem.name,
          submissions[problem.name]?.code || "// Completed from Topic View",
          canonical,
          "",
          dayWithProb?.topic,
          dayWithProb?.dayNumber,
          dayWithProb?.section,
          problem.difficulty,
        );
        // Also update in days if present
        if (dayWithProb) {
          void updateDay(dayWithProb.id, (d) => ({
            ...d,
            problems: d.problems.map((p) => (p.name === problem.name ? { ...p, done: true, completedAt: new Date().toISOString() } : p)),
          }));
        }
        toast.success(`Completed "${problem.name}"! 🎉`, {
          description: "Progress saved across all sheets.",
        });
      }
    } catch (e: any) {
      toast.error("Failed to update problem status", { description: e?.message });
    }
  };

  // Group topics for the currently selected viewed sheet
  const topicsList = useMemo(() => {
    const sections = getSectionsForSheet(viewedSheetId);
    const sectionDaysMap = new Map<string, Day[]>();

    if (isViewingActivePlan) {
      days.filter((d) => !d.isRevisionDay).forEach((d) => {
        const existing = sectionDaysMap.get(d.section) ?? [];
        existing.push(d);
        sectionDaysMap.set(d.section, existing);
      });
    }

    return sections.map((sec, idx) => {
      const topicDays = sectionDaysMap.get(sec.topic) ?? [];
      const activeDays = topicDays.filter((d) => !d.skipped);
      const allSkipped = topicDays.length > 0 && topicDays.every((d) => d.skipped);

      // Problems in this topic
      const problems = sec.problems && sec.problems.length > 0
        ? sec.problems
        : (topicDays.length > 0 ? topicDays.flatMap((d) => d.problems) : []);

      const done = problems.filter((p) => allCompletedNames.has(p.name)).length;
      const total = problems.length;
      const pct = total ? Math.round((done / total) * 100) : 0;

      const dc = problems.reduce(
        (acc, p) => {
          if (p.difficulty === "Easy") acc.easy++;
          else if (p.difficulty === "Medium") acc.medium++;
          else if (p.difficulty === "Hard") acc.hard++;
          return acc;
        },
        { easy: 0, medium: 0, hard: 0 }
      );

      const needed = activeDays.length > 0 ? daysRequired(activeDays, counts) : Math.ceil(total / (counts.target || 3));

      return {
        topicNo: sec.topicNo || idx + 1,
        section: sec.topic,
        subtopics: sec.subtopics ?? [],
        problems,
        daysList: activeDays,
        done,
        total,
        pct,
        allSkipped,
        daysNeeded: needed,
        diffCounts: dc,
      };
    });
  }, [viewedSheetId, isViewingActivePlan, days, allCompletedNames, counts]);

  const skippedDays = useMemo(
    () => (isViewingActivePlan ? days.filter((d) => d.skipped).sort((a, b) => a.dayNumber - b.dayNumber) : []),
    [days, isViewingActivePlan]
  );

  const totalSheetSolved = useMemo(() => {
    return topicsList.reduce((acc, t) => acc + t.done, 0);
  }, [topicsList]);

  const totalSheetProblems = useMemo(() => {
    return topicsList.reduce((acc, t) => acc + t.total, 0);
  }, [topicsList]);

  const sheetOverallPct = totalSheetProblems > 0 ? Math.round((totalSheetSolved / totalSheetProblems) * 100) : 0;

  if (planLoading || compLoading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  return (
    <>
      {/* ── Customized Sheet Selector Header Card ── */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-card to-card p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl border border-primary/30 bg-primary/15 p-2.5 text-primary shrink-0">
              <FileSpreadsheet className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-semibold uppercase text-primary tracking-wider">
                  Viewing Sheet
                </span>
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", viewedMeta.badgeColor)}>
                  {viewedMeta.badge}
                </span>
                {isViewingActivePlan ? (
                  <Badge variant="outline" className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1">
                    <CheckCircle2 className="size-3" /> Active Study Plan
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1">
                    <Eye className="size-3" /> View Only Mode
                  </Badge>
                )}
              </div>

              <h2 className="font-display text-lg font-bold text-foreground mt-0.5">
                {viewedMeta.name}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Curated by <strong>{viewedMeta.author}</strong> · Video tutorials by <strong>{viewedMeta.channel}</strong>
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-mono text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="size-3.5 text-primary" />
                  <strong className="text-foreground">{viewedMeta.problemCount}</strong> problems
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Layers className="size-3.5 text-primary" />
                  <strong className="text-foreground">{viewedMeta.topicCount}</strong> topics
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                  <strong>{totalSheetSolved}/{totalSheetProblems}</strong> solved ({sheetOverallPct}%)
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto shrink-0">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="font-mono text-xs gap-1.5 border-primary/30 hover:bg-primary/10"
            >
              <a
                href={viewedMeta.excelFile}
                download={viewedMeta.excelFileName}
                title={`Download ${viewedMeta.name} (.xlsx)`}
              >
                <Download className="size-3.5 text-primary" />
                Download Excel (.xlsx)
              </a>
            </Button>
          </div>
        </div>

        {/* Informative Note for View Purpose vs Settings Change */}
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-background/60 border border-primary/20 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary shrink-0" />
            <span className="text-muted-foreground leading-relaxed">
              <strong>Viewing Mode:</strong> Shift between sheets below to inspect all topics and track your progress across sheets. Your active daily study schedule is <strong className="text-foreground font-semibold">{activePlanMeta.name}</strong>.
            </span>
          </div>
          <Button asChild size="sm" variant="secondary" className="h-7 text-xs font-semibold rounded-lg shrink-0 gap-1 self-start sm:self-auto cursor-pointer">
            <Link href="/settings">
              <Settings className="size-3" /> Change Active Plan in Settings
            </Link>
          </Button>
        </div>

        {/* ── Quick Sheet Selector Pills (View Purpose Only) ── */}
        <div className="mt-4 pt-3.5 border-t border-border/60">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <span>Select your customized sheet:</span>
              <span className="text-[11px] font-normal text-muted-foreground">(Click any sheet to view its topics &amp; progress below)</span>
            </p>
            <span className="text-[10px] font-mono text-muted-foreground">Instant Topic Shift</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {CURATED_SHEETS.map((sheet) => {
              const isSelectedView = sheet.id === viewedSheetId;
              const isActivePlan = sheet.id === activePlanSheetId;
              const prog = sheetsProgress[sheet.id] || { done: 0, total: sheet.problemCount, pct: 0 };

              return (
                <button
                  key={sheet.id}
                  type="button"
                  onClick={() => handleSelectViewSheet(sheet.id)}
                  className={cn(
                    "flex flex-col items-center justify-between p-2.5 rounded-xl border text-center transition-all cursor-pointer relative group",
                    isSelectedView
                      ? "border-primary bg-primary/15 shadow-sm ring-2 ring-primary/40"
                      : "border-border bg-card/80 hover:border-primary/40 hover:bg-card hover:shadow-xs"
                  )}
                >
                  <div className="w-full flex items-center justify-between gap-1 mb-1">
                    <span className={cn(
                      "text-[11px] font-bold truncate max-w-full text-left",
                      isSelectedView ? "text-primary" : "text-foreground group-hover:text-primary"
                    )}>
                      {sheet.shortName}
                    </span>
                    {isActivePlan && (
                      <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" title="Active Daily Plan" />
                    )}
                  </div>

                  {/* Mini Progress Bar for Each Sheet */}
                  <div className="w-full space-y-1 mt-1">
                    <Progress value={prog.pct} className="h-1 bg-muted" />
                    <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground">
                      <span className="text-foreground font-semibold">{prog.done}/{prog.total}</span>
                      <span>{prog.pct}%</span>
                    </div>
                  </div>

                  <div className="mt-1 flex items-center gap-1 text-[9px] font-mono">
                    {isSelectedView ? (
                      <span className="text-primary font-bold flex items-center gap-0.5">
                        <Eye className="size-2.5" /> Viewing
                      </span>
                    ) : isActivePlan ? (
                      <span className="text-emerald-500 font-semibold flex items-center gap-0.5">
                        <CheckCircle2 className="size-2.5" /> Active Plan
                      </span>
                    ) : (
                      <span className="text-muted-foreground/70">Click to view</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Topic View Header ── */}
      <div className="mb-4 border-b border-border pb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Topic View</h1>
            <Badge variant="outline" className="text-xs font-mono font-bold bg-primary/10 text-primary border-primary/30">
              {viewedMeta.name}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {viewedMeta.topicCount} Topics · {totalSheetProblems} Problems · Solved:{" "}
            <span className="font-semibold text-emerald-500">{totalSheetSolved}/{totalSheetProblems} ({sheetOverallPct}%)</span>
          </p>
        </div>

        {/* View Mode Toggle when viewing active plan */}
        {isViewingActivePlan && (
          <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-xl border border-border text-xs">
            <button
              type="button"
              onClick={() => setViewMode("problems")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer",
                viewMode === "problems" ? "bg-card text-foreground font-bold shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ListOrdered className="size-3.5" />
              <span>Problems Checklist</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("days")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer",
                viewMode === "days" ? "bg-card text-foreground font-bold shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="size-3.5" />
              <span>Daily Schedule Cards</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Vertical Topic Order Accordion ── */}
      <Accordion
        type="multiple"
        defaultValue={topicsList.slice(0, 3).map((t) => t.section)}
        className="space-y-3"
      >
        {topicsList.map((s) => (
          <AccordionItem
            key={s.section}
            value={s.section}
            className="rounded-2xl border-2 border-border bg-card/60 px-4 overflow-hidden transition-all shadow-xs"
          >
            {/* Topic header */}
            <div className="flex w-full flex-wrap items-center justify-between gap-2 pt-2.5 pb-1.5">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="shrink-0 rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary font-mono">
                  Topic {String(s.topicNo).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <AccordionTrigger className="hover:no-underline py-1 text-left">
                    <span className="font-display text-sm sm:text-base md:text-lg font-bold break-words text-foreground">
                      {s.section}
                    </span>
                  </AccordionTrigger>
                </div>
              </div>

              {/* Progress count & Skip button */}
              <div className="flex shrink-0 items-center gap-2">
                <span className={cn(
                  "text-xs font-semibold tabular-nums whitespace-nowrap px-2 py-0.5 rounded-md border",
                  s.done === s.total && s.total > 0
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : "bg-muted text-muted-foreground border-border"
                )}>
                  {s.done}/{s.total} solved ({s.pct}%)
                </span>

                {isViewingActivePlan && (
                  <button
                    type="button"
                    className="flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-destructive transition-colors whitespace-nowrap cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      void skipSection(s.section, !s.allSkipped);
                    }}
                  >
                    {s.allSkipped ? (
                      <><Undo2 className="size-3" aria-hidden="true" /> Un-skip</>
                    ) : (
                      <><Ban className="size-3" aria-hidden="true" /> Skip</>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="pb-3 pt-0">
              <Progress value={s.pct} className="h-1.5 bg-muted" />
            </div>

            <AccordionContent>
              {s.total === 0 ? (
                <p className="pb-4 text-sm text-muted-foreground italic">
                  No problems registered for this topic in this sheet.
                </p>
              ) : (
                <div className="space-y-3 pb-2">
                  {/* Topic subtopics & capacity hint */}
                  <div className="rounded-xl border border-border/60 bg-muted/30 px-3.5 py-2 flex flex-wrap items-center justify-between gap-2">
                    {s.subtopics.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Patterns:</span>
                        {s.subtopics.map((pattern, pIdx) => (
                          <span
                            key={pIdx}
                            className="bg-background/80 text-foreground px-2 py-0.5 rounded-md border border-border/60 font-medium"
                          >
                            {pattern}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Standard topic sequence</span>
                    )}

                    {/* Difficulty chips */}
                    <div className="flex items-center gap-1.5 text-[11px] font-mono">
                      {s.diffCounts.easy > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                          {s.diffCounts.easy} Easy
                        </span>
                      )}
                      {s.diffCounts.medium > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold">
                          {s.diffCounts.medium} Medium
                        </span>
                      )}
                      {s.diffCounts.hard > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-semibold">
                          {s.diffCounts.hard} Hard
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ── View by Daily Schedule (Active Plan Only) ── */}
                  {isViewingActivePlan && viewMode === "days" && s.daysList.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-2 pt-1">
                      {s.daysList.map((d) => {
                        const dc = diffCounts(d);
                        return (
                          <div key={d.dayNumber} className="relative">
                            <DayCard day={d} showSkipAction />
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 px-1">
                              {dc.easy > 0 && (
                                <span className="inline-flex items-center rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                                  {dc.easy} Easy
                                </span>
                              )}
                              {dc.medium > 0 && (
                                <span className="inline-flex items-center rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400 tabular-nums">
                                  {dc.medium} Medium
                                </span>
                              )}
                              {dc.hard > 0 && (
                                <span className="inline-flex items-center rounded-md bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[11px] font-medium text-rose-600 dark:text-rose-400 tabular-nums">
                                  {dc.hard} Hard
                                </span>
                              )}
                              <span className="text-[11px] text-muted-foreground ml-auto font-mono">
                                {d.problems.length} {d.problems.length === 1 ? "problem" : "problems"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ── Problem Checklist (Available for ALL Sheets) ── */}
                  {(!isViewingActivePlan || viewMode === "problems" || s.daysList.length === 0) && (
                    <div className="rounded-xl border border-border/80 bg-background/40 overflow-hidden divide-y divide-border/60">
                      {s.problems.map((prob, pIdx) => {
                        const isDone = allCompletedNames.has(prob.name);
                        const hasCode = Boolean(submissions[prob.name]?.code);
                        const canonicalLink = getCanonicalProblemLink(prob.name) || prob.link || "";
                        const masterProb = prob as Partial<MasterProblem>;
                        const videoLink =
                          masterProb.videoUrl ||
                          getRespectedChannelForProblem(prob.name, viewedSheetId).youtubeSearchUrl;
                        const platColor = PLATFORM_COLORS[prob.platform || "LeetCode"] || "bg-muted text-muted-foreground border-border";
                        const diffColor = DIFFICULTY_COLORS[prob.difficulty] || "bg-muted text-muted-foreground border-border";

                        return (
                          <div
                            key={`${prob.name}-${pIdx}`}
                            className={cn(
                              "flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 sm:p-3 transition-colors hover:bg-muted/30",
                              isDone && "bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05]"
                            )}
                          >
                            {/* Left: Checkbox + Title + Meta */}
                            <div className="flex items-start gap-2.5 min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => handleToggleProblem(prob)}
                                className={cn(
                                  "size-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer",
                                  isDone
                                    ? "bg-emerald-500 border-emerald-500 text-white shadow-xs"
                                    : "border-border/80 bg-background hover:border-primary/60"
                                )}
                                title={isDone ? "Mark as undone" : "Mark as completed (saved to DB)"}
                              >
                                {isDone && <Check className="size-3.5 stroke-[3]" />}
                              </button>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {canonicalLink ? (
                                    <a
                                      href={canonicalLink}
                                      className={cn(
                                        "text-xs sm:text-sm font-semibold hover:text-primary transition-colors inline-flex items-center gap-1",
                                        isDone ? "text-muted-foreground line-through decoration-emerald-500/50" : "text-foreground"
                                      )}
                                      title={`Open ${prob.name} in application viewer`}
                                    >
                                      <span>{prob.name}</span>
                                      <ExternalLink className="size-3 opacity-50 shrink-0" />
                                    </a>
                                  ) : (
                                    <span className={cn(
                                      "text-xs sm:text-sm font-semibold",
                                      isDone ? "text-muted-foreground line-through" : "text-foreground"
                                    )}>
                                      {prob.name}
                                    </span>
                                  )}

                                  <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border", diffColor)}>
                                    {prob.difficulty}
                                  </span>

                                  {prob.platform && (
                                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border", platColor)}>
                                      {prob.platform}
                                    </span>
                                  )}
                                </div>

                                {masterProb.pattern && (
                                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                    {masterProb.pattern}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Right Actions: Code, Video, Link */}
                            <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                              {/* Code Modal Button */}
                              <button
                                type="button"
                                onClick={() => setSelectedProblemForModal({
                                  name: prob.name,
                                  difficulty: prob.difficulty,
                                  platform: prob.platform,
                                  link: canonicalLink,
                                })}
                                className={cn(
                                  "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg border transition-colors cursor-pointer",
                                  hasCode
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                                    : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                                )}
                                title={hasCode ? "View submitted code solution" : "Add code solution"}
                              >
                                <Code2 className="size-3" />
                                <span>{hasCode ? "View Code" : "Add Code"}</span>
                              </button>

                              {/* Video Tutorial Link */}
                              {videoLink && (
                                <a
                                  href={videoLink}
                                  className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/5 transition-colors cursor-pointer"
                                  title={`Watch video tutorial on ${masterProb.channel || viewedMeta.channel}`}
                                >
                                  <Video className="size-3.5" />
                                </a>
                              )}

                              {/* Practice Link */}
                              {canonicalLink && (
                                <a
                                  href={canonicalLink}
                                  className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-colors cursor-pointer"
                                  title="Open problem in application viewer (with Try in Chrome)"
                                >
                                  <ExternalLink className="size-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* ── Skipped Topics (Active Plan Only) ── */}
      {isViewingActivePlan && skippedDays.length > 0 && (
        <div className="mt-4">
          <Accordion type="single" collapsible className="space-y-3" defaultValue="__skipped__">
            <AccordionItem
              value="__skipped__"
              className="rounded-xl border border-dashed border-border bg-card/60 px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex w-full items-baseline justify-between gap-3 text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-semibold text-foreground">Skipped Topics in Active Plan</span>
                    <span className="text-[11px] font-medium text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      Click to solve anytime
                    </span>
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {skippedDays.length} topic{skippedDays.length === 1 ? "" : "s"}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-3 pb-2 sm:grid-cols-2 lg:grid-cols-3">
                  {skippedDays.map((d) => {
                    const { done, total, pct } = dayProgress(d);
                    const isAllDone = done === total && total > 0;
                    return (
                      <div
                        key={d.id}
                        onClick={() => setSelectedSkippedDay(d)}
                        className="group rounded-xl border border-dashed border-border bg-secondary/30 hover:bg-secondary/60 hover:border-primary/50 transition-all p-3.5 flex flex-col justify-between cursor-pointer"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">{d.section}</p>
                              <h4 className="mt-0.5 truncate text-sm font-bold text-foreground group-hover:text-primary transition-colors">{d.topic}</h4>
                            </div>
                            {total > 0 && (
                              <span className={cn(
                                "shrink-0 text-xs font-semibold tabular-nums px-2 py-0.5 rounded-md border",
                                isAllDone
                                  ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                                  : "bg-muted text-muted-foreground border-border"
                              )}>
                                {done}/{total}
                              </span>
                            )}
                          </div>
                          {d.subtopics.length > 0 && (
                            <p className="mt-1.5 line-clamp-1 text-xs text-muted-foreground">
                              {d.subtopics.join(" · ")}
                            </p>
                          )}
                          {total > 0 && (
                            <div className="mt-2.5 space-y-1">
                              <Progress value={pct} className="h-1 bg-muted" />
                            </div>
                          )}
                        </div>

                        <div className="mt-3.5 flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                          <Button
                            size="sm"
                            className="h-7 px-2.5 text-xs bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 font-semibold gap-1.5 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSkippedDay(d);
                            }}
                          >
                            <Code2 className="size-3.5" />
                            <span>{isAllDone ? "Review Solutions" : "Solve Problems"}</span>
                          </Button>

                          <button
                            type="button"
                            className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              void skipTopic(d.dayNumber, false);
                            }}
                          >
                            Un-skip
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}

      {/* ── Code Solution Modal ── */}
      {selectedProblemForModal && (
        <CodeModal
          open={!!selectedProblemForModal}
          onOpenChange={(open) => !open && setSelectedProblemForModal(null)}
          problemName={selectedProblemForModal.name}
          existingSubmission={submissions[selectedProblemForModal.name]}
          onSave={async (code, link, keyPoints) => {
            const effectiveLink = link || selectedProblemForModal.link || getCanonicalProblemLink(selectedProblemForModal.name) || "";
            // Resolve the day first so we can pass topic metadata to GitHub
            const dayWithProb = days.find((d) => d.problems.some((p) => p.name === selectedProblemForModal.name));
            await submitCode(selectedProblemForModal.name, code, effectiveLink, keyPoints, dayWithProb?.topic, dayWithProb?.dayNumber, dayWithProb?.section, selectedProblemForModal.difficulty);
            // Also update in active days if present
            if (dayWithProb) {
              void updateDay(dayWithProb.id, (d) => ({
                ...d,
                problems: d.problems.map((p) =>
                  p.name === selectedProblemForModal.name ? { ...p, done: true, completedAt: new Date().toISOString() } : p
                ),
              }));
            }
            toast.success("Code solution saved and synced! 🎉");
          }}
          readOnly={false}
        />
      )}

      {/* ── Skipped Topic Solve Modal ── */}
      <SkippedTopicSolveModal
        open={!!selectedSkippedDay}
        onOpenChange={(op) => !op && setSelectedSkippedDay(null)}
        day={selectedSkippedDay}
      />
    </>
  );
}

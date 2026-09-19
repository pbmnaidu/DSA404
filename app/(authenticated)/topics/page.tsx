"use client";

import { useMemo, useState } from "react";
import { usePlan } from "@/hooks/usePlan";
import { useSettings } from "@/hooks/useSettings";
import {
  dayProgress,
  DEFAULT_DAILY_COUNTS,
  formatDate,
  normalizeDailyCounts,
  daysNeeded,
  type DailyCounts,
} from "@/lib/plan";
import { CURATED_SHEETS, getSectionsForSheet, getSheetMeta, type SheetMeta } from "@/lib/sheets-data";
import { DayCard } from "@/components/DayCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
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
  Check,
  Loader2,
  ArrowRight,
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

export default function TopicsPage() {
  const { days, loading, skipSection, skipTopic, activeSheet, switchSheet, startDate } = usePlan();
  const { settings, update } = useSettings();
  const counts = useMemo(() => normalizeDailyCounts(settings?.counts), [settings?.counts]);

  const currentSheetId = activeSheet || settings?.activeSheet || "core404";
  const activeMeta = getSheetMeta(currentSheetId);
  const [switchingSheetId, setSwitchingSheetId] = useState<string | null>(null);

  async function handleSwitchSheet(sheetId: string) {
    if (sheetId === currentSheetId) return;
    setSwitchingSheetId(sheetId);
    try {
      await update({ activeSheet: sheetId });
      await switchSheet(sheetId);
      const targetMeta = getSheetMeta(sheetId);
      toast.success(`Switched to ${targetMeta.name}!`, {
        description: `Topic view and schedule re-seeded with ${targetMeta.problemCount} problems across ${targetMeta.topicCount} topics.`
      });
    } catch (err: any) {
      toast.error("Failed to switch sheet", {
        description: err?.message || "Please try again."
      });
    } finally {
      setSwitchingSheetId(null);
    }
  }

  // Group days by Topic dynamically based on active sheet's sections
  const topicsList = useMemo(() => {
    const sections = getSectionsForSheet(currentSheetId);
    const orderedTopicNames = sections.map((s) => s.topic);
    const sectionDaysMap = new Map<string, Day[]>();

    days.filter((d) => !d.isRevisionDay).forEach((d) => {
      const existing = sectionDaysMap.get(d.section) ?? [];
      existing.push(d);
      sectionDaysMap.set(d.section, existing);
    });

    const allTopicNames = Array.from(new Set([...orderedTopicNames, ...Array.from(sectionDaysMap.keys())]));

    return allTopicNames.map((topicName, idx) => {
      const topicDays = sectionDaysMap.get(topicName) ?? [];
      const active = topicDays.filter((d) => !d.skipped);
      const done = active.reduce((a, d) => a + dayProgress(d).done, 0);
      const total = active.reduce((a, d) => a + dayProgress(d).total, 0);
      const allSkipped = topicDays.length > 0 && topicDays.every((d) => d.skipped);
      const needed = daysRequired(active, counts);

      const levelCounts = active.reduce(
        (acc, d) => {
          d.problems.forEach((p) => {
            const lvl = normalizeLevel(p.level ?? d.level);
            if (lvl === "Level 1") acc.l1++;
            else if (lvl === "Level 2") acc.l2++;
            else if (lvl === "Level 3") acc.l3++;
          });
          return acc;
        },
        { l1: 0, l2: 0, l3: 0 }
      );

      const dc = active.reduce(
        (acc, d) => {
          const c = diffCounts(d);
          return { easy: acc.easy + c.easy, medium: acc.medium + c.medium, hard: acc.hard + c.hard };
        },
        { easy: 0, medium: 0, hard: 0 }
      );

      const coreSec = sections.find((s) => s.topic === topicName);

      return {
        topicNo: idx + 1,
        section: topicName,
        subtopics: coreSec?.subtopics ?? [],
        list: active,
        done,
        total,
        pct: total ? Math.round((done / total) * 100) : 0,
        allSkipped,
        daysNeeded: needed,
        diffCounts: dc,
        levelCounts,
      };
    }).filter((s) => s.total > 0 || s.allSkipped);
  }, [days, counts, currentSheetId]);

  const skippedDays = useMemo(
    () => days.filter((d) => d.skipped).sort((a, b) => a.dayNumber - b.dayNumber),
    [days],
  );

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <>
      {/* ── Customized Sheet Switcher Header Card ── */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-card to-card p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl border border-primary/30 bg-primary/15 p-2.5 text-primary shrink-0">
              <FileSpreadsheet className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-semibold uppercase text-primary tracking-wider">
                  Active Sheet
                </span>
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", activeMeta.badgeColor)}>
                  {activeMeta.badge}
                </span>
              </div>
              <h2 className="font-display text-lg font-bold text-foreground mt-0.5">
                {activeMeta.name}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Curated by <strong>{activeMeta.author}</strong> · Video tutorials by <strong>{activeMeta.channel}</strong>
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-mono text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="size-3.5 text-primary" />
                  <strong className="text-foreground">{activeMeta.problemCount}</strong> problems
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Layers className="size-3.5 text-primary" />
                  <strong className="text-foreground">{activeMeta.topicCount}</strong> topics
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
                href={activeMeta.excelFile}
                download={activeMeta.excelFileName}
                title={`Download ${activeMeta.name} (.xlsx)`}
              >
                <Download className="size-3.5 text-primary" />
                Download Excel (.xlsx)
              </a>
            </Button>
          </div>
        </div>

        {/* Quick Sheet Selector Pills */}
        <div className="mt-4 pt-4 border-t border-border/60">
          <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <span>Select your customized sheet:</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {CURATED_SHEETS.map((sheet) => {
              const isCurrent = sheet.id === currentSheetId;
              const isSwitching = switchingSheetId === sheet.id;

              if (isCurrent) {
                return (
                  <div
                    key={sheet.id}
                    className="flex flex-col items-center justify-center p-2 rounded-xl border border-primary bg-primary/15 text-center"
                  >
                    <span className="text-[11px] font-bold text-primary truncate max-w-full">
                      {sheet.shortName}
                    </span>
                    <span className="text-[9px] font-mono text-primary/80 flex items-center gap-1 mt-0.5">
                      <Check className="size-2.5" /> Active
                    </span>
                  </div>
                );
              }

              return (
                <ConfirmDialog
                  key={sheet.id}
                  trigger={
                    <button
                      type="button"
                      disabled={switchingSheetId !== null}
                      className="flex flex-col items-center justify-center p-2 rounded-xl border border-border bg-card/80 hover:border-primary/40 hover:bg-card text-center transition-all cursor-pointer group"
                    >
                      <span className="text-[11px] font-medium text-foreground group-hover:text-primary truncate max-w-full">
                        {sheet.shortName}
                      </span>
                      <span className="text-[9px] font-mono text-muted-foreground mt-0.5">
                        {sheet.problemCount} Qs · {sheet.topicCount} Topics
                      </span>
                    </button>
                  }
                  title={`Switch to ${sheet.name}?`}
                  description={`This will re-seed your plan with ${sheet.problemCount} problems across ${sheet.topicCount} topics from ${sheet.name}, starting from your plan start date (${formatDate(startDate)}).`}
                  confirmLabel={`Switch to ${sheet.shortName}`}
                  onConfirm={() => handleSwitchSheet(sheet.id)}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-4 border-b border-border pb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Topic View</h1>
          <p className="text-sm text-muted-foreground">
            {activeMeta.name} ({activeMeta.topicCount} Topics) · Daily target:{" "}
            <span className="font-semibold text-foreground">{counts.target} problems/day</span>
            {counts.tier && (
              <span className="text-xs text-muted-foreground font-mono ml-1">
                ({counts.tier.charAt(0).toUpperCase() + counts.tier.slice(1)} Pace)
              </span>
            )}
          </p>
        </div>
        <span className="text-xs font-mono text-muted-foreground">
          {topicsList.length} active topics · {topicsList.reduce((acc, t) => acc + t.total, 0)} problems
        </span>
      </div>

      {/* Vertical Topic Order */}
      <Accordion type="multiple" defaultValue={topicsList.slice(0, 3).map((t) => t.section)} className="space-y-3">
        {topicsList.map((s) => (
          <AccordionItem
            key={s.section}
            value={s.section}
            className="rounded-2xl border-2 border-border bg-card/50 px-4 overflow-hidden"
          >
            {/* Topic header */}
            <div className="flex w-full flex-wrap items-center justify-between gap-2 pt-2 pb-1">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="shrink-0 rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary font-mono">
                  Topic {String(s.topicNo).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <AccordionTrigger className="hover:no-underline py-1 text-left">
                    <span className="font-display text-sm sm:text-base md:text-lg font-bold break-words">
                      {s.section}
                    </span>
                  </AccordionTrigger>
                </div>
              </div>

              {/* Progress count & Skip button */}
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium tabular-nums whitespace-nowrap">
                  {s.done}/{s.total} problems
                </span>
                <button
                  type="button"
                  className="flex shrink-0 items-center gap-1 rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:text-destructive transition-colors whitespace-nowrap"
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
              </div>
            </div>

            {/* Progress bar */}
            <div className="pb-3 pt-0">
              <Progress value={s.pct} className="h-1.5" />
            </div>

            <AccordionContent>
              {s.list.length === 0 ? (
                <p className="pb-4 text-sm text-muted-foreground">
                  Every day in this topic is skipped.
                </p>
              ) : (
                <>
                  {/* Topic subtopics & capacity hint */}
                  <div className="mb-3 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
                    {s.subtopics.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Patterns:</span>
                        {s.subtopics.join(" · ")}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Daily pace:</span> {counts.target} problems/day
                      {" · "}<span className="font-medium text-foreground">Est. {s.daysNeeded} day{s.daysNeeded === 1 ? "" : "s"}</span>
                    </p>
                  </div>

                  {/* Day cards */}
                  <div className="grid gap-3 pb-2 sm:grid-cols-2">
                    {s.list.map((d) => {
                      const dc = diffCounts(d);
                      return (
                        <div key={d.dayNumber} className="relative">
                          <DayCard day={d} showSkipAction />
                          {/* Difficulty breakdown */}
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
                </>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Skipped days */}
      {skippedDays.length > 0 && (
        <div className="mt-4">
          <Accordion type="single" collapsible className="space-y-3">
            <AccordionItem
              value="__skipped__"
              className="rounded-xl border border-dashed border-border bg-card/60 px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex w-full items-baseline justify-between gap-3 text-left">
                  <span className="font-display font-semibold text-muted-foreground">Skipped Topics</span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {skippedDays.length} day{skippedDays.length === 1 ? "" : "s"}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-3 pb-2 sm:grid-cols-2">
                  {skippedDays.map((d) => {
                    const { done, total } = dayProgress(d);
                    return (
                      <div
                        key={d.id}
                        className="rounded-lg border border-dashed border-border bg-secondary/40 p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">{d.section}</p>
                            <h4 className="mt-0.5 truncate text-sm font-semibold">{d.topic}</h4>
                          </div>
                          {total > 0 && (
                            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                              {done}/{total}
                            </span>
                          )}
                        </div>
                        {d.subtopics.length > 0 && (
                          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                            {d.subtopics.join(" · ")}
                          </p>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-2 h-7 px-2 text-xs"
                          onClick={() => void skipTopic(d.dayNumber, false)}
                        >
                          <Undo2 className="mr-1 size-3" aria-hidden="true" /> Un-skip
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </>
  );
}

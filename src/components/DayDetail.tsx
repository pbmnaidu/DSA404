"use client";

import { useState, useEffect } from "react";
import { usePlan } from "@/hooks/usePlan";
import type { Day, DayStatus } from "@/lib/types";
import { addDays, formatDate, todayIso } from "@/lib/plan";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ProblemCardHorizontal } from "@/components/ProblemCardHorizontal";
import { TodayContestsSection } from "@/components/ContestsSection";
import { getChatGPTDayTopicPromptUrl } from "@/lib/aiTutorPrompt";
import {
 AlertTriangle,
 Sparkles,
 ListTodo,
 CheckCircle2,
 CalendarDays,
 Merge,
 Download,
 Trash2,
 RotateCcw,
 Ban,
 Undo2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import {
 Tooltip,
 TooltipContent,
 TooltipProvider,
 TooltipTrigger,
} from "@/components/ui/tooltip";

const STATUS_META: Record<
 DayStatus,
 { label: string; icon: string; className: string }
> = {
 pending: { label: "Pending", icon: "🟢", className: "text-success border-border bg-muted" },
 in_progress: { label: "In Progress", icon: "⚡", className: "text-primary border-primary bg-primary" },
 completed: { label: "Completed", icon: "✅", className: "text-success border-border bg-muted" },
 postponed: { label: "Postponed", icon: "⏳", className: "text-warning border-border bg-muted" },
 merged: { label: "Merged", icon: "🔀", className: "text-primary border-border bg-muted" },
 revision: { label: "Revision", icon: "🔁", className: "text-info border-border bg-muted" },
 skipped: { label: "Skipped", icon: "⏭️", className: "text-foreground border-border bg-muted" },
};

function HoverHint({ hint, children }: { hint: string; children: React.ReactNode }) {
 return (
 <TooltipProvider delayDuration={200}>
 <Tooltip>
 <TooltipTrigger asChild>{children}</TooltipTrigger>
 <TooltipContent side="top" className="max-w-xs text-xs">
 {hint}
 </TooltipContent>
 </Tooltip>
 </TooltipProvider>
 );
}

export function DayDetail({
 day,
 readOnly = false,
 lateMode = false,
 headerOnly = false,
 hideHeader = false,
 hideContests = false,
}: {
 day: Day;
 readOnly?: boolean;
 lateMode?: boolean;
 headerOnly?: boolean;
 hideHeader?: boolean;
 hideContests?: boolean;
}) {
 const {
 days,
 updateDay,
 toggleReview,
 postpone,
 mergeTomorrow,
 unmerge,
 borrowFromNext,
 deleteDay,
 deleteProblem,
 skipTopic,
 restoreDay,
 } = usePlan();

  const [isPushingNotes, setIsPushingNotes] = useState(false);
  const handlePushNotes = async () => {
    if (isPushingNotes) return;
    setIsPushingNotes(true);
    const loadingToast = toast.loading("Pushing Today's Notes to GitHub......");
    try {
      const res = await fetch("/api/push-notes", { 
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: day.notes, date: day.date, dayNumber: day.dayNumber })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message, { id: loadingToast });
        updateDay(day.dayNumber, (d) => ({ ...d, notesPushedAt: new Date().toISOString() }));
      } else {
        toast.error(data.error || "Failed to push notes.", { id: loadingToast });
      }
    } catch (err) {
      toast.error("An error occurred while pushing notes.", { id: loadingToast });
    } finally {
      setIsPushingNotes(false);
    }
  };

  // Auto-push logic at 11:55 PM
  useEffect(() => {
      const checkAndAutoPush = () => {
          const now = new Date();
          if (now.getHours() === 23 && now.getMinutes() >= 55) {
              const todayStr = new Date().toISOString().split('T')[0];
              // check if notes exist and not already pushed today
              if (day.notes && (!day.notesPushedAt || day.notesPushedAt.split('T')[0] !== todayStr)) {
                  handlePushNotes();
              }
          }
      };
      
      const interval = setInterval(checkAndAutoPush, 60000); // Check every minute
      return () => clearInterval(interval);
  }, [day.notes, day.notesPushedAt, day.dayNumber]);

 const [newDate, setNewDate] = useState(() => addDays(day.date, 1));

 const total = day.problems.length;
 const done = day.problems.filter((p) => p.done).length;
 const pct = total === 0 ? 100 : Math.round((done / total) * 100);

 const checklistTotal = day.checklist.length;
 const checklistDone = day.checklist.filter((c) => c.done).length;
 const checklistPct = checklistTotal === 0 ? 100 : Math.round((checklistDone / checklistTotal) * 100);

 const activeDays = days.filter((d) => !d.skipped);
 const tomorrow = activeDays.find((d) => d.dayNumber === day.dayNumber + 1);
 const anyDone = day.problems.some((p) => p.done);
 const status: DayStatus = day.skipped ? "skipped" : done === total && total > 0 ? "completed" : day.status;

 const locked = readOnly && !lateMode;
 const schedulingLocked = locked || day.skipped;

 const hasActionToRestore =
 day.skipped ||
 status === "postponed" ||
 status === "merged" ||
 Boolean(day.mergeSnapshot) ||
 Boolean(day.skippedProblems && day.skippedProblems.length > 0) ||
 day.problems.some((p) => Boolean(p.borrowedFromDay) || Boolean(p.carriedFromDay));

 const remaining = activeDays.filter((d) => d.dayNumber >= day.dayNumber).length;
 const gap = Math.max(
 1,
 Math.round((new Date(newDate).getTime() - new Date(day.date).getTime()) / (1000 * 60 * 60 * 24))
 );
 const lastActiveDay = activeDays.at(-1);

 const headerCard = (
 <header className="rounded-lg border border-border bg-card p-4 sm:p-5 shadow-sm space-y-3">
 {/* Top Meta & Actions Row */}
 <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
 <div className="flex items-center gap-2">
 <span className="text-xs uppercase tracking-wide text-foreground font-semibold">
 Day {day.dayNumber} · Week {Math.ceil(day.dayNumber / 7)} · {formatDate(day.date)}
 </span>
 <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${STATUS_META[status].className}`}>
 {STATUS_META[status].icon} {STATUS_META[status].label}
 </span>
 </div>

 {/* Schedule Action Buttons (Flex-wrap rowwise on mobile screens) */}
 {!schedulingLocked && (
 <div className="flex flex-wrap items-center gap-1.5 py-0.5 max-w-full">
 {/* Postpone */}
 {anyDone ? (
 <HoverHint hint="Postpone is locked because at least one problem is done">
 <Button variant="secondary" size="sm" className="h-7 text-[11px] px-2.5 rounded-lg font-semibold shrink-0 whitespace-nowrap" disabled>
 <CalendarDays className="size-3 mr-1 text-foreground" />
 <span>Postpone</span>
 </Button>
 </HoverHint>
 ) : (
 <HoverHint hint="Push this day's date forward — topic order stays intact">
 <div className="inline-block shrink-0">
 <ConfirmDialog
 trigger={
 <Button variant="secondary" size="sm" className="h-7 text-[11px] px-2.5 rounded-lg font-semibold shrink-0 whitespace-nowrap">
 <CalendarDays className="size-3 mr-1 text-primary" />
 <span>Postpone</span>
 </Button>
 }
 title="Postpone this day"
 description="The topic order stays intact — only the calendar moves."
 confirmLabel="Postpone"
 preview={
 <div className="space-y-2">
 <div className="space-y-1.5">
 <Label htmlFor="new-date">New date</Label>
 <Input
 id="new-date"
 type="date"
 value={newDate}
 min={addDays(day.date, 1)}
 onChange={(e) => setNewDate(e.target.value)}
 />
 </div>
 <p>
 Pushes {remaining} remaining day{remaining === 1 ? "" : "s"} forward by {gap} day{gap === 1 ? "" : "s"}.
 </p>
 </div>
 }
 onConfirm={() => postpone(day.dayNumber, newDate)}
 />
 </div>
 </HoverHint>
 )}

 {/* Merge Tomorrow */}
 {tomorrow ? (
 <HoverHint hint="Pull tomorrow's topic & problems into today — shortens schedule by 1 day">
 <div className="inline-block shrink-0">
 <ConfirmDialog
 trigger={
 <Button variant="secondary" size="sm" className="h-7 text-[11px] px-2.5 rounded-lg font-semibold shrink-0 whitespace-nowrap">
 <Merge className="size-3 mr-1 text-primary" />
 <span>Merge Tomorrow</span>
 </Button>
 }
 title="Pull tomorrow's topic into today"
 confirmLabel="Merge"
 preview={
 <p>
 "{tomorrow.topic}" ({tomorrow.problems.length} problems) is merged into day {day.dayNumber}.
 </p>
 }
 onConfirm={() => mergeTomorrow(day.dayNumber)}
 />
 </div>
 </HoverHint>
 ) : day.status === "merged" && day.mergeSnapshot ? (
 <HoverHint hint={`Split day back into "${day.mergeSnapshot.baseTopic}" and "${day.mergeSnapshot.absorbedTopic}"`}>
 <div className="inline-block shrink-0">
 <ConfirmDialog
 trigger={
 <Button variant="secondary" size="sm" className="h-7 text-[11px] px-2.5 rounded-lg font-semibold shrink-0 whitespace-nowrap">
 <RotateCcw className="size-3 mr-1 text-warning" />
 <span>Unmerge</span>
 </Button>
 }
 title="Unmerge this day"
 confirmLabel="Unmerge"
 preview={<p>Splits today back into two separate days.</p>}
 onConfirm={() => unmerge(day.dayNumber)}
 />
 </div>
 </HoverHint>
 ) : null}

 {/* Borrow Problem */}
 {(() => {
 const nextActive = activeDays.find((d) => d.dayNumber === day.dayNumber + 1);
 const nextHasUndone = nextActive?.problems.some((p) => !p.done) ?? false;
 if (!nextActive || !nextHasUndone) return null;
 const borrowedProblem = nextActive.problems.find((p) => !p.done);
 return (
 <HoverHint hint={`Borrow "${borrowedProblem?.name}" from tomorrow into today`}>
 <div className="inline-block shrink-0">
 <ConfirmDialog
 trigger={
 <Button variant="secondary" size="sm" className="h-7 text-[11px] px-2.5 rounded-lg font-semibold shrink-0 whitespace-nowrap">
 <Download className="size-3 mr-1 text-success" />
 <span>Borrow Problem</span>
 </Button>
 }
 title="Borrow a problem from tomorrow"
 confirmLabel="Borrow"
 preview={
 <p>Moves <strong>"{borrowedProblem?.name}"</strong> into today.</p>
 }
 onConfirm={() => borrowFromNext(day.dayNumber)}
 />
 </div>
 </HoverHint>
 );
 })()}

 {/* Delete Day */}
 {anyDone ? (
 <HoverHint hint="Delete is locked because a problem is done">
 <Button variant="ghost" size="sm" className="h-7 text-[11px] px-2 text-destructive rounded-lg shrink-0 whitespace-nowrap" disabled>
 <Trash2 className="size-3 mr-1" />
 <span>Delete</span>
 </Button>
 </HoverHint>
 ) : (
 <HoverHint hint="Removes this day entirely and shifts later days back by 1 day">
 <div className="inline-block shrink-0">
 <ConfirmDialog
 trigger={
 <Button variant="ghost" size="sm" className="h-7 text-[11px] px-2 text-destructive rounded-lg hover:bg-muted shrink-0 whitespace-nowrap">
 <Trash2 className="size-3 mr-1" />
 <span>Delete</span>
 </Button>
 }
 title="Delete this day"
 confirmLabel="Shrink schedule by 1 day"
 destructive
 preview={
 <p>Removes day {day.dayNumber} and shifts later days forward. Want it back later? Go to the Topic section and unskip it.</p>
 }
 onConfirm={() => deleteDay(day.dayNumber, "shrink")}
 />
 </div>
 </HoverHint>
 )}

 {/* Skip Topic */}
 <HoverHint hint="Skip this topic — next scheduled topic immediately replaces it for today">
 <div className="inline-block shrink-0">
 <ConfirmDialog
 trigger={
 <Button
 variant="secondary"
 size="sm"
 className="h-7 text-[11px] px-2.5 rounded-lg font-semibold shrink-0 whitespace-nowrap text-warning hover:text-warning"
 >
 <Ban className="size-3 mr-1" />
 <span>Skip Topic</span>
 </Button>
 }
 title={`Skip "${day.topic}"?`}
 description={`This topic will be marked as skipped. The next scheduled topic will immediately shift forward to take its place on today's calendar. You can un-skip it anytime from the Topics tab or using Restore.`}
 confirmLabel="Skip Topic"
 onConfirm={() => skipTopic(day.dayNumber, true)}
 />
 </div>
 </HoverHint>

 {/* Restore / Revert Button — Appears ONLY when an operation (merge/postpone/skip/borrow/delete) was performed */}
 {hasActionToRestore && !locked && (
 <HoverHint hint="Restore / Revert performed action on this day — restores merged or skipped topics, or returns borrowed/deleted problems">
 <Button
 variant="outline"
 size="sm"
 className="h-7 text-[11px] px-2.5 rounded-lg font-semibold shrink-0 whitespace-nowrap border-border text-success hover:bg-muted hover:text-success gap-1 bg-muted shadow-sm"
 onClick={async (e) => {
 e.stopPropagation();
 await restoreDay(day.dayNumber);
 }}
 >
 <RotateCcw className="size-3.5 text-success" />
 <span>Restore</span>
 </Button>
 </HoverHint>
 )}
 </div>
 )}
 </div>

 {/* Topic Title & Subtopics Row */}
 <div className="flex flex-wrap items-start sm:items-center justify-between gap-3">
 <div className="space-y-1">
 <div className="flex items-center gap-2.5 flex-wrap">
 <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">{day.topic}</h2>
 <HoverHint hint="Ask ChatGPT to explain today's topic, patterns, intuition, and review all assigned problems">
 <a
 href={getChatGPTDayTopicPromptUrl(day)}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted hover:bg-muted text-success hover:text-success px-3 py-1 text-xs font-bold transition-all shadow-sm hover:shadow-success hover:scale-[1.02] active:scale-[0.98] shrink-0"
 >
 <Sparkles className="size-3.5 text-success" />
 <span>ChatGPT</span>
 </a>
 </HoverHint>
 </div>
 <p className="text-xs font-medium text-foreground">{day.section}</p>
 </div>

 {day.subtopics.length > 0 && (
 <ul className="flex flex-wrap gap-1">
 {day.subtopics.map((s, i) => (
 <li key={`${s}-${i}`} className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-[10px] font-semibold text-foreground">
 {s}
 </li>
 ))}
 </ul>
 )}
 </div>

 {/* Progress Bar */}
 <div className="space-y-1 pt-1">
 <div className="flex items-center justify-between text-[11px] font-bold">
 <span className="text-foreground">Topic Progress</span>
 <span className="text-primary">{done}/{total} done ({pct}%)</span>
 </div>
 <Progress value={pct} aria-label={`${pct}% of today's problems complete`} />
 </div>
 </header>
 );

 if (headerOnly) {
 return headerCard;
 }

 return (
 <article aria-label={`Details for Day ${day.dayNumber}`} className="space-y-6 animate-fade-in pb-12">
 {lateMode && (
 <div role="alert" className="flex items-center gap-3 rounded-lg border border-border bg-muted p-4 text-sm text-warning shadow-sm">
 <AlertTriangle className="size-5 shrink-0 text-warning" />
 <span>This is a past uncompleted day. Submitting code or checking items here will still count towards your stats.</span>
 </div>
 )}

 {!hideHeader && headerCard}

 <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-[minmax(0,0.35fr)_minmax(0,0.65fr)]">
 
 {/* ── LEFT COLUMN: Context & Checklists ── */}
 <aside className="min-w-0 space-y-6 order-2 xl:order-1">
 
 {/* Reduced Height Completion Checklist UI */}
 <section aria-label="Daily checklist" className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4">
 <div className="flex items-center justify-between gap-2">
 <div className="flex items-center gap-2">
 <ListTodo className="size-4 text-success" />
 <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">Completion Checklist</h3>
 </div>
 <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[10px] font-bold text-success">
 {checklistDone} / {checklistTotal} ({checklistPct}%)
 </span>
 </div>

 <ul className="flex flex-col gap-2.5">
 {day.checklist.map((c, i) => (
 <li
 key={`${c.label}-${i}`}
 className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
 c.done
 ? "border-border bg-muted text-success font-semibold"
 : "border-border bg-secondary text-foreground hover:bg-secondary"
 }`}
 >
 <Checkbox
 id={`c-${day.dayNumber}-${i}`}
 checked={c.done}
 disabled={locked}
 className="size-4 rounded-md border-border text-success data-[state=checked]:bg-success data-[state=checked]:border-success"
 onCheckedChange={(v) =>
 void updateDay(day.dayNumber, (d) => ({
 ...d,
 checklist: d.checklist.map((x, xi) =>
 xi === i ? { ...x, done: Boolean(v) } : x,
 ),
 }))
 }
 />
 <Label
 htmlFor={`c-${day.dayNumber}-${i}`}
 className={`cursor-pointer text-xs leading-snug flex-1 select-none ${
 c.done ? "text-success font-semibold" : ""
 }`}
 >
 {c.label}
 </Label>
 {c.done && <CheckCircle2 className="size-4 text-success shrink-0" />}
 </li>
 ))}
 </ul>
 </section>


 </aside>

 {/* ── RIGHT COLUMN: Workspace (Problems & Contests) ── */}
 <main className="min-w-0 space-y-6 order-1 xl:order-2">
 
 <section
 aria-label="Today's Core Problems"
 className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-6 relative overflow-hidden"
 >
 {/* Header */}
 <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
 <div className="flex items-center gap-4">
 <div className="size-12 rounded-lg bg-muted border border-border text-primary flex items-center justify-center shrink-0">
 <Sparkles className="size-6" />
 </div>
 <div>
 <h3 className="text-xl font-display font-black tracking-tight text-foreground">
 Core Problem Set
 </h3>
 <p className="text-sm text-foreground mt-1">
 Curated problems to master {day.topic}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <span className="rounded-full bg-secondary border border-border px-4 py-1.5 text-sm font-bold text-foreground">
 {done} / {total} Solved
 </span>
 {done === total && total > 0 && (
 <span className="rounded-full bg-muted border border-border px-4 py-1.5 text-sm font-bold text-success flex items-center gap-2">
 <CheckCircle2 className="size-4" /> All Complete
 </span>
 )}
 </div>
 </div>

 {day.isRevisionDay ? (
 <div className="space-y-4 pt-2">
 {(!day.revisionDayNumbers || day.revisionDayNumbers.length === 0) ? (
 <div className="rounded-lg border border-dashed border-border bg-secondary p-8 text-center text-sm text-foreground">
 No study days from this week yet — check back once you've solved a few!
 </div>
 ) : (
 <>
 <p className="text-sm text-foreground bg-muted border border-border p-4 rounded-lg text-primary">
 Sunday is set aside for revision — revisit this week's topics and re-solve the problems from scratch to lock in the patterns.
 </p>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {day.revisionDayNumbers.map((n) => {
 const wd = days.find((x) => x.dayNumber === n);
 if (!wd) return null;
 return (
 <button
 key={n}
 type="button"
 onClick={() => { window.location.href = `/day/${wd.dayNumber}`; }}
 className="group flex flex-col justify-between gap-4 rounded-lg border border-border bg-secondary hover:bg-secondary hover:border-border p-5 text-left transition-all"
 >
 <div className="w-full space-y-1">
 <div className="flex items-center justify-between">
 <span className="text-xs font-bold uppercase tracking-wider text-primary">Day {wd.dayNumber}</span>
 <RotateCcw className="size-4 text-foreground group-hover:text-primary transition-colors" />
 </div>
 <p className="text-base font-bold text-foreground line-clamp-1">{wd.topic}</p>
 <p className="text-xs text-foreground">{wd.problems.length} Problems to Revise</p>
 </div>
 </button>
 );
 })}
 </div>
 </>
 )}
 </div>
 ) : total === 0 ? (
 <div className="rounded-lg border border-dashed border-border bg-secondary p-8 text-center text-sm text-foreground">
 No problems on this day — it is a buffer date.
 </div>
 ) : (
 <div className="grid min-w-0 grid-cols-1 gap-5 pt-2">
 {day.problems.map((p, i) => (
 <ProblemCardHorizontal
 key={`${p.name}-${i}`}
 problem={p}
 readOnly={locked}
 topic={day.topic}
 dayNumber={day.dayNumber}
 section={day.section}
 onToggle={() =>
 void updateDay(day.dayNumber, (d) => ({
 ...d,
 problems: d.problems.map((x) =>
 x.name === p.name
 ? { ...x, done: !x.done, completedAt: !x.done ? todayIso() : undefined }
 : x
 ),
 }))
 }
 onToggleReview={
 locked ? undefined : () => void toggleReview(day.dayNumber, p.name, !p.forReview)
 }
 onSkip={
 locked ? undefined : () => void deleteProblem(day.dayNumber, p.name)
 }
 />
 ))}
 </div>
 )}
 </section>

 {!hideContests && (
 <div className="rounded-lg overflow-hidden border border-border shadow-sm">
 <TodayContestsSection />
 </div>
 )}

 </main>
 </div>

 {/* ── FULL WIDTH ROW: Notes & Revision ── */}
 <section aria-label="Learning notes workspace" className="w-full min-w-0 pt-6">
 <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
 
 {/* Daily Notes */}
 <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-6 shadow-sm">
 <div className="flex items-center justify-between">
            <Label htmlFor={`notes-${day.dayNumber}`} className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              Today's Notes & Takeaways
            </Label>
            <HoverHint hint="Push Today's Notes to GitHub">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="h-7 text-[10px] uppercase font-bold tracking-wider gap-1.5 bg-background hover:bg-accent disabled:opacity-50"
                onClick={handlePushNotes}
                disabled={isPushingNotes || locked}
              >
                <UploadCloud className={cn("size-3.5", isPushingNotes && "animate-pulse")} />
                {isPushingNotes ? "Pushing..." : "Push"}
              </Button>
            </HoverHint>
          </div>
 <Textarea
 id={`notes-${day.dayNumber}`}
 rows={5}
 defaultValue={day.notes}
 placeholder="Write key code snippets, intuitions, or algorithm patterns..."
 disabled={locked}
 className="flex-1 bg-secondary border-border rounded-lg text-sm resize-none focus-visible:ring-primary/20 p-4"
 onBlur={(e) => void updateDay(day.dayNumber, (d) => ({ ...d, notes: e.target.value }))}
 />
 {(!day.notesPushedAt || day.notesPushedAt.split("T")[0] !== new Date().toISOString().split("T")[0]) && day.notes && (
    <p className="text-[11px] text-warning flex items-center gap-1.5 mt-1">
      <AlertTriangle className="size-3" />
      Notes not pushed today. Please push manually if the auto-push at 11:55 PM was missed.
    </p>
 )}
 {day.notesPushedAt && day.notesPushedAt.split("T")[0] === new Date().toISOString().split("T")[0] && (
    <p className="text-[11px] text-success flex items-center gap-1.5 mt-1">
      <CheckCircle2 className="size-3" />
      Notes successfully pushed today!
    </p>
 )}
 </div>

 {/* Revision Reminders */}
 <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-6 shadow-sm">
 <Label htmlFor={`rev-${day.dayNumber}`} className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
 Revision Reminders
 </Label>
 <Textarea
 id={`rev-${day.dayNumber}`}
 rows={5}
 defaultValue={day.revisionNotes}
 placeholder="Important edge cases, time complexities, or trick points to remember..."
 disabled={locked}
 className="flex-1 bg-secondary border-border rounded-lg text-sm resize-none focus-visible:ring-primary/20 p-4"
 onBlur={(e) =>
 void updateDay(day.dayNumber, (d) => ({ ...d, revisionNotes: e.target.value }))
 }
 />
 </div>

 </div>
 </section>
 </article>
 );
}

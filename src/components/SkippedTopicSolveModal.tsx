"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CodeModal } from "@/components/CodeModal";
import { usePlan } from "@/hooks/usePlan";
import { useProblemCompletions } from "@/hooks/useProblemCompletions";
import { getCanonicalProblemLink } from "@/lib/problems";
import { getChatGPTAiPromptUrl } from "@/lib/aiTutorPrompt";
import type { Day, Problem } from "@/lib/types";
import {
  Check,
  CheckCircle2,
  Code2,
  ExternalLink,
  Sparkles,
  Undo2,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

interface SkippedTopicSolveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  day: Day | null;
}

export function SkippedTopicSolveModal({
  open,
  onOpenChange,
  day,
}: SkippedTopicSolveModalProps) {
  const { days, updateDay, skipTopic } = usePlan();
  const { completed, submissions, submitCode, removeCode } = useProblemCompletions();

  // Find the latest state of this day in usePlan days
  const liveDay = useMemo(() => {
    if (!day) return null;
    return days.find((d) => d.id === day.id || d.dayNumber === day.dayNumber) ?? day;
  }, [days, day]);

  const [selectedProblemForModal, setSelectedProblemForModal] = useState<Problem | null>(null);

  if (!liveDay) return null;

  const total = liveDay.problems.length;
  const done = liveDay.problems.filter((p) => p.done || completed.has(p.name)).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = done === total && total > 0;

  const handleToggleProblem = async (problem: Problem) => {
    const isCurrentlyDone = problem.done || completed.has(problem.name);
    try {
      if (isCurrentlyDone) {
        await removeCode(problem.name);
        await updateDay(liveDay.dayNumber, (d) => ({
          ...d,
          problems: d.problems.map((p) =>
            p.name === problem.name ? { ...p, done: false, completedAt: undefined } : p
          ),
        }));
        toast.info(`Marked "${problem.name}" as undone`);
      } else {
        const canonical = getCanonicalProblemLink(problem.name) || problem.link || "";
        await submitCode(
          problem.name,
          submissions[problem.name]?.code || "// Completed from Skipped Section",
          canonical,
          "",
          liveDay.topic,
          liveDay.dayNumber,
          liveDay.section,
          problem.difficulty,
        );
        await updateDay(liveDay.dayNumber, (d) => ({
          ...d,
          problems: d.problems.map((p) =>
            p.name === problem.name
              ? { ...p, done: true, completedAt: new Date().toISOString() }
              : p
          ),
        }));
        toast.success(`Completed "${problem.name}"! 🎉`, {
          description: "Progress saved and counted towards topic completion.",
        });
      }
    } catch (e: any) {
      toast.error("Failed to update problem status", { description: e?.message });
    }
  };

  const handleUnskip = async () => {
    try {
      await skipTopic(liveDay.dayNumber, false);
      toast.success(`"${liveDay.topic}" restored to active schedule!`);
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Failed to un-skip topic", { description: e?.message });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl border-border/80 bg-card shadow-2xl">
          <DialogHeader className="space-y-3 pb-3 border-b border-border">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  {liveDay.section}
                </span>
                <Badge variant="outline" className="text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                  Skipped Topic
                </Badge>
                <Badge variant="outline" className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                  Solve Anytime
                </Badge>
                {allDone && (
                  <Badge variant="outline" className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border-emerald-500/40 gap-1">
                    <CheckCircle2 className="size-3" /> All Solved ✨
                  </Badge>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleUnskip}
                className="h-7 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
                title="Restore this topic into your active calendar schedule"
              >
                <Undo2 className="size-3" />
                <span>Un-skip Topic</span>
              </Button>
            </div>

            <div>
              <DialogTitle className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                {liveDay.topic}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                You can solve these problems anytime. All solved problems are counted toward your topic and sheet progress, recorded in your stats and activity heatmap, without cluttering today's workspace.
              </DialogDescription>
            </div>

            {/* Subtopics */}
            {liveDay.subtopics.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {liveDay.subtopics.map((s, idx) => (
                  <span
                    key={`${s}-${idx}`}
                    className="rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}

            {/* Progress bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Award className="size-3.5 text-primary" />
                  <span>Topic Completion Progress</span>
                </span>
                <span className={cn(
                  "font-mono",
                  allDone ? "text-emerald-500" : "text-primary"
                )}>
                  {done} / {total} Solved ({pct}%)
                </span>
              </div>
              <Progress value={pct} className="h-2 bg-muted" />
            </div>
          </DialogHeader>

          {/* Problem Checklist */}
          <div className="space-y-2.5 py-2">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-1">
              <span>Problems in this topic ({total})</span>
              <span>Mark done or submit code solution</span>
            </div>

            {liveDay.problems.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-4 text-center">
                No problems registered for this topic.
              </p>
            ) : (
              <div className="rounded-xl border border-border bg-background/50 overflow-hidden divide-y divide-border/60">
                {liveDay.problems.map((prob, pIdx) => {
                  const isDone = prob.done || completed.has(prob.name);
                  const hasCode = Boolean(submissions[prob.name]?.code);
                  const canonicalLink = getCanonicalProblemLink(prob.name) || prob.link || "";
                  const platColor =
                    PLATFORM_COLORS[prob.platform || "LeetCode"] ||
                    "bg-muted text-muted-foreground border-border";
                  const diffColor =
                    DIFFICULTY_COLORS[prob.difficulty] ||
                    "bg-muted text-muted-foreground border-border";
                  const chatGptUrl = getChatGPTAiPromptUrl(prob.name);

                  return (
                    <div
                      key={`${prob.name}-${pIdx}`}
                      className={cn(
                        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 transition-colors hover:bg-muted/30",
                        isDone && "bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06]"
                      )}
                    >
                      {/* Left: Checkbox + Title + Meta */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => handleToggleProblem(prob)}
                          className={cn(
                            "size-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer",
                            isDone
                              ? "bg-emerald-500 border-emerald-500 text-white shadow-xs"
                              : "border-border/80 bg-background hover:border-primary/60"
                          )}
                          title={isDone ? "Mark as undone" : "Mark as completed"}
                        >
                          {isDone && <Check className="size-3.5 stroke-[3]" />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {canonicalLink ? (
                              <a
                                href={canonicalLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                  "text-sm font-semibold hover:text-primary transition-colors inline-flex items-center gap-1",
                                  isDone
                                    ? "text-muted-foreground line-through decoration-emerald-500/50"
                                    : "text-foreground"
                                )}
                                title={`Open ${prob.name}`}
                              >
                                <span>{prob.name}</span>
                                <ExternalLink className="size-3 opacity-50 shrink-0" />
                              </a>
                            ) : (
                              <span
                                className={cn(
                                  "text-sm font-semibold",
                                  isDone ? "text-muted-foreground line-through" : "text-foreground"
                                )}
                              >
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
                        </div>
                      </div>

                      {/* Right: Code Modal, ChatGPT, Links */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        {/* Code Modal Button */}
                        <button
                          type="button"
                          onClick={() => setSelectedProblemForModal(prob)}
                          className={cn(
                            "inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer",
                            hasCode
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                              : "bg-muted/60 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                          )}
                          title={hasCode ? "View submitted code solution" : "Add code solution"}
                        >
                          <Code2 className="size-3.5" />
                          <span>{hasCode ? "View Code" : "Add Code"}</span>
                        </button>

                        {/* ChatGPT Prompt Button */}
                        <a
                          href={chatGptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                          title="Ask ChatGPT to explain this problem"
                        >
                          <Sparkles className="size-3.5" />
                        </a>

                        {/* Practice Link */}
                        {canonicalLink && (
                          <a
                            href={canonicalLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-colors cursor-pointer"
                            title="Open problem in new tab"
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

          <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {done} of {total} problems completed in this skipped topic
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs font-semibold px-4 rounded-lg cursor-pointer"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Code Modal for adding / inspecting code */}
      {selectedProblemForModal && (
        <CodeModal
          open={!!selectedProblemForModal}
          onOpenChange={(op) => !op && setSelectedProblemForModal(null)}
          problemName={selectedProblemForModal.name}
          existingSubmission={submissions[selectedProblemForModal.name]}
          onSave={async (code, link, keyPoints) => {
            const effectiveLink =
              link || selectedProblemForModal.link || getCanonicalProblemLink(selectedProblemForModal.name) || "";
            await submitCode(selectedProblemForModal.name, code, effectiveLink, keyPoints, liveDay.topic, liveDay.dayNumber, liveDay.section, selectedProblemForModal.difficulty);
            await updateDay(liveDay.dayNumber, (d) => ({
              ...d,
              problems: d.problems.map((p) =>
                p.name === selectedProblemForModal.name
                  ? { ...p, done: true, completedAt: new Date().toISOString() }
                  : p
              ),
            }));
            toast.success(`Solution code saved for "${selectedProblemForModal.name}"! 🎉`);
          }}
          readOnly={false}
        />
      )}
    </>
  );
}

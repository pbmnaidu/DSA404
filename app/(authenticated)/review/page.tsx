"use client";



import { useMemo } from "react";
import { usePlan } from "@/hooks/usePlan";
import { formatDate, todayIso } from "@/lib/plan";
import { ProblemRow } from "@/components/ProblemRow";
import { Skeleton } from "@/components/ui/skeleton";
import { BookmarkCheck } from "lucide-react";
import { TopicReminderSection } from "@/components/TopicReminderSection";


export default function ReviewPage() {
  const { days, loading, updateDay, toggleReview } = usePlan();

  const flagged = useMemo(
    () =>
      days
        .flatMap((d) => d.problems.filter((p) => p.forReview).map((p) => ({ day: d, problem: p })))
        .sort((a, b) => a.day.dayNumber - b.day.dayNumber),
    [days],
  );

  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Editorial Header */}
      <div className="rounded-lg border border-border bg-card p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8  pointer-events-none">
          <BookmarkCheck className="size-48" />
        </div>
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-muted border border-border text-primary flex items-center justify-center shrink-0">
              <BookmarkCheck className="size-5" />
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-foreground">Review Workspace</h1>
          </div>
          <p className="text-sm text-foreground max-w-xl">
            Problems you flagged for another look, gathered from every day. Tap the bookmark on a problem in Today to add or remove it.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <aside className="w-full">
          <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
            <TopicReminderSection />
          </div>
        </aside>

        <main className="w-full space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
            <BookmarkCheck className="size-4 text-primary" /> Flagged Problems
          </h2>
          {flagged.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-secondary p-12 text-center text-sm text-foreground flex flex-col items-center gap-3">
              <BookmarkCheck className="size-8 " />
              <p>Nothing flagged yet — use the bookmark button on any problem in Today to send it here.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {flagged.map(({ day, problem }) => {
                const isToday = day.date === todayIso();
                return (
                  <li key={`${day.dayNumber}-${problem.name}`} className="rounded-lg border border-border bg-card p-4 shadow-sm hover:border-border transition-colors">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-foreground mb-3 flex items-center gap-2">
                      <span className="text-primary">Day {day.dayNumber}</span>
                      <span>•</span>
                      <span>{formatDate(day.date)}</span>
                      <span>•</span>
                      <span>{day.topic}</span>
                      {!isToday && <span className="ml-auto bg-secondary px-2 py-0.5 rounded-full text-[9px]">View Only</span>}
                    </p>
                    <ul>
                      <ProblemRow
                        problem={problem}
                        readOnly={!isToday}
                        topic={day.topic}
                        dayNumber={day.dayNumber}
                        section={day.section}
                        onToggle={
                          isToday
                            ? (v) =>
                                void updateDay(day.dayNumber, (d) => ({
                                  ...d,
                                  problems: d.problems.map((x) =>
                                    x.name === problem.name ? { ...x, done: v, completedAt: v ? todayIso() : undefined } : x,
                                  ),
                                }))
                            : undefined
                        }
                        onReview={() =>
                          void toggleReview(day.dayNumber, problem.name, !problem.forReview)
                        }
                      />
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}
        </main>
      </div>
    </div>
  );
}

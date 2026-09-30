// src/components/DailyCombinationsBreakdown.tsx
"use client";

import React, { useMemo, useState } from "react";
import {
  getDailyCombinationsForTarget,
  analyzePlanDailyCombinations,
  type DailyProblemCombination,
} from "@/lib/plan";
import type { Day } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Sparkles, Scale, Layers, Flame, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyCombinationsBreakdownProps {
  target: number;
  days?: Day[];
  className?: string;
  showPlanFrequency?: boolean;
}

export function DailyCombinationsBreakdown({
  target,
  days,
  className = "",
  showPlanFrequency = true,
}: DailyCombinationsBreakdownProps) {
  const [activeTab, setActiveTab] = useState<number>(target);

  // Sync tab with external target when target changes
  React.useEffect(() => {
    setActiveTab(target);
  }, [target]);

  const combinations = useMemo(() => {
    return getDailyCombinationsForTarget(activeTab);
  }, [activeTab]);

  const planAnalysis = useMemo(() => {
    if (!days || days.length === 0) return null;
    return analyzePlanDailyCombinations(days);
  }, [days]);

  return (
    <div className={cn("space-y-4 rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/5 via-card/80 to-card p-4 sm:p-5 shadow-sm", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
              <Scale className="size-4 text-primary" />
              Valid Daily Problem Combinations in Your Plan
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[10px] font-mono font-bold">
              {activeTab} PROBLEMS / DAY
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
            Every study day strictly follows one of these balanced configurations based on <strong className="text-foreground font-semibold">2E = 1M</strong> and <strong className="text-foreground font-semibold">3E = 1H</strong> weightage.
          </p>
        </div>

        {/* Target Quick Switcher Tabs */}
        <div className="flex items-center gap-1 self-start sm:self-auto bg-muted/60 p-1 rounded-xl border border-border/80 text-xs font-mono">
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setActiveTab(num)}
              className={cn(
                "px-2 py-0.5 rounded-lg font-bold transition-all text-xs cursor-pointer",
                activeTab === num
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title={`View valid daily combinations for ${num} problems/day`}
            >
              {num}P
            </button>
          ))}
        </div>
      </div>

      {/* Combinations Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {combinations.map((c: DailyProblemCombination) => {
          // Check if this combination matches any days in the real plan
          const matchKey = `${c.easy}E_${c.medium}M_${c.hard}H`;
          const planCount = planAnalysis?.combinationCounts[matchKey]?.count ?? 0;

          return (
            <div
              key={c.id}
              className="relative flex flex-col justify-between rounded-xl border border-border/80 bg-background/70 hover:border-primary/50 hover:bg-background/95 transition-all p-3 space-y-2 shadow-xs group"
            >
              {/* Top: Day type & Estimated Time */}
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground truncate">
                    {c.dayType}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground shrink-0">
                    <Clock className="size-2.5 text-primary" />
                    ~{c.timeEstimateMin}m
                  </span>
                </div>

                {/* Difficulty Pills Breakdown */}
                <div className="flex flex-wrap items-center gap-1.5 my-1">
                  {c.easy > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 px-2 py-0.5 text-xs font-mono font-bold">
                      {c.easy} Easy
                    </span>
                  )}
                  {c.medium > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 px-2 py-0.5 text-xs font-mono font-bold">
                      {c.medium} Medium
                    </span>
                  )}
                  {c.hard > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 px-2 py-0.5 text-xs font-mono font-bold">
                      {c.hard} Hard
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-foreground/90 leading-tight mt-1">
                  {c.description}
                </p>
              </div>

              {/* Bottom: Workload weight & Live roadmap occurrences */}
              <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2 text-[10px] font-mono text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="font-bold text-foreground">{c.weight}</span> workload units
                </span>

                {showPlanFrequency && planCount > 0 ? (
                  <span className="text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                    {planCount} days in plan
                  </span>
                ) : (
                  <span className="text-muted-foreground opacity-80">
                    {c.totalProblems} {c.totalProblems === 1 ? "problem" : "problems"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Roadmap Frequency Analysis (if plan days available) */}
      {showPlanFrequency && planAnalysis && planAnalysis.uniqueCombinations.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <Layers className="size-3.5 text-primary" />
              Actual Problem Distribution in Your Active Roadmap:
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {days?.filter((d) => !d.skipped && !d.isRevisionDay)?.length || 0} active study days
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-0.5">
            {planAnalysis.uniqueCombinations.slice(0, 6).map((comb, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-mono shadow-2xs"
              >
                <span className="font-bold text-foreground">{comb.label}</span>
                <span className="text-muted-foreground">→</span>
                <span className="font-bold text-primary">{comb.count} days</span>
                {comb.sampleTopics.length > 0 && (
                  <span className="text-[9px] text-muted-foreground hidden sm:inline truncate max-w-[120px]" title={comb.sampleTopics.join(", ")}>
                    ({comb.sampleTopics[0]})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tutor Pedagogical Workload Guarantee Banner */}
      <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs text-emerald-900 dark:text-emerald-200">
        <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Student Anti-Burnout Guarantee:</strong> You will never be burdened with an impossible load such as <em>3 Easy + 2 Medium + 1 Hard</em> on a single day. Daily workloads strictly cap at your chosen capacity (~{activeTab * 15}–{activeTab * 25} mins/day).
        </p>
      </div>
    </div>
  );
}

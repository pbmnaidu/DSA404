"use client";

import React from "react";

interface DifficultyBreakdownProps {
  easy: number | null;
  medium: number | null;
  hard: number | null;
  total?: number | null;
}

export function DifficultyBreakdown({ easy, medium, hard, total }: DifficultyBreakdownProps) {
  if (easy === null && medium === null && hard === null) {
    return (
      <div className="text-xs text-foreground italic py-1">
        Difficulty statistics not provided by platform
      </div>
    );
  }

  const e = easy ?? 0;
  const m = medium ?? 0;
  const h = hard ?? 0;
  const sum = total || (e + m + h) || 1;

  const ePct = Math.round((e / sum) * 100);
  const mPct = Math.round((m / sum) * 100);
  const hPct = Math.min(100 - ePct - mPct, Math.round((h / sum) * 100));

  return (
    <div className="space-y-2">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-white">
        <div style={{ width: `${ePct}%` }} className="bg-success transition-all" title={`Easy: ${e}`} />
        <div style={{ width: `${mPct}%` }} className="bg-warning transition-all" title={`Medium: ${m}`} />
        <div style={{ width: `${hPct}%` }} className="bg-destructive transition-all" title={`Hard: ${h}`} />
      </div>

      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center text-xs">
        <div className="rounded-lg border border-border bg-muted p-1.5 sm:p-2">
          <span className="text-[10px] sm:text-[11px] font-bold text-success block uppercase truncate">Easy</span>
          <span className="font-extrabold text-xs sm:text-sm text-foreground tabular-nums">{easy !== null ? easy : "N/A"}</span>
        </div>
        <div className="rounded-lg border border-border bg-muted p-1.5 sm:p-2">
          <span className="text-[10px] sm:text-[11px] font-bold text-warning block uppercase truncate">Medium</span>
          <span className="font-extrabold text-xs sm:text-sm text-foreground tabular-nums">{medium !== null ? medium : "N/A"}</span>
        </div>
        <div className="rounded-lg border border-border bg-muted p-1.5 sm:p-2">
          <span className="text-[10px] sm:text-[11px] font-bold text-destructive block uppercase truncate">Hard</span>
          <span className="font-extrabold text-xs sm:text-sm text-foreground tabular-nums">{hard !== null ? hard : "N/A"}</span>
        </div>
      </div>
    </div>
  );
}

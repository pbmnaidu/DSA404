"use client";

import { useState } from "react";
import type { Badge } from "@/lib/gamification";
import { Award, Lock, ShieldCheck, Trophy, Zap, Star, Target, CheckCircle2 } from "lucide-react";

export interface BadgesGridProps {
  badges: Badge[];
}

function getBadgeIcon(code: string, earned: boolean) {
  const iconClass = earned ? "size-5 text-amber-500 dark:text-amber-400" : "size-5 text-muted-foreground/60";
  if (code.startsWith("streak_")) return <Zap className={iconClass} />;
  if (code.startsWith("first_")) return <Target className={iconClass} />;
  if (code === "halfway") return <Star className={iconClass} />;
  if (code === "finisher") return <Trophy className={iconClass} />;
  if (code.startsWith("section_")) return <ShieldCheck className={iconClass} />;
  return <Award className={iconClass} />;
}

export function BadgesGrid({ badges }: BadgesGridProps) {
  const earnedList = badges.filter((b) => b.earned);
  const [selectedCode, setSelectedCode] = useState<string | null>(earnedList[0]?.code ?? badges[0]?.code ?? null);
  const selectedBadge = badges.find((badge) => badge.code === selectedCode) ?? null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="size-5 text-amber-500" />
          <h2 className="font-display text-lg font-semibold">Badges & Achievements</h2>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
          {earnedList.length} of {badges.length} Unlocked
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {badges.map((b) => (
          <button
            key={b.code}
            type="button"
            onClick={() => setSelectedCode(b.code)}
            aria-pressed={selectedCode === b.code}
            aria-label={`${b.label}: ${b.description}`}
            className={`relative flex min-w-0 w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
              b.earned
                ? "border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-card shadow-sm hover:border-amber-500/50"
                : "border-border/60 bg-muted/20 opacity-65 hover:opacity-90"
            } ${selectedCode === b.code ? "ring-2 ring-amber-500/30" : ""}`}
          >
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${
                b.earned
                  ? "border-amber-500/40 bg-amber-500/10 shadow-inner"
                  : "border-border bg-muted/40"
              }`}
            >
              {getBadgeIcon(b.code, b.earned)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-semibold">{b.label}</p>
                {b.earned ? (
                  <CheckCircle2 className="ml-auto size-3.5 shrink-0 text-amber-500" />
                ) : (
                  <Lock className="ml-auto size-3.5 shrink-0 text-muted-foreground/60" />
                )}
              </div>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {b.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {selectedBadge && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4" aria-live="polite">
          <div className="flex items-center gap-2">
            {getBadgeIcon(selectedBadge.code, selectedBadge.earned)}
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">{selectedBadge.label}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {selectedBadge.earned ? "Unlocked badge" : "Locked badge"}
              </p>
            </div>
          </div>
          <p className="mt-2 text-sm leading-5 text-muted-foreground">{selectedBadge.description}</p>
        </div>
      )}
    </div>
  );
}

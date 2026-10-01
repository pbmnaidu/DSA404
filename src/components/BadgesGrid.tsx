"use client";

import { useState } from "react";
import type { Badge } from "@/lib/gamification";
import { Award, Lock, ShieldCheck, Trophy, Zap, Star, Target, CheckCircle2 } from "lucide-react";

export interface BadgesGridProps {
 badges: Badge[];
}

function getBadgeIcon(code: string, earned: boolean) {
 const iconClass = earned ? "size-5 text-warning dark:text-warning" : "size-5 text-foreground";
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
 <Trophy className="size-5 text-warning" />
 <h2 className="font-display text-lg font-semibold">Badges & Achievements</h2>
 </div>
 <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-primary border border-border">
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
 className={`relative flex min-w-0 w-full items-start gap-3 rounded-lg border p-3.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
 b.earned
 ? "border-border bg-primary   shadow-sm hover:border-border"
 : "border-border bg-muted opacity-65 hover:"
 } ${selectedCode === b.code ? "ring-2 ring-warning/30" : ""}`}
 >
 <div
 className={`flex size-10 shrink-0 items-center justify-center rounded-lg border ${
 b.earned
 ? "border-border bg-muted shadow-sm"
 : "border-border bg-muted"
 }`}
 >
 {getBadgeIcon(b.code, b.earned)}
 </div>

 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-1.5">
 <p className="truncate text-sm font-semibold">{b.label}</p>
 {b.earned ? (
 <CheckCircle2 className="ml-auto size-3.5 shrink-0 text-warning" />
 ) : (
 <Lock className="ml-auto size-3.5 shrink-0 text-foreground" />
 )}
 </div>
 <p className="mt-0.5 line-clamp-2 text-xs text-foreground">
 {b.description}
 </p>
 </div>
 </button>
 ))}
 </div>

 {selectedBadge && (
 <div className="rounded-lg border border-border bg-muted p-4" aria-live="polite">
 <div className="flex items-center gap-2">
 {getBadgeIcon(selectedBadge.code, selectedBadge.earned)}
 <div className="min-w-0">
 <p className="text-sm font-bold text-foreground">{selectedBadge.label}</p>
 <p className="text-[11px] font-semibold uppercase tracking-wider text-warning dark:text-warning">
 {selectedBadge.earned ? "Unlocked badge" : "Locked badge"}
 </p>
 </div>
 </div>
 <p className="mt-2 text-sm leading-5 text-foreground">{selectedBadge.description}</p>
 </div>
 )}
 </div>
 );
}

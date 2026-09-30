"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { CORE_SECTIONS } from "@/lib/master-problems";
import { ALL_PROBLEMS } from "@/lib/problems";
import {
  todayIso,
  DEFAULT_DAILY_COUNTS,
  TOTAL_PROBLEMS,
  TUTOR_PACE_PRESETS,
  getPacePresetByTarget,
  normalizeDailyCounts,
  type DailyCounts,
  type PaceTier,
} from "@/lib/plan";
import { Loader2, BookOpen, Zap, Trophy, CalendarDays, Sliders, X, Sparkles, CheckCircle2 } from "lucide-react";
import { DailyCombinationsBreakdown } from "@/components/DailyCombinationsBreakdown";

interface OnboardingModalProps {
  open: boolean;
  onComplete: (startDate: string, counts: DailyCounts) => Promise<void>;
  onClose?: () => void;
}

const STEPS = ["welcome", "pace", "startdate", "ready"] as const;
type Step = typeof STEPS[number];

/* ── real dynamic stats ── */
const REAL_ROADMAP_PROBLEMS = TOTAL_PROBLEMS;
const REAL_SECTIONS_COUNT = CORE_SECTIONS.length;
const LEVEL_COUNTS = CORE_SECTIONS.reduce(
  (acc, s) => {
    s.problems.forEach((p) => {
      if (p.level === "Level 1") acc.level1++;
      else if (p.level === "Level 2") acc.level2++;
      else if (p.level === "Level 3") acc.level3++;
    });
    return acc;
  },
  { level1: 0, level2: 0, level3: 0 }
);

export function OnboardingModal({ open, onComplete, onClose }: OnboardingModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [counts, setCounts] = useState<DailyCounts>(() => ({ ...DEFAULT_DAILY_COUNTS }));
  const [startDate, setStartDate] = useState(todayIso());
  const [busy, setBusy] = useState(false);

  const activePreset = getPacePresetByTarget(counts.target || 3);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      window.location.href = "/?onboarding=closed";
    }
  };

  const handleSelectTier = (tier: PaceTier) => {
    const p = TUTOR_PACE_PRESETS[tier];
    setCounts({
      target: p.target,
      tier: p.id,
      easy: p.levelRatios.level1.easy,
      medium: p.levelRatios.level2.medium,
      hard: p.levelRatios.level3.hard,
      levelRatios: p.levelRatios,
    });
  };

  const handleTargetChange = (val: number) => {
    const clamped = Math.max(1, Math.min(8, val));
    const p = getPacePresetByTarget(clamped);
    const tier = (["casual", "balanced", "standard", "intensive"] as PaceTier[]).find(
      (t) => TUTOR_PACE_PRESETS[t].target === clamped
    ) || "custom";
    setCounts({
      target: clamped,
      tier,
      easy: p.levelRatios.level1.easy,
      medium: p.levelRatios.level2.medium,
      hard: p.levelRatios.level3.hard,
      levelRatios: p.levelRatios,
    });
  };

  const handleFinish = async () => {
    setBusy(true);
    try {
      const normalized = normalizeDailyCounts(counts);
      await onComplete(startDate, normalized);
    } finally {
      setBusy(false);
    }
  };

  const PRESET_TIERS: PaceTier[] = ["casual", "balanced", "standard", "intensive"];

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
      }}
    >
      <DialogContent
        className="w-[calc(100vw-2rem)] sm:w-full max-w-lg max-h-[88vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl p-0 gap-0 overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          handleClose();
        }}
      >
        {/* Top-right close button to redirect to landing page */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-3.5 top-3.5 z-50 rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
          aria-label="Close and return to home"
        >
          <X className="size-4" />
        </button>

        {/* Progress dots */}
        <div className="flex gap-1.5 px-5 sm:px-6 pt-5 pr-12 shrink-0">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                STEPS.indexOf(step) >= i ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-6 pt-4 space-y-4">
          {/* ── Step 1: Welcome ── */}
          {step === "welcome" && (
            <div className="space-y-4">
              <DialogHeader className="text-left">
                <DialogTitle className="text-xl sm:text-2xl font-bold">Welcome to DSA⁴⁰⁴! 🚀</DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                  Let's set up your personalised DSA preparation plan. It only takes a minute.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
                <div className="rounded-xl border border-border bg-emerald-50 dark:bg-emerald-900/20 p-2.5 sm:p-3 text-center">
                  <BookOpen className="mx-auto mb-1 size-4 sm:size-5 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-[11px] sm:text-xs font-semibold text-emerald-700 dark:text-emerald-400">Level 1</p>
                  <p className="text-[10px] sm:text-[11px] font-bold text-emerald-800 dark:text-emerald-300">{LEVEL_COUNTS.level1} Problems</p>
                  <p className="text-[10px] text-muted-foreground">Foundations</p>
                </div>
                <div className="rounded-xl border border-border bg-blue-50 dark:bg-blue-900/20 p-2.5 sm:p-3 text-center">
                  <Zap className="mx-auto mb-1 size-4 sm:size-5 text-blue-600 dark:text-blue-400" />
                  <p className="text-[11px] sm:text-xs font-semibold text-blue-700 dark:text-blue-400">Level 2</p>
                  <p className="text-[10px] sm:text-[11px] font-bold text-blue-800 dark:text-blue-300">{LEVEL_COUNTS.level2} Problems</p>
                  <p className="text-[10px] text-muted-foreground">Intermediate</p>
                </div>
                <div className="rounded-xl border border-border bg-purple-50 dark:bg-purple-900/20 p-2.5 sm:p-3 text-center">
                  <Trophy className="mx-auto mb-1 size-4 sm:size-5 text-purple-600 dark:text-purple-400" />
                  <p className="text-[11px] sm:text-xs font-semibold text-purple-700 dark:text-purple-400">Level 3</p>
                  <p className="text-[10px] sm:text-[11px] font-bold text-purple-800 dark:text-purple-300">{LEVEL_COUNTS.level3} Problems</p>
                  <p className="text-[10px] text-muted-foreground">Advanced</p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {REAL_ROADMAP_PROBLEMS} curated problems across {REAL_SECTIONS_COUNT} core DSA topics — organised in 3 levels to take you from fundamentals to advanced DSA.
              </p>

              <Button className="w-full h-10 sm:h-11 cursor-pointer text-sm sm:text-base font-semibold" onClick={() => setStep("pace")}>
                Let's Get Started →
              </Button>
            </div>
          )}

          {/* ── Step 2: Daily Pace (Tutor Recommended Ratio) ── */}
          {step === "pace" && (
            <div className="space-y-4 sm:space-y-5">
              <DialogHeader className="text-left">
                <div className="flex items-center gap-2 mb-0.5">
                  <Sliders className="size-4 sm:size-5 text-primary" />
                  <DialogTitle className="text-lg sm:text-xl">Choose Your Daily Target</DialogTitle>
                </div>
                <DialogDescription className="text-xs sm:text-sm">
                  Select how many problems you want to solve each day. Your tutor balances difficulty ratios automatically by level so you never face unrealistic workloads.
                </DialogDescription>
              </DialogHeader>

              {/* Tutor Pace Preset Cards */}
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                {PRESET_TIERS.map((tierKey) => {
                  const p = TUTOR_PACE_PRESETS[tierKey];
                  const isSelected = (counts.tier === tierKey && counts.target === p.target) || (counts.target === p.target && counts.tier !== "custom");
                  return (
                    <button
                      key={tierKey}
                      type="button"
                      onClick={() => handleSelectTier(tierKey)}
                      className={`relative flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30"
                          : "border-border bg-card/60 hover:border-primary/40 hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex w-full items-center justify-between gap-1 mb-1">
                        <span className="text-xs sm:text-sm font-bold text-foreground">
                          {p.label}
                        </span>
                        {p.badge && (
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                            tierKey === "balanced"
                              ? "bg-primary/20 text-primary font-bold"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {p.badge}
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg sm:text-xl font-extrabold text-foreground tabular-nums">
                          {p.target}
                        </span>
                        <span className="text-[11px] text-muted-foreground">problems / day</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                        ~{p.timeEstimateMin}–{p.timeEstimateMax} min/day · {p.tagline.split(" · ")[1] || p.label}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Slider for fine adjustment */}
              <div className="space-y-1.5 rounded-xl border border-border/70 bg-muted/20 p-3.5">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <Label className="flex items-center gap-1.5 font-medium">
                    <Sparkles className="size-3.5 text-primary" />
                    Fine-tune Daily Target:
                  </Label>
                  <span className="font-extrabold text-primary text-base tabular-nums">
                    {counts.target} <span className="text-xs font-normal text-muted-foreground">problems / day</span>
                  </span>
                </div>
                <Slider
                  min={1}
                  max={6}
                  step={1}
                  value={[counts.target || 3]}
                  onValueChange={([v]) => handleTargetChange(v)}
                  className="py-1"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>1 (Light)</span>
                  <span>3 (Tutor Standard ⭐)</span>
                  <span>6 (Surgical Sprint)</span>
                </div>
              </div>

              {/* Tutor Pedagogical Workload Combinations Breakdown */}
              <DailyCombinationsBreakdown target={counts.target || 3} showPlanFrequency={false} />

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1 cursor-pointer h-10" onClick={() => setStep("welcome")}>Back</Button>
                <Button className="flex-1 cursor-pointer h-10" onClick={() => setStep("startdate")}>Next →</Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Start Date ── */}
          {step === "startdate" && (
            <div className="space-y-4 sm:space-y-5">
              <DialogHeader className="text-left">
                <div className="flex items-center gap-2 mb-0.5">
                  <CalendarDays className="size-4 sm:size-5 text-primary" />
                  <DialogTitle className="text-lg sm:text-xl">When do you start?</DialogTitle>
                </div>
                <DialogDescription className="text-xs sm:text-sm">
                  Pick the date your preparation journey begins. Day 1 will be assigned to this date.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-xs sm:text-sm">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  min={todayIso()}
                  onChange={(e) => setStartDate(e.target.value || todayIso())}
                  className="text-sm sm:text-base h-10"
                />
              </div>

              <div className="rounded-xl border border-border bg-muted/40 px-3.5 py-3 sm:px-4 space-y-1.5">
                <p className="text-xs sm:text-sm font-semibold">Your plan summary</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground">📅 Starting: {new Date(`${startDate}T00:00:00Z`).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })}</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground">⚡ Daily pace: <strong>{counts.target} problems/day</strong> ({activePreset.label} Pace)</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground">⏱ Study time: ~{activePreset.timeEstimateMin} – {activePreset.timeEstimateMax} min/day</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground">⚖️ Weightage: Balanced via 2E = 1M &amp; 3E = 1H rules (Cap: {counts.target} problems/day)</p>
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1 cursor-pointer h-10" onClick={() => setStep("pace")}>Back</Button>
                <Button className="flex-1 cursor-pointer h-10" onClick={() => setStep("ready")}>Next →</Button>
              </div>
            </div>
          )}

          {/* ── Step 4: Ready ── */}
          {step === "ready" && (
            <div className="space-y-4 sm:space-y-5">
              <DialogHeader className="text-left">
                <DialogTitle className="text-xl sm:text-2xl font-bold">You're all set! 🎉</DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                  Your personalised DSA plan is ready to build. Here's what we've configured:
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 sm:px-4 sm:py-3">
                  <CalendarDays className="size-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Start Date</p>
                    <p className="text-xs sm:text-sm font-semibold truncate">
                      {new Date(`${startDate}T00:00:00Z`).toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 sm:px-4 sm:py-3">
                  <Sliders className="size-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Daily Target</p>
                    <p className="text-xs sm:text-sm font-semibold truncate">
                      {counts.target} problems / day ({activePreset.label} Pace)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 sm:px-4 sm:py-3">
                  <span className="text-sm sm:text-base">⏱</span>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Daily Study Time</p>
                    <p className="text-xs sm:text-sm font-semibold truncate">~{activePreset.timeEstimateMin} to {activePreset.timeEstimateMax} min / day</p>
                  </div>
                </div>
              </div>

              <p className="text-[11px] sm:text-xs text-muted-foreground">
                You can always fine-tune your daily target and schedule anytime in Settings.
              </p>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1 cursor-pointer h-10 sm:h-11" onClick={() => setStep("startdate")}>Back</Button>
                <Button className="flex-[2] text-sm sm:text-base h-10 sm:h-11 cursor-pointer font-semibold" onClick={handleFinish} disabled={busy}>
                  {busy ? (
                    <><Loader2 className="mr-2 size-4 animate-spin" /> Building plan…</>
                  ) : (
                    "Start My DSA Journey 🚀"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePlan } from "@/hooks/usePlan";
import { useSettings } from "@/hooks/useSettings";
import { useProblemCompletions } from "@/hooks/useProblemCompletions";
import {
  loadOwnerProfile,
  saveUserProfile,
  syncPublicSolvedProblems,
  type CodingProfiles,
  type CustomLink,
  type CompletedProblemSnapshot,
} from "@/lib/db";
import { ALL_PROBLEMS, getCanonicalProblemLink } from "@/lib/problems";
import { SubmissionHeatmap } from "@/components/SubmissionHeatmap";
import { computeBadges, currentStreak } from "@/lib/gamification";
import { DayDetail } from "@/components/DayDetail";
import { CodeModal } from "@/components/CodeModal";
import {
  getInactivityDays,
  getRandomQuote,
  recordActivity,
  type MotivationalQuote,
} from "@/lib/userActivity";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { formatDate, diffDays, todayIso } from "@/lib/plan";
import {
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Code2,
  ExternalLink,
  Flame,
  Globe,
  Image as ImageIcon,
  Pencil,
  Plus,
  Quote,
  RefreshCw,
  Share2,
  Sparkles,
  Trash2,
  UserCircle2,
  ListTodo,
  Calendar as CalendarIcon,
  Rocket,
  HeartHandshake,
  X,
  RotateCcw,
  PauseCircle,
  PlayCircle,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Platform Metadata ────────────────────────────────────────────────────────
const PLATFORMS: {
  key: Exclude<keyof CodingProfiles, "customLinks">;
  label: string;
  placeholder: string;
  color: string;
  bgColor: string;
}[] = [
    {
      key: "leetcode",
      label: "LeetCode",
      placeholder: "https://leetcode.com/yourname",
      color: "#FFA116",
      bgColor: "rgba(255,161,22,0.12)",
    },
    {
      key: "codeforces",
      label: "Codeforces",
      placeholder: "https://codeforces.com/profile/yourname",
      color: "#1F8ACB",
      bgColor: "rgba(31,138,203,0.12)",
    },
    {
      key: "codechef",
      label: "CodeChef",
      placeholder: "https://www.codechef.com/users/yourname",
      color: "#5B4638",
      bgColor: "rgba(91,70,56,0.12)",
    },
    {
      key: "atcoder",
      label: "AtCoder",
      placeholder: "https://atcoder.jp/users/yourname",
      color: "#8BC4E8",
      bgColor: "rgba(139,196,232,0.12)",
    },
    {
      key: "hackerrank",
      label: "HackerRank",
      placeholder: "https://www.hackerrank.com/profile/yourname",
      color: "#00EA64",
      bgColor: "rgba(0,234,100,0.12)",
    },
    {
      key: "gfg",
      label: "GeeksforGeeks",
      placeholder: "https://www.geeksforgeeks.org/user/yourname",
      color: "#2F8D46",
      bgColor: "rgba(47,141,70,0.12)",
    },
  ];



import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function ThemedTooltip({ hint, children }: { hint: string; children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs rounded-xl border border-white/15 bg-popover/95 backdrop-blur-md px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-2xl">
          {hint}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function MergedTodayProfile() {
  const { user } = useAuth();
  const { days, loading, shiftSchedule } = usePlan();
  const { settings, update: updateSettings } = useSettings();
  const { completed: pbCompleted, submissions } = useProblemCompletions();
  const [resumingPlan, setResumingPlan] = useState(false);

  const handleResumePlan = useCallback(async () => {
    setResumingPlan(true);
    toast.info("Resuming preparation...", {
      description: "Shifting schedule to today where you left off.",
    });
    try {
      const from = settings.pausedFrom ?? todayIso();
      const today = todayIso();
      const finish = await shiftSchedule(from);
      const gap = Math.max(0, diffDays(from, today));
      await updateSettings({
        paused: false,
        pausedFrom: null,
        pausedDays: (settings.pausedDays ?? 0) + gap,
        resumeDate: today,
      });
      toast.success("Welcome back!", {
        description:
          gap > 0
            ? `Preparation resumed from today! Schedule shifted forward by ${gap} day(s). New finish date: ${formatDate(finish ?? "")}.`
            : "Preparation resumed right on schedule.",
      });
    } catch (err: any) {
      toast.error("Failed to resume plan", { description: err?.message || "Please try again." });
    } finally {
      setResumingPlan(false);
    }
  }, [settings.pausedFrom, settings.pausedDays, shiftSchedule, updateSettings]);

  // Selected date from calendar click
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  // Selected problem for CodeModal viewer in Solved tab
  const [selectedProblemForModal, setSelectedProblemForModal] = useState<string | null>(null);

  // Profile Drawer Edit toggle
  const [showProfileCard, setShowProfileCard] = useState(false);


  // Motivational Quote State
  const [currentQuote, setCurrentQuote] = useState<MotivationalQuote>(getRandomQuote());

  const [displayName, setDisplayName] = useState("");

  // Record visit activity on mount
  useEffect(() => {
    if (user?.uid) recordActivity(user.uid);
  }, [user]);

  // Keep public profile solved problems & activity heatmap automatically in sync
  useEffect(() => {
    if (!user?.uid || loading) return;
    const timer = setTimeout(() => {
      void syncPublicSolvedProblems(user.uid, days, pbCompleted, submissions).catch((err) => {
        console.warn("Background public solved problems sync failed:", err);
      });
    }, 1200);
    return () => clearTimeout(timer);
  }, [user?.uid, loading, days, pbCompleted, submissions]);

  // Strictly determine Today's Day:
  // When paused, freeze reference date to pausedFrom
  const iso = settings.paused && settings.pausedFrom ? settings.pausedFrom : todayIso();
  // 1. Look for active (non-skipped) day scheduled for today
  const todayDay = days.find((d) => d.date === iso && !d.skipped);
  // 2. If today has no exact date match (e.g. today was skipped or gap), find next active day on or after today
  const upcomingActive = days.find((d) => d.date >= iso && !d.skipped);
  // 3. If before plan start date, show first active day
  const firstActive = days.find((d) => !d.skipped);
  // 4. If after plan finish date, fallback to last active day
  const lastActive = days.filter((d) => !d.skipped).at(-1);
  // Strictly avoid falling back to old unfinished past days
  const currentDay = todayDay ?? upcomingActive ?? firstActive ?? lastActive ?? days[0];

  // In Today's workspace tab, strictly display Today's day only (never switch to past days)
  const displayedDay = currentDay;
  const isExactlyToday = displayedDay?.date === iso;
  const isPast = false;

  // Strictly filter problems to ensure ONLY problems belonging to today are displayed
  // (strictly exclude any problems carried over from earlier days)
  const sanitizedDay = useMemo(() => {
    if (!displayedDay) return null;
    return {
      ...displayedDay,
      problems: displayedDay.problems.filter(
        (p) => !p.carriedFromDay || p.carriedFromDay === displayedDay.dayNumber
      ),
    };
  }, [displayedDay]);

  // Calculate user inactivity gap
  const inactivityInfo = useMemo(() => getInactivityDays(days, user?.uid), [days, user]);

  // Streak — standard derived streak from active plan days
  const streakCount = useMemo(() => currentStreak(days), [days]);

  const userNameDisplay = displayName || user?.displayName || user?.email?.split("@")[0] || "Coder";

  const timeBasedGreeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return {
        greeting: `Good morning, ${userNameDisplay}! ☀️`,
        subtext: "Fresh morning start! Target: Tackle today's core problems & build your DSA momentum.",
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        greeting: `Good afternoon, ${userNameDisplay}! 🌤️`,
        subtext: "Mid-day coding boost! Target: Solve today's problems & sharpen your DSA patterns.",
      };
    } else if (hour >= 17 && hour < 21) {
      return {
        greeting: `Good evening, ${userNameDisplay}! 🌙`,
        subtext: "Evening sprint! Target: Clear today's checklist and keep your streak alive.",
      };
    } else {
      return {
        greeting: `Late night coding, ${userNameDisplay}! 🌌`,
        subtext: "Night owl mode activated! Target: Conquer today's problems before calling it a day.",
      };
    }
  }, [userNameDisplay]);

  // Solved problems snapshots
  const completedProblems = useMemo<CompletedProblemSnapshot[]>(() => {
    const seen = new Set<string>();
    const list: CompletedProblemSnapshot[] = [];
    const today = new Date().toISOString().slice(0, 10);

    for (const day of days) {
      for (const p of day.problems) {
        if (p.done && !seen.has(p.name)) {
          seen.add(p.name);
          const sub = submissions[p.name];
          const platLink = getCanonicalProblemLink(p.name) || p.link || "";
          const rawPlat = p.platform || "DSA";
          const normPlat = (rawPlat === "GFG" || rawPlat.toLowerCase().includes("geeks")) ? "GeeksforGeeks" : rawPlat;
          const completedAt = p.completedAt?.slice(0, 10) || sub?.submittedAt?.slice(0, 10) || day.date || today;
          const submittedAt = sub?.submittedAt || p.completedAt || new Date().toISOString();
          list.push({
            name: p.name,
            platform: normPlat,
            difficulty: p.difficulty || "Medium",
            link: platLink,
            completedAt,
            submittedAt,
            topic: day.topic,
            section: day.section,
            ...(sub ? { code: sub.code, submissionLink: sub.link || platLink, keyPoints: sub.keyPoints } : {}),
          });
        }
      }
    }

    for (const fp of ALL_PROBLEMS) {
      if (pbCompleted.has(fp.name) && !seen.has(fp.name)) {
        seen.add(fp.name);
        const sub = submissions[fp.name];
        const platLink = getCanonicalProblemLink(fp.name) || fp.link || "";
        const rawPlat = fp.platform || "DSA";
        const normPlat = (rawPlat === "GFG" || rawPlat.toLowerCase().includes("geeks")) ? "GeeksforGeeks" : rawPlat;
        const completedAt = sub?.submittedAt?.slice(0, 10) || today;
        const submittedAt = sub?.submittedAt || new Date().toISOString();
        list.push({
          name: fp.name,
          platform: normPlat,
          difficulty: fp.difficulty || "Medium",
          link: platLink,
          completedAt,
          submittedAt,
          topic: fp.topic,
          section: fp.sheet,
          ...(sub ? { code: sub.code, submissionLink: sub.link || platLink, keyPoints: sub.keyPoints } : {}),
        });
      }
    }

    // Also include any submissions that were submitted on Problems tab or CodeModal
    for (const [probName, sub] of Object.entries(submissions ?? {})) {
      if (!probName || seen.has(probName)) continue;
      seen.add(probName);
      const platLink = getCanonicalProblemLink(probName) || sub.link || "";
      const rawPlat = (sub as any).platform || "DSA";
      const normPlat = (rawPlat === "GFG" || rawPlat.toLowerCase().includes("geeks")) ? "GeeksforGeeks" : rawPlat;
      const completedAt = sub.submittedAt?.slice(0, 10) || today;
      const submittedAt = sub.submittedAt || new Date().toISOString();
      list.push({
        name: probName,
        platform: normPlat,
        difficulty: ((sub as any).difficulty || "Medium") as any,
        link: platLink,
        completedAt,
        submittedAt,
        topic: (sub as any).topic || "Problems",
        section: (sub as any).section || "Problems Tab",
        ...(sub.code ? { code: sub.code, submissionLink: sub.link || platLink, keyPoints: sub.keyPoints } : {}),
      });
    }

    return list;
  }, [days, pbCompleted, submissions]);

  const stats = useMemo(() => {
    const byPlatform: Record<string, number> = {};
    for (const p of completedProblems) {
      const plat = (p.platform === "GFG" || p.platform?.toLowerCase().includes("geeks")) ? "GeeksforGeeks" : (p.platform || "DSA");
      byPlatform[plat] = (byPlatform[plat] ?? 0) + 1;
    }
    return { total: completedProblems.length, byPlatform };
  }, [completedProblems]);

  const badges = useMemo(() => computeBadges(days), [days]);

  // Heatmap dataset
  const { heatmapData, detailMap } = useMemo(() => {
    const dateMap = new Map<string, any[]>();

    for (const day of days) {
      const doneProbs = day.problems.filter((p) => p.done);
      for (const p of doneProbs) {
        const dateStr = p.completedAt || day.date;
        const sub = submissions[p.name];
        const platLink = getCanonicalProblemLink(p.name) || p.link || "";
        const item = {
          ...p,
          submissionLink: sub?.link || (p as any).submissionLink || platLink || undefined,
          code: sub?.code || (p as any).code || undefined,
          keyPoints: sub?.keyPoints || (p as any).keyPoints || undefined,
        };
        const existing = dateMap.get(dateStr) ?? [];
        dateMap.set(dateStr, [...existing, item]);
      }
    }

    for (const [probName, sub] of Object.entries(submissions)) {
      if (sub.submittedAt) {
        const dateStr = sub.submittedAt.slice(0, 10);
        const existing = dateMap.get(dateStr) ?? [];
        if (!existing.some((p) => p.name === probName)) {
          const platLink = getCanonicalProblemLink(probName) || "";
          dateMap.set(dateStr, [
            ...existing,
            {
              name: probName,
              done: true,
              platform: "Problems Tab",
              submissionLink: sub.link || platLink || undefined,
              code: sub.code || undefined,
              keyPoints: sub.keyPoints || undefined,
            },
          ]);
        }
      }
    }

    const hData: { date: string; solved: number }[] = [];
    const dMap: Record<string, any[]> = {};

    dateMap.forEach((probs, dateStr) => {
      hData.push({ date: dateStr, solved: probs.length });
      dMap[dateStr] = probs;
    });

    const todayStr = todayIso();
    for (const day of days) {
      if (!day.skipped && !dateMap.has(day.date) && day.date <= todayStr) {
        hData.push({ date: day.date, solved: 0 });
      }
    }

    return { heatmapData: hData, detailMap: dMap };
  }, [days, submissions]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-16 animate-fade-in selection:bg-primary/20">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 space-y-12 pt-6">

        {/* ── PAUSED ALERT ── */}
        {settings.paused && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <PauseCircle className="size-5 text-amber-500 animate-pulse" />
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-amber-500">Plan Paused (Day {displayedDay?.dayNumber})</h3>
                <p className="text-xs text-amber-500/80">
                  Paused on {formatDate(settings.pausedFrom ?? "")}. Your streak is protected.
                </p>
              </div>
            </div>
            <Button
              onClick={handleResumePlan}
              disabled={resumingPlan}
              size="sm"
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs"
            >
              <PlayCircle className="size-4 mr-1.5" />
              {resumingPlan ? "Resuming..." : "Resume Catch Up"}
            </Button>
          </div>
        )}

        {/* ── MISSION HERO ── */}
        <header className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                <Target className="size-3.5" />
                <span>Today's Mission</span>
              </div>
              <h1 className="font-display text-4xl sm:text-5xl font-black tracking-tight text-foreground leading-none">
                {timeBasedGreeting.greeting.split(',')[0]}
                <span className="text-muted-foreground block text-2xl sm:text-3xl mt-1">{userNameDisplay}.</span>
              </h1>
              <p className="text-muted-foreground max-w-xl text-sm sm:text-base leading-relaxed mt-2">
                {timeBasedGreeting.subtext}
              </p>
            </div>

            <div className="flex flex-col items-end gap-3 shrink-0">
              <div className={cn(
                "flex items-center gap-2.5 rounded-full px-5 py-2.5 text-sm font-bold shadow-sm transition-all",
                streakCount > 0
                  ? "border-2 border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-amber-500/5 text-orange-400"
                  : "border border-border bg-card text-muted-foreground"
              )}>
                <Flame className={cn("size-5", streakCount > 0 && "text-orange-500 animate-pulse")} />
                <span>{streakCount > 0 ? `${streakCount} Day Streak` : "0 Day Streak"}</span>
              </div>
            </div>
          </div>
        </header>

        
        {/* ── WORKSPACE SPLIT ── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* PRIMARY LEARNING COLUMN (Left side, 8 cols) */}
          <main className="xl:col-span-8 space-y-10 min-w-0">
            
            {/* Topic Context (Editorial Style) */}
            {sanitizedDay && (
              <section className="space-y-5">
                <h2 className="font-display text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Target className="size-5 text-primary" /> Current Topic
                </h2>
                <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden p-1">
                  <DayDetail
                    day={sanitizedDay}
                    readOnly={false}
                    lateMode={false}
                    headerOnly
                  />
                </div>
              </section>
            )}

            {/* Main Problem Queue */}
            {sanitizedDay && (
              <section className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <ListTodo className="size-5 text-primary" /> Daily Problem List
                  </h2>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                    {sanitizedDay.problems.filter(p => p.done).length} / {sanitizedDay.problems.length} Done
                  </span>
                </div>
                
                {/* The actual problems wrapped cleanly */}
                <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden p-2 sm:p-6">
                  <DayDetail
                    day={sanitizedDay}
                    readOnly={false}
                    lateMode={false}
                    hideHeader
                  />
                </div>
              </section>
            )}
            
            {/* Review Queue (Placeholder) */}
            <section className="space-y-5">
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <RotateCcw className="size-5 text-amber-500" /> Review Queue
              </h2>
              <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 shadow-sm p-8 text-center flex flex-col items-center justify-center">
                <RotateCcw className="size-8 text-amber-500/50 mb-3" />
                <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-1">Spaced Repetition</h3>
                <p className="text-sm text-amber-700/80 dark:text-amber-300/80 max-w-sm mb-4">No problems due for review today. Keep pushing forward!</p>
              </div>
            </section>
            
          </main>

          {/* SECONDARY SIDEBAR (Right side, 4 cols) */}
          <aside className="xl:col-span-4 space-y-8 min-w-0">
            
            {/* Progress Summary & Consistency */}
            <section className="space-y-4">
              <h2 className="font-display text-lg font-bold tracking-tight border-b border-border pb-2">
                Progress Summary
              </h2>
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <SubmissionHeatmap data={heatmapData} detailMap={detailMap} />
              </div>
            </section>

            {/* Weekly Completion & Milestones */}
            <section className="space-y-4">
              <h2 className="font-display text-lg font-bold tracking-tight border-b border-border pb-2">
                Milestones
              </h2>
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted-foreground font-bold uppercase tracking-wider">Problems Solved</span>
                    <span className="font-black text-primary">{stats.total}</span>
                  </div>
                  <Progress value={Math.min(100, (stats.total / (ALL_PROBLEMS.length || 1)) * 100)} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted-foreground font-bold uppercase tracking-wider">Badges Earned</span>
                    <span className="font-black text-emerald-500">{badges.length}</span>
                  </div>
                  <Progress value={Math.min(100, (badges.length / 10) * 100)} className="h-2" />
                </div>
              </div>
            </section>
            
            {/* AI Tutor Entry Point */}
            <section className="space-y-4">
              <h2 className="font-display text-lg font-bold tracking-tight border-b border-border pb-2">
                AI Assistance
              </h2>
              <div className="rounded-3xl border border-purple-500/30 bg-purple-500/10 p-6 shadow-sm relative overflow-hidden group hover:border-purple-500/50 transition-colors cursor-pointer">
                <div className="absolute -right-4 -top-4 size-24 bg-purple-500/20 blur-2xl rounded-full group-hover:bg-purple-500/30 transition-all"></div>
                <Sparkles className="size-6 text-purple-500 mb-3 relative z-10" />
                <h3 className="font-bold text-foreground mb-1 relative z-10">AI Coding Tutor</h3>
                <p className="text-xs text-muted-foreground relative z-10 mb-4">Stuck on a problem? Ask your AI tutor for a conceptual hint without revealing the code.</p>
                <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold relative z-10">Launch Tutor</Button>
              </div>
            </section>
            
            {/* Recommendations */}
            <section className="space-y-4">
              <h2 className="font-display text-lg font-bold tracking-tight border-b border-border pb-2">
                Recommended Next
              </h2>
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                 <p className="text-xs text-muted-foreground italic text-center">Complete today's queue to unlock personalized recommendations.</p>
              </div>
            </section>

          </aside>

        </div>

        

        {/* Code Modal for viewing stored solutions from Solved tab */}
        <CodeModal
          open={!!selectedProblemForModal}
          onOpenChange={(open) => !open && setSelectedProblemForModal(null)}
          problemName={selectedProblemForModal ?? ""}
          existingSubmission={selectedProblemForModal ? submissions[selectedProblemForModal] : undefined}
          onSave={async () => { }}
          readOnly={true}
        />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
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
import { TodayContestsSection } from "@/components/ContestsSection";
import { TodayMissionOrbit } from "@/components/TodayMissionOrbit";
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
import { getChatGPTAiPromptUrl, getChatGPTDayTopicPromptUrl } from "@/lib/aiTutorPrompt";
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
 <TooltipContent side="top" className="max-w-xs rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-sm">
 {hint}
 </TooltipContent>
 </Tooltip>
 </TooltipProvider>
 );
}

function MissionWelcomeMascot({ name }: { name: string }) {
 const [isFirstVisit, setIsFirstVisit] = useState(true);
 const [mounted, setMounted] = useState(false);
 const [timeOfDay, setTimeOfDay] = useState<"morning" | "afternoon" | "evening" | "night">("morning");

 useEffect(() => {
 const hour = new Date().getHours();
 setTimeOfDay(hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 21 ? "evening" : "night");
 setMounted(true);

 try {
 const visitKey = `dsa404:today-welcome:${todayIso()}`;
 const hasVisitedToday = window.localStorage.getItem(visitKey) === "true";
 setIsFirstVisit(!hasVisitedToday);
 window.localStorage.setItem(visitKey, "true");
 } catch {
 // Keep the welcome state when browser storage is unavailable.
 }
 }, []);

 const messages = {
 morning: "Good morning — let's solve today's problems!",
 afternoon: "Good afternoon — keep your momentum going!",
 evening: "Good evening — one focused session can change your day.",
 night: "Night owl mode — conquer today's problems before bed!",
 };
 const message = isFirstVisit ? `Hey ${name}, welcome back! Let's solve your problems.` : messages[timeOfDay];

 return (
 <div
 className={cn("hidden min-w-0 flex-1 items-center justify-center gap-3 xl:flex", mounted ? "animate-in fade-in duration-500" : "opacity-0")}
 aria-live="polite"
 >
 <style jsx>{`
 @keyframes owlWave {
 0%, 100% { transform: rotate(0deg); }
 20% { transform: rotate(18deg); }
 40% { transform: rotate(-12deg); }
 60% { transform: rotate(18deg); }
 80% { transform: rotate(-6deg); }
 }
 .owl-wave { transform-origin: 80% 85%; animation: owlWave 1.8s ease-in-out 0.25s 2; }
 @media (prefers-reduced-motion: reduce) { .owl-wave { animation: none; } }
 `}</style>
 <div className="relative flex size-16 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-4xl shadow-sm">
 <span role="img" aria-label="Owl mascot">🦉</span>
 <span className="owl-wave absolute -right-3 -top-2 text-xl" aria-hidden="true">👋</span>
 </div>
 <div className="max-w-[220px] rounded-lg rounded-bl-sm border border-border bg-card px-4 py-3 shadow-sm">
 <p className="text-xs font-bold leading-5 text-foreground">{message}</p>
 <p className="mt-1 text-[10px] font-medium text-foreground">Your learning companion is ready.</p>
 </div>
 </div>
 );
}

export function MergedTodayProfile() {
 const { user } = useAuth();
 const { days, loading, shiftSchedule, startDate, changeStartDate } = usePlan();
 const { settings, update: updateSettings } = useSettings();
 const { completed: pbCompleted, submissions } = useProblemCompletions();
 const [resumingPlan, setResumingPlan] = useState(false);
 const [startingToday, setStartingToday] = useState(false);

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

 

 // Strictly determine Today's Day:
 // When paused, freeze reference date to pausedFrom
 const iso = settings.paused && settings.pausedFrom ? settings.pausedFrom : todayIso();
 const effectiveStartDate = startDate || days.find((d) => !d.skipped)?.date || days[0]?.date || iso;
 const isPlanFuture = effectiveStartDate > iso;
 const daysUntilStart = isPlanFuture ? Math.max(1, diffDays(iso, effectiveStartDate)) : 0;

 // 1. Look for active (non-skipped) day scheduled for today
 const todayDay = days.find((d) => d.date === iso && !d.skipped);
 // 2. If today has no exact date match (e.g. today was skipped or gap), find next active day on or after today
 const upcomingActive = days.find((d) => d.date >= iso && !d.skipped);
 // 3. First active day of curriculum
 const firstActive = days.find((d) => !d.skipped);
 // 4. If after plan finish date, fallback to last active day
 const lastActive = days.filter((d) => !d.skipped).at(-1);

 // When plan is scheduled for future, currentDay shows the upcoming Day 1 preview
 const currentDay = isPlanFuture
 ? (firstActive ?? days[0])
 : (todayDay ?? upcomingActive ?? firstActive ?? lastActive ?? days[0]);

 // In Today's workspace tab, strictly display Today's day only (never switch to past days)
 const displayedDay = currentDay;
 const isExactlyToday = !isPlanFuture && displayedDay?.date === iso;
 const isPast = false;

 // Strictly filter problems: when plan starts in future, DO NOT show problems for today!
 const sanitizedDay = useMemo(() => {
 if (!displayedDay || isPlanFuture) return null;
 return {
 ...displayedDay,
 problems: displayedDay.problems.filter(
 (p) => !p.carriedFromDay || p.carriedFromDay === displayedDay.dayNumber
 ),
 };
 }, [displayedDay, isPlanFuture]);

 const todayQueue = sanitizedDay?.problems ?? [];
 const completedTodayCount = todayQueue.filter((problem) => problem.done).length;
 const nextIncompleteProblem = todayQueue.find((problem) => !problem.done);
 const tutorTarget = nextIncompleteProblem?.name || sanitizedDay?.topic || displayedDay?.topic || "DSA";
 const tutorHref = sanitizedDay
 ? getChatGPTDayTopicPromptUrl({
 dayNumber: sanitizedDay.dayNumber,
 topic: sanitizedDay.topic,
 section: sanitizedDay.section,
 subtopics: sanitizedDay.subtopics,
 problems: todayQueue.map((problem) => ({
 name: problem.name,
 difficulty: problem.difficulty,
 platform: problem.platform,
 })),
 })
 : getChatGPTAiPromptUrl(tutorTarget);
 const nextPlanDay = useMemo(
 () => days.find((day) => !day.skipped && day.dayNumber > (displayedDay?.dayNumber ?? 0)),
 [days, displayedDay?.dayNumber]
 );

 const handleStartToday = useCallback(async () => {
 setStartingToday(true);
 try {
 await changeStartDate(todayIso());
 toast.success("Plan start date updated to today!", {
 description: "Day 1 curriculum is now active in your Today workspace.",
 });
 } catch (e: any) {
 toast.error("Could not set start date to today", { description: e?.message });
 } finally {
 setStartingToday(false);
 }
 }, [changeStartDate]);

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
 subtext: "Every great system was built one component at a time. Write code today that your future self will thank you for.",
 };
 } else if (hour >= 12 && hour < 17) {
 return {
 greeting: `Good afternoon, ${userNameDisplay}! 🌤️`,
 subtext: "Consistency outpaces intensity. A single problem solved today compounds into mastery tomorrow.",
 };
 } else if (hour >= 17 && hour < 21) {
 return {
 greeting: `Good evening, ${userNameDisplay}! 🌙`,
 subtext: "The day isn't over until you say it is. Push through the resistance and secure your progress.",
 };
 } else {
 return {
 greeting: `Late night coding, ${userNameDisplay}! 🌌`,
 subtext: "While the world sleeps, the dedicated build. Conquer the silence, solve the problem, and earn your rest.",
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
 const earnedBadgeCount = useMemo(() => badges.filter((badge) => badge.earned).length, [badges]);

 const missionSolvedCount = sanitizedDay?.problems?.filter((problem) => problem.done).length ?? 0;
 const missionTotalCount = sanitizedDay?.problems?.length ?? 0;
 const missionProgress = missionTotalCount > 0
 ? Math.round((missionSolvedCount / missionTotalCount) * 100)
 : 0;
 const journeyProgress = days.length > 0
 ? Math.min(100, Math.round(((displayedDay?.dayNumber ?? 1) / days.length) * 100))
 : 0;
 const nextStreakMilestone = streakCount < 3 ? 3 : streakCount < 7 ? 7 : Math.ceil((streakCount + 1) / 7) * 7;

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
 <div className="min-h-screen text-foreground pb-16 animate-fade-in selection:bg-muted">
 <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 space-y-12 pt-6">

 {/* ── PAUSED ALERT ── */}
 {settings.paused && (
 <div className="rounded-lg border border-border bg-muted p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <PauseCircle className="size-5 text-warning animate-pulse" />
 <div className="space-y-0.5">
 <h3 className="text-sm font-bold text-warning">Plan Paused (Day {displayedDay?.dayNumber})</h3>
 <p className="text-xs text-foreground">
 Paused on {formatDate(settings.pausedFrom ?? "")}. Your streak is protected.
 </p>
 </div>
 </div>
 <Button
 onClick={handleResumePlan}
 disabled={resumingPlan}
 size="sm"
 className="bg-warning hover:bg-warning text-black font-bold text-xs"
 >
 <PlayCircle className="size-4 mr-1.5" />
 {resumingPlan ? "Resuming..." : "Resume Catch Up"}
 </Button>
 </div>
 )}

 {/* ── MISSION HERO ── */}
<header className="relative overflow-hidden rounded-2xl bg-primary text-primary-foreground p-6 shadow-sm border border-primary/20">
 {/* subtle background pattern or gradient */}
 <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent pointer-events-none" />

 <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:gap-8">
 {/* Left Content (Title, Subtitle, Progress Cards) */}
 <div className="flex-1 flex flex-col min-w-0 h-full">
 <div className="flex flex-wrap items-center gap-2 mb-6">
 {isPlanFuture ? (
 <>
 <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 text-xs font-bold text-primary-foreground">
 <CalendarIcon className="size-3.5" aria-hidden="true" />
 <span>Plan Starting Soon</span>
 </div>
 <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 text-xs font-medium text-primary-foreground">
 <Rocket className="size-3.5" aria-hidden="true" />
 Starts {formatDate(effectiveStartDate)} ({daysUntilStart} day{daysUntilStart === 1 ? '' : 's'} left)
 </span>
 </>
 ) : (
 <>
 <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 text-xs font-bold text-primary-foreground">
 <Target className="size-3.5" aria-hidden="true" />
 <span>Today's Mission</span>
 </div>
 <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 text-xs font-medium text-primary-foreground">
 <CalendarIcon className="size-3.5" aria-hidden="true" />
 Day {displayedDay?.dayNumber ?? 1} of {days.length || 1}
 </span>
 </>
 )}
 </div>

 <div>
 <h1 className="font-display text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl">
 {isPlanFuture ? "From this day we start the plan" : timeBasedGreeting.greeting.split(',')[0]}
 <span className="block text-2xl font-medium text-primary-foreground/80 mt-1.5">
 {isPlanFuture ? `Starting ${formatDate(effectiveStartDate)}.` : `${userNameDisplay}.`}
 </span>
 </h1>
 <p className="mt-3 text-base sm:text-lg leading-relaxed text-primary-foreground/80 max-w-xl">
 {isPlanFuture
 ? `Your study plan is set to start on ${formatDate(effectiveStartDate)}. No problems are scheduled for today so you can prepare or begin right now.`
 : timeBasedGreeting.subtext}
 </p>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-auto pt-8">
 {isPlanFuture ? (
 <>
 <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col text-card-foreground">
 <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Countdown</span>
 <div className="flex items-end gap-1 mb-1">
 <span className="text-2xl font-bold leading-none">{daysUntilStart}</span>
 <span className="text-sm text-muted-foreground pb-0.5">day{daysUntilStart === 1 ? '' : 's'}</span>
 </div>
 <span className="text-xs text-muted-foreground mt-auto">Until Day 1 unlocks</span>
 </div>

 <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col text-card-foreground">
 <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
 <Target className="size-3.5" /> First Topic
 </span>
 <div className="text-xl font-bold leading-tight mb-1 truncate">
 {displayedDay?.topic?.split('—')[0]?.trim() || "Arrays"}
 </div>
 <span className="text-xs text-muted-foreground mt-auto">{displayedDay?.problems?.length || 3} problems queued</span>
 </div>

 <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col text-card-foreground">
 <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Daily Pace</span>
 <div className="text-2xl font-bold leading-none mb-1">{settings?.counts?.target || 3} / day</div>
 <span className="text-xs text-muted-foreground mt-auto">Configured in settings</span>
 </div>
 </>
 ) : (
 <>
 <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col text-card-foreground">
 <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Today's Progress</span>
 <div className="flex items-end gap-1 mb-3">
 <span className="text-2xl font-bold leading-none">{missionSolvedCount}</span>
 <span className="text-sm text-muted-foreground pb-0.5">/ {missionTotalCount}</span>
 </div>
 <div className="h-1.5 w-full rounded-full bg-muted mt-auto overflow-hidden">
 <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${missionProgress}%` }} />
 </div>
 </div>

 <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col text-card-foreground">
 <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-warning mb-2">
 <Flame className="size-3.5" /> Current Streak
 </span>
 <div className="flex items-end gap-1 mb-1">
 <span className="text-2xl font-bold leading-none">{streakCount}</span>
 <span className="text-sm font-medium text-muted-foreground pb-0.5">days</span>
 </div>
 <span className="text-xs text-muted-foreground mt-auto">Next milestone: {nextStreakMilestone}</span>
 </div>

 <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col text-card-foreground">
 <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Journey</span>
 <div className="text-2xl font-bold leading-none mb-1">{journeyProgress}%</div>
 <span className="text-xs text-muted-foreground mt-auto">Keep showing up.</span>
 </div>
 </>
 )}
 </div>
 </div>

 {/* Right Content (Assistant & Orbit/Visuals) */}
 <div className="flex flex-col gap-6 xl:w-[320px] shrink-0">
 <MissionWelcomeMascot name={userNameDisplay} />
 
 <div className="flex items-center justify-center bg-background rounded-xl border border-border p-4 shadow-sm h-full min-h-[220px]">
 <TodayMissionOrbit
 topic={sanitizedDay?.topic}
 solvedCount={missionSolvedCount}
 totalCount={missionTotalCount}
 streakCount={streakCount}
 badges={badges}
 />
 </div>
 </div>
 </div>

 {/* Learning Arc - bottom row */}
 <div className="relative mt-8 pt-6 border-t border-primary-foreground/20">
 <div className="flex items-center justify-between gap-4 text-xs mb-3">
 <span className="font-semibold uppercase tracking-wider text-primary-foreground/70">Your learning arc</span>
 <span className="font-medium text-primary-foreground">{journeyProgress}% complete</span>
 </div>
 <div className="relative h-1.5 rounded-full bg-primary-foreground/20">
 <div className="absolute inset-y-0 left-0 rounded-full bg-primary-foreground transition-all duration-700" style={{ width: `${journeyProgress}%` }} />
 <div className="absolute inset-x-0 -top-1.5 flex justify-between">
 {Array.from({ length: 5 }).map((_, index) => {
 const isReached = index / 4 <= journeyProgress / 100;
 return (
 <span
 key={index}
 className={cn(
 "size-4 rounded-full border-2 transition-colors",
 isReached ? "bg-primary-foreground border-primary ring-2 ring-primary-foreground/30" : "bg-primary-foreground/20 border-primary"
 )}
 />
 );
 })}
 </div>
 </div>
 <div className="mt-3 flex justify-between text-[10px] font-medium text-primary-foreground/70">
 <span>Started</span>
 <span>Consistency</span>
 <span>Next Chapter</span>
 </div>
 </div>
</header>

 
 {/* ── WORKSPACE SPLIT ── */}
 <div className="grid grid-cols-1 gap-8 items-start xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.8fr)] xl:gap-10">
 
 {/* PRIMARY LEARNING COLUMN (Left side, 8 cols) */}
 <main className="min-w-0 space-y-10">

 {isPlanFuture ? (
 <section className="space-y-6">
 <div className="rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-sm text-center flex flex-col items-center justify-center space-y-6">
 <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-sm">
 <Rocket className="size-8" />
 </div>
 <div className="max-w-md space-y-2">
 <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary mb-1">
 <CalendarIcon className="size-3.5" />
 <span>Scheduled Start: {formatDate(effectiveStartDate)}</span>
 </div>
 <h2 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-foreground">
 From this day we start the plan
 </h2>
 <p className="text-sm text-foreground/80 leading-relaxed">
 Your study journey is scheduled to start on <strong className="text-foreground font-bold">{formatDate(effectiveStartDate)}</strong> ({daysUntilStart} day{daysUntilStart === 1 ? '' : 's'} remaining). No problems are active for today so your progress tracking and streak start cleanly on your chosen day.
 </p>
 </div>

 {/* Day 1 Curriculum Preview Card */}
 {displayedDay && (
 <div className="w-full max-w-lg rounded-xl border border-border bg-secondary p-5 text-left space-y-3">
 <div className="flex items-center justify-between text-xs">
 <span className="font-bold uppercase tracking-wider text-muted-foreground">Day 1 Curriculum Preview</span>
 <span className="font-mono text-primary font-bold">{displayedDay.problems?.length || 3} Problems</span>
 </div>
 <p className="font-bold text-base text-foreground flex items-center gap-2">
 <Target className="size-4 text-primary" /> {displayedDay.topic}
 </p>
 {displayedDay.subtopics && displayedDay.subtopics.length > 0 && (
 <div className="flex flex-wrap gap-1.5 pt-1">
 {displayedDay.subtopics.map((sub, i) => (
 <span key={i} className="text-[11px] rounded-md bg-muted px-2.5 py-0.5 border border-border font-medium text-foreground">
 {sub}
 </span>
 ))}
 </div>
 )}
 </div>
 )}

 {/* Quick Action Buttons */}
 <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
 <Button
 onClick={handleStartToday}
 disabled={startingToday}
 className="font-bold gap-2 shadow-sm"
 >
 <PlayCircle className="size-4" />
 {startingToday ? "Starting..." : "Start Plan Today Instead"}
 </Button>
 <Button variant="outline" asChild className="gap-2">
 <Link href="/settings">
 <CalendarIcon className="size-4" />
 Adjust Start Date
 </Link>
 </Button>
 <Button variant="ghost" asChild className="gap-2 text-foreground/80">
 <Link href="/guide">
 <Code2 className="size-4" />
 Preparation Guide
 </Link>
 </Button>
 </div>
 </div>
 </section>
 ) : (
 <>
 {/* Topic Context (Editorial Style) */}
 {sanitizedDay && (
 <section className="space-y-5">
 <h2 className="font-display text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
 <Target className="size-5 text-primary" /> Current Topic
 </h2>
 <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden p-1">
 <DayDetail
 day={sanitizedDay}
 readOnly={false}
 lateMode={false}
 headerOnly
 hideContests
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
 <span className="text-xs font-bold uppercase tracking-wider text-foreground bg-secondary px-3 py-1 rounded-full">
 {sanitizedDay.problems.filter(p => p.done).length} / {sanitizedDay.problems.length} Done
 </span>
 </div>
 
 {/* The actual problems wrapped cleanly */}
 <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden p-2 sm:p-6">
 <DayDetail
 day={sanitizedDay}
 readOnly={false}
 lateMode={false}
 hideHeader
 hideContests
 />
 </div>
 </section>
 )}
 </>
 )}
 
 {/* Review Queue (Placeholder) */}
 <section className="space-y-5">
 <h2 className="font-display text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
 <RotateCcw className="size-5 text-warning" /> Review Queue
 </h2>
 <div className="rounded-lg border border-border bg-muted shadow-sm p-8 text-center flex flex-col items-center justify-center">
 <RotateCcw className="size-8 text-foreground mb-3" />
 <h3 className="font-bold text-warning mb-1">Spaced Repetition</h3>
 <p className="text-sm text-foreground max-w-sm mb-4">No problems due for review today. Keep pushing forward!</p>
 </div>
 </section>
 
 </main>

 {/* SECONDARY SIDEBAR (Right side, 4 cols) */}
 <aside className="min-w-0 space-y-8 xl:sticky xl:top-6 xl:self-start">
 
 {/* Progress Summary & Consistency */}
 <section className="space-y-4">
 <h2 className="font-display text-lg font-bold tracking-tight border-b border-border pb-2">
 Progress Summary
 </h2>
 <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
 <SubmissionHeatmap data={heatmapData} detailMap={detailMap} />
 </div>
 </section>

 {/* Weekly Completion & Milestones */}
 <section className="space-y-4">
 <h2 className="font-display text-lg font-bold tracking-tight border-b border-border pb-2">
 Milestones
 </h2>
 <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-6">
 <div>
 <div className="flex justify-between text-xs mb-2">
 <span className="text-foreground font-bold uppercase tracking-wider">Problems Solved</span>
 <span className="font-black text-primary">{stats.total}</span>
 </div>
 <Progress value={Math.min(100, (stats.total / (ALL_PROBLEMS.length || 1)) * 100)} className="h-2" />
 </div>
 <div>
 <div className="flex justify-between text-xs mb-2">
 <span className="text-foreground font-bold uppercase tracking-wider">Badges Earned</span>
 <span className="font-black text-success">{earnedBadgeCount}</span>
 </div>
 <Progress value={Math.min(100, (earnedBadgeCount / 10) * 100)} className="h-2" />
 </div>
 </div>
 </section>
 
 {/* AI Tutor Entry Point */}
 <section className="space-y-4">
 <h2 className="font-display text-lg font-bold tracking-tight border-b border-border pb-2">
 AI Assistance
 </h2>
 <div className="rounded-lg border border-border bg-muted p-6 shadow-sm relative overflow-hidden group hover:border-border transition-colors cursor-pointer">
 <div className="absolute -right-4 -top-4 size-24 bg-muted blur-2xl rounded-full group-hover:bg-muted transition-all"></div>
 <Sparkles className="size-6 text-primary mb-3 relative z-10" />
 <h3 className="font-bold text-foreground mb-1 relative z-10">AI Coding Tutor</h3>
 <p className="text-xs text-foreground relative z-10 mb-4">Stuck on a problem? Ask your AI tutor for a conceptual hint without revealing the code.</p>
 <Button asChild size="sm" className="w-full bg-primary hover:bg-primary text-white font-bold relative z-10">
 <a
 href={tutorHref}
 target="_blank"
 rel="noreferrer"
 aria-label={`Launch AI tutor for ${tutorTarget}`}
 >
 Launch Tutor
 </a>
 </Button>
 </div>
 </section>
 
 {/* Recommendations */}
 <section className="space-y-4">
 <h2 className="font-display text-lg font-bold tracking-tight border-b border-border pb-2">
 Recommended Next
 </h2>
 <div className="rounded-lg border border-border bg-muted p-5 shadow-sm">
 {isPlanFuture ? (
 <div className="space-y-4">
 <div>
 <p className="text-[11px] font-bold uppercase tracking-wider text-primary">First day</p>
 <h3 className="mt-2 break-words text-base font-bold leading-6 text-foreground">{displayedDay?.topic || "Day 1 Kickoff"}</h3>
 <p className="mt-1 text-xs leading-5 text-muted-foreground">Activates on {formatDate(effectiveStartDate)}. Preview the curriculum or explore practice problems in the meantime.</p>
 </div>
 <div className="flex flex-col gap-2">
 <Button onClick={handleStartToday} disabled={startingToday} size="sm" className="w-full font-bold">
 {startingToday ? "Starting..." : "Start Day 1 Now"}
 </Button>
 <Button asChild size="sm" variant="outline" className="w-full font-bold">
 <Link href={`/day/${displayedDay?.dayNumber ?? 1}`}>Preview Day 1</Link>
 </Button>
 </div>
 </div>
 ) : nextIncompleteProblem ? (
 <div className="space-y-4">
 <div>
 <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Continue today</p>
 <h3 className="mt-2 break-words text-base font-bold leading-6 text-foreground">{nextIncompleteProblem.name}</h3>
 <p className="mt-1 text-xs leading-5 text-foreground">
 {nextIncompleteProblem.difficulty} · {nextIncompleteProblem.platform || "DSA"} · {completedTodayCount}/{todayQueue.length} complete
 </p>
 </div>
 <Button asChild size="sm" className="w-full font-bold">
 <Link href={`/day/${displayedDay?.dayNumber ?? ""}`}>Open today&apos;s queue</Link>
 </Button>
 </div>
 ) : nextPlanDay ? (
 <div className="space-y-4">
 <div>
 <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Up next</p>
 <h3 className="mt-2 break-words text-base font-bold leading-6 text-foreground">{nextPlanDay.topic || nextPlanDay.section}</h3>
 <p className="mt-1 text-xs leading-5 text-foreground">Preview Day {nextPlanDay.dayNumber} and prepare for the next topic.</p>
 </div>
 <Button asChild size="sm" variant="outline" className="w-full font-bold">
 <Link href={`/day/${nextPlanDay.dayNumber}`}>Preview next day</Link>
 </Button>
 </div>
 ) : completedTodayCount > 0 ? (
 <div className="space-y-4">
 <div>
 <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Today complete</p>
 <h3 className="mt-2 text-base font-bold leading-6 text-foreground">Keep the momentum going</h3>
 <p className="mt-1 text-xs leading-5 text-foreground">Review a solved problem or strengthen a weak topic.</p>
 </div>
 <Button asChild size="sm" variant="outline" className="w-full font-bold">
 <Link href="/review">Open review queue</Link>
 </Button>
 </div>
 ) : (
 <div className="space-y-4">
 <div>
 <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Ready when you are</p>
 <h3 className="mt-2 text-base font-bold leading-6 text-foreground">Start today&apos;s learning mission</h3>
 <p className="mt-1 text-xs leading-5 text-foreground">Your next step will appear here once today&apos;s plan is available.</p>
 </div>
 <Button asChild size="sm" className="w-full font-bold">
 <Link href="/problems">Browse problems</Link>
 </Button>
 </div>
 )}
 </div>
 </section>

 {/* Keep contests in the open right-side workspace, not below the full dashboard. */}
 <section className="min-w-0 pt-2" aria-label="Today&apos;s contests and competitions">
 <TodayContestsSection />
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

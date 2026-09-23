"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth, db } from "@/integrations/firebase/client";
import { getCountFromServer, collection } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuoteLoader } from "@/components/QuoteLoader";
import { DemoShell } from "@/components/demo/DemoShell";
import { CORE_SECTIONS } from "@/lib/master-problems";
import { ALL_PROBLEMS } from "@/lib/problems";
import { seedDays, TOTAL_PROBLEMS } from "@/lib/plan";
import { CURATED_SHEETS } from "@/lib/sheets-data";
import { getChatGPTAiPromptUrl } from "@/lib/aiTutorPrompt";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Code2,
  LayoutGrid,
  Sparkles,
  Trophy,
  Users,
  Search,
  ExternalLink,
  Zap,
  Bot,
  Laptop,
  Globe,
  Download,
  FolderGit2,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Play,
  Clock,
  Flame,
  Menu,
  X,
  Sliders,
  Compass,
  Check,
  Pause,
  HelpCircle,
  Calendar,
  Layers,
  BookOpen,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { InstallApkSection } from "@/components/InstallApkSection";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { ChromeInstallModal } from "@/components/ChromeInstallModal";

function ChromeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <line x1="21.17" y1="8" x2="12" y2="8" />
      <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
      <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

/* ─── real, derived homepage stats (single source of truth) ─── */
const REAL_SECTIONS_COUNT = CORE_SECTIONS.length;
const REAL_PATTERNS_COUNT = Array.from(
  new Set(CORE_SECTIONS.flatMap((s) => s.subtopics))
).length;
const REAL_TOTAL_PROBLEMS = TOTAL_PROBLEMS;
const REAL_PRACTICE_PROBLEMS_COUNT = ALL_PROBLEMS.length - TOTAL_PROBLEMS;
const REAL_WEEKS_COUNT = Math.ceil(seedDays().length / 7);

/* ─── count-up hook ─── */
function useCountUp(target: number, duration = 1000) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || target <= 0) return;
    let start: number | null = null;
    let frameId: number;

    function tick(now: number) {
      if (!start) start = now;
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      if (el) el.textContent = Math.round(eased * target).toString();
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [target, duration]);
  return ref;
}

/* ═══════════════════════════════════════════════════════════
   SIMPLIFIED 4-STAT TOP BAR
═══════════════════════════════════════════════════════════ */
function StatsBar() {
  const COMBINED_TOTAL_PROBLEMS = REAL_TOTAL_PROBLEMS + REAL_PRACTICE_PROBLEMS_COUNT;
  const cTotal = useCountUp(COMBINED_TOTAL_PROBLEMS);
  const cPatterns = useCountUp(REAL_PATTERNS_COUNT);
  const cWeeks = useCountUp(REAL_WEEKS_COUNT);

  const downloadCore404Sheets = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    toast.success("Downloading Core 404 Sheet...", {
      description: "Both PDF and Excel (.xlsx) versions are downloading.",
      duration: 4500,
    });

    const pdfLink = document.createElement("a");
    pdfLink.href = "/Core404_Problems_Grouped_By_Pattern.pdf";
    pdfLink.download = "Core404_Problems_Grouped_By_Pattern.pdf";
    document.body.appendChild(pdfLink);
    pdfLink.click();
    document.body.removeChild(pdfLink);

    setTimeout(() => {
      const excelLink = document.createElement("a");
      excelLink.href = "/Core404_Problems_Grouped_By_Pattern.xlsx";
      excelLink.download = "Core404_Problems_Grouped_By_Pattern.xlsx";
      document.body.appendChild(excelLink);
      excelLink.click();
      document.body.removeChild(excelLink);
    }, 350);
  };

  const stats = [
    {
      id: "problems",
      isSheetsCard: true,
      ref: cTotal,
      value: COMBINED_TOTAL_PROBLEMS,
      label: "Hand-curated Problems",
      sub: "Striver A2Z · NeetCode 150 · Love Babbar · Core 404",
      icon: Trophy,
      iconColor: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-500/10",
    },
    {
      id: "topics",
      isSheetsCard: false,
      ref: cPatterns,
      value: REAL_PATTERNS_COUNT,
      label: "Topics & Patterns",
      sub: `${REAL_SECTIONS_COUNT} structured curriculum sections`,
      icon: LayoutGrid,
      iconColor: "text-purple-600 dark:text-purple-400",
      iconBg: "bg-purple-500/10",
    },
    {
      id: "roadmap",
      isSheetsCard: false,
      ref: cWeeks,
      value: REAL_WEEKS_COUNT,
      label: "Structured Roadmap",
      sub: "Week-by-week progressive DSA journey",
      icon: Calendar,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-500/10",
    },
    {
      id: "platforms",
      isSheetsCard: false,
      ref: undefined,
      value: "6+ Hubs",
      label: "Connected Platforms",
      sub: "LeetCode · GFG · Codeforces · GitHub",
      icon: Code2,
      iconColor: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 w-full items-stretch">
      {stats.map((s) => {
        const Icon = s.icon;
        const isSheets = s.isSheetsCard;

        return (
          <div
            key={s.label}
            onClick={isSheets ? () => downloadCore404Sheets() : undefined}
            title={isSheets ? "Click to download Curated Sheets (PDF & Excel)" : undefined}
            className={cn(
              "group relative overflow-hidden rounded-xl bg-card border border-border p-4 shadow-xs transition-all duration-200 hover:border-primary/60 hover:shadow-md flex flex-col justify-between h-full",
              isSheets && "hover:border-amber-500/70 cursor-pointer ring-1 ring-amber-500/20"
            )}
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className={`inline-flex size-8 items-center justify-center rounded-lg ${s.iconBg}`}>
                  <Icon className={`size-4 ${s.iconColor}`} />
                </div>
              </div>
              <p className="font-mono text-2xl font-bold text-foreground tabular-nums leading-none">
                {s.ref ? <span ref={s.ref}>{s.value}</span> : <span>{s.value}</span>}
              </p>
              <p className="mt-1.5 text-xs font-bold text-foreground truncate">{s.label}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2 leading-tight">{s.sub}</p>
            </div>

            {isSheets && (
              <div className="mt-3 pt-2 border-t border-border/60">
                <button
                  type="button"
                  onClick={(e) => downloadCore404Sheets(e)}
                  className="w-full inline-flex items-center justify-center gap-1 rounded-md bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 py-1 px-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 transition-colors"
                >
                  <Download className="size-3 shrink-0" />
                  <span>Download Cheat Sheets</span>
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   HERO SECTION WITH FRIENDLY "TODAY'S PLAN" PREVIEW
═══════════════════════════════════════════════════════════ */
function HeroSection() {
  const { promptInstall } = usePWAInstall();

  return (
    <section className="relative overflow-hidden py-8 sm:py-12">
      {/* Laptop / Chrome App Banner */}
      <div className="mx-auto max-w-6xl mb-6">
        <div className="rounded-2xl border border-primary/20 bg-card/60 p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Laptop className="size-4" />
            </div>
            <div className="text-xs sm:text-sm">
              <span className="font-semibold text-foreground">Best on Laptop/Desktop:</span>{" "}
              <span className="text-muted-foreground">
                Install the Chrome App for fast access, daily problem reminders, and smooth side-by-side coding.
              </span>
            </div>
          </div>
          <Button
            onClick={promptInstall}
            size="sm"
            variant="outline"
            className="font-mono text-xs font-semibold gap-1.5 shrink-0 cursor-pointer"
          >
            <ChromeIcon className="size-3.5" />
            Install App
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Hero Content */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs text-primary font-mono font-medium mb-4">
              <Sparkles className="size-3.5 shrink-0" />
              <span>Your beginner-friendly DSA learning planner</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-foreground">
              Learn DSA step by step, <span className="text-primary">without wondering what to solve next.</span>
            </h1>

            <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
              DSA⁴⁰⁴ turns confusing problem lists into a personalized daily plan. Choose your pace, learn one topic at a time, practice important patterns, and track your progress until you feel confident.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <Button asChild size="lg" className="font-mono justify-center text-center font-bold">
                <Link href="/auth?mode=signup">
                  Create my free plan
                  <ArrowRight className="size-4 ml-1.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-mono justify-center text-center">
                <a href="#how-it-works">See how it works</a>
              </Button>
            </div>

            {/* "New to DSA?" Link */}
            <div className="mt-4 flex items-center gap-2">
              <a
                href="#explain-dsa"
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-primary hover:underline underline-offset-4"
              >
                <span>New to DSA? Click here to learn what it means →</span>
              </a>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-500" />
                No prior DSA experience needed
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-500" />
                Adjust daily pace anytime
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-500" />
                100% Free & open starter
              </span>
            </div>
          </div>

          {/* Friendly "Today's Plan" Product Preview */}
          <div className="lg:col-span-6 w-full">
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-emerald-500" />
                  <span className="font-mono text-xs font-bold text-foreground">Today's Plan</span>
                </div>
                <Badge variant="outline" className="font-mono text-[10px] text-primary border-primary/30">
                  Day 1 of 120
                </Badge>
              </div>

              {/* Today Topic Header */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 mb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-mono text-primary font-bold uppercase tracking-wide">
                      Current Topic
                    </span>
                    <h3 className="font-display text-base font-bold text-foreground">
                      Two Pointers & Sliding Window
                    </h3>
                  </div>
                  <Badge variant="secondary" className="font-mono text-xs">
                    3 Problems Today
                  </Badge>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1 font-mono">
                    <span className="text-muted-foreground">Daily Goal</span>
                    <span className="font-bold text-foreground">2 of 3 Solved (66%)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: "66%" }} />
                  </div>
                </div>
              </div>

              {/* Sample Problem Checklist */}
              <div className="space-y-2 font-sans">
                <div className="rounded-lg border border-border bg-background p-3 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Check className="size-3.5 stroke-[3]" />
                    </div>
                    <span className="text-xs font-semibold text-foreground line-through opacity-70 truncate">
                      1. Two Sum (Array / Hash Map)
                    </span>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] shrink-0 font-mono">
                    Easy · Done
                  </Badge>
                </div>

                <div className="rounded-lg border border-border bg-background p-3 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Check className="size-3.5 stroke-[3]" />
                    </div>
                    <span className="text-xs font-semibold text-foreground line-through opacity-70 truncate">
                      2. Valid Palindrome (Two Pointers)
                    </span>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] shrink-0 font-mono">
                    Easy · Done
                  </Badge>
                </div>

                <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 flex items-center justify-between gap-2 shadow-xs ring-1 ring-primary/20">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-5 rounded-full border border-primary/50 flex items-center justify-center shrink-0">
                      <span className="size-2 rounded-full bg-primary" />
                    </div>
                    <span className="text-xs font-bold text-foreground truncate">
                      3. Container With Most Water
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-mono">
                      Medium
                    </Badge>
                    <a
                      href="https://leetcode.com/problems/container-with-most-water/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded bg-primary text-primary-foreground px-2 py-1 text-[10px] font-mono font-bold hover:opacity-90"
                    >
                      Solve ↗
                    </a>
                  </div>
                </div>
              </div>

              {/* Guided Action Buttons Preview */}
              <div className="mt-3.5 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground font-mono">
                <span className="text-[11px]">Stuck on problem #3?</span>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                    <Zap className="size-3" />
                    Hints (AI)
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-[10px] font-bold">
                    <Play className="size-3 fill-current" />
                    Video
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   "IS THIS FOR YOU?" SECTION
═══════════════════════════════════════════════════════════ */
function IsThisForYouSection() {
  const painPoints = [
    {
      title: "“I don't know where to start.”",
      desc: "Faced with thousands of random LeetCode problems and dense sheets, you feel lost about what to solve today.",
      icon: Compass,
      color: "border-l-sky-500 text-sky-600 dark:text-sky-400 bg-sky-500/10",
    },
    {
      title: "“I solve problems but don't see progress.”",
      desc: "Jumping between random topics without a structured plan makes it hard to remember solutions or build confidence.",
      icon: BarChart3,
      color: "border-l-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/10",
    },
    {
      title: "“I understand the solution but not the pattern.”",
      desc: "Reading editorials makes sense in the moment, but you struggle to recognize which technique to use on new problems.",
      icon: LayoutGrid,
      color: "border-l-purple-500 text-purple-600 dark:text-purple-400 bg-purple-500/10",
    },
    {
      title: "“I struggle to stay consistent.”",
      desc: "Missing one day ruins your streak and creates an overwhelming backlog, making you want to give up.",
      icon: Clock,
      color: "border-l-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
    },
  ];

  return (
    <section className="py-10 border-t border-border/50">
      <div className="mx-auto max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <Badge variant="outline" className="font-mono text-xs text-primary mb-2">
            Is this for you?
          </Badge>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            If any of these sound familiar, DSA⁴⁰⁴ was built for you.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {painPoints.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className={cn(
                  "rounded-xl border bg-card p-4 sm:p-5 shadow-xs border-l-4 transition-all hover:shadow-md",
                  item.color.split(" ")[0]
                )}
              >
                <div className="flex items-start gap-3.5">
                  <div className={cn("size-9 rounded-lg flex items-center justify-center shrink-0", item.color)}>
                    <Icon className="size-4.5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-amber-500/10 to-emerald-500/10 p-4 sm:p-5 text-center shadow-xs">
          <p className="text-sm sm:text-base font-semibold text-foreground">
            👉 DSA⁴⁰⁴ gives you the next step, the reason behind it, and a simple way to keep going.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   EXPLAIN DSA IN BEGINNER LANGUAGE (#explain-dsa)
═══════════════════════════════════════════════════════════ */
function ExplainDsaSection() {
  const concepts = [
    {
      title: "Data Structures",
      desc: "Ways to organize information in computer memory (like arrays, linked lists, and trees) so it's fast to find and update.",
      icon: "📦",
    },
    {
      title: "Algorithms",
      desc: "Step-by-step instructions (like binary search or depth-first search) to solve a specific problem efficiently.",
      icon: "⚙️",
    },
    {
      title: "Patterns",
      desc: "Reusable problem-solving ideas (like Two Pointers or Sliding Window) that apply to hundreds of different questions.",
      icon: "🧩",
    },
    {
      title: "Practice",
      desc: "Applying patterns repeatedly until your brain recognizes them instantly during interviews and coding tests.",
      icon: "📈",
    },
  ];

  return (
    <section id="explain-dsa" className="py-10 border-t border-border/50">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl border border-border bg-card/60 p-6 sm:p-8 shadow-md">
          <div className="max-w-3xl mb-8">
            <Badge variant="outline" className="font-mono text-xs text-primary mb-2">
              DSA Explained Simply
            </Badge>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              What is DSA and why does it matter?
            </h2>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
              <strong>DSA</strong> stands for <strong>Data Structures and Algorithms</strong>. It is the core foundation behind writing efficient software and passing technical coding interviews.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {concepts.map((item) => (
              <div key={item.title} className="rounded-xl border border-border/80 bg-background p-4 flex flex-col justify-between">
                <div>
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <h3 className="font-display text-base font-bold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>💡 <strong>Key Takeaway:</strong> You don't need to memorize hundreds of unrelated solutions. Learn the <strong>patterns</strong>, and the problems become easy.</span>
            <Link href="#roadmap" className="font-mono font-bold text-primary hover:underline shrink-0">
              Explore Learning Roadmap →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   HOW THE PLATFORM WORKS (4-STEP FLOW)
═══════════════════════════════════════════════════════════ */
function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      title: "Choose your daily pace",
      desc: "Select how many problems you want to practice each day (e.g., 2, 3, or 5). The planner automatically calculates your finish date.",
      badge: "Adaptive Schedule",
    },
    {
      num: "02",
      title: "Follow your daily plan",
      desc: "Get topic-focused problems arranged in a structured learning order. Every day presents a clear, manageable checklist.",
      badge: "Curated Sequence",
    },
    {
      num: "03",
      title: "Learn from every problem",
      desc: "Open coding platforms, view step-by-step logic hints, ask ChatGPT for intuitive breakdowns, watch video tutorials, or save notes.",
      badge: "Guided Assistance",
    },
    {
      num: "04",
      title: "Track and improve",
      desc: "Monitor daily progress, weekly completion, streaks, revision problems, contests, and completed patterns until full confidence.",
      badge: "Progress Analytics",
    },
  ];

  return (
    <section id="how-it-works" className="py-10 border-t border-border/50">
      <div className="mx-auto max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <Badge variant="outline" className="font-mono text-xs text-primary mb-2">
            Simple Daily Routine
          </Badge>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            How DSA⁴⁰⁴ guides your learning
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Four clear steps to build consistency and master problem-solving.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((s) => (
            <div key={s.num} className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xl font-bold text-primary">{s.num}.</span>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {s.badge}
                  </Badge>
                </div>
                <h3 className="font-display text-base font-bold text-foreground">
                  {s.title}
                </h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   INTERACTIVE "EXPLORE DSA404" PRODUCT SLIDESHOW (9 SLIDES)
═══════════════════════════════════════════════════════════ */
function ExploreSlideshowSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Interactive Demo State inside Slide 5 (Guided Problem Help)
  const [selectedDemoAction, setSelectedDemoAction] = useState<"solve" | "youtube" | "chatgpt" | "google" | null>("solve");

  const slides = [
    {
      module: "Today's Plan",
      title: "Know exactly what to solve today",
      desc: "Your daily workspace shows the topic, problems, difficulty mix, checklist, notes, progress, and learning actions in one place.",
      takeaway: "Open the app and immediately know your next step.",
      ctaText: "See a sample daily plan",
      ctaHref: "/auth?mode=signup",
      capabilities: [
        "Focused daily topic banner with difficulty balance",
        "Interactive 12-step daily learning checklist",
        "Real-time daily progress bar & finish date estimation",
        "Direct learning actions: ⚡ Solve, ▶ YouTube, ✦ ChatGPT, 🔍 Google",
      ],
      type: "today",
    },
    {
      module: "Personalized Planner",
      title: "Create a plan that fits your life",
      desc: "Choose how many problems you want to solve each day. The planner estimates your finish date and adjusts when your schedule changes.",
      takeaway: "You do not need to follow someone else's pace.",
      ctaText: "Choose your pace",
      ctaHref: "/auth?mode=signup",
      capabilities: [
        "Custom daily problem count selector (1 to 10 per day)",
        "Pace presets: Relaxed (1/day), Standard (3/day), Intensive (5/day)",
        "Adaptive finish-date estimation based on current progress",
        "Postpone, pause, shift, merge, or insert revision days anytime",
      ],
      type: "planner",
    },
    {
      module: "Topics & Patterns",
      title: "Learn the patterns behind the problems",
      desc: "Study DSA in a structured order instead of jumping between random questions.",
      takeaway: "Patterns help you recognize how to approach new problems.",
      ctaText: "Explore the roadmap",
      ctaHref: "#roadmap",
      capabilities: [
        "28 structured topics spanning Beginner, Core, and Advanced DSA",
        "Pattern groupings: Two Pointers, Sliding Window, Trees, DP, etc.",
        "Expandable subtopics with Easy, Medium, Hard breakdown",
        "Skip topics you know and unskip them whenever needed",
      ],
      type: "topics",
    },
    {
      module: "Problem Library",
      title: "Find the right problem quickly",
      desc: "Search and filter a curated problem library by topic, pattern, platform, difficulty, completion status, or sheet.",
      takeaway: "You can practice without searching across many websites.",
      ctaText: "Browse sample problems",
      ctaHref: "#explore",
      capabilities: [
        "Curated sheets: Striver A2Z, NeetCode 150, Love Babbar & Core 404",
        "Instant search by name, pattern, platform, or difficulty",
        "Filter by completion, bookmarks, or review status",
        "Direct links to LeetCode, GeeksforGeeks, Codeforces & HackerRank",
      ],
      type: "library",
    },
    {
      module: "Guided Problem Help",
      title: "Get unstuck without losing the learning",
      desc: "Use hints, explanations, videos, searches, and AI guidance to understand the problem instead of simply copying an answer.",
      takeaway: "Help is available when you need it, but the goal is understanding.",
      ctaText: "Try guided help",
      ctaHref: "/auth?mode=signup",
      capabilities: [
        "⚡ Solve: Socratic ChatGPT AI Tutor gives hints without code spoilers",
        "✦ ChatGPT: Generates brute-force to optimal analysis with Big-O",
        "▶ YouTube: Instant video editorial search tailored for DSA creators",
        "🔍 Google: Pre-queried multi-platform search (LeetCode, TUF, GFG)",
      ],
      type: "guided_demo", // Embedded interactive demo!
    },
    {
      module: "Weekly Roadmap",
      title: "See your complete learning journey",
      desc: "View your preparation plan by day, week, month, or full roadmap.",
      takeaway: "You can see where you are and what comes next.",
      ctaText: "View the roadmap",
      ctaHref: "#roadmap",
      capabilities: [
        "17-week structured master roadmap view",
        "Weekly progress bars & topic-to-week relationships",
        "Clear distinction between completed, active, and pending days",
        "Direct 1-click day navigation to inspect past or future days",
      ],
      type: "roadmap",
    },
    {
      module: "Progress & Review",
      title: "See yourself getting better",
      desc: "Track solved problems, streaks, weekly progress, difficulty balance, activity history, badges, and bookmarked problems.",
      takeaway: "Your progress becomes visible and motivating.",
      ctaText: "View progress demo",
      ctaHref: "#explore",
      capabilities: [
        "Streak counter & weekly solving velocity analytics",
        "Submission activity heatmaps & difficulty distribution charts",
        "Review Vault: Spaced repetition for bookmarked/weak problems",
        "Unlockable badges and milestone achievements",
      ],
      type: "progress",
    },
    {
      module: "Contests",
      title: "Practice solving under time pressure",
      desc: "Discover upcoming coding contests and gradually build confidence with timed problem-solving.",
      takeaway: "You can start by observing contests before participating.",
      ctaText: "Explore contests",
      ctaHref: "/auth?mode=signup",
      capabilities: [
        "Live contest radar: LeetCode, Codeforces, CodeChef, AtCoder & HackerRank",
        "Live countdown timers, upcoming schedules & missed contest logs",
        "Automatic contest attendance tracking",
        "Google Calendar sync for upcoming contest reminders",
      ],
      type: "contests",
    },
    {
      module: "Coding Profile & GitHub",
      title: "Build proof of your learning",
      desc: "Connect coding profiles, track platform activity, showcase your progress, and sync solutions to GitHub.",
      takeaway: "Your practice can become a visible portfolio.",
      ctaText: "View profile demo",
      ctaHref: "/profile/demo",
      capabilities: [
        "Public shareable portfolio URL (/profile/[username])",
        "Unified platform stats across LeetCode, Codeforces, GFG, etc.",
        "Automated GitHub sync: auto-commits solved code as files to your repo",
        "Solved problem archive & shareable resume links",
      ],
      type: "profile",
    },
  ];

  const totalSlides = slides.length;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Autoplay timer with pause on hover
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [isPlaying, nextSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Touch swipe support
  const minSwipeDistance = 40;
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) nextSlide();
    if (isRightSwipe) prevSlide();
  };

  const slide = slides[currentSlide];

  return (
    <section
      id="slideshow"
      className="py-12 border-t border-border/50 bg-gradient-to-b from-card/30 via-background to-background"
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="mx-auto max-w-6xl px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <Badge variant="outline" className="font-mono text-xs text-primary mb-2">
            Interactive Product Tour
          </Badge>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Explore DSA⁴⁰⁴ module by module
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Take a step-by-step look at how each feature supports your learning journey.
          </p>
        </div>

        {/* Progress & Indicator Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 font-mono text-xs text-muted-foreground">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold">
            <Sparkles className="size-3.5" />
            <span>{currentSlide + 1} of {totalSlides} — {slide.module}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title={isPlaying ? "Pause autoplay" : "Resume autoplay"}
            >
              {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5 fill-current" />}
            </button>
            <span className="text-[11px]">Hover to pause · Swipe or use Arrow keys</span>
          </div>
        </div>

        {/* Slide Box Container */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xl relative overflow-hidden transition-all duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Module Details */}
            <div className="lg:col-span-6 flex flex-col justify-between h-full space-y-4">
              <div>
                <span className="font-mono text-xs font-bold text-primary uppercase tracking-wider">
                  Module {currentSlide + 1}: {slide.module}
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground mt-1">
                  {slide.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {slide.desc}
                </p>
              </div>

              {/* Capabilities List */}
              <div className="space-y-2 pt-2 border-t border-border/60">
                <span className="text-[11px] font-mono text-muted-foreground font-bold uppercase">What you can do here:</span>
                <ul className="space-y-1.5 text-xs text-foreground/90 font-medium">
                  {slide.capabilities.map((cap, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{cap}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Beginner Takeaway */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-foreground">
                <strong>💡 Beginner Takeaway:</strong> {slide.takeaway}
              </div>

              {/* Slide CTA Button */}
              <div>
                <Button asChild size="sm" className="font-mono text-xs font-bold">
                  {slide.ctaHref.startsWith("#") ? (
                    <a href={slide.ctaHref}>{slide.ctaText} →</a>
                  ) : (
                    <Link href={slide.ctaHref}>{slide.ctaText} →</Link>
                  )}
                </Button>
              </div>
            </div>

            {/* Right Column: Realistic UI Mockup Preview */}
            <div className="lg:col-span-6 w-full">
              {slide.type === "guided_demo" ? (
                /* Interactive Guided Help Demo Box */
                <div className="rounded-xl border border-border bg-background p-4 shadow-inner">
                  <div className="flex items-center justify-between text-xs font-mono mb-3 pb-2 border-b border-border/60">
                    <span className="font-bold text-foreground">Guided Help Action Bar</span>
                    <span className="text-primary text-[10px]">Click buttons to test</span>
                  </div>

                  <div className="rounded-lg border border-border/80 bg-card p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-muted-foreground">#1 Two Sum</span>
                      <Badge className="bg-emerald-500/10 text-emerald-500 text-[10px]">Easy</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedDemoAction("solve")}
                        className={cn(
                          "px-2.5 py-1 rounded text-xs font-mono font-bold transition-all border",
                          selectedDemoAction === "solve"
                            ? "bg-amber-500/20 text-amber-600 border-amber-500/50"
                            : "bg-muted text-muted-foreground border-border"
                        )}
                      >
                        ⚡ Solve (Hints)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedDemoAction("chatgpt")}
                        className={cn(
                          "px-2.5 py-1 rounded text-xs font-mono font-bold transition-all border",
                          selectedDemoAction === "chatgpt"
                            ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/50"
                            : "bg-muted text-muted-foreground border-border"
                        )}
                      >
                        ✦ ChatGPT
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedDemoAction("youtube")}
                        className={cn(
                          "px-2.5 py-1 rounded text-xs font-mono font-bold transition-all border",
                          selectedDemoAction === "youtube"
                            ? "bg-red-500/20 text-red-600 border-red-500/50"
                            : "bg-muted text-muted-foreground border-border"
                        )}
                      >
                        ▶ YouTube
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedDemoAction("google")}
                        className={cn(
                          "px-2.5 py-1 rounded text-xs font-mono font-bold transition-all border",
                          selectedDemoAction === "google"
                            ? "bg-sky-500/20 text-sky-600 border-sky-500/50"
                            : "bg-muted text-muted-foreground border-border"
                        )}
                      >
                        🔍 Google
                      </button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-card/80 p-3 text-xs font-mono text-muted-foreground leading-relaxed">
                    {selectedDemoAction === "solve" && (
                      <p className="text-amber-600 dark:text-amber-400">
                        ⚡ <strong>Socratic AI Tutor:</strong> Explains problem statement & guides with hints step-by-step — zero code spoilers!
                      </p>
                    )}
                    {selectedDemoAction === "chatgpt" && (
                      <p className="text-emerald-600 dark:text-emerald-400">
                        ✦ <strong>ChatGPT Analysis:</strong> Provides brute-force vs optimal approach comparison with Big-O time and space complexity.
                      </p>
                    )}
                    {selectedDemoAction === "youtube" && (
                      <p className="text-red-600 dark:text-red-400">
                        ▶ <strong>YouTube Search:</strong> Direct link to Striver (TUF), NeetCode, and top video explanations.
                      </p>
                    )}
                    {selectedDemoAction === "google" && (
                      <p className="text-sky-600 dark:text-sky-400">
                        🔍 <strong>Google Search:</strong> Multi-platform search pre-filtered for LeetCode, GFG, TUF, and editorial writeups.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* Static UI Card Preview */
                <div className="rounded-xl border border-border bg-background p-4 sm:p-5 shadow-inner">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-3">
                    <span className="font-mono text-xs font-bold text-foreground">
                      UI Preview: {slide.module}
                    </span>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      DSA⁴⁰⁴ Module
                    </Badge>
                  </div>

                  <div className="space-y-2.5 font-mono text-xs">
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-center justify-between">
                      <span className="font-bold text-foreground">{slide.title}</span>
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">Active</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg border border-border bg-card p-2.5">
                        <span className="text-[10px] text-muted-foreground">Capabilities</span>
                        <p className="text-xs font-bold text-foreground mt-0.5">{slide.capabilities.length} Features</p>
                      </div>
                      <div className="rounded-lg border border-border bg-card p-2.5">
                        <span className="text-[10px] text-muted-foreground">Learning Order</span>
                        <p className="text-xs font-bold text-foreground mt-0.5">Structured</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Controls & Dot Indicators */}
          <div className="mt-8 pt-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentSlide(idx)}
                  className={cn(
                    "h-2 rounded-full transition-all cursor-pointer",
                    currentSlide === idx ? "w-6 bg-primary" : "w-2 bg-muted hover:bg-muted-foreground/50"
                  )}
                  title={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevSlide}
                className="font-mono text-xs gap-1 cursor-pointer"
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextSlide}
                className="font-mono text-xs gap-1 cursor-pointer"
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Final Summary Banner below Slideshow */}
        <div className="mt-6 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-amber-500/10 to-emerald-500/10 p-4 text-center shadow-xs">
          <p className="font-mono text-xs sm:text-sm font-bold text-foreground tracking-wide">
            Plan your practice → Solve with guidance → Track progress → Build confidence
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   CORE PRODUCT FEATURES (6 CATEGORIES)
═══════════════════════════════════════════════════════════ */
function CoreFeaturesSection() {
  const [activeTab, setActiveTab] = useState(0);

  const categories = [
    {
      id: "planner",
      title: "Personalized Daily Planner",
      icon: Sliders,
      short: "Pace & Schedule",
      desc: "Customize your daily workload and let the planner build your schedule automatically.",
      points: [
        "Set custom daily problem target (Easy, Medium, Hard ratio)",
        "Automatic target finish-date calculation",
        "Adaptive rebalancing: Postpone, shift, skip, merge, or borrow days when life happens",
        "Insert structured revision days & catch up on backlog easily",
        "12-step daily learning checklist with notes and dry-run steps",
      ],
    },
    {
      id: "curriculum",
      title: "Topics & Patterns",
      icon: LayoutGrid,
      short: "Topics & Patterns",
      desc: "Master reusable problem-solving techniques instead of memorizing code.",
      points: [
        "Structured curriculum spanning 28 core DSA topics & subtopics",
        "Pattern-based problem grouping (Two Pointers, Sliding Window, DP, etc.)",
        "Skip topics you already know and restore them anytime if you change your mind",
        "Core 404 pattern cheat sheets",
        "One-click PDF & Excel download sheets for offline study",
      ],
    },
    {
      id: "practice",
      title: "Problem Library & Guidance",
      icon: Zap,
      short: "Problem Library",
      desc: "Solve curated problem sheets with built-in learning links and AI assistance.",
      points: [
        "Curated problem sheets: Striver A2Z, Striver SDE, NeetCode 150, Love Babbar & Core 404",
        "Direct platform links to LeetCode, GeeksforGeeks, Codeforces, and HackerRank",
        "⚡ Solve with hints: Socratic ChatGPT AI Tutor gives logic hints without code spoilers",
        "✦ Explain problem: Full breakdown of brute-force, optimal, and space/time complexities",
        "▶ Watch video tutorials & 🔍 Search Google resources instantly",
      ],
    },
    {
      id: "progress",
      title: "Progress & Review Problems",
      icon: Flame,
      short: "Progress & Review",
      desc: "Stay motivated with clear visual feedback on your daily and weekly progress.",
      points: [
        "Daily completion tracking & overall roadmap progress indicators",
        "Daily streak counter & weekly solving velocity",
        "Submission activity heatmaps & difficulty distribution breakdown",
        "Badges and achievements for hitting learning milestones",
        "Catch Up hub and smart revision reminders",
      ],
    },
    {
      id: "contests",
      title: "Contests & Timed Practice",
      icon: Trophy,
      short: "Coding Contests",
      desc: "Practice speed and decision-making under realistic competition pressure.",
      points: [
        "Live contest radar covering LeetCode, Codeforces, CodeChef, AtCoder & HackerRank",
        "Live countdown timers, upcoming schedule & missed contest records",
        "Automatic contest attendance tracking",
        "Google Calendar synchronization for upcoming contest alerts",
        "Beginner guidance: Observe contests first, participate when comfortable",
      ],
    },
    {
      id: "profile",
      title: "Coding Profile & GitHub Sync",
      icon: FolderGit2,
      short: "Coding Profile",
      desc: "Build a visible record of your problem-solving journey.",
      points: [
        "Public shareable portfolio link (/profile/[username])",
        "Unified coding platform handles (LeetCode, GFG, Codeforces, etc.)",
        "Automated GitHub solution sync: auto-commits solved code to your repository",
        "Shareable portfolio for resume, LinkedIn, and social profiles",
        "Downloadable solution archive and progress records",
      ],
    },
  ];

  return (
    <section id="features" className="py-10 border-t border-border/50">
      <div className="mx-auto max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <Badge variant="outline" className="font-mono text-xs text-primary mb-2">
            Comprehensive Platform Features
          </Badge>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Everything you need to master DSA in one place
          </h2>
        </div>

        {/* Category Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            const isActive = activeTab === idx;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={cn(
                  "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer select-none",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card hover:bg-muted text-muted-foreground border-border"
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                <span>{cat.short}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Category Content Box */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-md transition-all">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                {(() => {
                  const Icon = categories[activeTab].icon;
                  return <Icon className="size-5" />;
                })()}
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">
                  {categories[activeTab].title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {categories[activeTab].desc}
                </p>
              </div>
            </div>

            <ul className="mt-6 space-y-3 font-sans text-xs sm:text-sm">
              {categories[activeTab].points.map((pt, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="size-4.5 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground/90 font-medium">{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROADMAP PREVIEW (10 HIGH-LEVEL STAGES)
═══════════════════════════════════════════════════════════ */
function RoadmapPreviewSection() {
  const stages = [
    { title: "1. Foundations & Language Basics", count: "12 Problems", tag: "Beginner" },
    { title: "2. Arrays & Strings", count: "35 Problems", tag: "Core" },
    { title: "3. Hashing & Sorting", count: "25 Problems", tag: "Core" },
    { title: "4. Two Pointers & Sliding Window", count: "28 Problems", tag: "Pattern" },
    { title: "5. Linked Lists, Stacks & Queues", count: "30 Problems", tag: "Linear DS" },
    { title: "6. Recursion & Backtracking", count: "22 Problems", tag: "Logic" },
    { title: "7. Trees & Binary Search Trees", count: "35 Problems", tag: "Hierarchical" },
    { title: "8. Graphs & Traversal Algorithms", count: "38 Problems", tag: "Networks" },
    { title: "9. Greedy Algorithms & Heuristics", count: "18 Problems", tag: "Optimization" },
    { title: "10. Dynamic Programming & Advanced DS", count: "45 Problems", tag: "Advanced" },
  ];

  return (
    <section id="roadmap" className="py-10 border-t border-border/50">
      <div className="mx-auto max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <Badge variant="outline" className="font-mono text-xs text-primary mb-2">
            Structured Learning Roadmap
          </Badge>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            From beginner fundamentals to advanced patterns
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            You do not need to decide everything today. The planner gives you one manageable step at a time.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {stages.map((stg) => (
            <div key={stg.title} className="rounded-xl border border-border bg-card p-3.5 shadow-2xs hover:border-primary/50 transition-colors">
              <span className="font-mono text-[10px] font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
                {stg.tag}
              </span>
              <h3 className="font-display text-xs font-bold text-foreground mt-2 line-clamp-2">
                {stg.title}
              </h3>
              <p className="mt-1 font-mono text-[11px] text-muted-foreground font-semibold">
                {stg.count}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   BEGINNER FAQ ACCORDION (12 ITEMS)
═══════════════════════════════════════════════════════════ */
function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "What is DSA⁴⁰⁴?",
      a: "DSA⁴⁰⁴ is a beginner-friendly DSA learning planner and progress tracker. It organizes random problems into a structured daily plan tailored to your pace.",
    },
    {
      q: "Do I need prior DSA knowledge?",
      a: "No prior DSA knowledge is required. The curriculum starts with basic programming fundamentals and builds up step-by-step.",
    },
    {
      q: "What if I am completely new to coding?",
      a: "You can start at 1 or 2 problems per day. Each problem comes with hints, ChatGPT explanations, and video tutorials to help you learn.",
    },
    {
      q: "How many problems should I solve per day?",
      a: "Most beginners start with 2 to 3 problems per day. You can change your daily workload anytime in Settings, and the plan recalculates instantly.",
    },
    {
      q: "What are DSA patterns?",
      a: "Patterns are reusable problem-solving techniques (like Two Pointers or Sliding Window). Instead of memorizing hundreds of solutions, learning patterns helps you solve new problems independently.",
    },
    {
      q: "What is the difference between Today's Plan and Problem Library?",
      a: "Today's Plan gives you a structured day-by-day sequence. Problem Library lets you search, filter, and practice problems across curated sheets (Striver, NeetCode, etc.) at your own speed.",
    },
    {
      q: "What are coding contests?",
      a: "A contest is a timed set of programming problems. It helps practice speed and decision-making under pressure. Beginners can observe contests first before competing.",
    },
    {
      q: "Can I change my daily pace later?",
      a: "Yes! You can increase or decrease your daily problem target anytime in Settings. Remaining problems automatically redistribute across your roadmap.",
    },
    {
      q: "What happens if I miss a day?",
      a: "Life happens. You can use actions like Postpone, Shift, Skip, or Borrow to rebalance your plan without losing momentum.",
    },
    {
      q: "Can I use ChatGPT for hints and explanations?",
      a: "Yes! Every problem includes a ⚡ Solve button that opens ChatGPT with a pre-filled Socratic prompt giving step-by-step logic hints without code spoilers.",
    },
    {
      q: "Can I connect my GitHub account?",
      a: "Yes! You can configure GitHub sync to automatically commit solved code to your GitHub repository.",
    },
    {
      q: "Is the platform free to start?",
      a: "Yes! DSA⁴⁰⁴ is free to use. You can create your account and start your personal daily plan immediately.",
    },
  ];

  return (
    <section id="faq" className="py-10 border-t border-border/50">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <Badge variant="outline" className="font-mono text-xs text-primary mb-2">
            Frequently Asked Questions
          </Badge>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Got questions? We've got answers.
          </h2>
        </div>

        <div className="space-y-3 font-sans">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={faq.q}
                className="rounded-xl border border-border bg-card overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-4 text-left font-display text-sm font-bold text-foreground flex items-center justify-between gap-3 cursor-pointer hover:bg-muted/40"
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "transform rotate-180 text-primary")} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-3 bg-muted/20">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   FINAL CALL TO ACTION BANNER
═══════════════════════════════════════════════════════════ */
function FinalCtaSection() {
  return (
    <section className="py-12 border-t border-border/50">
      <div className="mx-auto max-w-4xl text-center">
        <div className="rounded-2xl border border-primary/30 bg-card p-8 sm:p-12 shadow-xl relative overflow-hidden">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Stop wondering what to study next.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Start with one topic, one problem, and one consistent day. DSA⁴⁰⁴ will help you build from there.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="font-mono font-bold text-xs sm:text-sm px-6 py-3 h-auto">
              <Link href="/auth?mode=signup">
                Create my free plan
                <ArrowRight className="size-4 ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="font-mono text-xs sm:text-sm px-6 py-3 h-auto">
              <a href="#explore">Explore the demo</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN LANDING PAGE COMPONENT
═══════════════════════════════════════════════════════════ */
export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { promptInstall, isModalOpen, setIsModalOpen, isIOS, isStandalone } = usePWAInstall();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      const searchParams = new URLSearchParams(window.location.search);
      const isClosedOnboarding = searchParams.get("onboarding") === "closed";
      if (u && !isClosedOnboarding) {
        router.replace("/today");
      } else {
        setUser(null);
      }
    });
    return unsub;
  }, [router]);

  if (user === undefined) {
    return <QuoteLoader fullScreen />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header / Navigation */}
      <header className="border-b border-border/50 bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="size-7 rounded-full overflow-hidden border border-border/80 shadow-xs ring-1 ring-primary/20 bg-background shrink-0">
              <img src="/logo.jpg" alt="DSA404 Logo" className="size-full object-cover" />
            </div>
            <div className="font-display font-black tracking-tighter text-xl leading-none flex items-baseline select-none">
              <span className="bg-gradient-to-br from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">DSA</span>
              <span className="bg-gradient-to-br from-primary to-orange-500 bg-clip-text text-transparent ml-[1px]">⁴⁰⁴</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-mono font-semibold text-muted-foreground">
            <a href="#how-it-works" className="hover:text-primary transition-colors">How it works</a>
            <a href="#slideshow" className="hover:text-primary transition-colors">Tour</a>
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#roadmap" className="hover:text-primary transition-colors">Roadmap</a>
            <a href="#faq" className="hover:text-primary transition-colors">FAQ</a>
            <a href="#explore" className="hover:text-primary transition-colors text-primary font-bold">Demo</a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            {!isStandalone && (
              <Button
                onClick={promptInstall}
                variant="outline"
                size="sm"
                className="font-mono text-xs gap-1.5 hidden lg:inline-flex border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary cursor-pointer"
              >
                <ChromeIcon className="size-3.5" />
                Install App
              </Button>
            )}
            <Button asChild variant="outline" size="sm" className="font-mono text-xs gap-1.5 hidden sm:inline-flex border-primary/30 hover:bg-primary/10 cursor-pointer">
              <a href="#explore">
                <Play className="size-3 text-primary fill-current" />
                <span>Demo</span>
              </a>
            </Button>
            <Button asChild variant="ghost" size="sm" className="font-mono text-xs hidden sm:inline-flex">
              <Link href="/auth?mode=signin">Login</Link>
            </Button>
            <Button asChild size="sm" className="font-mono text-xs font-bold">
              <Link href="/auth?mode=signup">Start learning free</Link>
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden size-8"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border bg-background px-4 py-3 space-y-2 text-xs font-mono font-semibold">
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-foreground hover:text-primary"
            >
              How it works
            </a>
            <a
              href="#slideshow"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-foreground hover:text-primary"
            >
              Module Tour
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-foreground hover:text-primary"
            >
              Features
            </a>
            <a
              href="#roadmap"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-foreground hover:text-primary"
            >
              Roadmap
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-foreground hover:text-primary"
            >
              FAQ
            </a>
            <a
              href="#explore"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-primary font-bold"
            >
              ▶ Interactive Demo
            </a>
            <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
              <Link href="/auth?mode=signin" className="text-muted-foreground hover:text-foreground">
                Login
              </Link>
              <Link href="/auth?mode=signup" className="text-primary font-bold">
                Register Free →
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4">
        <HeroSection />
        <IsThisForYouSection />
        <ExplainDsaSection />
        <HowItWorksSection />
        <ExploreSlideshowSection />
        <CoreFeaturesSection />
        <RoadmapPreviewSection />
        <FaqSection />

        {/* Interactive Demo Shell Section */}
        <div id="explore" className="py-12 border-t border-border/50">
          <div className="mb-8 text-center max-w-2xl mx-auto">
            <Badge variant="outline" className="font-mono text-xs text-primary mb-2">
              Interactive Live Demo
            </Badge>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Test drive the complete workspace below
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Explore real curriculum topics, problem lists, daily checklists, and analytics.
            </p>
          </div>

          <StatsBar />
          <div className="mt-8">
            <DemoShell />
          </div>
        </div>

        <InstallApkSection />
        <FinalCtaSection />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10 bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 flex flex-col items-center justify-center text-center gap-4">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-full overflow-hidden border border-border/80 shadow-xs ring-1 ring-primary/20 bg-background shrink-0">
              <img src="/logo.jpg" alt="DSA404 Logo" className="size-full object-cover" />
            </div>
            <span className="font-display font-black tracking-tight text-base">
              DSA<span className="text-primary font-bold ml-0.5">⁴⁰⁴</span>
            </span>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
            DSA⁴⁰⁴ helps students learn Data Structures & Algorithms step by step through a personalized daily plan, guided problems, pattern-based learning, progress tracking, contests, and coding-profile integrations.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground">How it works</a>
            <span>·</span>
            <a href="#slideshow" className="hover:text-foreground">Module Tour</a>
            <span>·</span>
            <a href="#features" className="hover:text-foreground">Features</a>
            <span>·</span>
            <a href="#roadmap" className="hover:text-foreground">Roadmap</a>
            <span>·</span>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
            <span>·</span>
            <Link href="/auth?mode=signin" className="hover:text-foreground">Login</Link>
            <span>·</span>
            <Link href="/auth?mode=signup" className="hover:text-foreground">Register</Link>
          </div>

          <p className="text-xs text-muted-foreground font-medium">
            Created by{" "}
            <a
              href="https://pbmnaiduportfolio.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-foreground underline decoration-primary underline-offset-2 hover:text-primary transition-colors cursor-pointer"
            >
              Bhanu
            </a>
          </p>

          <div className="flex items-center gap-2 pt-0.5 font-mono text-xs">
            <a
              href="https://dsa404.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-primary hover:bg-primary/20 transition-all shadow-xs font-semibold"
            >
              <span>dsa404.vercel.app</span>
              <ExternalLink className="size-3" />
            </a>
          </div>

          <p className="text-[11px] text-muted-foreground/60 font-mono pt-2">
            © {new Date().getFullYear()} DSA⁴⁰⁴ · Built for structured, consistent DSA practice
          </p>
        </div>
      </footer>

      <ChromeInstallModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        isIOS={isIOS}
        isStandalone={isStandalone}
      />
    </div>
  );
}
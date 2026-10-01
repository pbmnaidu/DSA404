"use client";

/**
 * DemoShell — a fully static, fake-data preview of the interior app.
 *
 * IMPORTANT: This component is intentionally self-contained. It does NOT
 * import any real hooks (usePlan, useSettings, useAuth, Firestore, etc.)
 * and does NOT touch any of the real authenticated pages under
 * app/(authenticated)/*. It only *looks* like the real interior so a
 * signed-out visitor can understand what the product does before they
 * register. Nothing here reads or writes the database.
 */

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { enableGuestMode } from "@/lib/guest-data";
import {
 Sparkles,
 Code2,
 LayoutGrid,
 CalendarRange,
 Flame,
 BookmarkCheck,
 CalendarDays,
 Trophy,
 UserCircle2,
 Settings,
 CheckCircle2,
 Circle,
 Bookmark,
 Lock,
 Zap,
 Bot,
 Search,
 RotateCcw,
 PlusCircle,
 Combine,
 Ban,
 Undo2,
 Code,
 Video,
 Menu,
 X,
 PanelLeft,
 ChevronLeft,
 ChevronRight,
 Bell,
 Clock,
 Mail,
 Palette,
 Globe,
 ExternalLink,
 Check,
 Loader2,
 ArrowRight,
 Link2,
 TrendingUp,
 BarChart3,
 CheckCircle,
 Share2,
 FolderGit2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SubmissionHeatmap } from "@/components/SubmissionHeatmap";
import { GitHubContributionHeatmap } from "@/components/GitHubContributionHeatmap";
import { DailyCombinationsBreakdown } from "@/components/DailyCombinationsBreakdown";
import { GitHubIcon } from "@/components/SocialIcons";

const DEMO_NAV = [
 { key: "today", label: "Today's Workspace", icon: Sparkles },
 { key: "problems", label: "Problems", icon: Code2 },
 { key: "topics", label: "Topic View", icon: LayoutGrid },
 { key: "weeks", label: "Week View", icon: CalendarRange },
 { key: "progress", label: "Progress", icon: Flame },
 { key: "review", label: "Review", icon: BookmarkCheck },
 { key: "backlog", label: "Backlog", icon: CalendarDays },
 { key: "contests", label: "Contests", icon: Trophy },
 { key: "profile", label: "Coder Profile", icon: UserCircle2 },
 { key: "settings", label: "Settings", icon: Settings },
] as const;

type DemoTab = (typeof DEMO_NAV)[number]["key"];

/* ── fake data (display-only, never persisted) ───────────────────────── */
const FAKE_USER = {
 name: "Aditi Sharma",
 initials: "AS",
 streak: 14,
 day: 23,
 totalDays: 119,
 solved: 187,
 total: 904,
};

const FAKE_TODAY_PROBLEMS = [
 { title: "Reverse Linked List", difficulty: "Easy", done: true, platform: "LeetCode" },
 { title: "Detect Cycle in Linked List", difficulty: "Easy", done: true, platform: "LeetCode" },
 { title: "Merge Two Sorted Lists", difficulty: "Easy", done: false, platform: "GeeksforGeeks" },
 { title: "Add Two Numbers (Linked List)", difficulty: "Medium", done: false, platform: "LeetCode" },
 { title: "Flatten a Multilevel DLL", difficulty: "Hard", done: false, platform: "LeetCode" },
];

const FAKE_TOPICS = [
 { name: "Arrays", solved: 22, total: 34, isSkipped: false, sub: "Arrays · Cyclic Sort · Two Pointers" },
 { name: "Binary Search", solved: 4, total: 6, isSkipped: false, sub: "Sorting · Search Space Reduction" },
 { name: "Linked List", solved: 13, total: 16, isSkipped: false, sub: "Pointers · Fast/Slow · Node Reversal" },
 { name: "Stacks & Queues", solved: 9, total: 16, isSkipped: true, sub: "LIFO · Monotonic Stack · Deque" },
 { name: "Binary Trees", solved: 11, total: 25, isSkipped: false, sub: "DFS · BFS · Traversal · LCA" },
 { name: "Dynamic Programming", solved: 5, total: 44, isSkipped: false, sub: "1D/2D DP · Knapsack · LCS · LIS" },
];

const FAKE_WEEKS = Array.from({ length: 8 }, (_, i) => ({
 week: i + 1,
 status: i < 3 ? "done" : i === 3 ? "active" : "upcoming",
}));

function DifficultyBadge({ level }: { level: string }) {
 const styles: Record<string, string> = {
 Easy: "bg-muted text-success border-border",
 Medium: "bg-muted text-warning border-border",
 Hard: "bg-muted text-destructive border-border",
 };
 return <Badge variant="outline" className={cn("font-mono text-[10px]", styles[level])}>{level}</Badge>;
}

function DemoCTA({ label = "Sign up free to save this" }: { label?: string }) {
 return (
 <Link
 href="/auth"
 className="inline-flex items-center gap-1.5 text-xs font-mono text-primary hover:underline"
 >
 <Lock className="size-3" /> {label}
 </Link>
 );
}

/* ── panels ────────────────────────────────────────────────────────── */

function TodayPanel() {
 const { heatmapData, detailMap } = React.useMemo(() => {
 const data: { date: string; solved: number }[] = [];
 const detailMap: Record<string, any[]> = {};
 const today = new Date();

 for (let i = 180; i >= 0; i--) {
 const d = new Date(today);
 d.setDate(d.getDate() - i);
 const dateStr = d.toISOString().slice(0, 10);
 
 const rand = Math.sin(i * 3.7 + 1.2) * 10000;
 const pseudoRandom = Math.abs(rand - Math.floor(rand));
 
 let solved = 0;
 if (pseudoRandom > 0.45) {
 solved = Math.floor(pseudoRandom * 4) + 1;
 }

 if (solved > 0) {
 data.push({ date: dateStr, solved });
 detailMap[dateStr] = Array.from({ length: solved }, (_, idx) => ({
 name: idx === 0 ? "Reverse Linked List" : idx === 1 ? "Middle of Linked List" : idx === 2 ? "Merge Two Sorted Lists" : "Linked List Cycle",
 done: true,
 platform: idx % 2 === 0 ? "LeetCode" : "GeeksforGeeks",
 }));
 }
 }
 return { heatmapData: data, detailMap };
 }, []);

 return (
 <div className="space-y-6">
 {/* Today Workspace Card */}
 <div className="rounded-lg border border-border bg-card p-4 sm:p-6 shadow-sm">
 {/* Header & Day Action Buttons */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-border">
 <div>
 <div className="flex items-center gap-2">
 <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider">Day {FAKE_USER.day} of {FAKE_USER.totalDays}</span>
 <span className="text-xs text-foreground">· Linked List</span>
 </div>
 <h3 className="font-display text-lg font-bold text-foreground mt-0.5">Today's Workspace: Linked List Basics</h3>
 </div>

 <div className="flex items-center gap-2">
 <div className="flex items-center gap-1.5 rounded-full border border-warning bg-warning px-3 py-1 text-xs font-mono font-semibold text-warning dark:text-warning">
 <Flame className="size-3.5" /> {FAKE_USER.streak}-day streak
 </div>
 </div>
 </div>

 {/* Workspace Day Actions Bar (Revision, Borrow, Merge, Delete/Skip) */}
 <div className="mb-4 rounded-lg border border-border bg-muted p-3 flex flex-wrap items-center justify-between gap-2">
 <span className="text-xs font-mono font-bold text-foreground">Workspace Day Controls:</span>
 <div className="flex flex-wrap items-center gap-1.5">
 <button
 type="button"
 title="Revision: Mark this entire day or topic for weekly revision on Sunday"
 className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-2.5 py-1 text-xs font-mono font-semibold text-primary hover:bg-muted transition-colors"
 >
 <RotateCcw className="size-3" /> Revision
 </button>
 <button
 type="button"
 title="Borrow: Borrow a problem from a future day into today's workload"
 className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-2.5 py-1 text-xs font-mono font-semibold text-info dark:text-info hover:bg-muted transition-colors"
 >
 <PlusCircle className="size-3" /> Borrow
 </button>
 <button
 type="button"
 title="Merge: Merge today's workload with tomorrow's study day"
 className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-2.5 py-1 text-xs font-mono font-semibold text-primary dark:text-primary hover:bg-muted transition-colors"
 >
 <Combine className="size-3" /> Merge
 </button>
 <button
 type="button"
 title="Delete / Skip: Skip or delete this day's topic — remaining syllabus rebalances automatically"
 className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-2.5 py-1 text-xs font-mono font-semibold text-destructive dark:text-destructive hover:bg-muted transition-colors"
 >
 <Ban className="size-3" /> Delete / Skip
 </button>
 </div>
 </div>

 {/* GitHub Auto-Sync Active Banner */}
 <div className="mb-4 rounded-lg border border-border bg-muted p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div className="flex items-center gap-2.5">
 <div className="size-8 rounded-lg bg-muted text-success border border-border flex items-center justify-center shrink-0">
 <FolderGit2 className="size-4" />
 </div>
 <div>
 <div className="flex items-center gap-2 flex-wrap">
 <span className="text-xs font-bold text-foreground">GitHub Repo Automatic Submission</span>
 <span className="inline-flex items-center gap-1 rounded-full bg-muted text-success border border-border px-2 py-0.5 text-[9px] font-mono font-bold">
 ● AUTO-PUSH ACTIVE
 </span>
 </div>
 <p className="text-[11px] text-foreground mt-0.5">
 Target Repo: <span className="font-mono font-semibold text-success dark:text-success">aditi-sharma/dsa-solutions</span> (branch: <code className="text-foreground">main</code>) · Pushing code &amp; patterns as .txt files
 </p>
 </div>
 </div>
 <span className="text-[11px] font-mono text-success dark:text-success font-semibold shrink-0">
 2 Commits Pushed Today ✓
 </span>
 </div>

 {/* Problems List with All Action Buttons */}
 <div className="space-y-3">
 {FAKE_TODAY_PROBLEMS.map((p, idx) => (
 <div key={p.title} className="rounded-lg border border-border bg-background p-3.5 transition-all hover:border-border">
 {/* Problem Title & Meta Header */}
 <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
 <div className="flex items-center gap-2 min-w-0">
 {p.done ? (
 <span title="Completed"><CheckCircle2 className="size-4 text-success shrink-0" /></span>
 ) : (
 <span title="Pending"><Circle className="size-4 text-foreground shrink-0" /></span>
 )}
 <span className="font-mono text-xs text-foreground">#{idx + 1}</span>
 <span className={cn("text-sm font-semibold truncate", p.done && "line-through text-foreground")}>
 {p.title}
 </span>
 <span className="text-[10px] font-mono text-foreground bg-muted px-1.5 py-0.5 rounded">
 {p.platform}
 </span>
 </div>
 <DifficultyBadge level={p.difficulty} />
 </div>

 {/* Problem Action Bar (Solve, YouTube, ChatGPT, Search, Solution Code, Review) */}
 <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border">
 <button
 type="button"
 title="Solve: Launch interactive ChatGPT Socratic AI Tutor with step-by-step logic hints and zero code spoilers"
 className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-2 py-1 text-[11px] font-mono font-bold text-warning dark:text-warning hover:bg-muted transition-colors"
 >
 <Zap className="size-3 fill-amber-500/20" /> ⚡ Solve
 </button>

 <button
 type="button"
 title="YouTube: Search YouTube video tutorials and editorial explanations"
 className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-2 py-1 text-[11px] font-mono font-bold text-destructive dark:text-destructive hover:bg-muted transition-colors"
 >
 <Video className="size-3" /> ▶ YouTube
 </button>

 <button
 type="button"
 title="ChatGPT: Open pre-filled ChatGPT prompt for brute-force to optimal logic analysis"
 className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-2 py-1 text-[11px] font-mono font-bold text-success dark:text-success hover:bg-muted transition-colors"
 >
 <Bot className="size-3" /> ✦ ChatGPT
 </button>

 <button
 type="button"
 title="Google Search: Search Google across LeetCode, GFG, TUF & YouTube"
 className="inline-flex items-center gap-1 rounded-lg border border-primary bg-primary px-2 py-1 text-[11px] font-mono font-bold text-primary dark:text-primary hover:bg-primary transition-colors"
 >
 <Search className="size-3" /> 🔍 Search
 </button>

 <button
 type="button"
 title="Code / Solution: View canonical C++/Java/Python solution code"
 className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-2 py-1 text-[11px] font-mono font-bold text-primary dark:text-primary hover:bg-muted transition-colors"
 >
 <Code className="size-3" /> 💻 Code
 </button>

 <button
 type="button"
 title="Review: Flag problem to revisit later in your Review tab"
 className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-2 py-1 text-[11px] font-mono font-medium text-foreground hover:text-foreground transition-colors ml-auto"
 >
 <Bookmark className="size-3" /> Review
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>

 <div className="rounded-lg border border-border bg-card p-5">
 <h4 className="font-display font-semibold mb-3 text-sm">Solved Days Activity Heatmap</h4>
 <SubmissionHeatmap data={heatmapData} detailMap={detailMap} />
 </div>
 </div>
 );
}

function ProblemsPanel() {
 const sheets = ["All Sheets", "Core 404", "Striver A2Z", "Striver SDE", "NeetCode 150", "Love Babbar", "RisingBrains"];
 const platforms = ["All", "LeetCode", "GeeksforGeeks", "CodeChef", "HackerRank"];
 const [activeSheet, setActiveSheet] = useState("All Sheets");
 const [active, setActive] = useState("All");
 return (
 <div className="space-y-4">
 {/* Sheet Filter Pills */}
 <div className="flex items-center gap-2 overflow-x-auto pb-1">
 <span className="text-xs font-semibold text-foreground shrink-0">Sheet:</span>
 {sheets.map((s) => (
 <button
 key={s}
 onClick={() => setActiveSheet(s)}
 className={cn(
 "px-2.5 py-1 rounded-full text-xs font-mono border whitespace-nowrap transition-colors cursor-pointer",
 activeSheet === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-foreground hover:bg-muted"
 )}
 >
 {s}
 </button>
 ))}
 </div>

 <div className="flex flex-wrap gap-2">
 {platforms.map((p) => (
 <button
 key={p}
 onClick={() => setActive(p)}
 className={cn(
 "px-3 py-1.5 rounded-full text-xs font-mono border transition-colors cursor-pointer",
 active === p ? "bg-muted text-foreground border-border font-bold" : "border-border text-foreground hover:bg-muted"
 )}
 >
 {p}
 </button>
 ))}
 </div>
 <div className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
 {FAKE_TODAY_PROBLEMS.concat([
 { title: "Course Schedule (Topo Sort)", difficulty: "Medium", done: false, platform: "LeetCode" },
 { title: "Number of Islands", difficulty: "Medium", done: true, platform: "LeetCode" },
 ]).map((p, i) => (
 <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors">
 <div className="flex items-center gap-3 min-w-0">
 {p.done ? <CheckCircle2 className="size-4 text-success shrink-0" /> : <Circle className="size-4 text-foreground shrink-0" />}
 <span className="text-sm truncate">{p.title}</span>
 </div>
 <div className="flex items-center gap-3 shrink-0">
 <span className="text-[10px] font-mono text-foreground hidden sm:inline">{p.platform}</span>
 <DifficultyBadge level={p.difficulty} />
 <button
 type="button"
 title="Review: Flag problem to revisit later in your Review tab"
 className="text-foreground hover:text-foreground"
 >
 <Bookmark className="size-3.5" />
 </button>
 </div>
 </div>
 ))}
 </div>
 <p className="text-xs text-foreground">Showing a small sample — the real Problems tab has 1,500+ problems across 6 top curated sheets. <DemoCTA label="Register to unlock the full set" /></p>
 </div>
 );
}

function TopicsPanel() {
 const [topics, setTopics] = useState(FAKE_TOPICS);

 const toggleSkip = (name: string) => {
 setTopics((prev) =>
 prev.map((t) => (t.name === name ? { ...t, isSkipped: !t.isSkipped } : t))
 );
 };

 return (
 <div className="space-y-4">
 {/* Curated Sheet Selector Bar in Demo Topics */}
 <div className="rounded-lg border border-border bg-muted p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
 <div>
 <span className="text-xs font-bold text-primary flex items-center gap-1.5">
 <span>📚 Active Sheet: Core 404 DSA Roadmap</span>
 </span>
 <p className="text-[11px] text-foreground mt-0.5">
 Switch between Striver A2Z, Striver SDE, NeetCode 150, Love Babbar 450, RisingBrains &amp; Core 404
 </p>
 </div>
 <div className="flex flex-wrap gap-1">
 {["Core 404", "Striver A2Z", "NeetCode 150", "Love Babbar"].map((s, idx) => (
 <span
 key={s}
 className={cn(
 "px-2 py-0.5 rounded text-[10px] font-mono font-bold border",
 idx === 0 ? "bg-primary text-primary-foreground border-primary" : "border-border text-foreground"
 )}
 >
 {s}
 </span>
 ))}
 </div>
 </div>

 <p className="text-xs text-foreground font-mono">
 💡 <strong>Topic View Feature:</strong> Click <strong>Skip</strong> on any topic to remove it from your daily roadmap. The remaining syllabus rebalances automatically!
 </p>

 <div className="grid sm:grid-cols-2 gap-4">
 {topics.map((t) => (
 <div
 key={t.name}
 className={cn(
 "rounded-lg border bg-card p-4 transition-all",
 t.isSkipped ? "border-dashed border-border bg-muted " : "border-border"
 )}
 >
 <div className="flex items-center justify-between mb-1.5 gap-2">
 <div className="min-w-0">
 <span className={cn("font-display font-semibold text-sm block truncate", t.isSkipped && "line-through text-foreground")}>
 {t.name}
 </span>
 <span className="text-[11px] text-foreground block truncate">{t.sub}</span>
 </div>

 {/* Skip / Un-skip Action Button with hover tooltip */}
 <button
 type="button"
 title={t.isSkipped ? "Un-skip: Restore this topic back into your active daily roadmap" : "Skip: Skip this topic so your roadmap automatically rebalances without it"}
 onClick={() => toggleSkip(t.name)}
 className={cn(
 "inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-mono font-bold transition-colors cursor-pointer",
 t.isSkipped
 ? "border-border bg-muted text-success dark:text-success hover:bg-muted"
 : "border-border bg-muted text-destructive dark:text-destructive hover:bg-muted"
 )}
 >
 {t.isSkipped ? (
 <><Undo2 className="size-3" /> Un-skip</>
 ) : (
 <><Ban className="size-3" /> Skip</>
 )}
 </button>
 </div>

 <div className="flex items-center justify-between text-xs font-mono text-foreground mb-1.5">
 <span>Progress</span>
 <span className="tabular-nums">{t.solved}/{t.total} problems</span>
 </div>
 <Progress value={(t.solved / t.total) * 100} className="h-2" />
 </div>
 ))}
 </div>
 </div>
 );
}

function WeeksPanel() {
 return (
 <div className="rounded-lg border border-border bg-card p-5">
 <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
 {FAKE_WEEKS.map((w) => (
 <div
 key={w.week}
 title={`Week ${w.week} (${w.status})`}
 className={cn(
 "aspect-square rounded-lg border flex flex-col items-center justify-center text-xs font-mono",
 w.status === "done" && "bg-muted border-border text-success",
 w.status === "active" && "bg-muted border-border text-primary",
 w.status === "upcoming" && "bg-muted border-border text-foreground"
 )}
 >
 <span className="font-bold">W{w.week}</span>
 <span className="text-[10px]">{w.status}</span>
 </div>
 ))}
 </div>
 <p className="mt-4 text-xs text-foreground">The real Week View spans your full 17-week roadmap with per-day drill-down.</p>
 </div>
 );
}

function ProgressPanel() {
 const pct = Math.round((FAKE_USER.solved / FAKE_USER.total) * 100);
 return (
 <div className="space-y-6">
 <div className="rounded-lg border border-border bg-card p-5">
 <div className="flex items-center justify-between mb-2">
 <span className="font-display font-semibold text-sm">Overall progress</span>
 <span className="text-xs font-mono text-foreground">{FAKE_USER.solved}/{FAKE_USER.total}</span>
 </div>
 <Progress value={pct} className="h-2.5" />
 <p className="mt-2 text-xs text-foreground">{pct}% complete · sample data</p>
 </div>
 <div className="grid sm:grid-cols-3 gap-4">
 {[
 { label: "Current streak", value: `${FAKE_USER.streak} days` },
 { label: "Longest streak", value: "31 days" },
 { label: "Badges earned", value: "6" },
 ].map((s) => (
 <div key={s.label} className="rounded-lg border border-border bg-card p-4 text-center">
 <p className="text-2xl font-display font-black">{s.value}</p>
 <p className="text-xs text-foreground mt-1">{s.label}</p>
 </div>
 ))}
 </div>
 </div>
 );
}

function ReviewPanel() {
 const [reviewList, setReviewList] = useState([
 { title: "LRU Cache (Least Recently Used)", difficulty: "Hard", topic: "Linked List & Hash Map", due: "Due Today", platform: "LeetCode" },
 { title: "Trapping Rain Water", difficulty: "Hard", topic: "Two Pointers / Stack", due: "2 Days Ago", platform: "LeetCode" },
 { title: "Word Break (DP)", difficulty: "Medium", topic: "Dynamic Programming", due: "3 Days Ago", platform: "GeeksforGeeks" },
 { title: "Kth Largest Element in an Array", difficulty: "Medium", topic: "Heap / QuickSelect", due: "Last Week", platform: "LeetCode" },
 ]);

 return (
 <div className="space-y-4">
 <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
 <div className="flex items-center justify-between mb-3">
 <div>
 <h3 className="font-display font-bold text-base text-foreground">Review & Revision Deck</h3>
 <p className="text-xs text-foreground mt-0.5">Problems you flagged to revisit and strengthen before interviews</p>
 </div>
 <Badge variant="outline" className="font-mono text-xs bg-muted text-warning border-border">
 {reviewList.length} Items Pending Review
 </Badge>
 </div>

 <div className="space-y-3 mt-4">
 {reviewList.map((item, idx) => (
 <div key={item.title} className="rounded-lg border border-border bg-background p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <span className="font-mono text-xs text-foreground">#{idx + 1}</span>
 <span className="font-semibold text-sm text-foreground">{item.title}</span>
 <DifficultyBadge level={item.difficulty} />
 </div>
 <div className="flex items-center gap-2 text-xs text-foreground">
 <span>{item.topic}</span>
 <span>·</span>
 <span className="font-mono text-warning font-medium">{item.due}</span>
 </div>
 </div>

 <div className="flex items-center gap-2 shrink-0">
 <button
 type="button"
 title="Solve with Socratic AI Tutor"
 className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-2.5 py-1 text-xs font-mono font-bold text-warning dark:text-warning hover:bg-muted"
 >
 <Zap className="size-3" /> ⚡ Solve
 </button>
 <button
 type="button"
 title="View solution code"
 className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-2.5 py-1 text-xs font-mono font-bold text-primary dark:text-primary hover:bg-muted"
 >
 <Code className="size-3" /> Code
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}

function BacklogPanel() {
 const [backlog, setBacklog] = useState([
 { day: "Day 18", title: "Binary Search Space Reduction & Rotated Sorted Array", problems: 3, est: "45m" },
 { day: "Day 21", title: "Reversing Nodes in K-Group & Circular Doubly Linked List", problems: 2, est: "35m" },
 ]);

 return (
 <div className="space-y-4">
 <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
 <div className="flex items-center justify-between mb-3">
 <div>
 <h3 className="font-display font-bold text-base text-foreground">Postponed & Backlog Workload</h3>
 <p className="text-xs text-foreground mt-0.5">Missed or postponed days — rebalance or catch up anytime</p>
 </div>
 <Badge variant="outline" className="font-mono text-xs bg-muted text-destructive border-border">
 {backlog.length} Postponed Days
 </Badge>
 </div>

 <div className="space-y-3 mt-4">
 {backlog.map((item) => (
 <div key={item.day} className="rounded-lg border border-border bg-background p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <span className="font-mono text-xs font-bold text-primary">{item.day}</span>
 <span className="font-semibold text-sm text-foreground">{item.title}</span>
 </div>
 <p className="text-xs text-foreground">
 {item.problems} Problems · Estimated time {item.est}
 </p>
 </div>

 <div className="flex items-center gap-2 shrink-0">
 <button
 type="button"
 title="Re-integrate into active daily roadmap"
 className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-2.5 py-1 text-xs font-mono font-bold text-primary hover:bg-muted"
 >
 <Undo2 className="size-3" /> Catch Up
 </button>
 <button
 type="button"
 title="Merge into tomorrow's workload"
 className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-2.5 py-1 text-xs font-mono font-bold text-primary dark:text-primary hover:bg-muted"
 >
 <Combine className="size-3" /> Merge
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}

function ContestsPanel() {
 const contests = [
 { name: "LeetCode Weekly Contest 412", platform: "LeetCode", time: "Sunday 08:00 AM IST", status: "Upcoming", badge: "Rating +32" },
 { name: "CodeChef Starters 150 (Div 2)", platform: "CodeChef", time: "Wednesday 08:00 PM IST", status: "Upcoming", badge: "CP Practice" },
 { name: "AtCoder Beginner Contest 370", platform: "AtCoder", time: "Saturday 05:30 PM IST", status: "Upcoming", badge: "Math & DP" },
 ];

 return (
 <div className="space-y-4">
 <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
 <h3 className="font-display font-bold text-base text-foreground mb-1">Competitive Programming Contests Hub</h3>
 <p className="text-xs text-foreground mb-4">Curated weekly contests to test speed, accuracy, and live rank</p>

 <div className="grid sm:grid-cols-3 gap-3">
 {contests.map((c) => (
 <div key={c.name} className="rounded-lg border border-border bg-background p-4 flex flex-col justify-between space-y-3">
 <div>
 <div className="flex items-center justify-between mb-2">
 <Badge variant="outline" className="font-mono text-[10px] bg-muted text-primary border-border">
 {c.platform}
 </Badge>
 <span className="text-[10px] font-mono text-success font-bold">{c.status}</span>
 </div>
 <h4 className="font-semibold text-sm text-foreground leading-snug">{c.name}</h4>
 <p className="text-xs text-foreground mt-1 font-mono">{c.time}</p>
 </div>

 <div className="pt-2 border-t border-border flex items-center justify-between text-xs font-mono">
 <span className="text-foreground">{c.badge}</span>
 <span className="text-primary font-bold">Register →</span>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}

interface ExtractedPlatformState {
 platform: "LeetCode" | "Codeforces" | "GeeksforGeeks" | "GitHub";
 handle: string;
 url: string;
 rank: string;
 rating: number;
 totalSolved: number;
 easy: { solved: number; total: number };
 medium: { solved: number; total: number };
 hard: { solved: number; total: number };
 streak: string;
 extraStatLabel: string;
 extraStatVal: string;
 accentColor: string;
 accentBg: string;
 badge: string;
}

const PRESET_PROFILES: Record<string, ExtractedPlatformState> = {
 leetcode: {
 platform: "LeetCode",
 handle: "aditisharma_codes",
 url: "https://leetcode.com/u/aditisharma_codes",
 rank: "Guardian (Top 1.4%)",
 rating: 2185,
 totalSolved: 542,
 easy: { solved: 210, total: 820 },
 medium: { solved: 265, total: 1720 },
 hard: { solved: 67, total: 740 },
 streak: "48 Days Active",
 extraStatLabel: "Acceptance Rate",
 extraStatVal: "68.4%",
 accentColor: "text-warning",
 accentBg: "bg-muted border-border",
 badge: "Contest Rating 2185",
 },
 codeforces: {
 platform: "Codeforces",
 handle: "aditi_cf",
 url: "https://codeforces.com/profile/aditi_cf",
 rank: "Candidate Master",
 rating: 1845,
 totalSolved: 312,
 easy: { solved: 140, total: 300 },
 medium: { solved: 130, total: 400 },
 hard: { solved: 42, total: 200 },
 streak: "24 Contests",
 extraStatLabel: "Max Rating",
 extraStatVal: "1910 (Expert)",
 accentColor: "text-info",
 accentBg: "bg-muted border-border",
 badge: "Div. 2 Specialist",
 },
 gfg: {
 platform: "GeeksforGeeks",
 handle: "aditi_geek",
 url: "https://auth.geeksforgeeks.org/user/aditi_geek",
 rank: "Institute Rank #3",
 rating: 1240,
 totalSolved: 388,
 easy: { solved: 180, total: 500 },
 medium: { solved: 165, total: 700 },
 hard: { solved: 43, total: 300 },
 streak: "35 POTD Streak",
 extraStatLabel: "Coding Score",
 extraStatVal: "1,240 pts",
 accentColor: "text-success",
 accentBg: "bg-muted border-border",
 badge: "POTD Champion",
 },
 github: {
 platform: "GitHub",
 handle: "aditisharma",
 url: "https://github.com/aditisharma",
 rank: "Top 5% Contributor",
 rating: 1420,
 totalSolved: 1420,
 easy: { solved: 450, total: 500 },
 medium: { solved: 620, total: 800 },
 hard: { solved: 350, total: 400 },
 streak: "112 Contributions",
 extraStatLabel: "Public Repos",
 extraStatVal: "34 Repos",
 accentColor: "text-primary",
 accentBg: "bg-muted border-border",
 badge: "Verified Coder",
 },
};

function detectPlatformFromUrl(raw: string): { platform: ExtractedPlatformState["platform"]; handle: string } {
 const lower = raw.toLowerCase().trim();
 if (lower.includes("codeforces.com")) {
 const match = raw.match(/codeforces\.com\/profile\/([^/?#]+)/i);
 return { platform: "Codeforces", handle: match ? match[1] : "aditi_cf" };
 }
 if (lower.includes("geeksforgeeks.org") || lower.includes("gfg")) {
 const match = raw.match(/geeksforgeeks\.org\/user\/([^/?#]+)/i);
 return { platform: "GeeksforGeeks", handle: match ? match[1] : "aditi_geek" };
 }
 if (lower.includes("github.com")) {
 const match = raw.match(/github\.com\/([^/?#]+)/i);
 return { platform: "GitHub", handle: match ? match[1] : "aditisharma" };
 }
 const lcMatch = raw.match(/leetcode\.com\/(?:u\/)?([^/?#]+)/i);
 return { platform: "LeetCode", handle: lcMatch ? lcMatch[1] : (raw.trim() || "aditisharma_codes") };
}

function ProfilePanel() {
 const [urlInput, setUrlInput] = useState("https://leetcode.com/u/aditisharma_codes");
 const [isExtracting, setIsExtracting] = useState(false);
 const [extractedState, setExtractedState] = useState<ExtractedPlatformState>(PRESET_PROFILES.leetcode);
 const [extractedSuccess, setExtractedSuccess] = useState(true);

 const handleExtract = (urlToExtract?: string) => {
 const target = urlToExtract || urlInput;
 setIsExtracting(true);
 setExtractedSuccess(false);

 setTimeout(() => {
 const { platform, handle } = detectPlatformFromUrl(target);
 let base: ExtractedPlatformState;
 if (platform === "Codeforces") base = { ...PRESET_PROFILES.codeforces };
 else if (platform === "GeeksforGeeks") base = { ...PRESET_PROFILES.gfg };
 else if (platform === "GitHub") base = { ...PRESET_PROFILES.github };
 else base = { ...PRESET_PROFILES.leetcode };

 setExtractedState({
 ...base,
 handle: handle.replace(/[^a-zA-Z0-9_-]/g, "") || base.handle,
 url: target.startsWith("http") ? target : `https://${platform.toLowerCase()}.com/${handle}`,
 });
 setIsExtracting(false);
 setExtractedSuccess(true);
 }, 450);
 };

 return (
 <div className="space-y-5">
 {/* Profile Header Banner */}
 <div className="rounded-lg border border-border bg-card p-5">
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
 <div className="flex items-center gap-4">
 <div className="size-16 rounded-lg bg-primary text-white flex items-center justify-center font-display font-black text-2xl shadow-sm shrink-0">
 {FAKE_USER.initials}
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h3 className="font-display text-xl font-bold text-foreground">{FAKE_USER.name}</h3>
 <Badge variant="outline" className="font-mono text-[10px] bg-muted text-success border-border">
 Pro Plan
 </Badge>
 </div>
 <div className="flex items-center gap-2 flex-wrap mt-0.5">
 <a
 href="https://github.com/aditisharma_codes"
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted dark:text-muted hover:bg-muted dark:hover:bg-muted border border-muted transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer group"
 title="Open GitHub profile: https://github.com/aditisharma_codes"
 >
 <GitHubIcon className="size-3.5 shrink-0" />
 <span className="font-mono">@aditisharma_codes</span>
 <ExternalLink className="size-2.5 group-hover:opacity-100 transition-opacity" />
 </a>
 <span className="text-xs text-foreground font-mono">· SDE-1 Aspirant</span>
 </div>
 <p className="text-xs text-foreground mt-1">Final Year CS Undergrad @ IIT · Target: Top Tech SDE Roles</p>
 </div>
 </div>

 <div className="flex items-center gap-2 shrink-0">
 <div className="rounded-lg border border-warning bg-warning px-3 py-1.5 text-center">
 <p className="font-mono text-lg font-black text-warning dark:text-warning">{FAKE_USER.streak} 🔥</p>
 <p className="text-[10px] font-mono text-foreground">Active Streak</p>
 </div>
 </div>
 </div>
 </div>

 {/* Metrics Row */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
 {[
 { label: "Problems Solved", val: `${FAKE_USER.solved} / ${FAKE_USER.total}` },
 { label: "Completion Rate", val: `${Math.round((FAKE_USER.solved / FAKE_USER.total) * 100)}%` },
 { label: "Mastered Topics", val: "6 / 28" },
 { label: "Preferred Lang", val: "C++ (85%)" },
 ].map((m) => (
 <div key={m.label} className="rounded-lg border border-border bg-card p-3.5 text-center">
 <p className="font-mono text-lg font-black text-foreground">{m.val}</p>
 <p className="text-[11px] text-foreground mt-0.5">{m.label}</p>
 </div>
 ))}
 </div>

 {/* ── INTERACTIVE CODING PLATFORM EXTRACTOR ── */}
 <div className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-4 relative overflow-hidden">
 <div className="absolute top-0 right-0 w-48 h-48 bg-muted rounded-full blur-3xl pointer-events-none" />
 
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
 <div>
 <div className="flex items-center gap-2">
 <span className="flex size-6 items-center justify-center rounded-lg bg-muted text-primary text-xs font-bold">
 <Link2 className="size-3.5" />
 </span>
 <h4 className="font-display font-bold text-base text-foreground">
 Coding Platform Profile Telemetry Extractor
 </h4>
 <Badge variant="outline" className="font-mono text-[10px] bg-muted text-primary border-border">
 Live Inspector
 </Badge>
 </div>
 <p className="text-xs text-foreground mt-1">
 Place any coding platform profile URL below to extract solved counts, contest ratings, and difficulty breakdowns.
 </p>
 </div>
 </div>

 {/* Input Bar */}
 <div className="space-y-2">
 <div className="flex flex-col sm:flex-row gap-2">
 <div className="relative flex-1">
 <input
 type="text"
 value={urlInput}
 onChange={(e) => setUrlInput(e.target.value)}
 onKeyDown={(e) => e.key === "Enter" && handleExtract()}
 placeholder="Paste URL e.g. https://leetcode.com/u/username or https://codeforces.com/profile/handle"
 className="w-full h-10 px-3.5 rounded-lg border border-border bg-background text-xs font-mono text-foreground placeholder:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
 />
 </div>
 <Button
 onClick={() => handleExtract()}
 disabled={isExtracting || !urlInput.trim()}
 className="h-10 px-4 text-xs font-semibold gap-1.5 shrink-0 bg-primary text-primary-foreground hover:bg-muted"
 >
 {isExtracting ? (
 <>
 <Loader2 className="size-3.5 animate-spin" />
 Extracting State...
 </>
 ) : (
 <>
 <Sparkles className="size-3.5" />
 Extract Details
 </>
 )}
 </Button>
 </div>

 {/* Quick Presets */}
 <div className="flex items-center flex-wrap gap-1.5 pt-1">
 <span className="text-[11px] font-mono text-foreground mr-1">Quick Presets:</span>
 {[
 { label: "LeetCode", url: "https://leetcode.com/u/aditisharma_codes" },
 { label: "Codeforces", url: "https://codeforces.com/profile/aditi_cf" },
 { label: "GeeksforGeeks", url: "https://auth.geeksforgeeks.org/user/aditi_geek" },
 { label: "GitHub", url: "https://github.com/aditisharma" },
 ].map((p) => (
 <button
 key={p.label}
 type="button"
 onClick={() => {
 setUrlInput(p.url);
 handleExtract(p.url);
 }}
 className="text-[11px] font-mono px-2.5 py-1 rounded-lg border border-border bg-muted hover:bg-muted text-foreground hover:text-foreground transition-colors"
 >
 {p.label}
 </button>
 ))}
 </div>
 </div>

 {/* Extracted Details Result Card */}
 {extractedState && (
 <div className={cn("rounded-lg border p-4.5 space-y-4 transition-all animate-in fade-in-50 duration-300", extractedState.accentBg)}>
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-3">
 <div className="flex items-center gap-3">
 <div className="size-11 rounded-lg bg-background border border-border flex items-center justify-center font-display font-black text-sm shadow-sm">
 <span className={extractedState.accentColor}>{extractedState.platform[0]}</span>
 </div>
 <div>
 <div className="flex items-center gap-2">
 <span className="font-display font-bold text-sm text-foreground">{extractedState.platform}</span>
 <Badge variant="outline" className="font-mono text-[10px] bg-muted text-success border-border gap-1">
 <CheckCircle className="size-2.5" /> Extracted & Verified
 </Badge>
 </div>
 <div className="flex items-center gap-2 mt-0.5">
 <span className="font-mono text-xs text-foreground">@{extractedState.handle}</span>
 <a
 href={extractedState.url}
 target="_blank"
 rel="noopener noreferrer"
 className="text-[10px] font-mono text-primary hover:underline inline-flex items-center gap-0.5"
 >
 Open Platform <ExternalLink className="size-2.5" />
 </a>
 </div>
 </div>
 </div>

 <div className="flex items-center gap-2">
 <Badge variant="outline" className="font-mono text-xs font-semibold px-2.5 py-1 bg-background">
 {extractedState.badge}
 </Badge>
 </div>
 </div>

 {/* Platform Stats Grid */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
 <div className="rounded-lg border border-border bg-background p-2.5">
 <p className="text-[10px] font-mono text-foreground uppercase">Total Solved</p>
 <p className="font-mono text-base font-black text-foreground mt-0.5">{extractedState.totalSolved}</p>
 <p className="text-[10px] text-foreground">Verified Submissions</p>
 </div>
 <div className="rounded-lg border border-border bg-background p-2.5">
 <p className="text-[10px] font-mono text-foreground uppercase">Rating / Standing</p>
 <p className="font-mono text-base font-black text-foreground mt-0.5">{extractedState.rating}</p>
 <p className="text-[10px] text-foreground truncate">{extractedState.rank}</p>
 </div>
 <div className="rounded-lg border border-border bg-background p-2.5">
 <p className="text-[10px] font-mono text-foreground uppercase">Activity Streak</p>
 <p className="font-mono text-base font-black text-foreground mt-0.5">{extractedState.streak}</p>
 <p className="text-[10px] text-foreground">Consistency Metric</p>
 </div>
 <div className="rounded-lg border border-border bg-background p-2.5">
 <p className="text-[10px] font-mono text-foreground uppercase">{extractedState.extraStatLabel}</p>
 <p className="font-mono text-base font-black text-foreground mt-0.5">{extractedState.extraStatVal}</p>
 <p className="text-[10px] text-foreground">Telemetry Synced</p>
 </div>
 </div>

 {/* Solved Distribution Progress Bars */}
 <div className="rounded-lg border border-border bg-background p-3 space-y-2.5">
 <div className="flex items-center justify-between text-xs">
 <span className="font-semibold text-foreground">Difficulty Level Distribution</span>
 <span className="font-mono text-[11px] text-foreground">
 {extractedState.easy.solved + extractedState.medium.solved + extractedState.hard.solved} Solved Across Tiers
 </span>
 </div>
 <div className="space-y-2.5">
 <div>
 <div className="flex justify-between text-[11px] font-mono mb-1">
 <span className="text-success dark:text-success font-semibold">Easy</span>
 <span className="text-foreground">{extractedState.easy.solved} / {extractedState.easy.total}</span>
 </div>
 <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
 <div className="h-full bg-success rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.round((extractedState.easy.solved / extractedState.easy.total) * 100))}%` }} />
 </div>
 </div>
 <div>
 <div className="flex justify-between text-[11px] font-mono mb-1">
 <span className="text-warning dark:text-warning font-semibold">Medium</span>
 <span className="text-foreground">{extractedState.medium.solved} / {extractedState.medium.total}</span>
 </div>
 <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
 <div className="h-full bg-warning rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.round((extractedState.medium.solved / extractedState.medium.total) * 100))}%` }} />
 </div>
 </div>
 <div>
 <div className="flex justify-between text-[11px] font-mono mb-1">
 <span className="text-destructive dark:text-destructive font-semibold">Hard</span>
 <span className="text-foreground">{extractedState.hard.solved} / {extractedState.hard.total}</span>
 </div>
 <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
 <div className="h-full bg-destructive rounded-full transition-all duration-300" style={{ width: `${Math.min(100, Math.round((extractedState.hard.solved / extractedState.hard.total) * 100))}%` }} />
 </div>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Combined Public URL Callout Banner */}
 <div className="rounded-lg border border-border bg-primary /5  /10 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
 <div className="flex items-center gap-2.5">
 <span className="size-8 rounded-lg bg-muted text-primary flex items-center justify-center shrink-0">
 <Globe className="size-4" />
 </span>
 <div>
 <p className="font-semibold text-xs text-foreground">Shareable Public Coder Profile URL</p>
 <p className="font-mono text-[11px] text-foreground">
 Your portfolio at <span className="text-primary font-semibold">404dsatracker.com/profile/aditisharma_codes</span> aggregates all platforms automatically!
 </p>
 </div>
 </div>
 <Link
 href="/auth?tab=signup"
 className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-muted transition-colors shrink-0"
 >
 Claim Your Handle <ArrowRight className="size-3" />
 </Link>
 </div>
 </div>

 {/* GitHub Contribution Activity Heatmap */}
 <GitHubContributionHeatmap username="aditisharma" />

 {/* Achievements Badges */}
 <div className="rounded-lg border border-border bg-card p-5">
 <h4 className="font-display font-semibold text-sm text-foreground mb-3">Earned Badges & Milestones</h4>
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
 {[
 { title: "14-Day Consistency Master", desc: "Maintained 14 consecutive study days", icon: "🥇" },
 { title: "100+ Solved Milestone", desc: "Crossed 100 curated DSA problems", icon: "⚡" },
 { title: "Arrays Specialist", desc: "Mastered 90%+ array patterns", icon: "🎯" },
 { title: "Socratic AI Pioneer", desc: "Used ChatGPT AI tutor 50+ times", icon: "✦" },
 { title: "Contest Contender", desc: "Top 15% in platform contests", icon: "🏆" },
 { title: "Week 3 Milestone", desc: "Finished Foundations & Linked List", icon: "📅" },
 ].map((b) => (
 <div key={b.title} className="rounded-lg border border-border bg-background p-3 flex items-start gap-3">
 <span className="text-2xl shrink-0">{b.icon}</span>
 <div>
 <p className="font-semibold text-xs text-foreground leading-tight">{b.title}</p>
 <p className="text-[10px] text-foreground mt-0.5 leading-tight">{b.desc}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}

function SettingsPanel() {
 const [selectedDemoSheet, setSelectedDemoSheet] = useState("core404");
 const [workload, setWorkload] = useState(3);
 const [pushEnabled, setPushEnabled] = useState(true);
 const [morningEnabled, setMorningEnabled] = useState(true);
 const [morningTime, setMorningTime] = useState("08:00");
 const [contestEnabled, setContestEnabled] = useState(true);
 const [eveningTime, setEveningTime] = useState("21:30");
 const [emailEnabled, setEmailEnabled] = useState(true);

 return (
 <div className="space-y-5">
 {/* 0. Curated Sheet Customizer */}
 <div className="rounded-lg border border-border bg-card p-5 space-y-4">
 <div>
 <h3 className="font-display font-bold text-base text-foreground">Select your customized sheet</h3>
 <p className="text-xs text-foreground mt-0.5">
 Choose your preferred sheet — your daily roadmap and problem recommendations dynamically re-seed from it.
 </p>
 </div>

 <div className="grid sm:grid-cols-3 gap-2.5">
 {[
 { id: "core404", name: "Core 404 Roadmap", problems: "381 Qs", topics: "28 Topics", tag: "Official Default" },
 { id: "striver_a2z", name: "Striver's A2Z Sheet", problems: "402 Qs", topics: "16 Steps", tag: "takeUforward" },
 { id: "striver_sde", name: "Striver's SDE Sheet", problems: "183 Qs", topics: "26 Topics", tag: "takeUforward" },
 { id: "neetcode150", name: "NeetCode 150", problems: "150 Qs", topics: "18 Topics", tag: "NeetCode" },
 { id: "love_babbar", name: "Love Babbar 450", problems: "171 Qs", topics: "15 Topics", tag: "CodeHelp" },
 { id: "rising_brains", name: "RisingBrains Sheet", problems: "97 Qs", topics: "11 Patterns", tag: "RisingBrains" },
 ].map((sh) => {
 const isActive = selectedDemoSheet === sh.id;
 return (
 <button
 key={sh.id}
 type="button"
 onClick={() => setSelectedDemoSheet(sh.id)}
 className={cn(
 "p-3 rounded-lg border flex flex-col justify-between text-left transition-colors cursor-pointer",
 isActive ? "border-primary bg-muted shadow-xs" : "border-border bg-background hover:border-border"
 )}
 >
 <div>
 <div className="flex items-center justify-between gap-1 mb-1">
 <span className="font-semibold text-xs text-foreground truncate">{sh.name}</span>
 <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border border-border text-primary">
 {sh.tag}
 </span>
 </div>
 <p className="text-[11px] font-mono text-foreground">{sh.problems} · {sh.topics}</p>
 </div>
 <span className="text-[10px] font-bold text-primary mt-2 flex items-center gap-1">
 {isActive ? "✓ Active Sheet" : "Click to Switch"}
 </span>
 </button>
 );
 })}
 </div>
 </div>

 {/* GitHub Repository Auto-Sync Settings Demo Card */}
 <div className="rounded-lg border border-border bg-card p-5 space-y-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2.5">
 <div className="size-8 rounded-lg bg-muted text-success border border-border flex items-center justify-center">
 <FolderGit2 className="size-4" />
 </div>
 <div>
 <h3 className="font-display font-bold text-base text-foreground">GitHub Automatic Submission</h3>
 <p className="text-xs text-foreground">Auto-commit code and key patterns to your repository on completion</p>
 </div>
 </div>
 <span className="inline-flex items-center gap-1 rounded-full bg-muted text-success border border-border px-2 py-0.5 text-[10px] font-mono font-bold">
 CONNECTED
 </span>
 </div>

 <div className="rounded-lg border border-border bg-background p-4 space-y-3">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
 <div>
 <label className="text-[11px] font-mono text-foreground">Target Repository</label>
 <div className="font-mono font-semibold text-foreground mt-0.5 p-2 rounded-lg bg-muted border border-border">
 aditi-sharma/dsa-solutions
 </div>
 </div>
 <div>
 <label className="text-[11px] font-mono text-foreground">Target Branch</label>
 <div className="font-mono font-semibold text-foreground mt-0.5 p-2 rounded-lg bg-muted border border-border">
 main
 </div>
 </div>
 </div>
 <p className="text-[11px] text-foreground leading-relaxed">
 Every time you submit code in the "Add Code" section, a clean <code className="text-success">.txt</code> file is automatically generated and pushed to your repo containing your key patterns and optimal solution code.
 </p>
 </div>
 </div>

 {/* 1. Workload Customizer */}
 <div className="rounded-lg border border-border bg-card p-5 space-y-4">
 <div>
 <h3 className="font-display font-bold text-base text-foreground">Roadmap &amp; Workload Customizer</h3>
 <p className="text-xs text-foreground mt-0.5">Tune your daily problem target for optimal learning pace</p>
 </div>

 {/* Daily Target Slider */}
 <div className="rounded-lg border border-border bg-background p-4 space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-xs font-semibold text-foreground">Daily Problem Target</span>
 <span className="font-mono text-xs font-bold text-primary">{workload} Problems / Day</span>
 </div>
 <div className="flex items-center gap-3">
 {[1, 2, 3, 4, 5].map((num) => (
 <button
 key={num}
 type="button"
 onClick={() => setWorkload(num)}
 className={cn(
 "flex-1 py-2 rounded-lg font-mono text-xs font-bold border transition-colors cursor-pointer",
 workload === num
 ? "bg-primary text-primary-foreground border-primary"
 : "border-border text-foreground hover:bg-muted"
 )}
 >
 {num} {num === 1 ? "Problem" : "Problems"}
 </button>
 ))}
 </div>
 <p className="text-[11px] text-foreground mt-1">
 Current pace: <strong>{workload} problems daily</strong>. Estimated roadmap completion: <strong>{Math.ceil(404 / workload)} days</strong>.
 </p>
 </div>

 {/* Daily combinations breakdown */}
 <DailyCombinationsBreakdown target={workload} showPlanFrequency={false} />
 </div>

 {/* 2. Interactive Notification Customizer */}
 <div className="rounded-lg border border-border bg-card p-5 space-y-4">
 <div className="flex items-center gap-2">
 <Bell className="size-5 text-primary" />
 <div>
 <h3 className="font-display font-bold text-base text-foreground">Notification & Reminder Controls</h3>
 <p className="text-xs text-foreground mt-0.5">Customize your morning alerts, contest notifications, and evening unresolved problem nudges anytime</p>
 </div>
 </div>

 <div className="space-y-4 pt-1">
 {/* Master Browser Push Switch */}
 <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background p-4">
 <div>
 <span className="text-sm font-bold text-foreground block">Browser & Mobile Push Notifications</span>
 <p className="text-xs text-foreground">Receive real-time push alerts on your phone or desktop even when the app is closed.</p>
 </div>
 <button
 type="button"
 onClick={() => setPushEnabled(!pushEnabled)}
 className={cn(
 "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
 pushEnabled ? "bg-primary" : "bg-muted-foreground/30"
 )}
 >
 <span
 className={cn(
 "pointer-events-none inline-block size-5 transform rounded-full bg-background shadow-sm ring-0 transition duration-200 ease-in-out",
 pushEnabled ? "translate-x-5" : "translate-x-0"
 )}
 />
 </button>
 </div>

 {pushEnabled && (
 <div className="ml-2 pl-4 border-l-2 border-border space-y-3">
 {/* Morning Topic Reminder */}
 <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted p-3">
 <div>
 <span className="text-xs font-semibold text-foreground block">☀️ Morning Topic & Plan Reminder</span>
 <p className="text-[11px] text-foreground">Scheduled morning topic alert to kickstart your day.</p>
 </div>
 <div className="flex items-center gap-3">
 <input
 type="time"
 value={morningTime}
 onChange={(e) => setMorningTime(e.target.value)}
 disabled={!morningEnabled}
 className="h-8 w-28 rounded-md border border-border bg-background px-2 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
 />
 <button
 type="button"
 onClick={() => setMorningEnabled(!morningEnabled)}
 className={cn(
 "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
 morningEnabled ? "bg-primary" : "bg-muted-foreground/30"
 )}
 >
 <span
 className={cn(
 "pointer-events-none inline-block size-4 transform rounded-full bg-background shadow-sm ring-0 transition duration-200 ease-in-out",
 morningEnabled ? "translate-x-4" : "translate-x-0"
 )}
 />
 </button>
 </div>
 </div>

 {/* Contest Alerts (Morning, 1h, 10m) */}
 <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted p-3">
 <div>
 <span className="text-xs font-semibold text-foreground block">🏆 Coding Contest Alerts (Morning, 1h & 10m)</span>
 <p className="text-[11px] text-foreground">Notifies you on contest day morning, 1 hour before, and 10 minutes before start.</p>
 </div>
 <button
 type="button"
 onClick={() => setContestEnabled(!contestEnabled)}
 className={cn(
 "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
 contestEnabled ? "bg-primary" : "bg-muted-foreground/30"
 )}
 >
 <span
 className={cn(
 "pointer-events-none inline-block size-4 transform rounded-full bg-background shadow-sm ring-0 transition duration-200 ease-in-out",
 contestEnabled ? "translate-x-4" : "translate-x-0"
 )}
 />
 </button>
 </div>

 {/* Evening 9:30 PM Unresolved Problem Reminder */}
 <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted p-3">
 <div>
 <span className="text-xs font-semibold text-foreground block">🌙 Compulsory Unresolved Problem Reminder</span>
 <p className="text-[11px] text-foreground">Fires if you have 0 problems solved today when reminder time arrives.</p>
 </div>
 <input
 type="time"
 value={eveningTime}
 onChange={(e) => setEveningTime(e.target.value)}
 className="h-8 w-28 rounded-md border border-border bg-background px-2 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
 />
 </div>
 </div>
 )}

 {/* Email Notifications Switch */}
 <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background p-4">
 <div className="flex items-start gap-2.5">
 <Mail className="size-4 text-primary mt-0.5 shrink-0" />
 <div>
 <span className="text-sm font-bold text-foreground block">Email Notifications</span>
 <p className="text-xs text-foreground">Receive revision topic reminders and contest schedules via email.</p>
 </div>
 </div>
 <button
 type="button"
 onClick={() => setEmailEnabled(!emailEnabled)}
 className={cn(
 "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
 emailEnabled ? "bg-primary" : "bg-muted-foreground/30"
 )}
 >
 <span
 className={cn(
 "pointer-events-none inline-block size-5 transform rounded-full bg-background shadow-sm ring-0 transition duration-200 ease-in-out",
 emailEnabled ? "translate-x-5" : "translate-x-0"
 )}
 />
 </button>
 </div>
 </div>
 </div>
 </div>
 );
}

export function DemoShell() {
 const [activeTab, setActiveTab] = useState<DemoTab>("today");
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
 const [isCollapsed, setIsCollapsed] = useState(false);
 const [colorModalOpen, setColorModalOpen] = useState(false);

 return (
 <div className="rounded-lg sm:rounded-lg border border-border bg-card shadow-sm overflow-hidden">
 {/* Top mock app bar */}
 <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-3">
 <div className="flex items-center gap-3">
 <Button
 variant="ghost"
 size="icon"
 className="hidden md:flex size-8 text-foreground hover:text-foreground"
 onClick={() => setIsCollapsed(!isCollapsed)}
 title={isCollapsed ? "Expand sidebar" : "Collapse sidebar to icons"}
 >
 <Menu className="size-4" />
 </Button>
 <div className="flex items-center gap-1.5">
 <span className="size-3 rounded-full bg-muted" />
 <span className="size-3 rounded-full bg-muted" />
 <span className="size-3 rounded-full bg-success" />
 </div>
 <span className="font-mono text-xs font-semibold text-foreground border-l border-border pl-3">
 DSA⁴⁰⁴ Workspace Preview
 </span>
 </div>
 <div className="flex items-center gap-2">
 <Button
 type="button"
 onClick={() => {
 enableGuestMode();
 window.location.href = "/today";
 }}
 size="sm"
 className="h-7 text-xs font-mono font-bold bg-primary hover:bg-muted text-primary-foreground gap-1.5 cursor-pointer shadow-xs"
 >
 <Sparkles className="size-3" />
 <span className="hidden sm:inline">Enter Full Workspace (Guest Mode)</span>
 <span className="sm:hidden">Full Demo →</span>
 </Button>
 <Badge variant="outline" className="font-mono text-[10px] bg-muted text-primary border-border">
 DEMO MODE
 </Badge>
 <Button
 variant="ghost"
 size="icon"
 className="md:hidden size-8"
 onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
 >
 {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
 </Button>
 </div>
 </div>

 <div className="flex flex-col md:flex-row min-h-[540px]">
 {/* Mock Sidebar (Desktop: Collapsible between w-56 expanded and w-16 icon-only) */}
 <aside
 className={cn(
 "hidden md:flex flex-col border-r border-border bg-muted p-3 shrink-0 transition-all duration-300",
 isCollapsed ? "w-16 items-center px-2" : "w-56"
 )}
 >
 <div className="space-y-1 w-full">
 {DEMO_NAV.map((item) => {
 const Icon = item.icon;
 const isActive = activeTab === item.key;
 return (
 <button
 key={item.key}
 onClick={() => setActiveTab(item.key)}
 title={isCollapsed ? item.label : undefined}
 className={cn(
 "w-full flex items-center rounded-lg transition-all text-left",
 isCollapsed ? "justify-center p-2.5" : "gap-2.5 px-3 py-2 text-xs font-medium",
 isActive
 ? "bg-primary text-primary-foreground shadow-sm font-semibold"
 : "text-foreground hover:bg-muted hover:text-foreground"
 )}
 >
 <Icon className="size-4 shrink-0" />
 {!isCollapsed && <span className="truncate">{item.label}</span>}
 </button>
 );
 })}
 </div>

 <div className="mt-auto pt-3 border-t border-border text-center w-full space-y-2">
 <button
 type="button"
 onClick={() => setColorModalOpen(true)}
 title="Customize Color & Font"
 className={cn(
 "flex w-full items-center gap-2 rounded-lg text-xs font-medium text-foreground hover:bg-muted hover:text-foreground transition-colors border border-border bg-background cursor-pointer",
 isCollapsed ? "justify-center p-2" : "px-2.5 py-1.5"
 )}
 >
 <Palette className="size-3.5 text-primary shrink-0" />
 {!isCollapsed && <span className="truncate">Customize Color & Font</span>}
 </button>

 {!isCollapsed ? (
 <>
 <p className="text-[11px] text-foreground mb-1">Want to save your real progress?</p>
 <Button asChild size="sm" className="w-full font-mono text-xs">
 <Link href="/auth?mode=signup">Register Now</Link>
 </Button>
 </>
 ) : (
 <Button asChild size="icon" className="size-9 rounded-lg mx-auto" title="Register Now to save progress">
 <Link href="/auth?mode=signup">
 <Lock className="size-4" />
 </Link>
 </Button>
 )}
 </div>
 </aside>

 {/* Mobile Navigation Dropdown */}
 {mobileMenuOpen && (
 <div className="md:hidden border-b border-border bg-muted p-2 space-y-1">
 {DEMO_NAV.map((item) => {
 const Icon = item.icon;
 const isActive = activeTab === item.key;
 return (
 <button
 key={item.key}
 onClick={() => {
 setActiveTab(item.key);
 setMobileMenuOpen(false);
 }}
 className={cn(
 "w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-left",
 isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
 )}
 >
 <Icon className="size-4 shrink-0" />
 <span>{item.label}</span>
 </button>
 );
 })}
 <button
 type="button"
 onClick={() => {
 setColorModalOpen(true);
 setMobileMenuOpen(false);
 }}
 className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-left text-foreground hover:bg-muted"
 >
 <Palette className="size-4 text-primary shrink-0" />
 <span>Customize Color & Font</span>
 </button>
 </div>
 )}

 {/* Main Content Area */}
 <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-background">
 {activeTab === "today" && <TodayPanel />}
 {activeTab === "problems" && <ProblemsPanel />}
 {activeTab === "topics" && <TopicsPanel />}
 {activeTab === "weeks" && <WeeksPanel />}
 {activeTab === "progress" && <ProgressPanel />}
 {activeTab === "review" && <ReviewPanel />}
 {activeTab === "backlog" && <BacklogPanel />}
 {activeTab === "contests" && <ContestsPanel />}
 {activeTab === "profile" && <ProfilePanel />}
 {activeTab === "settings" && <SettingsPanel />}
 </main>
 </div>

 {/* Color & Font Customizer Info Modal */}
 {colorModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black p-4 animate-in fade-in duration-200">
 <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm space-y-4">
 <div className="flex items-center justify-between border-b border-border pb-3">
 <div className="flex items-center gap-2.5">
 <div className="size-9 rounded-lg bg-muted border border-border flex items-center justify-center text-primary shrink-0">
 <Palette className="size-5" />
 </div>
 <div>
 <h4 className="font-display font-bold text-base text-foreground">Customize Color & Font</h4>
 <p className="text-xs text-foreground">Personalize your learning environment</p>
 </div>
 </div>
 <button
 type="button"
 onClick={() => setColorModalOpen(false)}
 className="rounded-lg p-1 text-foreground hover:bg-muted hover:text-foreground cursor-pointer"
 >
 <X className="size-4" />
 </button>
 </div>

 <div className="space-y-3 text-xs text-foreground leading-relaxed">
 <p className="text-foreground font-medium">
 In the complete DSA404 workspace, signed-in users can open the <strong>Theme & Font Customizer</strong> anytime to personalize:
 </p>
 <ul className="space-y-2 font-mono text-[11px] border-l-2 border-border pl-3">
 <li className="flex items-start gap-1.5">
 <span className="text-primary font-bold">🎨 Accent Color Palettes:</span> Select from Orange, Emerald, Royal Blue, Purple, Rose, Cyan & Gold.
 </li>
 <li className="flex items-start gap-1.5">
 <span className="text-primary font-bold">🌙 Theme Surface Modes:</span> Switch between Dark Mode, High Contrast Light Mode, or OLED Pitch Black.
 </li>
 <li className="flex items-start gap-1.5">
 <span className="text-primary font-bold">🔤 Font Families & Scaling:</span> Choose from Inter, JetBrains Mono, Outfit, or Roboto, and scale font sizes for effortless code readability.
 </li>
 </ul>
 <p className="text-[11px]">
 All customized theme preferences are automatically saved to your account and synced across your desktop & mobile browsers.
 </p>
 </div>

 <div className="pt-2 flex justify-end">
 <Button size="sm" onClick={() => setColorModalOpen(false)} className="font-mono text-xs cursor-pointer">
 Got It ✓
 </Button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}

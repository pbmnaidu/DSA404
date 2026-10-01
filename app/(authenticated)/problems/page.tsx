"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SECTIONS } from "@/lib/a2z-data";
import { EXTRA_PROBLEMS, type Sheet } from "@/lib/extra-problems-data";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExternalLink, Search, X, ArrowUpDown, Filter, ChevronLeft, ChevronRight, Sparkles, Code2, Link2, Video, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/lib/types";
import { useProblemCompletions } from "@/hooks/useProblemCompletions";
import { CodeModal } from "@/components/CodeModal";
import type { CodeSubmission } from "@/lib/db";
import { getChatGPTAiPromptUrl } from "@/lib/aiTutorPrompt";

// ─── Types ───────────────────────────────────────────────────────────────────
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

export type Platform =
 | "All"
 | "LeetCode"
 | "GeeksforGeeks"
 | "GFG";

export type SheetFilter =
 | "All"
 | "Core 404"
 | "Striver's A2Z"
 | "Striver's SDE"
 | "NeetCode 150"
 | "Love Babbar 450"
 | "RisingBrains"
 | "Practice 404 Sheet";

export type StatusFilter =
 | "All"
 | "Completed"
 | "Incomplete"
 | "Revision Needed";

export type SortOption =
 | "Default Order"
 | "Problem Number"
 | "Problem Name"
 | "Recently Completed";

const PLATFORMS: Platform[] = [
 "All",
 "LeetCode",
 "GeeksforGeeks",
];

const SHEET_FILTERS: SheetFilter[] = [
 "All",
 "Core 404",
 "Striver's A2Z",
 "Striver's SDE",
 "NeetCode 150",
 "Love Babbar 450",
 "RisingBrains",
 "Practice 404 Sheet",
];

const STATUS_FILTERS: StatusFilter[] = [
 "Incomplete",
 "Completed",
 "All",
 "Revision Needed",
];

const SORT_OPTIONS: SortOption[] = [
 "Default Order",
 "Problem Number",
 "Problem Name",
 "Recently Completed",
];

// ─── Platform helpers ────────────────────────────────────────────────────────

function canonicalPlatform(raw: string): Platform {
 const r = raw.toLowerCase();
 if (r.includes("leetcode")) return "LeetCode";
 if (r.includes("gfg") || r.includes("geeks")) return "GeeksforGeeks";
 return "All";
}

function platformSearchLink(name: string, platform: Platform | string): string {
 const q = encodeURIComponent(name);
 if (platform === "GeeksforGeeks" || platform === "GFG") {
 return `https://www.geeksforgeeks.org/explore?search=${q}`;
 }
 switch (platform) {
 case "LeetCode": return `https://leetcode.com/problemset/?search=${q}`;
 default: return `https://leetcode.com/problemset/?search=${q}`;
 }
}

function googleSearchUrl(problemName: string) {
  const query = `${problemName} DSA solution explanation site:leetcode.com OR site:geeksforgeeks.org OR site:takeuforward.org OR site:naukri.com OR site:interviewbit.com OR site:programiz.com OR site:w3schools.com OR site:hackerrank.com OR site:hackerearth.com OR site:codechef.com OR site:codeforces.com OR site:neetcode.io OR site:cp-algorithms.com`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

const PLATFORM_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
 All: { label: "All", color: "text-foreground", bg: "bg-secondary", dot: "bg-muted-foreground" },
 LeetCode: { label: "LeetCode", color: "text-[#FFA116]", bg: "bg-[#FFA116]/10", dot: "bg-[#FFA116]" },
 GeeksforGeeks: { label: "GeeksforGeeks", color: "text-[#2F8D46]", bg: "bg-[#2F8D46]/10", dot: "bg-[#2F8D46]" },
 GFG: { label: "GeeksforGeeks", color: "text-[#2F8D46]", bg: "bg-[#2F8D46]/10", dot: "bg-[#2F8D46]" },
};

const DIFF_META: Record<string, { label: string; color: string; bg: string }> = {
 Easy: { label: "Easy", color: "text-easy", bg: "bg-muted" },
 Medium: { label: "Medium", color: "text-medium", bg: "bg-muted" },
 Hard: { label: "Hard", color: "text-hard", bg: "bg-muted" },
 Advanced: { label: "Advanced", color: "text-primary dark:text-primary", bg: "bg-muted" },
 Expert: { label: "Expert", color: "text-destructive dark:text-destructive", bg: "bg-muted" },
 "Multiple Choice": { label: "MCQ", color: "text-info dark:text-info", bg: "bg-muted" },
};

import { ALL_PROBLEMS as GLOBAL_PROBLEMS } from "@/lib/problems";

const SHEET_META: Record<SheetFilter, { color: string; bg: string }> = {
 "All": { color: "text-foreground", bg: "bg-secondary" },
 "Core 404": { color: "text-primary", bg: "bg-muted" },
 "Striver's A2Z": { color: "text-destructive", bg: "bg-muted" },
 "Striver's SDE": { color: "text-warning", bg: "bg-muted" },
 "NeetCode 150": { color: "text-success", bg: "bg-muted" },
 "Love Babbar 450": { color: "text-primary", bg: "bg-muted" },
 "RisingBrains": { color: "text-info", bg: "bg-muted" },
 "Practice 404 Sheet": { color: "text-[#00B8A3]", bg: "bg-[#00B8A3]/10" },
};

// ─── Unified flat problem type ───────────────────────────────────────────────

interface FlatProblem {
 id: number;
 name: string;
 difficulty: Difficulty;
 platform: Platform;
 topic: string;
 sheet: SheetFilter;
 link: string;
}

const ALL_PROBLEMS: FlatProblem[] = GLOBAL_PROBLEMS.map((p, idx) => ({
 id: idx + 1,
 name: p.name,
 difficulty: p.difficulty,
 platform: p.platform as Platform,
 topic: p.topic,
 sheet: p.sheet as SheetFilter,
 link: p.link,
}));

function countBy<T>(arr: T[], key: (x: T) => string): Record<string, number> {
 return arr.reduce<Record<string, number>>((acc, x) => {
 const k = key(x);
 acc[k] = (acc[k] ?? 0) + 1;
 return acc;
 }, {});
}

// ─── External link helpers ───────────────────────────────────────────────────

function youtubeSearchUrl(problemName: string, sheet?: SheetFilter) {
 let channel = "takeUforward OR NeetCode";
 if (sheet === "Striver's A2Z" || sheet === "Striver's SDE") {
 channel = "takeUforward";
 } else if (sheet === "NeetCode 150") {
 channel = "NeetCode";
 } else if (sheet === "Love Babbar 450") {
 channel = "Love Babbar CodeHelp";
 } else if (sheet === "RisingBrains") {
 channel = "RisingBrains";
 }
 const query = `${problemName} ${channel} solution intuition explained`;
 return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}


// ─── Problem row ─────────────────────────────────────────────────────────────

function ProblemItem({
 problem,
 done,
 submission,
 onSaveCode,
 onDeleteCode,
}: {
 problem: FlatProblem;
 done: boolean;
 submission?: CodeSubmission;
 onSaveCode: (code: string, link: string, keyPoints?: string) => Promise<void>;
 onDeleteCode?: () => Promise<void>;
}) {
 const diff = DIFF_META[problem.difficulty] ?? {
 label: problem.difficulty || "Medium",
 color: "text-primary dark:text-primary",
 bg: "bg-muted",
 };
 const sm = SHEET_META[problem.sheet] ?? SHEET_META["Core 404"];
 const checkId = `pb-${problem.id}-${problem.name.replace(/\W+/g, "-")}`;
 const [modalOpen, setModalOpen] = useState(false);

 return (
 <>
 <div
 className={cn(
 "flex flex-col justify-between gap-4 rounded-lg border bg-card p-5 transition-all shadow-sm hover:shadow-sm",
 done ? "border-border bg-muted hover:border-border" : "border-border hover:border-border",
 )}
 >
 <div className="space-y-3">
 <div className="flex items-start justify-between gap-3">
 <div className="flex items-center gap-2">
 <Checkbox
 id={checkId}
 checked={done}
 onCheckedChange={() => setModalOpen(true)}
 className="size-5 transition-all"
 />
 <span className="text-xs font-mono text-foreground uppercase">
 #{problem.id}
 </span>
 </div>
 
 <div className="flex items-center gap-1.5 shrink-0">
 <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold", sm.bg, sm.color, "border-border")}>
 {problem.sheet}
 </span>
 <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", diff.bg, diff.color)}>
 {problem.difficulty}
 </span>
 </div>
 </div>

 <label
 htmlFor={checkId}
 className={cn(
 "block cursor-pointer font-display text-lg font-bold leading-tight transition-colors line-clamp-2",
 done ? "text-foreground line-through" : "text-foreground hover:text-primary",
 )}
 >
 {problem.name}
 </label>
 
 <div className="text-xs font-medium text-foreground line-clamp-1">
 {problem.topic}
 </div>
 </div>

 {/* Actions Row */}
 <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <button
 className="flex items-center gap-1.5 rounded-lg border border-border bg-card hover:bg-secondary px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors"
 >
 <Link2 className="size-3.5 text-primary" />
 <span>Resources</span>
 </button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="start" className="w-56 rounded-lg border border-border bg-card p-1 shadow-sm">
 {problem.link && (
 <DropdownMenuItem asChild>
 <a href={problem.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
 <ExternalLink className="size-3.5 text-primary" />
 <span>Official Problem Page</span>
 </a>
 </DropdownMenuItem>
 )}
 <DropdownMenuItem asChild>
 <a href={youtubeSearchUrl(problem.name)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-medium cursor-pointer">
 <Video className="size-3.5 text-destructive" />
 <span>YouTube Solutions</span>
 </a>
 </DropdownMenuItem>
 <DropdownMenuItem asChild>
 <a href={googleSearchUrl(problem.name)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-medium cursor-pointer">
 <Search className="size-3.5 text-primary" />
 <span>Google Search</span>
 </a>
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>

 <div className="flex items-center gap-2">
 <a
 href={getChatGPTAiPromptUrl(problem.name)}
 target="_blank"
 rel="noreferrer"
 className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-xs font-semibold text-success transition-colors hover:bg-muted"
 >
 <Sparkles className="size-3.5" />
 <span>AI Tutor</span>
 </a>

 <button
 type="button"
 onClick={() => setModalOpen(true)}
 className={cn(
 "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors border",
 done
 ? "bg-muted text-success border-border hover:bg-muted"
 : "border-border text-foreground hover:border-primary hover:text-primary",
 )}
 >
 <Code2 className="size-3.5" />
 <span>Code</span>
 </button>
 </div>
 </div>
 </div>

 <CodeModal
 open={modalOpen}
 onOpenChange={setModalOpen}
 problemName={problem.name}
 existingSubmission={submission}
 onSave={onSaveCode}
 onDelete={onDeleteCode}
 />
 </>
 );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function ProblemsPage() {
 const router = useRouter();
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const { completed, submissions, submitCode, removeCode, loading } = useProblemCompletions();

 // Read URL search params
 const paramPage = parseInt(searchParams.get("page") ?? "", 10);
 const paramStatus = (searchParams.get("status") as StatusFilter) || "All";
 const paramPlat = (searchParams.get("platform") as Platform) || "All";
 const paramDiff = (searchParams.get("difficulty") as "All" | Difficulty) || "All";
 const paramTopic = searchParams.get("topic") || "All";
 const paramSheet = (searchParams.get("sheet") as SheetFilter) || "All";
 const paramSort = (searchParams.get("sort") as SortOption) || "Default Order";
 const paramQuery = searchParams.get("q") || "";

 const [pageSize, setPageSize] = useState<number>(10);
 const [initialJumpDone, setInitialJumpDone] = useState(false);

 // All topics list for topic selector
 const topicsList = useMemo(() => {
 const set = new Set<string>();
 ALL_PROBLEMS.forEach((p) => set.add(p.topic));
 return ["All", ...Array.from(set).sort()];
 }, []);

 // Update URL helper via Next.js router
 const updateUrl = useCallback(
 (params: Record<string, string | number | null | undefined>) => {
 const current = new URLSearchParams(searchParams.toString());
 Object.entries(params).forEach(([key, val]) => {
 if (
 val === null ||
 val === undefined ||
 val === "" ||
 val === "All" ||
 val === "Default Order" ||
 (key === "page" && Number(val) === 1)
 ) {
 current.delete(key);
 } else {
 current.set(key, String(val));
 }
 });
 const queryStr = current.toString();
 const target = queryStr ? `${pathname}?${queryStr}` : pathname;
 router.replace(target, { scroll: false });
 },
 [router, pathname, searchParams],
 );

 // Filtered dataset
 const filtered = useMemo(() => {
 return ALL_PROBLEMS.filter((p) => {
 const isDone = completed.has(p.name);
 const hasSubmission = Boolean(submissions[p.name]);

 if (paramStatus === "Completed" && !isDone) return false;
 if (paramStatus === "Incomplete" && isDone) return false;
 if (paramStatus === "Revision Needed" && !hasSubmission) return false;

 if (paramDiff !== "All" && p.difficulty !== paramDiff) return false;
 if (paramPlat !== "All") {
 const targetPlat = paramPlat === "GFG" ? "GeeksforGeeks" : paramPlat;
 const probPlat = p.platform === "GFG" ? "GeeksforGeeks" : p.platform;
 if (probPlat !== targetPlat) return false;
 }
 if (paramSheet !== "All" && p.sheet !== paramSheet) return false;
 if (paramTopic !== "All" && p.topic !== paramTopic) return false;

 if (paramQuery.trim()) {
 const q = paramQuery.toLowerCase();
 const matchesPlat =
 p.platform.toLowerCase().includes(q) ||
 ((q === "gfg" || q === "geeks") && (p.platform === "GeeksforGeeks" || p.platform === "GFG"));
 return (
 p.name.toLowerCase().includes(q) ||
 p.topic.toLowerCase().includes(q) ||
 p.sheet.toLowerCase().includes(q) ||
 matchesPlat
 );
 }
 return true;
 });
 }, [paramStatus, paramDiff, paramPlat, paramSheet, paramTopic, paramQuery, completed, submissions]);

 // Sorted dataset
 const sortedAndFiltered = useMemo(() => {
 const list = [...filtered];
 switch (paramSort) {
 case "Problem Number":
 return list.sort((a, b) => a.id - b.id);
 case "Problem Name":
 return list.sort((a, b) => a.name.localeCompare(b.name));
 case "Recently Completed":
 return list.sort((a, b) => {
 const aDone = completed.has(a.name);
 const bDone = completed.has(b.name);
 if (aDone && !bDone) return -1;
 if (!aDone && bDone) return 1;
 return a.id - b.id;
 });
 default:
 return list;
 }
 }, [filtered, paramSort, completed]);

 const totalPages = Math.max(1, Math.ceil(sortedAndFiltered.length / pageSize));
 const currentPage = isNaN(paramPage) || paramPage < 1 ? 1 : Math.min(paramPage, totalPages);

 // Auto-jump to user's active/last solved page if no ?page= param was specified
 useEffect(() => {
 if (loading || initialJumpDone || searchParams.has("page")) return;

 if (sortedAndFiltered.length > 0) {
 let targetIndex = -1;
 for (let i = sortedAndFiltered.length - 1; i >= 0; i--) {
 if (completed.has(sortedAndFiltered[i].name)) {
 targetIndex = i;
 break;
 }
 }
 if (targetIndex === -1) targetIndex = 0;

 const targetPage = Math.floor(targetIndex / pageSize) + 1;
 if (targetPage !== currentPage) {
 updateUrl({ page: targetPage });
 }
 }
 setInitialJumpDone(true);
 }, [loading, initialJumpDone, searchParams, sortedAndFiltered, completed, pageSize, currentPage, updateUrl]);

 // Handle page change with auto scroll-
 const setPage = (p: number) => {
 const nextP = Math.max(1, Math.min(p, totalPages));
 updateUrl({ page: nextP });
 if (typeof window !== "undefined") {
 window.scrollTo({ top: 0, behavior: "smooth" });
 }
 };

 const setFilterState = (updates: Record<string, string | number | null | undefined>) => {
 updateUrl({ ...updates, page: 1 });
 };

 // Paginated items
 const paginatedProblems = useMemo(() => {
 const start = (currentPage - 1) * pageSize;
 return sortedAndFiltered.slice(start, start + pageSize);
 }, [sortedAndFiltered, currentPage, pageSize]);

 const diffCounts = useMemo(() => countBy(ALL_PROBLEMS, (p) => p.difficulty), []);
 const totalDone = completed.size;
 const filteredDone = useMemo(
 () => sortedAndFiltered.filter((p) => completed.has(p.name)).length,
 [sortedAndFiltered, completed],
 );

 const hasActiveFilter =
 paramDiff !== "All" ||
 paramPlat !== "All" ||
 paramSheet !== "Practice 404 Sheet" ||
 paramTopic !== "All" ||
 paramStatus !== "Incomplete" ||
 paramSort !== "Default Order" ||
 paramQuery.trim() !== "";

 function clearFilters() {
 updateUrl({
 page: 1,
 status: "Incomplete",
 platform: "All",
 difficulty: "All",
 topic: "All",
 sheet: "Practice 404 Sheet",
 sort: "Default Order",
 q: "",
 });
 }

 const startItem = sortedAndFiltered.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
 const endItem = Math.min(currentPage * pageSize, sortedAndFiltered.length);

 return (
 <div className="min-h-screen text-foreground pb-16 pt-8 animate-fade-in">
 <div className="mx-auto max-w-[1400px] px-4 md:px-8">
 
 {/* ── EDITORIAL HEADER ── */}
 <header className="mb-12 border-b border-border pb-6">
 <div className="flex items-center gap-3 text-primary font-semibold text-sm tracking-widest uppercase mb-3">
 <Code2 className="size-4" />
 <span>Practice Workspace</span>
 </div>
 <h1 className="font-display text-4xl sm:text-5xl font-black tracking-tight leading-none text-foreground">
 Problem Library
 </h1>
 <p className="mt-3 text-foreground text-sm sm:text-base max-w-2xl leading-relaxed">
 Discover, filter, and master algorithmic challenges. Your completed problems are automatically synced with your curriculum timeline.
 </p>
 </header>

 {/* ── WORKSPACE LAYOUT (SIDEBAR + GRID) ── */}
 <div className="flex flex-col lg:flex-row gap-8 items-start">
 
 {/* LEFT SIDEBAR: FILTERS */}
 <aside className="w-full lg:w-72 shrink-0 space-y-8 lg:sticky lg:top-8 border border-border bg-card p-6 rounded-lg shadow-sm">
 <div className="space-y-6">
 
 {/* Search */}
 <div className="space-y-2">
 <label className="text-xs font-bold uppercase tracking-wider text-foreground">Search</label>
 <div className="relative">
 <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground" />
 <Input
 placeholder="Search problems..."
 value={paramQuery}
 onChange={(e) => setFilterState({ q: e.target.value })}
 className="pl-9 h-10 border-border bg-secondary focus:bg-background"
 />
 {paramQuery && (
 <button
 type="button"
 onClick={() => setFilterState({ q: "" })}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground hover:text-foreground"
 >
 <X className="size-4" />
 </button>
 )}
 </div>
 </div>

 {/* Status */}
 <div className="space-y-2">
 <label className="text-xs font-bold uppercase tracking-wider text-foreground">Status</label>
 <div className="flex flex-col gap-1.5">
 {STATUS_FILTERS.map((st) => (
 <button
 key={st}
 type="button"
 onClick={() => setFilterState({ status: st })}
 className={cn(
 "text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors",
 paramStatus === st
 ? "bg-primary text-primary-foreground"
 : "text-foreground hover:bg-secondary hover:text-foreground"
 )}
 >
 {st}
 </button>
 ))}
 </div>
 </div>

 {/* Difficulty */}
 <div className="space-y-2">
 <label className="text-xs font-bold uppercase tracking-wider text-foreground">Difficulty</label>
 <div className="flex flex-wrap gap-2">
 {(["All", "Easy", "Medium", "Hard"] as const).map((d) => (
 <button
 key={d}
 type="button"
 onClick={() => setFilterState({ difficulty: d })}
 className={cn(
 "rounded-full border px-3 py-1 text-xs font-bold transition-all",
 paramDiff === d
 ? "border-primary bg-primary text-primary-foreground"
 : "border-border bg-transparent text-foreground hover:border-muted-foreground"
 )}
 >
 {d}
 </button>
 ))}
 </div>
 </div>

 {/* Sheet */}
 <div className="space-y-2">
 <label className="text-xs font-bold uppercase tracking-wider text-foreground">Curriculum Sheet</label>
 <select
 value={paramSheet}
 onChange={(e) => setFilterState({ sheet: e.target.value })}
 className="w-full h-10 rounded-lg border border-border bg-secondary px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
 >
 {SHEET_FILTERS.map((sf) => (
 <option key={sf} value={sf}>{sf}</option>
 ))}
 </select>
 </div>

 {/* Topic */}
 <div className="space-y-2">
 <label className="text-xs font-bold uppercase tracking-wider text-foreground">Topic</label>
 <select
 value={paramTopic}
 onChange={(e) => setFilterState({ topic: e.target.value })}
 className="w-full h-10 rounded-lg border border-border bg-secondary px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
 >
 <option value="All">All Topics</option>
 {topicsList.filter((t) => t !== "All").map((tp) => (
 <option key={tp} value={tp}>{tp}</option>
 ))}
 </select>
 </div>

 {/* Sort */}
 <div className="space-y-2">
 <label className="text-xs font-bold uppercase tracking-wider text-foreground">Sort By</label>
 <select
 value={paramSort}
 onChange={(e) => setFilterState({ sort: e.target.value })}
 className="w-full h-10 rounded-lg border border-border bg-secondary px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
 >
 {SORT_OPTIONS.map((st) => (
 <option key={st} value={st}>{st}</option>
 ))}
 </select>
 </div>

 {hasActiveFilter && (
 <button
 type="button"
 onClick={clearFilters}
 className="w-full mt-4 flex justify-center items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground hover:text-foreground transition-colors py-2 border-t border-border"
 >
 <X className="size-3.5" /> Clear All Filters
 </button>
 )}

 </div>
 </aside>

 {/* MAIN AREA: GRID */}
 <main className="flex-1 min-w-0 space-y-6">
 
 {/* Top Bar Summary */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-lg p-4 shadow-sm">
 <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
 <span className="font-semibold text-foreground">
 Showing {startItem}-{endItem} of {sortedAndFiltered.length}
 </span>
 <span className="text-success font-bold">
 ✓ {filteredDone} Completed
 </span>
 <span className="text-foreground font-semibold">
 {sortedAndFiltered.length - filteredDone} Remaining
 </span>
 </div>
 <div className="flex items-center gap-2">
 <span className="text-xs font-bold text-foreground uppercase tracking-wider">Per Page</span>
 <div className="flex items-center rounded-lg border border-border bg-secondary p-0.5">
 {[20, 50, 100].map((sz) => (
 <button
 key={sz}
 type="button"
 onClick={() => {
 setPageSize(sz);
 setPage(1);
 }}
 className={cn(
 "rounded-md px-3 py-1 font-bold text-xs transition-colors",
 pageSize === sz ? "bg-primary text-primary-foreground" : "text-foreground hover:text-foreground"
 )}
 >
 {sz}
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* Empty State */}
 {sortedAndFiltered.length === 0 ? (
 <div className="rounded-lg border border-dashed border-border p-12 text-center flex flex-col items-center">
 <div className="size-16 rounded-full bg-secondary flex items-center justify-center mb-4">
 <Filter className="size-8 text-foreground " />
 </div>
 <h3 className="text-xl font-display font-bold mb-2">No problems found</h3>
 <p className="text-foreground mb-6 max-w-sm">We couldn't find any challenges matching your current filter combinations.</p>
 <button
 type="button"
 className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold"
 onClick={clearFilters}
 >
 Clear all filters
 </button>
 </div>
 ) : (
 /* Problem Grid */
 <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
 {paginatedProblems.map((p) => (
 <ProblemItem
 key={`${p.sheet}|${p.id}|${p.name}`}
 problem={p}
 done={completed.has(p.name)}
 submission={submissions[p.name]}
 onSaveCode={async (code, link, kp) => await submitCode(p.name, code, link || p.link, kp)}
 onDeleteCode={async () => await removeCode(p.name)}
 />
 ))}
 </div>
 )}

 {/* Pagination Controls */}
 {totalPages > 1 && (
 <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
 <Button
 variant="outline"
 size="sm"
 onClick={() => setPage(Math.max(1, currentPage - 1))}
 disabled={currentPage === 1}
 className="w-24"
 >
 <ChevronLeft className="mr-1 size-4" /> Previous
 </Button>
 <span className="text-sm text-foreground font-medium">
 Page {currentPage} of {totalPages}
 </span>
 <Button
 variant="outline"
 size="sm"
 onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
 disabled={currentPage === totalPages}
 className="w-24"
 >
 Next <ChevronRight className="ml-1 size-4" />
 </Button>
 </div>
 )}

 </main>
 </div>
 </div>
 </div>
 );
}



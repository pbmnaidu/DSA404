"use client";

import { useState, useMemo } from "react";
import { useOptionalPlan } from "@/hooks/usePlan";
import { useProblemCompletions } from "@/hooks/useProblemCompletions";
import { ALL_PROBLEMS, getCanonicalProblemLink, getProblemMetadata } from "@/lib/problems";
import { todayIso } from "@/lib/plan";
import { type CompletedProblemSnapshot } from "@/lib/db";
import { CodeModal } from "@/components/CodeModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
 CheckCircle2, ExternalLink, Code2, Search, Filter,
 Layers, BookOpen, Sparkles, ChevronDown, ChevronRight, Activity, Calendar
} from "lucide-react";

interface SolvedProblemsArchiveProps {
 completedProblems?: CompletedProblemSnapshot[];
 className?: string;
 isProfileTheme?: boolean;
}

export function SolvedProblemsArchive({
 completedProblems: providedProblems,
 className,
 isProfileTheme = false,
}: SolvedProblemsArchiveProps) {
 const planCtx = useOptionalPlan();
 const days = planCtx?.days ?? [];
 const { submissions } = useProblemCompletions();

 const [selectedProblemForModal, setSelectedProblemForModal] = useState<string | null>(null);
 const [searchQuery, setSearchQuery] = useState("");
 const [selectedPlatform, setSelectedPlatform] = useState<string>("All");
 const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");
 const [expandedId, setExpandedId] = useState<string | null>(null);

 // Compute completed problems list
 const completedProblems = useMemo<CompletedProblemSnapshot[]>(() => {
 if (providedProblems) {
 const seen = new Set<string>();
 const list: CompletedProblemSnapshot[] = [];
 const today = todayIso();
 for (const p of providedProblems) {
 if (!p?.name || seen.has(p.name)) continue;
 seen.add(p.name);
 const meta = getProblemMetadata(p.name);
 const sub = submissions[p.name];
 const effectiveLink = p.link || meta.link || getCanonicalProblemLink(p.name) || sub?.link || "";
 const rawPlat = p.platform || meta.platform || (sub as any)?.platform || "DSA";
 const normPlat = rawPlat === "GFG" || rawPlat.toLowerCase().includes("geeks") ? "GeeksforGeeks" : rawPlat;
 list.push({
 ...p,
 platform: normPlat,
 difficulty: p.difficulty || meta.difficulty || "Medium",
 link: effectiveLink,
 completedAt: p.completedAt || sub?.submittedAt?.slice(0, 10) || today,
 submittedAt: p.submittedAt || sub?.submittedAt || new Date().toISOString(),
 topic: p.topic || meta.topic || (sub as any)?.topic || "DSA Sheet",
 section: p.section || meta.sheet || (sub as any)?.section || "Core Problems",
 code: p.code || sub?.code,
 submissionLink: p.submissionLink || sub?.link || effectiveLink,
 keyPoints: p.keyPoints || sub?.keyPoints,
 });
 }
 return list;
 }

 const seen = new Set<string>();
 const list: CompletedProblemSnapshot[] = [];
 const today = todayIso();
 for (const day of days) {
 for (const p of day.problems) {
 if (p.done && !seen.has(p.name)) {
 seen.add(p.name);
 const sub = submissions[p.name];
 const platLink = getCanonicalProblemLink(p.name) || p.link || "";
 const rawPlat = p.platform || "DSA";
 const normPlat = rawPlat === "GFG" || rawPlat.toLowerCase().includes("geeks") ? "GeeksforGeeks" : rawPlat;
 const completedAt = p.completedAt?.slice(0, 10) || sub?.submittedAt?.slice(0, 10) || day.date || today;
 const submittedAt = sub?.submittedAt || p.completedAt || new Date().toISOString();
 const meta = getProblemMetadata(p.name);
 list.push({
 name: p.name,
 platform: normPlat,
 difficulty: p.difficulty || "Medium",
 link: platLink,
 completedAt,
 submittedAt,
 topic: meta.topic || "DSA Sheet",
 section: meta.sheet || "Core Problems",
 code: sub?.code,
 submissionLink: sub?.link || platLink,
 keyPoints: sub?.keyPoints,
 });
 }
 }
 }
 return list;
 }, [providedProblems, days, submissions]);

 // Aggregations
 const platforms = useMemo(() => ["All", ...Array.from(new Set(completedProblems.map((p) => p.platform))).sort()], [completedProblems]);
 const difficulties = ["All", "Easy", "Medium", "Hard"];
 
 const difficultyCounts = useMemo(() => {
 return completedProblems.reduce((acc, p) => {
 acc[p.difficulty] = (acc[p.difficulty] || 0) + 1;
 return acc;
 }, {} as Record<string, number>);
 }, [completedProblems]);

 const topicCounts = useMemo(() => {
 return completedProblems.reduce((acc, p) => {
 const topic = p.topic || "Uncategorized";
 acc[topic] = (acc[topic] || 0) + 1;
 return acc;
 }, {} as Record<string, number>);
 }, [completedProblems]);

 const topTopics = useMemo(() => Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).slice(0, 4), [topicCounts]);

 const filteredProblems = useMemo(() => {
 return completedProblems
 .filter((p) => {
 if (selectedPlatform !== "All" && p.platform !== selectedPlatform) return false;
 if (selectedDifficulty !== "All" && p.difficulty !== selectedDifficulty) return false;
 if (searchQuery.trim()) {
 const q = searchQuery.toLowerCase();
 const topicMatch = p.topic ? p.topic.toLowerCase().includes(q) : false;
 return p.name.toLowerCase().includes(q) || topicMatch;
 }
 return true;
 })
 .sort((a, b) => {
 const timeA = new Date(a.submittedAt || a.completedAt || 0).getTime();
 const timeB = new Date(b.submittedAt || b.completedAt || 0).getTime();
 return timeB - timeA;
 });
 }, [completedProblems, selectedPlatform, selectedDifficulty, searchQuery]);

 if (completedProblems.length === 0) {
 return (
 <div className={cn("rounded-lg border border-dashed border-border bg-card p-12 text-center", className)}>
 <div className="mx-auto size-16 rounded-full bg-muted flex items-center justify-center text-primary mb-4">
 <Layers className="size-8" />
 </div>
 <h3 className="text-xl font-display font-bold mb-2">No problems solved yet</h3>
 <p className="text-foreground max-w-sm mx-auto text-sm">
 Your solved problems journey will appear here once you start completing your daily tasks.
 </p>
 </div>
 );
 }

 return (
 <div className={cn("space-y-8 animate-fade-in", className)}>
 {/* Overview Section */}
 <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
 <div className="md:col-span-4 rounded-[2rem] bg-muted border border-border p-6 flex flex-col justify-center">
 <div className="flex items-center gap-2 text-primary mb-4">
 <Sparkles className="size-5" />
 <h3 className="font-bold text-sm uppercase tracking-wider">Total Mastery</h3>
 </div>
 <div className="text-5xl font-display font-black text-foreground mb-2">{completedProblems.length}</div>
 <p className="text-foreground text-sm">Problems solved across all sheets</p>
 </div>

 <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="rounded-[2rem] bg-card border border-border p-6 shadow-sm">
 <h4 className="text-xs font-bold uppercase text-foreground tracking-wider mb-4">Difficulty Split</h4>
 <div className="space-y-3">
 {['Easy', 'Medium', 'Hard'].map(diff => {
 const count = difficultyCounts[diff] || 0;
 const total = completedProblems.length || 1;
 const color = diff === 'Easy' ? 'bg-success' : diff === 'Medium' ? 'bg-warning' : 'bg-destructive';
 return (
 <div key={diff}>
 <div className="flex justify-between text-xs font-bold mb-1">
 <span>{diff}</span>
 <span>{count}</span>
 </div>
 <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
 <div className={cn("h-full rounded-full", color)} style={{ width: `${(count / total) * 100}%` }} />
 </div>
 </div>
 )
 })}
 </div>
 </div>
 <div className="rounded-[2rem] bg-card border border-border p-6 shadow-sm">
 <h4 className="text-xs font-bold uppercase text-foreground tracking-wider mb-4">Top Topics</h4>
 <div className="space-y-2">
 {topTopics.map(([topic, count]) => (
 <div key={topic} className="flex items-center justify-between">
 <span className="text-sm font-medium truncate pr-2 max-w-[150px]" title={topic}>{topic}</span>
 <Badge variant="secondary" className="font-mono">{count}</Badge>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>

 {/* Library View */}
 <div className="rounded-[2rem] bg-card border border-border shadow-sm overflow-hidden flex flex-col">
 <div className="p-6 border-b border-border bg-muted">
 <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
 <BookOpen className="size-5 text-primary" /> Problem Library
 </h3>
 <div className="flex min-w-0 flex-col gap-4 sm:flex-row">
 <div className="relative flex-1">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground" />
 <Input
 placeholder="Search problems or topics..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-9 h-11 rounded-lg bg-background border-border"
 />
 </div>
 <div className="flex flex-wrap gap-2 sm:shrink-0">
 <div className="relative">
 <select
 value={selectedDifficulty}
 onChange={(e) => setSelectedDifficulty(e.target.value)}
 className="h-11 pl-4 pr-10 rounded-lg bg-background border border-border text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
 >
 {difficulties.map((d) => (<option key={d} value={d}>{d === "All" ? "All Difficulties" : d}</option>))}
 </select>
 <Filter className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-foreground pointer-events-none" />
 </div>
 <div className="relative">
 <select
 value={selectedPlatform}
 onChange={(e) => setSelectedPlatform(e.target.value)}
 className="h-11 pl-4 pr-10 rounded-lg bg-background border border-border text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
 >
 {platforms.map((p) => (<option key={p} value={p}>{p === "All" ? "All Platforms" : p}</option>))}
 </select>
 <Filter className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-foreground pointer-events-none" />
 </div>
 </div>
 </div>
 </div>

 <div className="divide-y divide-border/60 max-h-[600px] overflow-y-auto custom-scrollbar">
 {filteredProblems.length === 0 ? (
 <div className="p-12 text-center text-foreground">
 No problems match your filters.
 </div>
 ) : (
 filteredProblems.map((p, i) => {
 const isExpanded = expandedId === p.name;
 return (
 <div key={i} className="transition-colors hover:bg-muted">
 <div 
 onClick={() => setExpandedId(isExpanded ? null : p.name)}
 className="flex min-w-0 items-start justify-between gap-3 p-4 cursor-pointer sm:items-center sm:px-6"
 >
 <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
 <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
 <CheckCircle2 className="size-4 text-success" />
 </div>
 <div className="min-w-0">
 <h4 className="font-bold text-sm leading-5 break-words">{p.name}</h4>
 <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-foreground">
 <span className={cn(
 "font-bold",
 p.difficulty === "Easy" ? "text-success" :
 p.difficulty === "Medium" ? "text-warning" : "text-destructive"
 )}>{p.difficulty}</span>
 <span>•</span>
 <span className="break-words">{p.topic}</span>
 </div>
 </div>
 </div>
 <div className="flex items-center gap-4 shrink-0">
 <Badge variant="outline" className="hidden sm:inline-flex bg-background font-mono text-[10px]">
 {new Date(p.submittedAt || p.completedAt || "").toLocaleDateString()}
 </Badge>
 {isExpanded ? <ChevronDown className="size-5 text-foreground" /> : <ChevronRight className="size-5 text-foreground" />}
 </div>
 </div>

 {isExpanded && (
 <div className="px-4 sm:px-6 pb-6 pt-2 bg-muted border-t border-border">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
 <div className="space-y-4">
 <div>
 <p className="text-[10px] font-bold text-foreground uppercase tracking-wider mb-1">Context</p>
 <p className="text-sm font-medium">{p.section} / {p.topic}</p>
 </div>
 <div>
 <p className="text-[10px] font-bold text-foreground uppercase tracking-wider mb-1">Platform</p>
 <p className="text-sm font-medium">{p.platform}</p>
 </div>
 <div className="flex gap-2 pt-2">
 {p.link && (
 <Button variant="outline" size="sm" className="h-8 gap-2 text-xs" asChild>
 <a href={p.link} target="_blank" rel="noreferrer">
 View Original <ExternalLink className="size-3" />
 </a>
 </Button>
 )}
 {(p.code || p.keyPoints || p.submissionLink) && (
 <Button size="sm" className="h-8 gap-2 text-xs" onClick={(e) => { e.stopPropagation(); setSelectedProblemForModal(p.name); }}>
 <Code2 className="size-3" /> My Solution
 </Button>
 )}
 </div>
 </div>
 {(p.keyPoints) && (
 <div className="bg-background rounded-lg p-4 border border-border h-full">
 <p className="text-[10px] font-bold text-foreground uppercase tracking-wider mb-2">My Notes</p>
 <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap line-clamp-4">
 {p.keyPoints}
 </p>
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 );
 })
 )}
 </div>
 </div>

 {selectedProblemForModal && (
 <CodeModal
 open={true}
 onOpenChange={(open) => { if (!open) setSelectedProblemForModal(null); }}
 onSave={async () => {}}
 problemName={selectedProblemForModal}
 />
 )}
 </div>
 );
}

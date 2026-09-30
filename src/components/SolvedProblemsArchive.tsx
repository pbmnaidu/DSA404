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
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ExternalLink,
  Code2,
  Search,
  Filter,
  Layers,
  BookOpen,
  Sparkles,
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
  const { submissions, completed: pbCompleted } = useProblemCompletions();

  const [selectedProblemForModal, setSelectedProblemForModal] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");

  // Compute completed problems list if not provided directly via props
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
        const normPlat =
          rawPlat === "GFG" || rawPlat.toLowerCase().includes("geeks")
            ? "GeeksforGeeks"
            : rawPlat;
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
    // 1. Collect completed problems from plan days
    for (const day of days) {
      for (const p of day.problems) {
        if (p.done && !seen.has(p.name)) {
          seen.add(p.name);
          const sub = submissions[p.name];
          const platLink = getCanonicalProblemLink(p.name) || p.link || "";
          const rawPlat = p.platform || "DSA";
          const normPlat =
            rawPlat === "GFG" || rawPlat.toLowerCase().includes("geeks")
              ? "GeeksforGeeks"
              : rawPlat;
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
            ...(sub
              ? {
                  code: sub.code,
                  submissionLink: sub.link || platLink,
                  keyPoints: sub.keyPoints,
                }
              : {}),
          });
        }
      }
    }

    // 2. Collect completed problems from global pbCompleted set
    for (const fp of ALL_PROBLEMS) {
      if (pbCompleted.has(fp.name) && !seen.has(fp.name)) {
        seen.add(fp.name);
        const sub = submissions[fp.name];
        const platLink = getCanonicalProblemLink(fp.name) || fp.link || "";
        const rawPlat = fp.platform || "DSA";
        const normPlat =
          rawPlat === "GFG" || rawPlat.toLowerCase().includes("geeks")
            ? "GeeksforGeeks"
            : rawPlat;
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
          ...(sub
            ? {
                code: sub.code,
                submissionLink: sub.link || platLink,
                keyPoints: sub.keyPoints,
              }
            : {}),
        });
      }
    }

    // 3. Collect completed problems from submissions that might not have been in days or pbCompleted
    for (const [probName, sub] of Object.entries(submissions ?? {})) {
      if (!probName || seen.has(probName)) continue;
      seen.add(probName);
      const platLink = getCanonicalProblemLink(probName) || sub.link || "";
      const rawPlat = (sub as any).platform || "DSA";
      const normPlat =
        rawPlat === "GFG" || rawPlat.toLowerCase().includes("geeks")
          ? "GeeksforGeeks"
          : rawPlat;
      const completedAt = sub?.submittedAt?.slice(0, 10) || today;
      const submittedAt = sub?.submittedAt || new Date().toISOString();
      list.push({
        name: probName,
        platform: normPlat,
        difficulty: ((sub as any).difficulty || "Medium") as any,
        link: platLink,
        completedAt,
        submittedAt,
        topic: (sub as any).topic || "Problems",
        section: (sub as any).section || "Problems Tab",
        ...(sub.code
          ? {
              code: sub.code,
              submissionLink: sub.link || platLink,
              keyPoints: sub.keyPoints,
            }
          : {}),
      });
    }

    return list;
  }, [providedProblems, days, pbCompleted, submissions]);

  // Extract unique platforms
  const platforms = useMemo(() => {
    const set = new Set<string>();
    completedProblems.forEach((p) => {
      if (p.platform) set.add(p.platform);
    });
    return ["All", ...Array.from(set)];
  }, [completedProblems]);

  // Counts by difficulty
  const difficultyCounts = useMemo(() => {
    let easy = 0;
    let medium = 0;
    let hard = 0;
    for (const p of completedProblems) {
      const diff = (p.difficulty || "Medium").toLowerCase();
      if (diff === "easy") easy++;
      else if (diff === "hard") hard++;
      else medium++;
    }
    return { easy, medium, hard };
  }, [completedProblems]);

  // Filtered problem list based on search and selected filters
  const filteredProblems = useMemo(() => {
    return completedProblems.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.platform.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPlatform =
        selectedPlatform === "All" || p.platform === selectedPlatform;

      const matchesDifficulty =
        selectedDifficulty === "All" ||
        p.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();

      return matchesSearch && matchesPlatform && matchesDifficulty;
    });
  }, [completedProblems, searchQuery, selectedPlatform, selectedDifficulty]);

  const diffBadgeColor = (diff: string) => {
    const d = (diff || "medium").toLowerCase();
    if (d === "easy") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    if (d === "hard") return "bg-rose-500/10 text-rose-400 border-rose-500/30";
    return "bg-amber-500/10 text-amber-400 border-amber-500/30";
  };

  const platformBadgeColor = (plat: string) => {
    const p = (plat || "").toLowerCase();
    if (p.includes("leetcode")) return "bg-orange-500/10 text-orange-400 border-orange-500/30";
    if (p.includes("geeks")) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    if (p.includes("codeforces")) return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    if (p.includes("atcoder")) return "bg-purple-500/10 text-purple-400 border-purple-500/30";
    return "bg-secondary text-secondary-foreground border-border";
  };

  return (
    <section
      className={cn(
        "rounded-2xl border p-5 shadow-sm space-y-4",
        isProfileTheme
          ? "border-white/10 bg-card/60 backdrop-blur-xl shadow-xl p-6"
          : "border-border bg-card",
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 p-2 text-emerald-400 shrink-0">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">
              All Solved Problems Archive
            </h2>
            <p className="text-xs text-muted-foreground">
              Row-wise archive of all your completed questions with code solutions.
            </p>
          </div>
        </div>

        {/* Difficulty Counts Badges */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-bold text-emerald-400">
            {completedProblems.length} Total Solved
          </span>
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
            {difficultyCounts.easy} Easy
          </span>
          <span className="rounded-full border border-amber-500/20 bg-amber-500/5 px-2 py-0.5 text-[11px] font-medium text-amber-400">
            {difficultyCounts.medium} Med
          </span>
          <span className="rounded-full border border-rose-500/20 bg-rose-500/5 px-2 py-0.5 text-[11px] font-medium text-rose-400">
            {difficultyCounts.hard} Hard
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search solved problems by title or platform..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>

        {/* Filter Selects */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Platform Filter */}
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="h-9 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
          >
            {platforms.map((plat) => (
              <option key={plat} value={plat}>
                {plat === "All" ? "All Platforms" : plat}
              </option>
            ))}
          </select>

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="h-9 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Row-wise Table / List View */}
      {completedProblems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 p-8 text-center space-y-2">
          <BookOpen className="mx-auto size-8 text-muted-foreground/60" />
          <p className="text-xs text-muted-foreground italic">
            No completed problems yet. Submit code solutions on your daily workspace to build your solved archive!
          </p>
        </div>
      ) : filteredProblems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 p-6 text-center">
          <p className="text-xs text-muted-foreground">
            No solved problems match your search filters.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Header Row (Desktop) */}
          <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/40">
            <span className="w-9 text-center">#</span>
            <span className="flex-1">Problem Title</span>
            <span className="w-28 text-center">Platform</span>
            <span className="w-20 text-center">Difficulty</span>
            <span className="w-32 text-right">Actions</span>
          </div>

          {/* Scrollable Container for Row Items */}
          <div className="max-h-[460px] overflow-y-auto pr-1 space-y-1 divide-y divide-border/20 custom-scrollbar">
            {filteredProblems.map((p, idx) => (
              <div
                key={`${p.name}-${idx}`}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 px-3 rounded-lg hover:bg-muted/40 transition-colors border border-transparent hover:border-border/40 text-xs"
              >
                {/* Left: Index + Title */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className="w-7 sm:w-9 text-center font-mono text-[11px] font-semibold text-muted-foreground shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-foreground truncate block group-hover:text-primary transition-colors">
                      {p.name}
                    </span>
                  </div>
                </div>

                {/* Center: Badges */}
                <div className="flex items-center gap-2 shrink-0 sm:w-52 justify-start sm:justify-center">
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight truncate max-w-[110px]",
                      platformBadgeColor(p.platform)
                    )}
                  >
                    {p.platform}
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-semibold truncate",
                      diffBadgeColor(p.difficulty)
                    )}
                  >
                    {p.difficulty}
                  </span>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 sm:w-32 justify-end pt-1 sm:pt-0 border-t sm:border-t-0 border-border/20">
                  {p.link && (
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
                    >
                      <a
                        href={p.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Open ${p.name} on external site`}
                      >
                        <ExternalLink className="size-3 text-primary" />
                        <span className="hidden lg:inline">Link</span>
                      </a>
                    </Button>
                  )}

                  {p.code ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedProblemForModal(p.name)}
                      className="h-7 px-2.5 text-[11px] font-bold gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    >
                      <Code2 className="size-3" />
                      View Code
                    </Button>
                  ) : (
                    <span className="text-[10px] font-semibold text-muted-foreground px-2 py-1 rounded bg-muted/30 border border-border/40">
                      Marked Done
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-right text-[11px] text-muted-foreground font-mono">
            Showing {filteredProblems.length} of {completedProblems.length} problem(s)
          </div>
        </div>
      )}

      {/* Code Modal */}
      <CodeModal
        open={!!selectedProblemForModal}
        onOpenChange={(open) => !open && setSelectedProblemForModal(null)}
        problemName={selectedProblemForModal ?? ""}
        existingSubmission={
          selectedProblemForModal
            ? submissions[selectedProblemForModal] || (() => {
                const sp = completedProblems.find((p) => p.name === selectedProblemForModal);
                return sp?.code
                  ? {
                      code: sp.code,
                      link: sp.submissionLink || sp.link || "",
                      keyPoints: sp.keyPoints || "",
                      submittedAt: sp.submittedAt || sp.completedAt || "",
                    }
                  : undefined;
              })()
            : undefined
        }
        onSave={async () => {}}
        readOnly={true}
      />
    </section>
  );
}

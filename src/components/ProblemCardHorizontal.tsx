"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
 Tooltip,
 TooltipContent,
 TooltipProvider,
 TooltipTrigger,
} from "@/components/ui/tooltip";
import {
 ExternalLink,
 BookmarkPlus,
 BookmarkCheck,
 Sparkles,
 Search,
 Code2,
 CheckCircle2,
 Video,
 Link2,
 SkipForward,
} from "lucide-react";
import type { Problem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CodeModal } from "@/components/CodeModal";
import { useProblemCompletions } from "@/hooks/useProblemCompletions";
import { getCanonicalProblemLink } from "@/lib/problems";

const diffClass: Record<string, string> = {
 Easy: "bg-success/20 text-card-foreground border-success/60",
 Medium: "bg-warning/20 text-card-foreground border-warning/60",
 Hard: "bg-destructive/20 text-card-foreground border-destructive/60",
};

const platformColors: Record<string, string> = {
 LeetCode: "bg-warning/20 text-card-foreground border-warning/60",
 Codeforces: "bg-primary/20 text-card-foreground border-primary/60",
 GeeksforGeeks: "bg-success/20 text-card-foreground border-success/60",
 GFG: "bg-success/20 text-card-foreground border-success/60",
 HackerRank: "bg-success/20 text-card-foreground border-success/60",
 AtCoder: "bg-info/20 text-card-foreground border-info/60",
 CodeChef: "bg-warning/20 text-card-foreground border-warning/60",
};

function googleSearchUrl(problemName: string) {
 const query = `${problemName} DSA solution explanation site:leetcode.com OR site:geeksforgeeks.org OR site:takeuforward.org OR site:naukri.com OR site:interviewbit.com OR site:programiz.com OR site:w3schools.com OR site:hackerrank.com OR site:hackerearth.com OR site:codechef.com OR site:codeforces.com OR site:neetcode.io OR site:cp-algorithms.com`;
 return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function youtubeSearchUrl(problemName: string) {
 const query = `${problemName} solution intuition explained NeetCode OR Striver`;
 return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

import { getChatGPTAiPromptUrl } from "@/lib/aiTutorPrompt";
import { HoverHint } from "./HoverHint";

function chatGptProblemUrl(problemName: string) {
 return getChatGPTAiPromptUrl(problemName);
}

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

interface ProblemCardHorizontalProps {
 problem: Problem;
 onToggle: () => void;
 onToggleReview?: () => void;
 onSkip?: () => void;
 readOnly?: boolean;
 /** Topic name of the day this problem belongs to */
 topic?: string;
 /** Day number in the plan */
 dayNumber?: number;
 /** Section / chapter of the plan */
 section?: string;
}

export function ProblemCardHorizontal({
 problem,
 onToggle,
 onToggleReview,
 onSkip,
 readOnly = false,
 topic,
 dayNumber,
 section,
}: ProblemCardHorizontalProps) {
 const [codeModalOpen, setCodeModalOpen] = useState(false);
 const { submissions, submitCode, removeCode } = useProblemCompletions();
 const submission = submissions[problem.name];
 const hasSubmission = !!submission;

 return (
 <>
 <div
 className={cn(
 "group relative flex min-w-0 w-full flex-col justify-between overflow-hidden rounded-lg border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-sm select-none min-h-[170px]",
 problem.done
 ? "border-border bg-muted shadow-sm shadow-success "
 : "border-border bg-card shadow-sm hover:border-border hover:shadow-sm"
 )}
 >

 {/* Card Header: Badges & Actions */}
 <div className="flex min-w-0 items-start justify-between gap-2 mb-3">
 <div className="flex min-w-0 flex-wrap items-center gap-1.5">
 {(() => {
 const displayPlat = problem.platform === "GFG" ? "GeeksforGeeks" : problem.platform;
 return (
 <span
 className={cn(
 "rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
 platformColors[displayPlat] ?? "bg-white text-foreground border-border"
 )}
 >
 {displayPlat}
 </span>
 );
 })()}
 <span
 className={cn(
 "rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide",
 diffClass[problem.difficulty] ?? "bg-white text-foreground border-border"
 )}
 >
 {problem.difficulty}
 </span>
 {hasSubmission && (
 <span className="inline-flex items-center gap-1 rounded-full border border-success/60 bg-success/20 px-2 py-0.5 text-[10px] font-bold text-card-foreground">
 <CheckCircle2 className="size-3 text-card-foreground" /> Submitted
 </span>
 )}
 </div>

 <div className="flex shrink-0 items-center gap-1">
 {onSkip && !readOnly && (
 <ThemedTooltip hint="Skip problem — moves this problem to tomorrow's plan">
 <button
 onClick={onSkip}
 className="rounded-full p-1.5 text-foreground hover:bg-white hover:text-warning transition-colors"
 >
 <SkipForward className="size-4" />
 </button>
 </ThemedTooltip>
 )}

 {onToggleReview && (
 <ThemedTooltip hint={problem.forReview ? "Remove from Review tab" : "Bookmark problem for Review tab"}>
 <button
 onClick={onToggleReview}
 className={cn(
 "rounded-full p-1.5 transition-colors",
 problem.forReview
 ? "bg-muted text-warning hover:bg-muted"
 : "text-foreground hover:bg-white hover:text-foreground"
 )}
 >
 {problem.forReview ? (
 <BookmarkCheck className="size-4 fill-amber-400/20" />
 ) : (
 <BookmarkPlus className="size-4" />
 )}
 </button>
 </ThemedTooltip>
 )}
 </div>
 </div>

 {/* Card Body: Problem Title & Checkbox */}
 <div className="mb-4">
 <div className="flex items-start gap-2">
 <ThemedTooltip hint={problem.done ? "Click to uncheck completed status" : "Submit code solution to mark completed"}>
 <div className="mt-0.5">
 <Checkbox
 checked={problem.done}
 onCheckedChange={() => {
 if (readOnly) return;
 if (!problem.done) {
 setCodeModalOpen(true);
 } else {
 onToggle();
 }
 }}
 disabled={readOnly}
 className="size-5 rounded-md border-border text-success data-[state=checked]:bg-success data-[state=checked]:border-success hover:border-primary transition-colors cursor-pointer"
 />
 </div>
 </ThemedTooltip>

 <div className="flex-1 min-w-0">
 <h4
 className={cn(
 "text-sm font-semibold leading-snug tracking-tight transition-colors line-clamp-2",
 problem.done ? "text-success font-bold" : "text-foreground font-semibold"
 )}
 >
 {problem.name}
 </h4>
 </div>
 </div>
 </div>

 {/* Card Footer: Links Dropdown & Action Buttons */}
 <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 pt-3 border-t border-border text-xs">
 <div className="flex shrink-0 items-center gap-1">
 {/* Links Dropdown Button */}
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <button
 className="inline-flex items-center gap-1 rounded-lg bg-muted hover:bg-muted text-primary px-2.5 py-1 font-medium transition-colors text-xs"
 >
 <Link2 className="size-3.5" />
 <ThemedTooltip hint={`view all the links & resources for ${problem.name}`}>
 <span>Links 🔗</span>
 </ThemedTooltip>
 </button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="start" className="w-56 rounded-lg border border-border bg-card ">
 <DropdownMenuLabel className="text-xs font-semibold text-foreground">Resource Links</DropdownMenuLabel>
 <DropdownMenuSeparator />

 {(() => {
 const effectiveLink = getCanonicalProblemLink(problem.name) ?? problem.link;
 if (!effectiveLink) return null;
 const linkPlatform =
 effectiveLink.includes("geeksforgeeks.org") ? "GeeksforGeeks" :
 effectiveLink.includes("hackerrank.com") ? "HackerRank" :
 effectiveLink.includes("w3schools.com") ? "W3Schools" :
 effectiveLink.includes("leetcode.com") ? "LeetCode" :
 (problem.platform === "GFG" ? "GeeksforGeeks" : problem.platform);
 return (
 <DropdownMenuItem asChild>
 <a href={effectiveLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-semibold text-primary">
 <ExternalLink className="size-3.5 text-primary" />
 <ThemedTooltip hint={`view the ${linkPlatform} official page for ${problem.name}`}>
 <span>{linkPlatform} Official Page</span>
 </ThemedTooltip>
 </a>
 </DropdownMenuItem>
 );
 })()}

 <DropdownMenuItem asChild>
 <a href={youtubeSearchUrl(problem.name)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-foreground">
 <Video className="size-3.5 text-destructive" />
 <ThemedTooltip hint={`view youtube solution video for ${problem.name}`}>
 <span>YouTube Solution Video</span>
 </ThemedTooltip>
 </a>
 </DropdownMenuItem>

 <DropdownMenuItem asChild>
 <a href={googleSearchUrl(problem.name)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-foreground">
 <Search className="size-3.5 text-primary" />
 <ThemedTooltip hint={`view google search results for ${problem.name} solution intuition explained`}>
 <span>Google Search Solution</span>
 </ThemedTooltip>
 </a>
 </DropdownMenuItem>

 <DropdownMenuItem asChild>
 <a href="https://www.codechef.com/ide" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-warning font-semibold">
 <Code2 className="size-3.5 text-warning" />
 <ThemedTooltip hint={`open CodeChef online IDE compiler for ${problem.name}`}>
 <span>CodeChef IDE Compiler 👨‍🍳</span>
 </ThemedTooltip>
 </a>
 </DropdownMenuItem>

 {hasSubmission && (
 <>
 <DropdownMenuSeparator />
 <DropdownMenuItem onSelect={() => setCodeModalOpen(true)} className="flex items-center gap-2 text-xs text-success font-semibold">
 <Code2 className="size-3.5 text-success" />
 <ThemedTooltip hint={`view or edit your code solution and keypoints for ${problem.name}`}>
 <span>View/Edit Submitted Code</span>
 </ThemedTooltip>
 </DropdownMenuItem>
 </>
 )}
 </DropdownMenuContent>
 </DropdownMenu>
 </div>

 <div className="flex min-w-0 flex-wrap items-center justify-end gap-1">
 <ThemedTooltip hint={hasSubmission ? "View or edit stored code solution" : "Submit code solution to mark completed"}>
 <button
 onClick={() => setCodeModalOpen(true)}
 className={cn(
 "inline-flex items-center gap-1 rounded-lg px-2 py-1 font-medium transition-colors text-xs",
 hasSubmission
 ? "bg-muted hover:bg-muted text-success border border-border"
 : "border border-border bg-muted hover:bg-white text-foreground hover:text-foreground"
 )}
 >
 <Code2 className="size-3.5" />
 <span>{hasSubmission ? "Code" : "Add Code"}</span>
 </button>
 </ThemedTooltip>

 <ThemedTooltip hint="Solve with Interactive ChatGPT DSA AI Tutor (give you problem statement and hints to complete)">
 <a
 href={getChatGPTAiPromptUrl(problem.name)}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-1 rounded-lg bg-muted hover:bg-muted border border-border text-success px-2.5 py-1 font-semibold transition-colors"
 >
 <span>Solve</span>
 <Sparkles className="size-3 text-success" />
 </a>
 </ThemedTooltip>
 </div>
 </div>
 </div>

 {/* Code Modal with submission mark logic */}
 <CodeModal
 open={codeModalOpen}
 onOpenChange={setCodeModalOpen}
 problemName={problem.name}
 existingSubmission={submission}
 onSave={async (code, link, keyPoints) => {
 await submitCode(problem.name, code, link, keyPoints, topic, dayNumber, section, problem.difficulty);
 // Mark completed automatically upon submitting code
 if (!problem.done && !readOnly) {
 onToggle();
 }
 }}
 onDelete={async () => {
 await removeCode(problem.name);
 if (problem.done && !readOnly) {
 onToggle();
 }
 }}
 readOnly={readOnly}
 />
 </>
 );
}

"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
 Sparkles,
 ChevronDown,
 ChevronUp,
 RotateCcw,
 UserPlus,
 HelpCircle,
 X,
 Trophy,
 Flame,
 CheckCircle2,
 ExternalLink,
 Code2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
 isGuestMode,
 isGuestGuidesVisible,
 setGuestGuidesVisible,
 resetGuestData,
 disableGuestMode,
} from "@/lib/guest-data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PageGuideInfo {
 title: string;
 badge: string;
 description: string;
 tips: string[];
}

const PAGE_GUIDES: Record<string, PageGuideInfo> = {
 "/today": {
 title: "Today's Workspace (Daily Mission)",
 badge: "Core Feature",
 description:
 "Your personalized daily headquarters. Every morning, DSA⁴⁰⁴ assigns 2–3 questions matched to your daily pace. In this 3★ coder demo, 2 problems are solved and 1 is ready for you to explore!",
 tips: [
 "Click the checkmark on Problem #3 to see your daily progress hit 100%.",
 "Tap 'Hints (AI)' to get instant step-by-step logic guidance without code spoilers.",
 "Use '👨‍🍳 CodeChef IDE' in the top bar to run and test code directly in your browser.",
 ],
 },
 "/problems": {
 title: "Curated Problem Library (830+ Questions)",
 badge: "Multi-Sheet Hub",
 description:
 "A searchable library combining Striver's A2Z, NeetCode 150, Love Babbar, and Core 404 sheets. Notice green badges indicating problems Alex has already solved.",
 tips: [
 "Filter by sheet (e.g. NeetCode 150 vs Core 404) or difficulty (Easy/Medium/Hard).",
 "Click the 'Code' icon next to any problem to inspect Alex's verified C++ & Python solutions.",
 "Filter by 'Completed' to review all solved questions with time complexities.",
 ],
 },
 "/topics": {
 title: "Pattern-First Curriculum (42 Core Topics)",
 badge: "Structured Learning",
 description:
 "Instead of memorizing hundreds of solutions, DSA⁴⁰⁴ organizes curriculum by reusable patterns (Sliding Window, Two Pointers, BFS/DFS, etc.).",
 tips: [
 "Expand any topic accordion to see subtopics and related problems.",
 "You can skip or customize individual topics if you've already mastered them.",
 "Alex has completed 45% of the curriculum up to Binary Trees & BST.",
 ],
 },
 "/weeks": {
 title: "17-Week Calendar Roadmap",
 badge: "Roadmap View",
 description:
 "A progressive day-by-day sequence. Past days (Days 1–45) are marked complete in green, Day 46 is today's active day, and future days show upcoming topics.",
 tips: [
 "Switch between 'Week', 'Month', or 'All' view using the top controls.",
 "Click on any day card to inspect its problems or jump to that day's workspace.",
 ],
 },
 "/progress": {
 title: "Consistency Analytics & Badges",
 badge: "Gamification",
 description:
 "Visualizes consistency, streak velocity, problem difficulty split, and weekly charts. Track your journey towards interview readiness.",
 tips: [
 "Alex is currently on an active 42-day problem-solving streak 🔥.",
 "Check out earned milestone badges and weekly velocity charts below.",
 ],
 },
 "/review": {
 title: "Review Bucket (Spaced Repetition)",
 badge: "Retention System",
 description:
 "Forgetting solved problems is common. Tap the bookmark icon on any problem in Today's Workspace to queue it here for quick revision before interviews.",
 tips: [
 "6 high-yield problems are currently flagged for Alex's weekend review.",
 "Reviewing marked problems helps transfer algorithms from short-term to long-term memory.",
 ],
 },
 "/backlog": {
 title: "Zero-Guilt Backlog Buffer",
 badge: "Stress-Free",
 description:
 "Life happens! If college exams or work interrupt your schedule, DSA⁴⁰⁴ moves unfinished problems here so your momentum stays intact.",
 tips: [
 "Click 'Add Revision Day' to insert a buffer day and catch up without breaking future plans.",
 "Never worry about missed days resetting your progress.",
 ],
 },
 "/contests": {
 title: "Contests Hub (LeetCode · CodeChef · Codeforces)",
 badge: "Competitive Hub",
 description:
 "Synchronized schedule of live and upcoming competitive programming contests across 5 major platforms in your local timezone.",
 tips: [
 "A 3★ coder regularly competes in LeetCode Biweekly/Weekly and CodeChef Starters.",
 "Set contest reminders to never miss an upcoming round.",
 ],
 },
 "/profile": {
 title: "Coder Portfolio (@alex_3star)",
 badge: "Public Profile",
 description:
 "Your unified developer portfolio. Live rating cards, submission heatmaps, connected GitHub repos, and verified problem archive in one shareable link.",
 tips: [
 "View Alex's 3★ CodeChef (1695 rating) and LeetCode Knight (1842 rating) credentials.",
 "Check the 120-day submission heatmap and verified code snapshots.",
 ],
 },
 "/settings": {
 title: "Plan Calibration & Settings",
 badge: "Customization",
 description:
 "Fine-tune your daily problem targets (1 to 5 per day), shift start dates, customize theme colors, and configure notifications.",
 tips: [
 "Alex's plan is set to 3 problems/day (Moderate pace).",
 "All settings modified in demo mode remain safely saved in your browser session.",
 ],
 },
};

export function DemoHelperBanner() {
 const router = useRouter();
 const pathname = usePathname();
 const [guidesOpen, setGuidesOpen] = useState(isGuestGuidesVisible);
 const [dismissed, setDismissed] = useState(false);

 // Only render if guest mode is active
 if (!isGuestMode() || dismissed) return null;

 // Find matching guide for active route
 const currentKey = Object.keys(PAGE_GUIDES).find((k) => pathname.startsWith(k)) || "/today";
 const guide = PAGE_GUIDES[currentKey];

 const handleToggleGuides = () => {
 const next = !guidesOpen;
 setGuidesOpen(next);
 setGuestGuidesVisible(next);
 };

 const handleReset = () => {
 resetGuestData();
 toast.success("Demo Data Reset! 🔄", {
 description: "Restored initial 3★ Coder account state.",
 });
 router.refresh();
 window.location.reload();
 };

 const handleExitDemo = () => {
 disableGuestMode();
 toast.info("Exited Demo Mode", {
 description: "You have returned to visitor mode.",
 });
 router.push("/");
 };

 return (
 <div className="mb-5 rounded-lg border border-border bg-primary /10 p-3.5 sm:p-4 shadow-sm transition-all">
 {/* Top Bar: Demo Mode Identity & Controls */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div className="flex items-center gap-2.5 flex-wrap min-w-0">
 <Badge className="bg-warning text-black hover:bg-warning font-bold text-xs gap-1 py-0.5 px-2 font-mono shrink-0 shadow-xs">
 <Sparkles className="size-3" />
 3★ Coder Demo Mode
 </Badge>
 <span className="font-mono text-xs font-semibold text-foreground truncate">
 @alex_3star
 </span>
 <span className="hidden md:inline text-foreground text-xs">·</span>
 <span className="hidden md:inline text-xs text-foreground truncate">
 348 Solved · 42d Streak 🔥 · LeetCode Knight (1842) · CodeChef 3★ (1695)
 </span>
 </div>

 {/* Action Buttons */}
 <div className="flex items-center gap-2 shrink-0 flex-wrap">
 <Button
 type="button"
 variant="outline"
 size="sm"
 onClick={handleToggleGuides}
 className="h-7 px-2.5 text-[11px] font-mono gap-1 border-border bg-background hover:bg-muted text-foreground cursor-pointer"
 >
 <HelpCircle className="size-3 text-warning" />
 <span>{guidesOpen ? "Hide Beginner Guide" : "Explain This Component"}</span>
 {guidesOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
 </Button>

 <Button
 type="button"
 variant="ghost"
 size="sm"
 onClick={handleReset}
 className="h-7 px-2 text-[11px] font-mono gap-1 text-foreground hover:text-foreground cursor-pointer"
 title="Reset demo data back to clean 3-star state"
 >
 <RotateCcw className="size-3" />
 <span className="hidden sm:inline">Reset</span>
 </Button>

 <Button
 asChild
 size="sm"
 className="h-7 px-2.5 text-[11px] font-mono font-bold bg-primary hover:bg-muted text-primary-foreground gap-1 cursor-pointer"
 >
 <Link href="/auth?mode=signup">
 <UserPlus className="size-3" />
 <span>Create My Own Account</span>
 </Link>
 </Button>

 <button
 type="button"
 onClick={handleExitDemo}
 className="size-7 flex items-center justify-center rounded-lg hover:bg-muted text-foreground hover:text-foreground transition-colors cursor-pointer"
 title="Exit Demo Mode"
 aria-label="Exit Demo"
 >
 <X className="size-3.5" />
 </button>
 </div>
 </div>

 {/* Expandable Beginner Guide Card for Naive Users */}
 {guidesOpen && guide && (
 <div className="mt-3.5 rounded-lg border border-border bg-background p-3.5 sm:p-4 text-xs space-y-2.5 animate-in fade-in-50 duration-200 shadow-sm">
 <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
 <div className="flex items-center gap-2 min-w-0">
 <span className="size-2 rounded-full bg-success animate-pulse shrink-0" />
 <h4 className="font-bold text-foreground text-xs sm:text-sm truncate">
 💡 Beginner Guide: {guide.title}
 </h4>
 </div>
 <Badge variant="outline" className="font-mono text-[10px] text-primary border-border shrink-0">
 {guide.badge}
 </Badge>
 </div>

 <p className="text-foreground text-xs leading-relaxed">
 {guide.description}
 </p>

 <div className="pt-1 space-y-1.5">
 <p className="font-semibold text-[11px] text-foreground font-mono uppercase tracking-wider">
 Quick things to try in this component:
 </p>
 <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-foreground">
 {guide.tips.map((tip, idx) => (
 <li key={idx} className="flex items-start gap-1.5">
 <CheckCircle2 className="size-3.5 text-success shrink-0 mt-0.5" />
 <span>{tip}</span>
 </li>
 ))}
 </ul>
 </div>
 </div>
 )}
 </div>
 );
}

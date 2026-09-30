const fs = require('fs');
const path = 'p:/DSA404-chatBot/app/page.tsx';

// We will construct the file in parts.
const imports = `"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "@/integrations/firebase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { enableGuestMode } from "@/lib/guest-data";
import { CORE_SECTIONS } from "@/lib/master-problems";
import { TOTAL_PROBLEMS } from "@/lib/plan";
import { ALL_PROBLEMS } from "@/lib/problems";
import {
  Code2, Sparkles, Trophy, Users, Search, ExternalLink, Zap, 
  Bot, Laptop, Globe, ArrowRight, ChevronDown, Play, 
  Clock, Flame, Menu, X, LayoutGrid, BarChart3, CheckCircle2,
  Calendar, FolderGit2, BookOpen, BrainCircuit
} from "lucide-react";
import { toast } from "sonner";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { InstallApkSection } from "@/components/InstallApkSection";
import { ChromeInstallModal } from "@/components/ChromeInstallModal";
import { DemoShell } from "@/components/demo/DemoShell";

// Icons
function ChromeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" />
      <line x1="21.17" y1="8" x2="12" y2="8" /><line x1="3.95" y1="6.06" x2="8.54" y2="14" />
      <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
    </svg>
  );
}

// Data
const REAL_SECTIONS_COUNT = CORE_SECTIONS.length;
const REAL_PATTERNS_COUNT = Array.from(new Set(CORE_SECTIONS.flatMap((s) => s.subtopics))).length;
const REAL_TOTAL_PROBLEMS = TOTAL_PROBLEMS;
const REAL_PRACTICE_PROBLEMS_COUNT = ALL_PROBLEMS.length - TOTAL_PROBLEMS;
const COMBINED_TOTAL_PROBLEMS = REAL_TOTAL_PROBLEMS + REAL_PRACTICE_PROBLEMS_COUNT;
`;

const components = `
// --- 1. Announcement Bar ---
function AnnouncementBar() {
  return (
    <div className="bg-primary text-primary-foreground py-2 text-center text-xs font-mono font-bold flex items-center justify-center gap-2">
      <Sparkles className="size-3.5" />
      <span>New: Try the complete platform instantly with Guest Mode!</span>
    </div>
  );
}

// --- 3. Hero Section ---
function HeroSection({ onEnterDemo }: { onEnterDemo: () => void }) {
  return (
    <section className="relative pt-20 pb-32 overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl aspect-square bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="mx-auto max-w-7xl px-4 relative z-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs text-primary font-mono font-bold mb-6">
          <Badge variant="secondary" className="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 mr-1 text-[10px]">DSA404 v2</Badge>
          <span>A complete, structured learning system</span>
        </div>

        <h1 className="font-display text-5xl md:text-7xl font-black tracking-tight leading-[1.1] text-foreground max-w-4xl mx-auto mb-6">
          Master Data Structures.<br/>
          <span className="text-primary">One focused session at a time.</span>
        </h1>
        
        <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10">
          Stop jumping between random problems. Get a personalized daily roadmap, learn the core patterns, and track your true problem-solving mastery.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg" className="h-14 px-8 text-base font-bold rounded-2xl w-full sm:w-auto">
            <Link href="/auth?mode=signup">
              Start Your Roadmap
              <ArrowRight className="size-5 ml-2" />
            </Link>
          </Button>
          <Button 
            onClick={onEnterDemo}
            variant="outline" 
            size="lg" 
            className="h-14 px-8 text-base font-bold rounded-2xl w-full sm:w-auto border-amber-500/30 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-2 shadow-sm"
          >
            <Sparkles className="size-5" />
            Try Live Demo
          </Button>
        </div>

        <p className="mt-6 text-sm text-muted-foreground font-mono">
          No credit card required. Over <b>{COMBINED_TOTAL_PROBLEMS}</b> curated problems.
        </p>
      </div>

      {/* Hero Visual - Layered App Mockup */}
      <div className="mx-auto max-w-6xl mt-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-20 pointer-events-none" />
        
        <div className="relative z-10 rounded-2xl md:rounded-[2rem] border border-border/50 bg-background shadow-2xl p-2 md:p-4 rotate-x-12 scale-100 overflow-hidden transform perspective-1000">
          <div className="rounded-xl md:rounded-2xl border border-border bg-card overflow-hidden grid grid-cols-1 md:grid-cols-12 h-[400px] md:h-[600px]">
            {/* Sidebar Mockup */}
            <div className="hidden md:block col-span-3 border-r border-border/60 bg-muted/10 p-4">
              <div className="flex items-center gap-2 mb-8">
                <div className="size-8 bg-primary rounded-lg" />
                <div className="h-4 w-24 bg-foreground/20 rounded" />
              </div>
              <div className="space-y-3">
                <div className="h-8 w-full bg-primary/10 rounded-md border border-primary/20 flex items-center px-3">
                   <div className="size-3 rounded-full bg-primary mr-2" />
                   <div className="h-2 w-16 bg-primary/40 rounded" />
                </div>
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-8 w-full hover:bg-muted rounded-md flex items-center px-3">
                    <div className="size-3 rounded-full bg-foreground/10 mr-2" />
                    <div className="h-2 w-20 bg-foreground/20 rounded" />
                  </div>
                ))}
              </div>
            </div>
            {/* Main Content Mockup */}
            <div className="col-span-1 md:col-span-9 p-6 md:p-8 bg-card flex flex-col">
              <div className="flex items-center justify-between mb-8">
                 <div className="h-8 w-48 bg-foreground/10 rounded-lg" />
                 <div className="size-8 rounded-full bg-foreground/10" />
              </div>
              <div className="h-40 w-full bg-primary/5 rounded-2xl border border-primary/20 mb-6 p-6 flex flex-col justify-end">
                <div className="h-4 w-24 bg-primary/40 rounded mb-2" />
                <div className="h-8 w-64 bg-primary/60 rounded" />
              </div>
              <div className="grid grid-cols-2 gap-4 flex-1">
                <div className="bg-muted/30 rounded-xl border border-border/50 p-4 space-y-3">
                   <div className="h-4 w-1/3 bg-foreground/20 rounded mb-4" />
                   {[1,2,3].map(i => (
                     <div key={i} className="h-12 w-full bg-background rounded-lg border border-border/50 flex items-center px-3 justify-between">
                       <div className="h-3 w-1/2 bg-foreground/30 rounded" />
                       <div className="size-4 rounded-sm bg-emerald-500/40" />
                     </div>
                   ))}
                </div>
                <div className="bg-muted/30 rounded-xl border border-border/50 p-4">
                   <div className="h-4 w-1/3 bg-foreground/20 rounded mb-4" />
                   <div className="h-full w-full bg-background rounded-lg border border-border/50 flex flex-col p-4 justify-between">
                     <div className="space-y-2">
                       <div className="h-2 w-full bg-foreground/10 rounded" />
                       <div className="h-2 w-4/5 bg-foreground/10 rounded" />
                       <div className="h-2 w-5/6 bg-foreground/10 rounded" />
                     </div>
                     <div className="h-8 w-full bg-primary/20 rounded-md" />
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// --- 4. Problem Statement ---
function ProblemStatement() {
  return (
    <section className="py-24 bg-muted/20 border-y border-border/50">
      <div className="mx-auto max-w-5xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <Badge variant="outline" className="font-mono text-xs text-destructive mb-4 border-destructive/30 bg-destructive/5">
              The Problem
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-6 leading-tight">
              Endless problem lists don't teach you how to think.
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Most students fail technical interviews not because they didn't solve enough problems, but because they solved them randomly. 
            </p>
            <ul className="space-y-4 font-medium text-sm">
              <li className="flex items-start gap-3">
                <X className="size-5 text-destructive shrink-0" />
                <span>You forget the logic of a problem a week after solving it.</span>
              </li>
              <li className="flex items-start gap-3">
                <X className="size-5 text-destructive shrink-0" />
                <span>You waste hours figuring out what topic to study next.</span>
              </li>
              <li className="flex items-start gap-3">
                <X className="size-5 text-destructive shrink-0" />
                <span>You lose consistency the moment your schedule gets busy.</span>
              </li>
            </ul>
          </div>
          <div className="relative">
            <div className="aspect-square rounded-3xl bg-card border border-border p-8 shadow-xl flex flex-col justify-center items-center text-center space-y-6 relative overflow-hidden">
               <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-destructive to-transparent" />
               <BrainCircuit className="size-16 text-destructive opacity-80" />
               <h3 className="font-display text-xl font-bold">The Cycle of Frustration</h3>
               <p className="text-sm text-muted-foreground">Random Practice → Forget Concepts → Feel Unprepared → Start Over</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// --- 5. Product Promise ---
function ProductPromise() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-4 text-center">
        <Badge variant="outline" className="font-mono text-xs text-primary mb-4 border-primary/30 bg-primary/5">
          The Solution
        </Badge>
        <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-6">
          A structured system that builds true mastery.
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-16">
          DSA⁴⁰⁴ replaces scattered practice with a directed, measurable journey. We tell you what to learn, when to practice it, and when to revise.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
               <Calendar className="size-5 text-emerald-500" />
            </div>
            <h3 className="font-bold mb-2">Daily Learning Plan</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">No more guessing. Open the app to a customized daily checklist of exactly which concepts and problems to tackle today.</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="size-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
               <LayoutGrid className="size-5 text-purple-500" />
            </div>
            <h3 className="font-bold mb-2">Pattern Recognition</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Study problems grouped by underlying patterns (like Sliding Window or DFS) to build a mental framework, not just rote memorization.</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
               <BarChart3 className="size-5 text-amber-500" />
            </div>
            <h3 className="font-bold mb-2">Measurable Progress</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Track exactly what percentage of the roadmap you've mastered, keep your streak alive, and automatically queue weak topics for review.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// --- 7. Core Features (Bento Grid) ---
function CoreFeaturesBento() {
  return (
    <section className="py-24 bg-muted/10 border-t border-border/50">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-4">Everything you need to succeed</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">A complete toolkit for the modern computer science student and interview candidate.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* AI Tutor */}
          <div className="md:col-span-8 bg-card border border-border rounded-3xl p-8 overflow-hidden relative shadow-sm group">
            <div className="relative z-10 w-full md:w-2/3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 font-mono text-xs font-bold mb-4">
                <Bot className="size-3.5" /> Socratic AI Tutor
              </div>
              <h3 className="text-2xl font-bold mb-3">Get unstuck without spoilers.</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                Our integrated AI doesn't just write the code for you. It explains concepts, provides incremental hints, analyzes time complexity, and helps you find the optimal approach yourself.
              </p>
            </div>
            {/* Visual */}
            <div className="absolute right-[-10%] bottom-[-20%] w-[60%] h-full bg-gradient-to-tl from-amber-500/20 to-transparent rounded-full blur-3xl" />
          </div>

          {/* Practice Library */}
          <div className="md:col-span-4 bg-card border border-border rounded-3xl p-8 shadow-sm">
             <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 font-mono text-xs font-bold mb-4">
                <Search className="size-3.5" /> Library
              </div>
              <h3 className="text-xl font-bold mb-3">{COMBINED_TOTAL_PROBLEMS} Problems</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Filter by pattern, difficulty, or platform. Includes Striver A2Z, NeetCode 150, and Core 404 sheets.
              </p>
          </div>

          {/* GitHub Sync */}
          <div className="md:col-span-4 bg-card border border-border rounded-3xl p-8 shadow-sm">
             <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-mono text-xs font-bold mb-4">
                <FolderGit2 className="size-3.5" /> Integration
              </div>
              <h3 className="text-xl font-bold mb-3">Auto-Sync to GitHub</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Build your portfolio automatically. Every accepted solution is pushed directly to your linked GitHub repository.
              </p>
          </div>

          {/* Progress Intelligence */}
          <div className="md:col-span-8 bg-card border border-border rounded-3xl p-8 overflow-hidden relative shadow-sm">
             <div className="relative z-10 w-full md:w-2/3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 font-mono text-xs font-bold mb-4">
                <Flame className="size-3.5" /> Analytics
              </div>
              <h3 className="text-2xl font-bold mb-3">Deep Progress Intelligence.</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                Visualize your solving velocity, topic mastery, and difficulty distribution. Let the system automatically queue up problems you flagged for review using spaced repetition principles.
              </p>
            </div>
             <div className="absolute right-[-10%] bottom-[-20%] w-[60%] h-full bg-gradient-to-tl from-purple-500/20 to-transparent rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}

// --- 9. Target User Section ---
function TargetUser() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <h2 className="font-display text-3xl font-bold mb-12">Who is DSA⁴⁰⁴ for?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
          <div className="p-6 rounded-2xl bg-card border border-border">
            <h3 className="font-bold text-lg mb-2">CS Students & Beginners</h3>
            <p className="text-sm text-muted-foreground">Stop feeling overwhelmed by LeetCode. Follow a clear path from arrays to advanced dynamic programming.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border">
            <h3 className="font-bold text-lg mb-2">Interview Candidates</h3>
            <p className="text-sm text-muted-foreground">Focus strictly on high-yield patterns (Two Pointers, Sliding Window, Trees) to prepare for FAANG interviews efficiently.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// --- 10. FAQ Section ---
function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const faqs = [
    { q: "Is this suitable for beginners?", a: "Yes. The roadmap starts from absolute basics and allows you to set a comfortable pace of 1-2 problems a day." },
    { q: "Do I need to pay?", a: "No. The core learning platform, daily planner, and problem tracking are completely free." },
    { q: "Can I try it without an account?", a: "Yes! Click 'Try Live Demo' to explore the full platform using a Guest account." },
    { q: "Does it support LeetCode and GFG?", a: "Absolutely. All curated problems link directly to the best platform to solve them, including LeetCode, GeeksforGeeks, and Codeforces." },
  ];

  return (
    <section className="py-24 bg-muted/10 border-t border-border/50" id="faq">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="font-display text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-card border border-border rounded-xl overflow-hidden">
              <button 
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full text-left px-6 py-4 font-bold flex justify-between items-center"
              >
                {faq.q}
                <ChevronDown className={cn("size-4 transition-transform", openIdx === idx && "rotate-180")} />
              </button>
              {openIdx === idx && (
                <div className="px-6 pb-4 text-sm text-muted-foreground">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- 12. Final CTA ---
function FinalCTA({ onEnterDemo }: { onEnterDemo: () => void }) {
  return (
    <section className="py-32 relative overflow-hidden">
       <div className="absolute inset-0 bg-primary/5" />
       <div className="mx-auto max-w-4xl px-4 text-center relative z-10">
         <h2 className="font-display text-4xl md:text-5xl font-black tracking-tight mb-6">
           Ready to master Data Structures?
         </h2>
         <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
           Join the structured learning platform that actually teaches you how to think.
         </p>
         <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg" className="h-14 px-8 text-base font-bold rounded-2xl w-full sm:w-auto">
            <Link href="/auth?mode=signup">
              Create Free Account
              <ArrowRight className="size-5 ml-2" />
            </Link>
          </Button>
          <Button 
            onClick={onEnterDemo}
            variant="outline" 
            size="lg" 
            className="h-14 px-8 text-base font-bold rounded-2xl w-full sm:w-auto bg-card"
          >
            Explore as Guest
          </Button>
        </div>
       </div>
    </section>
  );
}

`;

const footer = `
export default function LandingPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleEnterDemo = useCallback(() => {
    enableGuestMode();
    toast.success("Welcome to Demo Mode! 🎉", {
      description: "Directly logging into Alex Rivera's account...",
    });
    router.push("/today");
  }, [router]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      const searchParams = new URLSearchParams(window.location.search);
      const isClosedOnboarding = searchParams.get("onboarding") === "closed";
      if (u && !isClosedOnboarding) {
        router.replace("/today");
      }
    });
    return unsub;
  }, [router]);

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
      <AnnouncementBar />
      
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-primary flex items-center justify-center font-bold text-primary-foreground font-mono text-xs">
              404
            </div>
            <span className="font-display font-bold text-lg tracking-tight">DSA⁴⁰⁴</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted-foreground">
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
            <button onClick={handleEnterDemo} className="hover:text-foreground transition-colors">Demo</button>
            <Link href="/auth?mode=signin" className="hover:text-foreground transition-colors">Log In</Link>
          </nav>
          
          <div className="flex items-center gap-4">
             <Button asChild size="sm" className="hidden md:flex rounded-full px-5 font-bold">
               <Link href="/auth?mode=signup">Get Started</Link>
             </Button>
             <button className="md:hidden p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
               {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
             </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-card p-4 space-y-4">
          <button onClick={() => { setIsMobileMenuOpen(false); handleEnterDemo(); }} className="block w-full text-left font-bold text-lg">Demo</button>
          <Link href="/auth?mode=signin" className="block w-full text-left font-bold text-lg">Log In</Link>
          <Link href="/auth?mode=signup" className="block w-full text-left font-bold text-lg text-primary">Get Started</Link>
        </div>
      )}

      <main>
        <HeroSection onEnterDemo={handleEnterDemo} />
        <ProblemStatement />
        <ProductPromise />
        <CoreFeaturesBento />
        <TargetUser />
        <FAQ />
        <FinalCTA onEnterDemo={handleEnterDemo} />
      </main>

      <footer className="border-t border-border bg-card py-12 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} DSA⁴⁰⁴. All rights reserved.</p>
        <p className="mt-2">Created by <a href="https://pbmnaiduportfolio.vercel.app" className="font-bold hover:text-primary">Bhanu</a>.</p>
      </footer>
    </div>
  );
}
`;

fs.writeFileSync(path, imports + components + footer, 'utf8');
console.log("Landing page generated!");

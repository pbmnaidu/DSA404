"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { enableGuestMode } from "@/lib/guest-data";
import { CORE_SECTIONS } from "@/lib/master-problems";
import { TOTAL_PROBLEMS } from "@/lib/plan";
import { ALL_PROBLEMS } from "@/lib/problems";
import {
 Code2, Sparkles, Trophy, Users, Search, ExternalLink, Zap, Send,
 Bot, Laptop, Globe, ArrowRight, ChevronDown, Play, 
 Clock, Flame, Menu, X, LayoutGrid, BarChart3, CheckCircle2,
 Calendar, FolderGit2, BookOpen, BrainCircuit, Activity, LineChart, Code, CheckSquare, Sliders, History
} from "lucide-react";
import { User, Bell, Settings, Mail, Monitor, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { InstallApkSection } from "@/components/InstallApkSection";
import { ChromeInstallModal } from "@/components/ChromeInstallModal";
import { DemoShell } from "@/components/demo/DemoShell";
import { AnimatedHeroBackground } from "@/components/AnimatedHeroBackground";
import { DSA404Logo } from "@/components/DSA404Logo";
import { useThemeCustomizer } from "./theme-customizer-context";
import { useThemeCustomizer } from "./theme-customizer-context";

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

// Data constants
const REAL_SECTIONS_COUNT = CORE_SECTIONS.length;
const REAL_PATTERNS_COUNT = Array.from(new Set(CORE_SECTIONS.flatMap((s) => s.subtopics))).length;
const REAL_TOTAL_PROBLEMS = TOTAL_PROBLEMS;
const REAL_PRACTICE_PROBLEMS_COUNT = ALL_PROBLEMS.length - TOTAL_PROBLEMS;
const COMBINED_TOTAL_PROBLEMS = REAL_TOTAL_PROBLEMS + REAL_PRACTICE_PROBLEMS_COUNT;

// --- 1. Announcement Bar ---
function AnnouncementBar() {
 return (
 <div className="bg-primary text-primary-foreground py-2.5 text-center text-[11px] sm:text-xs font-mono font-bold flex items-center justify-center gap-2">
 <Sparkles className="size-3.5 hidden sm:block" />
 <span>New: The complete DSA learning platform is live. Try it instantly with Guest Mode!</span>
 </div>
 );
}

// --- 3. Hero Section ---
function HeroSection({ onEnterDemo }: { onEnterDemo: () => void }) {
 const containerRef = useRef<HTMLElement>(null);
 
 useEffect(() => {
   const handleMouseMove = (e: MouseEvent) => {
     if (!containerRef.current) return;
     const x = (e.clientX / window.innerWidth) * 2 - 1;
     const y = (e.clientY / window.innerHeight) * 2 - 1;
     containerRef.current.style.setProperty('--mouse-x', x.toString());
     containerRef.current.style.setProperty('--mouse-y', y.toString());
   };
   window.addEventListener('mousemove', handleMouseMove);
   return () => window.removeEventListener('mousemove', handleMouseMove);
 }, []);

 const ParallaxWrapper = ({ depth, children, className = '' }: { depth: number, children: React.ReactNode, className?: string }) => (
   <div 
     className={`absolute inset-0 pointer-events-none transition-transform duration-75 ease-out ${className}`} 
     style={{ transform: `translate(calc(var(--mouse-x, 0) * ${depth}px), calc(var(--mouse-y, 0) * ${depth}px))` }}
   >
     {children}
   </div>
 );

 return (
 <section ref={containerRef} className="relative pt-16 pb-24 md:pt-24 md:pb-32 overflow-hidden">
 <AnimatedHeroBackground />

 {/* Reference-inspired floating learning objects. They are decorative on desktop
     and collapse away on mobile so the hero copy remains the priority. */}
 <ParallaxWrapper depth={10}>
   <div className="hero-float-card hero-float-card--progress pointer-events-auto" aria-hidden="true">
   <p className="hero-float-card__eyebrow">Your Progress</p>
   <div className="hero-progress-ring"><span>73%</span></div>
   <div className="hero-mini-bars"><i /><i /><i /></div>
 </div>
 </ParallaxWrapper>
 <ParallaxWrapper depth={25}>
   <div className="hero-float-card hero-float-card--topics pointer-events-auto" aria-hidden="true">
   {[["Arrays", "24/24", "success"], ["Hashing", "18/18", "accent"], ["Two Pointers", "12/24", "info"], ["Dynamic Programming", "4/32", "warning"]].map(([label, count, tone]) => (
     <div className="hero-topic-row" key={label}>
       <span className={`hero-topic-dot hero-topic-dot--${tone}`}><CheckCircle2 /></span>
       <span>{label}</span><b>{count}</b>
     </div>
   ))}
 </div>
 </ParallaxWrapper>
 <ParallaxWrapper depth={15}>
   <div className="hero-float-card hero-float-card--editor pointer-events-auto" aria-hidden="true">
   <div className="hero-editor-bar"><span /><span /><span /><em>&lt;/&gt;</em></div>
   <pre><code><strong>class Solution</strong> {'{'}{`\n  public int solve() {\n    // Your code here\n    return 0;\n  }\n`}{'}'}</code></pre>
   </div>
 </ParallaxWrapper>
 <ParallaxWrapper depth={35}>
   <div className="hero-plane pointer-events-auto" aria-hidden="true"><Send /></div>
 </ParallaxWrapper>
 <ParallaxWrapper depth={20}>
   <div className="hero-float-card hero-float-card--streak pointer-events-auto" aria-hidden="true">
   <div className="hero-streak-icon"><Flame /></div>
   <div><p>Daily Streak</p><strong>12</strong><small>days</small></div>
   <div className="hero-mini-bars hero-mini-bars--streak"><i /><i /><i /><i /></div>
   </div>
 </ParallaxWrapper>
 
 <div className="mx-auto max-w-7xl px-4 relative z-10 text-center flex flex-col items-center">
 <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-xs text-primary font-mono font-bold mb-8">
 <Badge variant="secondary" className="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px]">DSA404</Badge>
 <span>A complete, structured learning system</span>
 </div>

 <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] text-foreground max-w-4xl mb-6 relative z-10">
 Build the DSA skills you need.<br/>
 <span className="bg-gradient-to-r from-[var(--gradient-start)] via-[var(--gradient-mid)] to-[var(--gradient-end)] bg-clip-text text-transparent transition-colors duration-500 relative z-10 inline-block drop-shadow-[0_4px_10px_var(--glow-soft)]">One focused session at a time.</span>
 </h1>
 
 <p className="text-base sm:text-lg md:text-xl text-foreground leading-relaxed max-w-2xl mb-10">
 Stop jumping between random coding problems. DSA⁴⁰⁴ gives you a personalized daily roadmap, pattern-based learning, and true progress tracking.
 </p>

 <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto relative z-10">
 <Button asChild size="lg" className="h-14 px-8 text-sm sm:text-base font-bold rounded-lg w-full sm:w-auto bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)] shadow-[0_10px_30px_var(--glow-soft)] hover:shadow-[0_10px_40px_var(--glow-strong)] transition-all duration-400 ease-in-out hover:-translate-y-0.5 border-none">
 <Link href="/auth?mode=signup">
 Start Learning Free
 <ArrowRight className="size-4 ml-2" />
 </Link>
 </Button>
 <Button 
 onClick={onEnterDemo}
 variant="outline" 
 size="lg" 
 className="h-14 px-8 text-sm sm:text-base font-bold rounded-lg w-full sm:w-auto border-border hover:bg-muted text-primary gap-2"
 >
 <Play className="size-4 fill-current" />
 Try as Guest
 </Button>
 </div>

 <div className="mt-8 flex items-center justify-center gap-6 text-xs font-mono text-foreground font-medium">
 <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-success" /> {COMBINED_TOTAL_PROBLEMS} Problems</span>
 <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-success" /> {REAL_PATTERNS_COUNT} Patterns</span>
 <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-success" /> AI Tutor</span>
 </div>
 </div>

 {/* Hero Visual - Layered App Mockup */}
 <div className="mx-auto max-w-6xl mt-16 md:mt-24 px-4 relative">
 <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-20 pointer-events-none" />
 <div className="relative z-10 rounded-lg md:rounded-[2rem] border border-border bg-background shadow-sm p-2 md:p-4 rotate-x-12 scale-100 overflow-hidden transform perspective-1000 origin-top animate-fade-in [animation-duration:1.5s]">
 {/* Product preview: keep the hero visual readable and useful instead of showing empty skeleton bars. */}
 <div className="rounded-lg md:rounded-lg border border-border bg-card overflow-hidden grid grid-cols-1 md:grid-cols-12 h-[300px] sm:h-[400px] md:h-[600px]">
 {/* Sidebar */}
 <div className="hidden md:flex md:col-span-3 flex-col border-r border-border bg-muted p-5">
 <div className="flex items-center gap-2.5 mb-8">
 <div className="size-9 bg-primary rounded-lg flex items-center justify-center shadow-sm"><Code className="size-4 text-primary-foreground" /></div>
 <div>
 <p className="text-sm font-black tracking-tight text-foreground">DSA⁴⁰⁴</p>
 <p className="text-[10px] text-foreground">Your coding system</p>
 </div>
 </div>
 <div className="space-y-1.5 text-xs font-medium">
 <div className="flex items-center gap-2.5 rounded-lg bg-muted border border-border px-3 py-2.5 text-primary">
 <Sparkles className="size-3.5" />
 <span>Today</span>
 </div>
 {[
 { icon: Calendar, label: "Plan & Calendar" },
 { icon: LayoutGrid, label: "Problem Library" },
 { icon: BarChart3, label: "Progress" },
 { icon: Trophy, label: "Contests" },
 ].map(({ icon: Icon, label }) => (
 <div key={label} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-foreground">
 <Icon className="size-3.5" />
 <span>{label}</span>
 </div>
 ))}
 </div>
 <div className="mt-auto rounded-lg border border-border bg-card p-3">
 <div className="flex items-center justify-between text-[10px] font-semibold">
 <span className="text-foreground">Plan progress</span>
 <span className="text-primary">18%</span>
 </div>
 <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
 <div className="h-full w-[18%] rounded-full bg-primary" />
 </div>
 <p className="mt-2 text-[10px] text-foreground">Day 22 of 120</p>
 </div>
 </div>
 {/* Main Area */}
 <div className="col-span-1 md:col-span-9 p-4 sm:p-6 md:p-8 bg-card flex flex-col">
 <div className="flex items-start justify-between gap-4 mb-6">
 <div>
 <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Wednesday · Day 22</p>
 <h3 className="mt-1 text-xl md:text-2xl font-black tracking-tight text-foreground">Today's Mission</h3>
 <p className="mt-1 text-xs text-foreground">Build confidence with one focused session.</p>
 </div>
 <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-bold text-foreground">BP</div>
 </div>
 {/* Today's Mission Mockup */}
 <div className="h-32 md:h-40 w-full bg-muted rounded-lg border border-border mb-6 p-4 md:p-6 flex flex-col justify-between">
 <div className="flex items-center justify-between gap-3">
 <div className="flex items-center gap-2 text-xs font-bold text-primary">
 <span className="size-2 rounded-full bg-primary animate-pulse" />
 Current topic
 </div>
 <span className="rounded-full bg-accent px-2 py-1 text-[10px] font-bold text-success">2 / 4 complete</span>
 </div>
 <div>
 <p className="text-lg md:text-2xl font-black tracking-tight text-foreground">Arrays &amp; Hashing</p>
 <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
 <div className="h-full w-1/2 rounded-full bg-primary" />
 </div>
 </div>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
 <div className="bg-muted rounded-lg border border-border p-4 space-y-3 hidden sm:block">
 <div className="mb-4 flex items-center justify-between">
 <p className="text-xs font-bold text-foreground">Daily problem list</p>
 <span className="text-[10px] text-foreground">3 problems</span>
 </div>
 {[
 ["Two Sum", "Easy", true],
 ["Valid Anagram", "Easy", true],
 ["Group Anagrams", "Medium", false],
 ].map(([title, difficulty, done]) => (
 <div key={title as string} className="flex min-h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
 <CheckCircle2 className={cn("size-4 shrink-0", done ? "text-success" : "text-foreground")} />
 <div className="min-w-0 flex-1">
 <p className={cn("truncate text-[11px] font-semibold", done && "text-foreground line-through")}>{title}</p>
 <p className="text-[10px] text-foreground">{difficulty}</p>
 </div>
 <span className={cn("size-2 rounded-full", done ? "bg-success" : "bg-muted-foreground/25")} />
 </div>
 ))}
 </div>
 <div className="bg-muted rounded-lg border border-border p-4">
 <p className="mb-4 text-xs font-bold text-foreground">Your momentum</p>
 <div className="h-full w-full bg-background rounded-lg border border-border flex flex-col p-4 justify-between min-h-[120px]">
 <div>
 <div className="flex items-end justify-between">
 <span className="text-3xl font-black text-foreground">7</span>
 <span className="text-[10px] font-bold text-warning">day streak</span>
 </div>
 <div className="mt-4 flex h-12 items-end gap-1.5">
 {[35, 52, 42, 68, 58, 82, 100].map((height, index) => (
 <div key={index} className="flex-1 rounded-t bg-muted" style={{ height: `${height}%` }}>
 <div className="h-full rounded-t bg-primary" style={{ opacity: 0.35 + index * 0.08 }} />
 </div>
 ))}
 </div>
 </div>
 <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[10px] text-foreground">
 <span>12 solved this week</span>
 <Activity className="size-3.5 text-primary" />
 </div>
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
 <section className="py-20 md:py-28 bg-muted border-y border-border">
 <div className="mx-auto max-w-5xl px-4">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
 <div>
 <Badge variant="outline" className="font-mono text-[10px] md:text-xs text-destructive mb-4 md:mb-6 border-border bg-muted uppercase tracking-wider">
 The Problem
 </Badge>
 <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 md:mb-6 leading-tight">
 Endless problem lists don't teach you how to think.
 </h2>
 <p className="text-sm md:text-base text-foreground leading-relaxed mb-6 md:mb-8">
 Most students fail technical interviews not because they didn't solve enough problems, but because they practiced them randomly across disconnected platforms.
 </p>
 <ul className="space-y-3 md:space-y-4 font-medium text-xs md:text-sm">
 <li className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border shadow-sm">
 <X className="size-4 md:size-5 text-destructive shrink-0 mt-0.5" />
 <span><strong>No clear path:</strong> You don't know what topic to study next.</span>
 </li>
 <li className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border shadow-sm">
 <X className="size-4 md:size-5 text-destructive shrink-0 mt-0.5" />
 <span><strong>Memory fading:</strong> You forget previously studied patterns.</span>
 </li>
 <li className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border shadow-sm">
 <X className="size-4 md:size-5 text-destructive shrink-0 mt-0.5" />
 <span><strong>Lost consistency:</strong> You miss a day and give up completely.</span>
 </li>
 </ul>
 </div>
 <div className="relative">
 <div className="aspect-square rounded-[2rem] bg-card border border-border p-6 md:p-8 shadow-sm flex flex-col justify-center items-center text-center space-y-4 md:space-y-6 relative overflow-hidden">
 <div className="absolute inset-0  bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
 <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))]  " />
 <BrainCircuit className="size-12 md:size-16 text-destructive " />
 <h3 className="font-display text-lg md:text-xl font-bold">The Cycle of Frustration</h3>
 <div className="space-y-2 text-xs md:text-sm text-foreground font-mono">
 <p className="px-3 py-1.5 border border-border rounded bg-background">1. Random Practice</p>
 <p className="px-3 py-1.5 border border-border rounded bg-background">2. Forget Concepts</p>
 <p className="px-3 py-1.5 border border-border rounded bg-background">3. Unclear Progress</p>
 <p className="px-3 py-1.5 border border-border rounded bg-background">4. Start Over</p>
 </div>
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
 <section className="py-20 md:py-28">
 <div className="mx-auto max-w-5xl px-4 text-center">
 <Badge variant="outline" className="font-mono text-[10px] md:text-xs text-primary mb-4 md:mb-6 border-border bg-muted uppercase tracking-wider">
 The Solution
 </Badge>
 <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4 md:mb-6">
 A structured system that builds true mastery.
 </h2>
 <p className="text-base md:text-lg text-foreground max-w-2xl mx-auto mb-12 md:mb-16 leading-relaxed">
 DSA⁴⁰⁴ turns scattered DSA preparation into a structured, measurable learning journey. We tell you what to learn, what to practice, and what to revise.
 </p>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 text-left">
 {/* Before */}
 <div className="p-6 md:p-8 rounded-[2rem] border border-border bg-card shadow-sm">
 <div className="flex items-center gap-2 mb-6 text-foreground">
 <X className="size-5 text-destructive" />
 <h3 className="font-display font-bold text-lg">Before DSA⁴⁰⁴</h3>
 </div>
 <ul className="space-y-4 text-sm font-medium">
 <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" /> Random practice</li>
 <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" /> No clear roadmap</li>
 <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" /> Forgotten concepts</li>
 <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" /> Unclear progress</li>
 </ul>
 </div>
 {/* After */}
 <div className="p-6 md:p-8 rounded-[2rem] border border-border bg-muted shadow-sm relative overflow-hidden">
 <div className="absolute top-0 right-0 p-8 pointer-events-none">
 <Sparkles className="size-24 text-primary" />
 </div>
 <div className="flex items-center gap-2 mb-6 text-foreground relative z-10">
 <CheckCircle2 className="size-5 text-primary" />
 <h3 className="font-display font-bold text-lg">With DSA⁴⁰⁴</h3>
 </div>
 <ul className="space-y-4 text-sm font-medium relative z-10">
 <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Structured daily plan</li>
 <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Topic-based curriculum</li>
 <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Automated review queue</li>
 <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Measurable learning habit</li>
 </ul>
 </div>
 </div>
 </div>
 </section>
 );
}

// --- 6. Product Walkthrough ---
function ProductWalkthrough() {
 const steps = [
 {
 num: "01",
 title: "Get a personalized plan",
 desc: "Choose your experience level and goal. Set your pace (e.g., 2 or 3 problems a day).",
 icon: Sliders
 },
 {
 num: "02",
 title: "Learn in the correct sequence",
 desc: "The roadmap guides you from Arrays to Dynamic Programming without skipping fundamentals.",
 icon: LayoutGrid
 },
 {
 num: "03",
 title: "Solve and track",
 desc: "Open your daily workspace, solve curated problems, and check them off your list.",
 icon: Code2
 },
 {
 num: "04",
 title: "Review weak areas",
 desc: "Problems you flag are added to a review queue to ensure you actually retain the patterns.",
 icon: History
 }
 ];

 return (
 <section className="py-20 md:py-28 bg-muted border-y border-border">
 <div className="mx-auto max-w-6xl px-4">
 <div className="text-center mb-16">
 <Badge variant="outline" className="font-mono text-[10px] md:text-xs text-primary mb-4 border-border bg-muted uppercase tracking-wider">
 How it works
 </Badge>
 <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Four steps to consistency</h2>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
 {steps.map((step) => (
 <div key={step.num} className="bg-card border border-border rounded-lg p-6 shadow-sm relative group hover:border-border transition-colors">
 <div className="absolute top-4 right-4 text-4xl font-black text-foreground group-hover:text-primary transition-colors font-mono">
 {step.num}
 </div>
 <div className="size-10 rounded-lg bg-muted flex items-center justify-center mb-6 text-primary">
 <step.icon className="size-5" />
 </div>
 <h3 className="font-bold text-lg mb-2 text-foreground">{step.title}</h3>
 <p className="text-sm text-foreground leading-relaxed">{step.desc}</p>
 </div>
 ))}
 </div>
 </div>
 </section>
 );
}

// --- 7. Core Features Bento ---
function CoreFeaturesBento() {
 return (
 <section className="py-20 md:py-28">
 <div className="mx-auto max-w-6xl px-4">
 <div className="text-center mb-16">
 <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-4">Everything you need to succeed</h2>
 <p className="text-foreground max-w-2xl mx-auto text-sm md:text-base">A complete toolkit for the modern computer science student and interview candidate.</p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
 {/* Structured Roadmap */}
 <div className="md:col-span-8 bg-card border border-border rounded-[2rem] p-6 md:p-8 shadow-sm">
 <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-success font-mono text-[10px] md:text-xs font-bold mb-4 uppercase tracking-wider">
 <LayoutGrid className="size-3.5" /> Structured Roadmap
 </div>
 <h3 className="text-xl md:text-2xl font-bold mb-3">Beginner-to-advanced progression.</h3>
 <p className="text-foreground text-sm leading-relaxed max-w-lg">
 Follow a meticulously designed topic order that builds dependencies correctly. Understand Hashing before Two Pointers, and Trees before Graphs.
 </p>
 </div>

 {/* Daily Workspace */}
 <div className="md:col-span-4 bg-card border border-border rounded-[2rem] p-6 md:p-8 shadow-sm">
 <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-info font-mono text-[10px] md:text-xs font-bold mb-4 uppercase tracking-wider">
 <Calendar className="size-3.5" /> Daily Workspace
 </div>
 <h3 className="text-lg md:text-xl font-bold mb-3">Today's Mission</h3>
 <p className="text-foreground text-sm leading-relaxed">
 Open the app and see exactly what to do today: current topic, problem checklist, and your active streak.
 </p>
 </div>

 {/* AI Tutor */}
 <div className="md:col-span-4 bg-card border border-border rounded-[2rem] p-6 md:p-8 shadow-sm overflow-hidden relative">
 <div className="relative z-10">
 <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-warning font-mono text-[10px] md:text-xs font-bold mb-4 uppercase tracking-wider">
 <Bot className="size-3.5" /> AI Tutor
 </div>
 <h3 className="text-lg md:text-xl font-bold mb-3">Socratic guidance.</h3>
 <p className="text-foreground text-sm leading-relaxed mb-4">
 Get hints, review approaches, and explain mistakes without revealing the full code.
 </p>
 </div>
 <div className="absolute right-[-20%] bottom-[-20%] w-[80%] h-[80%] bg-muted rounded-full blur-3xl pointer-events-none" />
 </div>

 {/* Progress Intelligence */}
 <div className="md:col-span-4 bg-card border border-border rounded-[2rem] p-6 md:p-8 shadow-sm">
 <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-primary font-mono text-[10px] md:text-xs font-bold mb-4 uppercase tracking-wider">
 <BarChart3 className="size-3.5" /> Progress Intelligence
 </div>
 <h3 className="text-lg md:text-xl font-bold mb-3">Track real mastery.</h3>
 <p className="text-foreground text-sm leading-relaxed">
 Visualize completion trends, topic strengths, streaks, and upcoming milestones.
 </p>
 </div>

 {/* Practice System & Editor */}
 <div className="md:col-span-4 bg-card border border-border rounded-[2rem] p-6 md:p-8 shadow-sm">
 <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-accent-foreground font-mono text-[10px] md:text-xs font-bold mb-4 uppercase tracking-wider">
 <Code className="size-3.5" /> Coding Workspace
 </div>
 <h3 className="text-lg md:text-xl font-bold mb-3">Integrated Editor.</h3>
 <p className="text-foreground text-sm leading-relaxed">
 Filter problems, write code, run test cases, and save notes directly within the platform.
 </p>
 </div>

 {/* User Profiles */}
 <div className="md:col-span-4 bg-card border border-border rounded-[2rem] p-6 md:p-8 shadow-sm">
 <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-success font-mono text-[10px] md:text-xs font-bold mb-4 uppercase tracking-wider">
 <User className="size-3.5" /> User Profiles
 </div>
 <h3 className="text-lg md:text-xl font-bold mb-3">Public Portfolio.</h3>
 <p className="text-foreground text-sm leading-relaxed">
 Showcase your consistency with GitHub-style heatmaps and share your DSA progress publicly.
 </p>
 </div>

 {/* Messages & Push */}
 <div className="md:col-span-4 bg-card border border-border rounded-[2rem] p-6 md:p-8 shadow-sm">
 <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-warning font-mono text-[10px] md:text-xs font-bold mb-4 uppercase tracking-wider">
 <Bell className="size-3.5" /> Notifications
 </div>
 <h3 className="text-lg md:text-xl font-bold mb-3">Stay Consistent.</h3>
 <p className="text-foreground text-sm leading-relaxed">
 Never miss a day with web push notifications, platform announcements, and daily email reminders.
 </p>
 </div>

 {/* Settings & Customization */}
 <div className="md:col-span-4 bg-card border border-border rounded-[2rem] p-6 md:p-8 shadow-sm">
 <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-foreground font-mono text-[10px] md:text-xs font-bold mb-4 uppercase tracking-wider">
 <Settings className="size-3.5" /> Settings
 </div>
 <h3 className="text-lg md:text-xl font-bold mb-3">Your Environment.</h3>
 <p className="text-foreground text-sm leading-relaxed">
 Connect Codeforces, LeetCode, and personalize your sync preferences and notification schedules.
 </p>
 </div>

  {/* Global Contests */}
  <div className="md:col-span-4 bg-card border border-border rounded-[2rem] p-6 md:p-8 shadow-sm">
  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-primary font-mono text-[10px] md:text-xs font-bold mb-4 uppercase tracking-wider">
  <Trophy className="size-3.5" /> Global Contests
  </div>
  <h3 className="text-lg md:text-xl font-bold mb-3">Sync Competitions.</h3>
  <p className="text-foreground text-sm leading-relaxed">
  Automatically track and sync upcoming coding competitions from LeetCode, Codeforces, CodeChef, and AtCoder in one unified calendar.
  </p>
  </div>

  {/* Backlog Manager */}
  <div className="md:col-span-4 bg-card border border-border rounded-[2rem] p-6 md:p-8 shadow-sm">
  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-warning font-mono text-[10px] md:text-xs font-bold mb-4 uppercase tracking-wider">
  <History className="size-3.5" /> Backlog Manager
  </div>
  <h3 className="text-lg md:text-xl font-bold mb-3">Guilt-Free Catch-Up.</h3>
  <p className="text-foreground text-sm leading-relaxed">
  Missed a day? Our dedicated backlog system safely queues missed problems and allows you to seamlessly shift your entire schedule forward.
  </p>
  </div>

  {/* PWA App */}
  <div className="md:col-span-4 bg-card border border-border rounded-[2rem] p-6 md:p-8 shadow-sm">
  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-success font-mono text-[10px] md:text-xs font-bold mb-4 uppercase tracking-wider">
  <Laptop className="size-3.5" /> Native Experience
  </div>
  <h3 className="text-lg md:text-xl font-bold mb-3">Install Anywhere.</h3>
  <p className="text-foreground text-sm leading-relaxed">
  Install DSA⁴⁰⁴ as a native progressive web app on your desktop or mobile device. Complete with Android APK support.
  </p>
  </div>


 </div>
  </div>
  </section>
  );
}

// --- 8. Product Preview Section ---
function ProductPreview() {
 return (
 <section className="py-20 md:py-32 bg-card border-y border-border overflow-hidden">
 <div className="mx-auto max-w-7xl px-4 text-center">
 <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-12">A unified learning environment</h2>
 
 {/* Large Coordinated UI Mockup */}
 <div className="relative rounded-[2rem] border border-border bg-background shadow-sm p-4 md:p-8 mx-auto max-w-5xl">
 <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
 <div className="flex gap-2">
 <div className="size-3 rounded-full bg-muted" />
 <div className="size-3 rounded-full bg-muted" />
 <div className="size-3 rounded-full bg-muted" />
 </div>
 <div className="flex gap-4 font-mono text-xs font-bold text-foreground">
 <span className="text-primary border-b-2 border-primary pb-4 -mb-4">Today's Mission</span>
 <span className="hidden sm:inline">Roadmap</span>
 <span className="hidden sm:inline">Progress</span>
 </div>
 <div className="size-6 rounded-full bg-muted" />
 </div>

 <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
 <div className="md:col-span-8 space-y-6">
 <div className="bg-muted rounded-lg border border-border p-6">
 <h3 className="font-display font-bold text-2xl mb-1">Sliding Window</h3>
 <p className="text-foreground text-sm mb-4">Day 14 • 3 Problems • Medium Difficulty</p>
 <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
 <div className="w-2/3 h-full bg-primary rounded-full" />
 </div>
 </div>
 <div className="space-y-3">
 {[1,2].map(i => (
 <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
 <div className="flex items-center gap-3">
 <CheckSquare className="size-5 text-success" />
 <span className="font-medium text-sm">Longest Substring Without Repeating</span>
 </div>
 <Badge variant="outline" className="text-[10px] font-mono">Medium</Badge>
 </div>
 ))}
 <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted ring-1 ring-primary/20">
 <div className="flex items-center gap-3">
 <div className="size-5 rounded border border-border flex items-center justify-center"><div className="size-2 bg-primary rounded-lg" /></div>
 <span className="font-bold text-sm">Minimum Window Substring</span>
 </div>
 <Badge variant="secondary" className="bg-muted text-destructive text-[10px] font-mono">Hard</Badge>
 </div>
 </div>
 </div>
 <div className="md:col-span-4 space-y-6">
 <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
 <h4 className="font-bold text-sm mb-4 flex items-center gap-2"><Flame className="size-4 text-warning" /> 14 Day Streak</h4>
 <div className="grid grid-cols-7 gap-1">
 {Array.from({length: 28}).map((_, i) => (
 <div key={i} className={cn("aspect-square rounded-lg", [1, 2, 3, 4, 6, 8, 9, 10, 11, 13, 14, 15, 17, 18, 19, 21, 22, 23, 24, 25, 26, 27].includes(i) ? "bg-muted" : "bg-muted")} />
 ))}
 </div>
 </div>
 <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
 <h4 className="font-bold text-sm mb-4">Topic Mastery</h4>
 <div className="space-y-3">
 <div>
 <div className="flex justify-between text-xs mb-1"><span className="text-foreground">Arrays</span><span>100%</span></div>
 <div className="h-1.5 w-full bg-muted rounded-full"><div className="w-full h-full bg-success rounded-full"/></div>
 </div>
 <div>
 <div className="flex justify-between text-xs mb-1"><span className="text-foreground">Two Pointers</span><span>80%</span></div>
 <div className="h-1.5 w-full bg-muted rounded-full"><div className="w-4/5 h-full bg-primary rounded-full"/></div>
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

// --- 9. Learning Journey Section ---
function LearningJourney() {
 const journey = [
 { name: "Foundations & Arrays", color: "bg-info" },
 { name: "Two Pointers & Sliding Window", color: "bg-primary" },
 { name: "Linked Lists & Stacks", color: "bg-primary" },
 { name: "Trees & Binary Search", color: "bg-primary" },
 { name: "Graphs & Networks", color: "bg-destructive" },
 { name: "Dynamic Programming", color: "bg-warning" },
 { name: "Advanced Patterns & Contests", color: "bg-success" },
 ];

 return (
 <section className="py-20 md:py-28">
 <div className="mx-auto max-w-4xl px-4 text-center">
 <Badge variant="outline" className="font-mono text-[10px] md:text-xs text-primary mb-6 border-border bg-muted uppercase tracking-wider">
 The Roadmap
 </Badge>
 <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-12">A proven path from zero to interview-ready.</h2>
 
 <div className="relative">
 {/* Vertical Line */}
 <div className="absolute left-[15px] sm:left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2" />
 
 <div className="space-y-8 relative">
 {journey.map((step, idx) => (
 <div key={idx} className={cn("flex flex-col sm:flex-row items-start sm:items-center gap-6", idx % 2 === 0 ? "sm:flex-row-reverse" : "")}>
 <div className={cn("flex-1 text-left", idx % 2 === 0 ? "sm:text-left" : "sm:text-right")}>
 <div className="bg-card border border-border p-4 rounded-lg shadow-sm inline-block">
 <h4 className="font-bold text-sm md:text-base">{step.name}</h4>
 </div>
 </div>
 <div className={cn("size-8 rounded-full border-4 border-background z-10 shrink-0", step.color)} />
 <div className="flex-1 hidden sm:block" />
 </div>
 ))}
 </div>
 </div>
 </div>
 </section>
 );
}

// --- 10. Trust & Credibility ---
function TrustSection() {
 return (
 <section className="py-16 bg-muted border-y border-border">
 <div className="mx-auto max-w-5xl px-4 text-center">
 <p className="text-sm font-mono font-bold text-foreground uppercase tracking-wider mb-8">Comprehensive Platform Integration</p>
 <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 grayscale hover:grayscale-0 transition-all">
 <div className="flex items-center gap-2 font-bold text-lg"><Code2 className="size-5" /> LeetCode</div>
 <div className="flex items-center gap-2 font-bold text-lg"><Globe className="size-5" /> GeeksforGeeks</div>
 <div className="flex items-center gap-2 font-bold text-lg"><FolderGit2 className="size-5" /> GitHub</div>
 <div className="flex items-center gap-2 font-bold text-lg"><Trophy className="size-5" /> Codeforces</div>
 </div>
 <div className="mt-12 flex justify-center">
 <Badge variant="outline" className="font-mono text-xs">Based on {REAL_SECTIONS_COUNT} Core Curated Sections</Badge>
 </div>
 </div>
 </section>
 );
}

// --- 11. Target User Section ---
function TargetUser() {
 return (
 <section className="py-20 md:py-28">
 <div className="mx-auto max-w-5xl px-4">
 <h2 className="font-display text-3xl md:text-4xl font-bold mb-12 text-center tracking-tight">Who should use DSA⁴⁰⁴?</h2>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
 <div className="p-6 md:p-8 rounded-[2rem] bg-card border border-border shadow-sm">
 <h3 className="font-bold text-lg mb-3">Beginners</h3>
 <p className="text-sm text-foreground leading-relaxed">Stop feeling overwhelmed. Follow a clear, curated path from language basics to advanced structures without guessing.</p>
 </div>
 <div className="p-6 md:p-8 rounded-[2rem] bg-card border border-border shadow-sm">
 <h3 className="font-bold text-lg mb-3">Interview Candidates</h3>
 <p className="text-sm text-foreground leading-relaxed">Focus strictly on high-yield patterns. Use spaced repetition to revise weak areas before the big day.</p>
 </div>
 <div className="p-6 md:p-8 rounded-[2rem] bg-card border border-border shadow-sm">
 <h3 className="font-bold text-lg mb-3">Inconsistent Learners</h3>
 <p className="text-sm text-foreground leading-relaxed">Rebuild your habit. The platform auto-adjusts your schedule if you miss a day, preventing backlog anxiety.</p>
 </div>
 </div>
 </div>
 </section>
 );
}

// --- 12. FAQ Section ---
function FAQ() {
 const [openIdx, setOpenIdx] = useState<number | null>(0);
 const faqs = [
 { q: "Is this suitable for beginners?", a: "Yes. The roadmap starts from absolute basics and allows you to set a comfortable pace of 1-2 problems a day." },
 { q: "Do I need to pay?", a: "No. The core learning platform, daily planner, and problem tracking are free." },
 { q: "Can I try it without an account?", a: "Yes! Click 'Try as Guest' to explore the full platform using a sample Guest account." },
 { q: "Does it provide a roadmap?", a: "Yes. The system generates a week-by-week roadmap based on your chosen daily pace." },
 { q: "Can I track completed problems?", a: "Yes. Progress, streaks, and difficulty distribution are tracked automatically." },
 { q: "Does it support coding platforms?", a: "Absolutely. All curated problems link directly to the best platform to solve them (LeetCode, GFG, Codeforces)." },
 { q: "Is there an AI tutor?", a: "Yes, every problem features a Socratic AI Tutor that gives incremental logic hints without revealing the full code." },
 ];

 return (
 <section className="py-20 md:py-28 bg-muted border-t border-border" id="faq">
 <div className="mx-auto max-w-3xl px-4">
 <h2 className="font-display text-3xl md:text-4xl font-bold mb-10 text-center tracking-tight">Frequently Asked Questions</h2>
 <div className="space-y-3">
 {faqs.map((faq, idx) => (
 <div key={idx} className="bg-card border border-border rounded-lg overflow-hidden transition-all hover:border-border shadow-sm">
 <button 
 onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
 className="w-full text-left px-6 py-4 font-bold flex justify-between items-center text-sm md:text-base"
 >
 {faq.q}
 <ChevronDown className={cn("size-4 shrink-0 transition-transform", openIdx === idx && "rotate-180 text-primary")} />
 </button>
 {openIdx === idx && (
 <div className="px-6 pb-5 text-sm text-foreground leading-relaxed border-t border-border pt-4 bg-muted">
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

// --- 13. Final CTA ---
function FinalCTA({ onEnterDemo }: { onEnterDemo: () => void }) {
 return (
 <section className="py-24 md:py-32 relative overflow-hidden">
 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] /10  " />
 <div className="mx-auto max-w-4xl px-4 text-center relative z-10">
 <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6">
 Ready to master Data Structures?
 </h2>
 <p className="text-lg md:text-xl text-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
 Join the structured learning platform that actually teaches you how to think, step by step.
 </p>
 <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
 <Button asChild size="lg" className="h-14 px-8 text-sm md:text-base font-bold rounded-lg w-full sm:w-auto shadow-sm shadow-primary/20">
 <Link href="/auth?mode=signup">
 Start Learning Now
 <ArrowRight className="size-5 ml-2" />
 </Link>
 </Button>
 <Button 
 onClick={onEnterDemo}
 variant="outline" 
 size="lg" 
 className="h-14 px-8 text-sm md:text-base font-bold rounded-lg w-full sm:w-auto bg-card"
 >
 Try as Guest
 </Button>
 </div>
 </div>
 </section>
 );
}


// --- Stay Consistent. Compete Smarter. ---
function StayConsistentSection() {
  return (
    <section className="py-20 md:py-28 bg-background border-y border-border">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">Stay Consistent. Compete Smarter.</h2>
          <p className="text-foreground max-w-2xl mx-auto text-sm md:text-base">Powerful analytics, unified leaderboards, and scheduled reminders to keep you on track.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <Link href="/settings" className="bg-card border border-border rounded-[2rem] p-6 shadow-sm hover:border-primary/50 transition-colors block">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-primary font-mono text-[10px] md:text-xs font-bold mb-4 uppercase tracking-wider">
              <Mail className="size-3.5" /> Emails
            </div>
            <h3 className="text-lg md:text-xl font-bold mb-3 text-foreground">Daily Problem Emails</h3>
            <p className="text-foreground text-sm leading-relaxed mb-4">
              Receive a clear daily reminder with the problems planned for your next focused practice session.
            </p>
            <p className="text-foreground/70 text-xs font-medium">Benefit: Know exactly what to solve without opening multiple tools or losing your routine.</p>
          </Link>

          <Link href="/settings" className="bg-card border border-border rounded-[2rem] p-6 shadow-sm hover:border-warning/50 transition-colors block">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-warning font-mono text-[10px] md:text-xs font-bold mb-4 uppercase tracking-wider">
              <Bell className="size-3.5" /> Reminders
            </div>
            <h3 className="text-lg md:text-xl font-bold mb-3 text-foreground">Contest Reminders</h3>
            <p className="text-foreground text-sm leading-relaxed mb-4">
              Track upcoming coding contests and configure reminders so you can prepare and participate on time.
            </p>
            <p className="text-foreground/70 text-xs font-medium">Benefit: Never miss an important contest because you forgot the schedule.</p>
          </Link>

          <Link href="/profile" className="bg-card border border-border rounded-[2rem] p-6 shadow-sm hover:border-success/50 transition-colors block">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-success font-mono text-[10px] md:text-xs font-bold mb-4 uppercase tracking-wider">
              <LineChart className="size-3.5" /> Ratings
            </div>
            <h3 className="text-lg md:text-xl font-bold mb-3 text-foreground">Unified Coding Ratings</h3>
            <p className="text-foreground text-sm leading-relaxed mb-4">
              Connect supported coding platforms and view your competitive-programming ratings in one profile.
            </p>
            <p className="text-foreground/70 text-xs font-medium">Benefit: Understand your progress without checking every platform separately.</p>
          </Link>

          <Link href="/profile" className="bg-card border border-border rounded-[2rem] p-6 shadow-sm hover:border-info/50 transition-colors block">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-info font-mono text-[10px] md:text-xs font-bold mb-4 uppercase tracking-wider">
              <Trophy className="size-3.5" /> Ranking
            </div>
            <h3 className="text-lg md:text-xl font-bold mb-3 text-foreground">Cross-Platform Ranking</h3>
            <p className="text-foreground text-sm leading-relaxed mb-4">
              Compare your ranking and performance across supported coding platforms from one unified dashboard.
            </p>
            <p className="text-foreground/70 text-xs font-medium">Benefit: See your overall competitive position and identify where to improve.</p>
          </Link>

        </div>
      </div>
    </section>
  );
}

// --- Main Page Component ---

export default function LandingPage() {
 const router = useRouter();
 const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
 const { promptInstall, isModalOpen, setIsModalOpen, isIOS, isStandalone } = usePWAInstall();
 const { forceView, applyView } = useThemeCustomizer();
 
 const [isDemoLoading, setIsDemoLoading] = useState(false);
  const handleEnterDemo = useCallback(() => {
    if (isDemoLoading) return;
    setIsDemoLoading(true);
 enableGuestMode();
 toast.success("Welcome to Demo Mode! 🎉", {
 description: "Directly logging into Alex Rivera's account...",
 });
 window.location.href = "/today";
 }, [router]);

 const { user } = useAuth();
 useEffect(() => {
 const searchParams = new URLSearchParams(window.location.search);
 const isClosedOnboarding = searchParams.get("onboarding") === "closed";
 if (user && !isClosedOnboarding) {
 router.replace("/today");
 }
 }, [user, router]);

 return (
 <div className="min-h-screen font-sans selection:bg-muted text-foreground">
 <AnnouncementBar />
 
 {/* 2. Header */}
 <header className="sticky top-0 z-50 w-full bg-primary text-primary-foreground shadow-sm">
 <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
 <Link href="/" className="flex items-center gap-2">
 <DSA404Logo size={32} className="shrink-0" />
 <span className="font-display font-bold text-lg tracking-tight">DSA⁴⁰⁴</span>
 </Link>
 
 <nav className="hidden md:flex items-center gap-8 text-xs font-mono font-semibold">
 <a href="#faq" className="opacity-80 hover:opacity-100 transition-opacity">FAQ</a>
 <button onClick={handleEnterDemo} className="opacity-80 hover:opacity-100 transition-opacity cursor-pointer">Demo</button>
 <Link href="/auth?mode=signin" className="opacity-80 hover:opacity-100 transition-opacity">Log In</Link>
 </nav>
 
 <div className="flex items-center gap-3">
 {!isStandalone && (
 <Button onClick={promptInstall} variant="secondary" size="sm" className="hidden lg:flex rounded-full text-xs font-mono text-primary">
 <ChromeIcon className="size-3.5 mr-1.5" /> Install
 </Button>
 )}
 <Button asChild variant="secondary" size="sm" className="hidden md:flex rounded-full px-5 font-bold font-mono text-xs text-primary hover:text-primary">
 <Link href="/auth?mode=signup">Start Learning</Link>
 </Button>
 <Button
   onClick={() => applyView(forceView === "desktop" ? "auto" : "desktop")}
   variant="secondary"
   size="sm"
   className="md:hidden relative flex items-center justify-center size-8 rounded-full text-[10px] font-mono font-bold text-primary group shadow-sm shadow-black/20 hover:text-primary"
   title={forceView === "desktop" ? "Switch to Mobile View" : "Switch to Desktop View"}
 >
   {forceView === "desktop" ? (
     <Smartphone className="size-4" />
   ) : (
     <>
       <Monitor className="size-4" />
       {/* Highlight Hint */}
       <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-destructive animate-ping opacity-75" />
       <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-destructive" />
     </>
   )}
 </Button>
 <Button variant="ghost" size="icon" className="md:hidden text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
 {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
 </Button>
 </div>
 </div>
 </header>

 {/* Mobile Menu */}
 {isMobileMenuOpen && (
 <div className="md:hidden border-b border-border bg-card px-4 py-4 space-y-2 text-sm font-mono font-bold">
 <button onClick={() => { setIsMobileMenuOpen(false); handleEnterDemo(); }} className="block w-full text-left py-2 hover:text-primary">Try Live Demo</button>
 <a href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 hover:text-primary">FAQ</a>
 <Link href="/auth?mode=signin" className="block py-2 hover:text-primary">Log In</Link>
 <div className="pt-4 border-t border-border">
 <Button asChild className="w-full rounded-lg"><Link href="/auth?mode=signup">Start Learning Free</Link></Button>
 </div>
 </div>
 )}

 <main>
 <HeroSection onEnterDemo={handleEnterDemo} />
 <ProblemStatement />
 <ProductPromise />
 <ProductWalkthrough />
 <CoreFeaturesBento />
        <StayConsistentSection />
 <ProductPreview />
 <LearningJourney />
 <TrustSection />
 <TargetUser />
 <FAQ />
 <InstallApkSection />
 <FinalCTA onEnterDemo={handleEnterDemo} />
 </main>

 <footer className="bg-primary py-12 md:py-16 text-center text-sm text-primary-foreground">
 <div className="mx-auto max-w-6xl px-4">
 <div className="flex justify-center mb-6">
 <DSA404Logo size={32} className="shrink-0" />
 </div>
 <p className="font-medium mb-4">DSA⁴⁰⁴ — Structured DSA Learning</p>
 <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono mb-8 opacity-90">
 <a href="#faq" className="hover:opacity-100">FAQ</a>
 <span className="opacity-50">|</span>
 <Link href="/auth?mode=signin" className="hover:opacity-100">Log In</Link>
 <span className="opacity-50">|</span>
 <Link href="/auth?mode=signup" className="hover:opacity-100">Register</Link>
 <span className="opacity-50">|</span>
 <a href="https://pbmnaidu.vercel.app" target="_blank" rel="noreferrer" className="font-bold hover:underline">Creator</a>
 </div>
 <p className="text-[11px] opacity-70">© {new Date().getFullYear()} DSA⁴⁰⁴. Built for students and developers.</p>
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

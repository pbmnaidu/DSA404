"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Target, BookOpen, CheckCircle2, Flame, TrendingUp } from "lucide-react";

interface TodayMissionOrbitProps {
  topic?: string;
  solvedCount?: number;
  totalCount?: number;
  streakCount?: number;
  totalSolved?: number;
  className?: string;
}

export function TodayMissionOrbit({
  topic = "Algorithms",
  solvedCount = 0,
  totalCount = 0,
  streakCount = 0,
  totalSolved = 0,
  className,
}: TodayMissionOrbitProps) {
  const [mounted, setMounted] = useState(false);
  const progressPct = totalCount > 0 ? Math.min(100, Math.round((solvedCount / totalCount) * 100)) : 0;

  useEffect(() => {
    // Delay mounting slightly to allow CSS transitions to trigger entry animation
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={cn(
        "relative flex items-center justify-center w-full max-w-[260px] aspect-square",
        className
      )}
      aria-label="Learning momentum and mission progress animation"
      role="img"
    >
      {/* ── CENTRAL GLOW & NODE ── */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className={cn(
            "absolute size-32 rounded-full bg-primary/20 blur-3xl transition-opacity duration-1000",
            mounted ? "opacity-100" : "opacity-0"
          )}
        />
        <div className="relative z-10 size-20 rounded-full border border-primary/30 bg-card shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.15)] flex flex-col items-center justify-center overflow-hidden">
          {/* Progress fill that slowly rises */}
          <div 
            className="absolute bottom-0 left-0 right-0 bg-primary/20 transition-all duration-[2000ms] ease-out"
            style={{ height: mounted ? `${progressPct}%` : "0%" }}
          />
          <Target className="size-6 text-primary relative z-10 animate-pulse duration-[3000ms]" />
          <span className="text-[10px] font-bold text-foreground mt-1 relative z-10">{progressPct}%</span>
        </div>
      </div>

      {/* ── ORBIT RINGS ── */}
      <svg className="absolute inset-0 size-full pointer-events-none" viewBox="0 0 200 200">
        <circle 
          cx="100" cy="100" r="85" 
          fill="none" 
          stroke="var(--color-border)" 
          strokeWidth="1" 
          strokeDasharray="4 4"
          className="opacity-50"
        />
        <circle 
          cx="100" cy="100" r="55" 
          fill="none" 
          stroke="var(--color-border)" 
          strokeWidth="1" 
          strokeDasharray="2 4"
          className="opacity-30"
        />
        
        {/* Animated Progress Ring */}
        <circle 
          cx="100" cy="100" r="85" 
          fill="none" 
          stroke="var(--color-primary)" 
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="534"
          strokeDashoffset={mounted ? 534 - (534 * progressPct) / 100 : 534}
          className="transition-all duration-[2500ms] ease-out opacity-70"
          transform="rotate(-90 100 100)"
        />
      </svg>

      {/* ── ORBITING NODES ── */}
      {/* Container for slow rotation. Respects reduced-motion. */}
      <div className="absolute inset-0 animate-[spin_60s_linear_infinite] motion-reduce:animate-none">
        
        {/* Node 1: Current Topic */}
        <div className="absolute top-[8px] left-[50%] -translate-x-1/2 -translate-y-1/2 group">
          {/* Counter-rotate so the icon stays upright */}
          <div className="animate-[spin_60s_linear_infinite_reverse] motion-reduce:animate-none flex flex-col items-center">
            <div className="size-8 rounded-full border border-primary/40 bg-background flex items-center justify-center shadow-sm">
              <BookOpen className="size-3.5 text-primary" />
            </div>
            {/* Tooltip on hover */}
            <div className="absolute top-10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded-md border border-border pointer-events-none shadow-md">
              Topic: {topic}
            </div>
          </div>
        </div>

        {/* Node 2: Total Solved */}
        <div className="absolute top-[85%] left-[8%]" style={{ transform: "translate(-50%, -50%)" }}>
          <div className="animate-[spin_60s_linear_infinite_reverse] motion-reduce:animate-none flex flex-col items-center group">
            <div className="size-6 rounded-full border border-emerald-500/40 bg-background flex items-center justify-center shadow-sm">
              <CheckCircle2 className="size-3 text-emerald-500" />
            </div>
            <div className="absolute top-8 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded-md border border-border pointer-events-none shadow-md">
              Total Solved: {totalSolved}
            </div>
          </div>
        </div>

        {/* Node 3: Streak */}
        <div className="absolute top-[85%] right-[8%]" style={{ transform: "translate(50%, -50%)" }}>
          <div className="animate-[spin_60s_linear_infinite_reverse] motion-reduce:animate-none flex flex-col items-center group">
            <div className="size-6 rounded-full border border-orange-500/40 bg-background flex items-center justify-center shadow-sm">
              <Flame className="size-3 text-orange-500" />
            </div>
            <div className="absolute top-8 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded-md border border-border pointer-events-none shadow-md">
              Streak: {streakCount} Days
            </div>
          </div>
        </div>

      </div>

      {/* Floating Particles (decorative) */}
      <div className={cn(
        "absolute size-1.5 rounded-full bg-primary/60 blur-[1px] transition-all duration-[4000ms] ease-in-out",
        mounted ? "translate-y-[-60px] translate-x-[40px] opacity-100" : "translate-y-0 translate-x-0 opacity-0"
      )} />
      <div className={cn(
        "absolute size-1 rounded-full bg-primary/40 blur-[1px] transition-all duration-[5000ms] ease-in-out delay-500",
        mounted ? "translate-y-[40px] translate-x-[-50px] opacity-100" : "translate-y-0 translate-x-0 opacity-0"
      )} />

    </div>
  );
}

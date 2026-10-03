"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Target, BookOpen, Flame, Award } from "lucide-react";
import type { Badge } from "@/lib/gamification";

interface TodayMissionOrbitProps {
 topic?: string;
 solvedCount?: number;
 totalCount?: number;
 streakCount?: number;
 badges?: Badge[];
 className?: string;
}

export function TodayMissionOrbit({
 topic = "Algorithms",
 solvedCount = 0,
 totalCount = 0,
 streakCount = 0,
 badges = [],
 className,
}: TodayMissionOrbitProps) {
 const [mounted, setMounted] = useState(false);
 const progressPct = totalCount > 0 ? Math.min(100, Math.round((solvedCount / totalCount) * 100)) : 0;

 useEffect(() => {
 const timer = setTimeout(() => setMounted(true), 100);
 return () => clearTimeout(timer);
 }, []);

 const earnedBadges = badges.filter((b) => b.earned);
 
 // Build the list of orbiting nodes
 const nodes = [];
 
 if (topic) {
 nodes.push({
 id: "topic",
 icon: <BookOpen className="size-3.5 text-primary" />,
 label: `Topic: ${topic}`,
 size: 8,
 });
 }
 
 if (streakCount > 0) {
 nodes.push({
 id: "streak",
 icon: <Flame className="size-3 text-warning" />,
 label: `Streak: ${streakCount} Days`,
 size: 6,
 borderColor: "border-warning"
 });
 }
 
 earnedBadges.forEach((badge) => {
 nodes.push({
 id: `badge_${badge.code}`,
 icon: <Award className="size-3.5 text-warning" />,
 label: badge.label,
 size: 7,
 });
 });

 return (
 <div 
 className={cn(
 "relative flex items-center justify-center w-full max-w-[360px] aspect-[1.55] overflow-visible",
 className
 )}
 aria-label="Learning momentum and mission progress animation"
 role="group"
 >
 {/* ── CENTRAL GLOW & NODE ── */}
 <div className="absolute inset-0 flex items-center justify-center">
 <div 
 className={cn(
 "absolute size-32 rounded-full bg-muted blur-3xl transition-opacity duration-1000",
 mounted ? "opacity-100" : "opacity-0"
 )}
 />
 <div className="relative z-10 size-20 rounded-full border border-border bg-card shadow-[0_0_20px_var(--color-primary)] shadow-primary/15 flex flex-col items-center justify-center overflow-hidden">
 {/* Progress fill that slowly rises */}
 <div 
 className="absolute bottom-0 left-0 right-0 bg-muted transition-all duration-[2000ms] ease-out"
 style={{ height: mounted ? `${progressPct}%` : "0%" }}
 />
 <Target className="size-6 text-primary relative z-10 animate-pulse duration-[3000ms]" />
 <span className="text-[10px] font-bold text-foreground mt-1 relative z-10">{progressPct}%</span>
 </div>
 </div>

 {/* ── ORBIT RINGS ── */}
 <svg className="absolute inset-0 size-full pointer-events-none" viewBox="0 0 320 200" preserveAspectRatio="none">
 <ellipse 
 cx="160" cy="100" rx="140" ry="78" 
 fill="none" 
 stroke="var(--color-border)" 
 strokeWidth="1" 
 strokeDasharray="4 4"
 />
 <ellipse 
 cx="160" cy="100" rx="92" ry="48" 
 fill="none" 
 stroke="var(--color-border)" 
 strokeWidth="1" 
 strokeDasharray="2 4"
 />
 
 {/* Animated Progress Ring */}
 <ellipse 
 cx="160" cy="100" rx="140" ry="78" 
 fill="none" 
 stroke="var(--color-primary)" 
 strokeWidth="1.5"
 strokeLinecap="round"
 pathLength="100"
 strokeDasharray="100"
 strokeDashoffset={mounted ? 100 - progressPct : 100}
 className="transition-all duration-[2500ms] ease-out"
 />
 </svg>

 {/* ── ORBITING NODES ── */}
 <div className="absolute inset-0 animate-[spin_60s_linear_infinite] motion-reduce:animate-none">
 {nodes.map((node, i) => {
 // Angle starts at -90deg (top) and spaces evenly
 const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
 const left = 50 + Math.cos(angle) * 43.75;
 const top = 50 + Math.sin(angle) * 39;
 
 return (
 <div 
 key={node.id}
 className="absolute group"
 style={{ 
 left: `${left}%`, 
 top: `${top}%`, 
 transform: "translate(-50%, -50%)" 
 }}
 >
 <div className="animate-[spin_60s_linear_infinite_reverse] motion-reduce:animate-none flex flex-col items-center">
 <div 
 className={cn(
 "rounded-full border bg-background flex items-center justify-center shadow-sm",
 `size-${node.size}`,
 node.borderColor || "border-border"
 )}
 >
 {node.icon}
 </div>
 <div className="absolute top-10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded-md border border-border pointer-events-none shadow-sm z-50">
 {node.label}
 </div>
 </div>
 </div>
 );
 })}
 </div>

 {/* Floating Particles (decorative) */}
 <div className={cn(
 "absolute size-1.5 rounded-full bg-muted blur-[1px] transition-all duration-[4000ms] ease-in-out",
 mounted ? "translate-y-[-60px] translate-x-[40px] opacity-100" : "translate-y-0 translate-x-0 opacity-0"
 )} />
 <div className={cn(
 "absolute size-1 rounded-full bg-muted blur-[1px] transition-all duration-[5000ms] ease-in-out delay-500",
 mounted ? "translate-y-[40px] translate-x-[-50px] opacity-100" : "translate-y-0 translate-x-0 opacity-0"
 )} />

 </div>
 );
}
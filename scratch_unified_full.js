const fs = require('fs');
const path = 'p:/DSA404-chatBot/src/components/coding-profiles/UnifiedProfileDashboard.tsx';

const content = `"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ConnectedPlatform, NormalizedCodingProfile, PlatformId } from "@/lib/coding-platforms/types";
import { fetchBatchProfilesApi, fetchUserProfileApi } from "@/lib/coding-platforms/client-api";
import { analyzeCodingProfiles } from "@/lib/coding-platforms/analytics";
import { PlatformConnectCard } from "./PlatformConnectCard";
import { savePlatformStats, saveUserProfile } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Globe, RefreshCw, Trophy, CheckCircle2, ExternalLink, Activity, 
  Target, BarChart3, TrendingUp, Layers, ChevronRight, PieChart, Calendar, Code2, LineChart
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell, AreaChart, Area
} from "recharts";
import { resolvePlatformUrl } from "./PlatformProfileCard";

const PLATFORM_META: Record<string, { name: string; color: string; bg: string }> = {
  leetcode: { name: "LeetCode", color: "#FFA116", bg: "rgba(255,161,22,0.12)" },
  codeforces: { name: "Codeforces", color: "#1F8ACB", bg: "rgba(31,138,203,0.12)" },
  codechef: { name: "CodeChef", color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
  atcoder: { name: "AtCoder", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  hackerrank: { name: "HackerRank", color: "#22C55E", bg: "rgba(34,197,94,0.12)" },
  gfg: { name: "GeeksforGeeks", color: "#2F8D46", bg: "rgba(47,141,70,0.12)" },
  github: { name: "GitHub", color: "#94A3B8", bg: "rgba(148,163,184,0.12)" },
};

interface UnifiedProfileDashboardProps {
  initialProfiles?: Record<string, string>;
  initialStats?: Record<string, NormalizedCodingProfile | any>;
  userId?: string;
  onSaveProfiles?: (profiles: Record<string, string>) => void;
  readOnly?: boolean;
}

export function UnifiedProfileDashboard({
  initialProfiles = {},
  initialStats = {},
  userId,
  onSaveProfiles,
  readOnly = false,
}: UnifiedProfileDashboardProps) {
  const [connectedProfiles, setConnectedProfiles] = useState<Record<string, string>>(initialProfiles);
  const [fetchedData, setFetchedData] = useState<Record<string, NormalizedCodingProfile>>(initialStats);
  const [loading, setLoading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");

  useEffect(() => {
    setConnectedProfiles(initialProfiles);
    setFetchedData(initialStats);
  }, [initialProfiles, initialStats]);

  const handleConnect = async (platformKey: string, username: string) => {
    setLoading(true);
    try {
      const result = await fetchUserProfileApi(platformKey as PlatformId, username);
      if (result.status === "SUCCESS") {
        const newProfiles = { ...connectedProfiles, [platformKey]: username };
        const newStats = { ...fetchedData, [platformKey]: result };
        setConnectedProfiles(newProfiles);
        setFetchedData(newStats);
        onSaveProfiles?.(newProfiles);
        toast.success(\`Connected to \${PLATFORM_META[platformKey]?.name || platformKey}\`);
      } else {
        toast.error(\`Failed to connect to \${PLATFORM_META[platformKey]?.name || platformKey}\`);
      }
    } catch (e) {
      toast.error("An error occurred while connecting.");
    } finally {
      setLoading(false);
    }
  };

  const activeProfiles = useMemo(() => {
    return Object.entries(fetchedData).filter(
      ([key, data]) => data.status === "SUCCESS" && connectedProfiles[key]
    );
  }, [fetchedData, connectedProfiles]);

  const analytics = useMemo(() => analyzeCodingProfiles(fetchedData), [fetchedData]);

  const aggregateDifficulty = useMemo(() => {
    let easy = 0, medium = 0, hard = 0;
    activeProfiles.forEach(([_, p]) => {
      easy += p.easySolved || 0;
      medium += p.mediumSolved || 0;
      hard += p.hardSolved || 0;
    });
    return [
      { name: "Easy", value: easy, color: "#22c55e" },
      { name: "Medium", value: medium, color: "#f97316" },
      { name: "Hard", value: hard, color: "#ef4444" },
    ].filter(d => d.value > 0);
  }, [activeProfiles]);

  const platformDistribution = useMemo(() => {
    return activeProfiles.map(([key, p]) => ({
      name: PLATFORM_META[key]?.name || key,
      value: p.totalSolved || 0,
      color: PLATFORM_META[key]?.color || "#6366f1",
    })).filter(d => d.value > 0).sort((a,b) => b.value - a.value);
  }, [activeProfiles]);

  const selectedProfile = selectedPlatform !== "all" ? fetchedData[selectedPlatform] : null;
  const selectedMeta = PLATFORM_META[selectedPlatform];

  const renderPlatformSelector = () => (
    <div className="flex overflow-x-auto pb-4 mb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar gap-2 border-b border-border">
      <button
        onClick={() => setSelectedPlatform("all")}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all shrink-0",
          selectedPlatform === "all"
            ? "bg-primary text-primary-foreground shadow-md"
            : "bg-card border border-border text-muted-foreground hover:bg-muted"
        )}
      >
        <Globe className="size-4" /> Global Overview
      </button>
      {activeProfiles.map(([key]) => {
        const meta = PLATFORM_META[key] || { name: key, color: "#fff", bg: "rgba(255,255,255,0.1)" };
        const isActive = selectedPlatform === key;
        return (
          <button
            key={key}
            onClick={() => setSelectedPlatform(key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all shrink-0 border border-transparent",
              isActive ? "shadow-md" : "bg-card border-border text-muted-foreground hover:bg-muted"
            )}
            style={isActive ? { backgroundColor: meta.color, color: "#fff" } : {}}
          >
            {meta.name}
          </button>
        );
      })}
    </div>
  );

  if (activeProfiles.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-sm">
          <div className="mx-auto size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
            <Globe className="size-8" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-2">No Platforms Connected</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Connect your LeetCode, Codeforces, or CodeChef profiles to see your unified analytics workspace.
          </p>
          {!readOnly && <PlatformConnectCard onConnect={handleConnect} existingPlatforms={connectedProfiles} />}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight">Platform Analytics</h2>
          <p className="text-sm text-muted-foreground">Your performance across all competitive programming platforms.</p>
        </div>
      </div>

      {/* HEADER ROW: Platform Selector */}
      {renderPlatformSelector()}

      {!readOnly && selectedPlatform === "all" && (
        <PlatformConnectCard onConnect={handleConnect} existingPlatforms={connectedProfiles} />
      )}

      {selectedPlatform === "all" ? (
        <div className="space-y-6">
          {/* Main KPI Panel */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="rounded-[2rem] bg-card border border-border p-6 shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Target className="size-4" /> <span className="text-xs font-bold uppercase tracking-wider">Total Solved</span>
              </div>
              <div className="text-5xl font-display font-black text-emerald-500 mb-2">{analytics.totalSolvedAcrossPlatforms}</div>
            </div>
            
            <div className="rounded-[2rem] bg-card border border-border p-6 shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Trophy className="size-4" /> <span className="text-xs font-bold uppercase tracking-wider">Peak Rating</span>
              </div>
              <div className="text-5xl font-display font-black text-amber-500 mb-2">
                {analytics.highestReportedRating ? analytics.highestReportedRating.rating : "N/A"}
              </div>
            </div>
            
            <div className="rounded-[2rem] bg-card border border-border p-6 shadow-sm col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <PieChart className="size-4" /> <span className="text-xs font-bold uppercase tracking-wider">Difficulty Split</span>
              </div>
              {aggregateDifficulty.length > 0 ? (
                <div className="space-y-3">
                  {aggregateDifficulty.map(d => (
                    <div key={d.name}>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span>{d.name}</span>
                        <span>{d.value}</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: \`\${(d.value / Math.max(analytics.totalSolvedAcrossPlatforms, 1)) * 100}%\`, backgroundColor: d.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">No data</div>
              )}
            </div>
          </div>

          {/* Secondary Global Panel */}
          <div className="rounded-[2rem] bg-card border border-border p-6 shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground mb-6">
              <BarChart3 className="size-4" /> <span className="text-xs font-bold uppercase tracking-wider">Platform Distribution</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformDistribution} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#888" }} width={90} />
                  <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.8)", padding: "12px" }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                    {platformDistribution.map((entry, index) => (
                      <Cell key={\`cell-\${index}\`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        /* Selected Platform View (Top-Down Flow) */
        <div className="space-y-6 animate-fade-in">
          
          {/* Header Area (Platform Identity) */}
          <div className="flex items-center gap-4">
             <div className="size-16 rounded-2xl flex items-center justify-center font-bold text-white shadow-md text-2xl" style={{ backgroundColor: selectedMeta?.color }}>
               {selectedMeta?.name.slice(0, 2).toUpperCase()}
             </div>
             <div>
               <h3 className="font-display font-bold text-3xl">{selectedMeta?.name}</h3>
               <a 
                 href={resolvePlatformUrl(selectedPlatform, connectedProfiles[selectedPlatform], selectedProfile?.profileUrl)} 
                 target="_blank" 
                 rel="noreferrer"
                 className="text-sm text-muted-foreground font-mono hover:text-primary flex items-center gap-1 mt-1"
               >
                 @{connectedProfiles[selectedPlatform]} <ExternalLink className="size-3" />
               </a>
             </div>
          </div>

          {/* Primary Area: Large Ranking Graph */}
          <div className="rounded-[2rem] bg-card border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="size-4 text-primary" /> <span className="text-xs font-bold uppercase tracking-wider text-primary">Rating Progression</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black" style={{ color: selectedMeta?.color }}>{selectedProfile?.rating || "Unrated"}</span>
                <span className="text-xs text-muted-foreground block uppercase tracking-wider font-bold">Current Rating</span>
              </div>
            </div>
            
            <div className="h-[350px] w-full">
              {selectedProfile?.ratingHistory && selectedProfile.ratingHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={selectedProfile.ratingHistory} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={selectedMeta?.color} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={selectedMeta?.color} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.6} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} 
                      stroke="var(--color-border)" 
                      axisLine={false} 
                      tickLine={false} 
                      minTickGap={40}
                    />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      stroke="var(--color-muted-foreground)" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      width={45}
                    />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: "12px", border: "1px solid var(--color-border)", background: "var(--color-popover)", color: "var(--color-popover-foreground)", padding: "12px" }} 
                      labelStyle={{ fontWeight: "bold", marginBottom: "4px" }}
                    />
                    <Area type="monotone" dataKey="rating" stroke={selectedMeta?.color} strokeWidth={3} fillOpacity={1} fill="url(#colorRating)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center border border-dashed border-border rounded-xl">
                  <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4"><LineChart className="size-6" /></div>
                  <h4 className="font-bold text-lg mb-2">No Contest History</h4>
                  <p className="text-muted-foreground text-sm max-w-sm text-center">We couldn't find any rated contest history for this platform profile.</p>
                </div>
              )}
            </div>
          </div>

          {/* Secondary Area: Difficulty Breakdown & Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-[2rem] bg-card border border-border p-6 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-6">Key Metrics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background rounded-xl p-4 border border-border">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Solved</p>
                  <p className="text-2xl font-black">{selectedProfile?.totalSolved || 0}</p>
                </div>
                <div className="bg-background rounded-xl p-4 border border-border">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Rank</p>
                  <p className="text-xl font-bold truncate">{selectedProfile?.rank || "N/A"}</p>
                </div>
                <div className="bg-background rounded-xl p-4 border border-border">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Contests</p>
                  <p className="text-2xl font-black text-purple-500">{selectedProfile?.contestsParticipated || 0}</p>
                </div>
                <div className="bg-background rounded-xl p-4 border border-border">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Max Rating</p>
                  <p className="text-2xl font-black text-amber-500">{selectedProfile?.maxRating || selectedProfile?.rating || "N/A"}</p>
                </div>
              </div>
            </div>

            {(selectedProfile?.easySolved || selectedProfile?.mediumSolved || selectedProfile?.hardSolved) ? (
              <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-6">Difficulty Distribution</h4>
                <div className="space-y-5">
                   {selectedProfile.easySolved !== null && (
                     <div>
                       <div className="flex justify-between text-xs font-bold mb-1.5 text-emerald-500"><span>Easy</span><span>{selectedProfile.easySolved}</span></div>
                       <div className="h-2 w-full bg-emerald-500/10 rounded-full overflow-hidden">
                         <div className="h-full bg-emerald-500 rounded-full" style={{ width: \`\${(selectedProfile.easySolved / Math.max(selectedProfile.totalSolved || 1, 1)) * 100}%\` }} />
                       </div>
                     </div>
                   )}
                   {selectedProfile.mediumSolved !== null && (
                     <div>
                       <div className="flex justify-between text-xs font-bold mb-1.5 text-amber-500"><span>Medium</span><span>{selectedProfile.mediumSolved}</span></div>
                       <div className="h-2 w-full bg-amber-500/10 rounded-full overflow-hidden">
                         <div className="h-full bg-amber-500 rounded-full" style={{ width: \`\${(selectedProfile.mediumSolved / Math.max(selectedProfile.totalSolved || 1, 1)) * 100}%\` }} />
                       </div>
                     </div>
                   )}
                   {selectedProfile.hardSolved !== null && (
                     <div>
                       <div className="flex justify-between text-xs font-bold mb-1.5 text-destructive"><span>Hard</span><span>{selectedProfile.hardSolved}</span></div>
                       <div className="h-2 w-full bg-destructive/10 rounded-full overflow-hidden">
                         <div className="h-full bg-destructive rounded-full" style={{ width: \`\${(selectedProfile.hardSolved / Math.max(selectedProfile.totalSolved || 1, 1)) * 100}%\` }} />
                       </div>
                     </div>
                   )}
                </div>
              </div>
            ) : (
              <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm flex flex-col items-center justify-center text-center">
                 <Target className="size-8 text-muted-foreground mb-3 opacity-20" />
                 <p className="text-sm text-muted-foreground">Difficulty distribution unavailable.</p>
              </div>
            )}
          </div>

          {/* Bottom Area: Recent Activity */}
          {selectedProfile?.recentSubmissions && selectedProfile.recentSubmissions.length > 0 && (
            <div className="rounded-[2rem] bg-card border border-border p-6 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground mb-6">
                <Code2 className="size-4" /> <span className="text-xs font-bold uppercase tracking-wider">Recent Submissions</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedProfile.recentSubmissions.slice(0, 6).map((sub, i) => (
                  <div key={i} className="flex justify-between items-start p-4 rounded-xl bg-background border border-border">
                    <div className="min-w-0 pr-4">
                       <span className="font-bold text-sm block truncate" title={sub.problemName}>{sub.problemName || "Submission"}</span>
                       <span className="text-xs text-muted-foreground">{new Date(sub.timestamp).toLocaleDateString()}</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">{sub.verdict || "Accepted"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
`
fs.writeFileSync(path, content, 'utf8');
console.log("UnifiedProfileDashboard completely rebuilt!");

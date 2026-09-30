"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ConnectedPlatform, NormalizedCodingProfile, PlatformId } from "@/lib/coding-platforms/types";
import { fetchBatchProfilesApi, fetchUserProfileApi } from "@/lib/coding-platforms/client-api";
import { analyzeCodingProfiles } from "@/lib/coding-platforms/analytics";
import { PlatformConnectCard } from "./PlatformConnectCard";
import { savePlatformStats, saveUserProfile } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Globe, RefreshCw, Trophy, CheckCircle2, ExternalLink, Activity, 
  Target, BarChart3, TrendingUp, Layers, ChevronRight, PieChart, Calendar, Code2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
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
        toast.success(`Connected to ${PLATFORM_META[platformKey]?.name || platformKey}`);
      } else {
        toast.error(`Failed to connect to ${PLATFORM_META[platformKey]?.name || platformKey}`);
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

  // Aggregate Data for "All Platforms" view
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

  // Selected Profile Data
  const selectedProfile = selectedPlatform !== "all" ? fetchedData[selectedPlatform] : null;
  const selectedMeta = PLATFORM_META[selectedPlatform];

  const renderPlatformSelector = () => (
    <div className="flex overflow-x-auto pb-4 mb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar gap-2">
      <button
        onClick={() => setSelectedPlatform("all")}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all shrink-0",
          selectedPlatform === "all"
            ? "bg-primary text-primary-foreground shadow-md"
            : "bg-card border border-border text-muted-foreground hover:bg-muted"
        )}
      >
        <Globe className="size-4" /> Overview
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight">Platform Analytics</h2>
          <p className="text-sm text-muted-foreground">Your performance across all competitive programming platforms.</p>
        </div>
        {!readOnly && (
          <Button variant="outline" size="sm" className="hidden sm:flex rounded-xl font-bold">
            <RefreshCw className={cn("size-4 mr-2", loading && "animate-spin")} />
            Sync Platforms
          </Button>
        )}
      </div>

      {renderPlatformSelector()}

      {!readOnly && selectedPlatform === "all" && (
        <PlatformConnectCard onConnect={handleConnect} existingPlatforms={connectedProfiles} />
      )}

      {selectedPlatform === "all" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main KPI Panel */}
          <div className="lg:col-span-8 grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1 rounded-[2rem] bg-card border border-border p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Target className="size-4" /> <span className="text-xs font-bold uppercase tracking-wider">Total Solved</span>
              </div>
              <div>
                <div className="text-5xl font-display font-black text-emerald-500 mb-2">{analytics.totalSolvedAcrossPlatforms}</div>
                <p className="text-sm text-muted-foreground">Problems across {activeProfiles.length} platforms</p>
              </div>
            </div>
            
            <div className="col-span-2 sm:col-span-1 rounded-[2rem] bg-card border border-border p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Trophy className="size-4" /> <span className="text-xs font-bold uppercase tracking-wider">Peak Rating</span>
              </div>
              <div>
                <div className="text-5xl font-display font-black text-amber-500 mb-2">
                  {analytics.highestReportedRating ? analytics.highestReportedRating.rating : "N/A"}
                </div>
                <p className="text-sm text-muted-foreground">
                  {analytics.highestReportedRating ? `On ${analytics.highestReportedRating.platform.toUpperCase()}` : "No rated contests"}
                </p>
              </div>
            </div>

            <div className="col-span-2 rounded-[2rem] bg-card border border-border p-6 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground mb-6">
                <BarChart3 className="size-4" /> <span className="text-xs font-bold uppercase tracking-wider">Platform Distribution</span>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={platformDistribution} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#888" }} width={90} />
                    <RechartsTooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} contentStyle={{ borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.8)" }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                      {platformDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Sidebar Analytics */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-[2rem] bg-card border border-border p-6 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground mb-6">
                <PieChart className="size-4" /> <span className="text-xs font-bold uppercase tracking-wider">Difficulty Split</span>
              </div>
              {aggregateDifficulty.length > 0 ? (
                <div className="space-y-4">
                  {aggregateDifficulty.map(d => (
                    <div key={d.name}>
                      <div className="flex justify-between text-sm font-bold mb-1">
                        <span>{d.name}</span>
                        <span>{d.value}</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(d.value / analytics.totalSolvedAcrossPlatforms) * 100}%`, backgroundColor: d.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-8">No difficulty data available</div>
              )}
            </div>
            
            <div className="rounded-[2rem] bg-card border border-border p-6 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Activity className="size-4" /> <span className="text-xs font-bold uppercase tracking-wider">Active Identities</span>
              </div>
              <div className="space-y-3">
                {activeProfiles.map(([key, p]) => (
                  <div key={key} className="flex items-center justify-between bg-background p-3 rounded-xl border border-border">
                    <div className="flex items-center gap-2">
                       <div className="size-2 rounded-full" style={{ backgroundColor: PLATFORM_META[key]?.color || "#ccc" }} />
                       <span className="font-bold text-sm">{PLATFORM_META[key]?.name || key}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">@{connectedProfiles[key]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Selected Platform View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                 <Globe className="size-24" style={{ color: selectedMeta?.color }} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                   <div className="size-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-md" style={{ backgroundColor: selectedMeta?.color }}>
                     {selectedMeta?.name.slice(0, 2).toUpperCase()}
                   </div>
                   <div>
                     <h3 className="font-display font-bold text-xl">{selectedMeta?.name}</h3>
                     <a 
                       href={resolvePlatformUrl(selectedPlatform, connectedProfiles[selectedPlatform], selectedProfile?.profileUrl)} 
                       target="_blank" 
                       rel="noreferrer"
                       className="text-xs text-muted-foreground font-mono hover:text-primary flex items-center gap-1"
                     >
                       @{connectedProfiles[selectedPlatform]} <ExternalLink className="size-3" />
                     </a>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background rounded-xl p-4 border border-border">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Solved</p>
                    <p className="text-2xl font-black">{selectedProfile?.totalSolved || 0}</p>
                  </div>
                  <div className="bg-background rounded-xl p-4 border border-border">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Rating</p>
                    <p className="text-2xl font-black text-amber-500">{selectedProfile?.rating || "N/A"}</p>
                  </div>
                  <div className="bg-background rounded-xl p-4 border border-border">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Rank</p>
                    <p className="text-lg font-bold">{selectedProfile?.rank || "N/A"}</p>
                  </div>
                  <div className="bg-background rounded-xl p-4 border border-border">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Contests</p>
                    <p className="text-2xl font-black text-purple-500">{selectedProfile?.contestsParticipated || 0}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {(selectedProfile?.easySolved || selectedProfile?.mediumSolved || selectedProfile?.hardSolved) ? (
              <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
                <h4 className="font-bold text-sm mb-4">Difficulty Distribution</h4>
                <div className="space-y-4">
                   {selectedProfile.easySolved !== null && (
                     <div>
                       <div className="flex justify-between text-xs font-bold mb-1 text-emerald-500"><span>Easy</span><span>{selectedProfile.easySolved}</span></div>
                       <div className="h-1.5 w-full bg-emerald-500/10 rounded-full overflow-hidden">
                         <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(selectedProfile.easySolved / (selectedProfile.totalSolved || 1)) * 100}%` }} />
                       </div>
                     </div>
                   )}
                   {selectedProfile.mediumSolved !== null && (
                     <div>
                       <div className="flex justify-between text-xs font-bold mb-1 text-amber-500"><span>Medium</span><span>{selectedProfile.mediumSolved}</span></div>
                       <div className="h-1.5 w-full bg-amber-500/10 rounded-full overflow-hidden">
                         <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(selectedProfile.mediumSolved / (selectedProfile.totalSolved || 1)) * 100}%` }} />
                       </div>
                     </div>
                   )}
                   {selectedProfile.hardSolved !== null && (
                     <div>
                       <div className="flex justify-between text-xs font-bold mb-1 text-destructive"><span>Hard</span><span>{selectedProfile.hardSolved}</span></div>
                       <div className="h-1.5 w-full bg-destructive/10 rounded-full overflow-hidden">
                         <div className="h-full bg-destructive rounded-full" style={{ width: `${(selectedProfile.hardSolved / (selectedProfile.totalSolved || 1)) * 100}%` }} />
                       </div>
                     </div>
                   )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-8 space-y-6">
            
            {/* Contest Rating Chart */}
            {selectedProfile?.ratingHistory && selectedProfile.ratingHistory.length > 0 ? (
              <div className="rounded-[2rem] bg-card border border-border p-6 shadow-sm h-[350px] flex flex-col">
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <TrendingUp className="size-4" /> <span className="text-xs font-bold uppercase tracking-wider">Rating Progression</span>
                </div>
                <div className="flex-1 w-full min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={selectedProfile.ratingHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={selectedMeta?.color} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={selectedMeta?.color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12, fill: "#888" }} 
                        stroke="#888" 
                        axisLine={false} 
                        tickLine={false} 
                        minTickGap={30}
                      />
                      <YAxis 
                        domain={['auto', 'auto']} 
                        stroke="#888" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        width={40}
                      />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.8)", padding: "12px" }} 
                        labelStyle={{ color: "#fff", fontWeight: "bold", marginBottom: "4px" }}
                      />
                      <Area type="monotone" dataKey="rating" stroke={selectedMeta?.color} strokeWidth={3} fillOpacity={1} fill="url(#colorRating)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="rounded-[2rem] bg-card border border-border p-12 shadow-sm text-center flex flex-col items-center justify-center h-[350px]">
                <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4"><LineChart className="size-6" /></div>
                <h4 className="font-bold text-lg mb-2">No Contest History</h4>
                <p className="text-muted-foreground text-sm max-w-sm">We couldn't find any rated contest history for this platform profile.</p>
              </div>
            )}

            
            {/* Activity Chart if available */}
            {selectedProfile?.recentSubmissions && selectedProfile.recentSubmissions.length > 0 ? (
              <div className="rounded-[2rem] bg-card border border-border p-6 shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <Code2 className="size-4" /> <span className="text-xs font-bold uppercase tracking-wider">Recent Activity</span>
                </div>
                <div className="space-y-2">
                  {selectedProfile.recentSubmissions.slice(0, 5).map((sub, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-background border border-border">
                      <span className="font-medium text-sm truncate max-w-[200px] sm:max-w-md">{sub.problemName || "Submission"}</span>
                      <span className="text-xs text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono">{sub.verdict || "Accepted"}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-[2rem] bg-card border border-border p-12 shadow-sm text-center flex flex-col items-center justify-center">
                <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4"><Code2 className="size-6" /></div>
                <h4 className="font-bold text-lg mb-2">No Recent Activity</h4>
                <p className="text-muted-foreground text-sm max-w-sm">We couldn't find any recent submissions for this platform profile.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

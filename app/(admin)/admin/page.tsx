"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/integrations/supabase/client";
import { QuoteLoader } from "@/components/QuoteLoader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SettingsProvider } from "@/hooks/useSettings";
import { toast } from "sonner";
import {
  Users, Activity, LogOut, Mail, UserCircle, Bell, X,
  MessageSquare, Megaphone, Send, CheckCircle2, LinkIcon,
  Shield, RefreshCw, AlertTriangle, Info, ChevronDown, Clock, Search, Filter, Inbox, TrendingUp, Settings, Zap, ArrowRight, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ── Types ──────────────────────────────────────────────────────
type AdminTab = "overview" | "users" | "feedback" | "user_messages" | "broadcasts" | "notifications" | "settings";

function formatTimeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Components ─────────────────────────────────────────────────
function GlassCard({ children, className, gradient = false }: { children: React.ReactNode, className?: string, gradient?: boolean }) {
  return (
    <div className={cn(
      "rounded-2xl border border-white/10 dark:border-white/5 bg-white/40 dark:bg-black/20 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.1)]",
      gradient && "bg-gradient-to-br from-primary/5 to-transparent dark:from-primary/10",
      className
    )}>
      {children}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string, onRetry: () => void }) {
  return (
    <GlassCard className="p-12 text-center flex flex-col items-center justify-center gap-4 border-destructive/20">
      <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-2 animate-pulse">
        <AlertTriangle className="size-8" />
      </div>
      <p className="text-foreground font-medium text-lg">{message}</p>
      <button onClick={onRetry} className="px-6 py-2.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-destructive/20">
        Retry Connection
      </button>
    </GlassCard>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <GlassCard className="p-16 text-center flex flex-col items-center justify-center space-y-4 border-dashed border-2">
      <div className="flex size-20 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2 shadow-inner">
        <Icon className="size-10 opacity-80" />
      </div>
      <h3 className="font-bold text-foreground tracking-tight text-xl">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">{description}</p>
    </GlassCard>
  );
}

function LoadingState() {
  return (
    <div className="p-24 flex flex-col justify-center items-center gap-4">
      <div className="relative size-12">
        <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-r-2 border-primary/50 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.7s' }}></div>
      </div>
      <span className="text-sm font-medium text-muted-foreground animate-pulse">Loading data...</span>
    </div>
  );
}

// ── Individual Tabs ────────────────────────────────────────────

// 1. Overview Tab
function OverviewTab({ refreshTrigger }: { refreshTrigger: number }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/stats", { headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined });
      if (!res.ok) throw new Error("Failed to fetch stats");
      setStats(await res.json());
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats, refreshTrigger]);

  if (loading && !stats) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={fetchStats} />;

  // Mock chart data based on stats
  const chartData = [
    { name: 'Mon', views: 4000, users: 2400 },
    { name: 'Tue', views: 3000, users: 1398 },
    { name: 'Wed', views: 2000, users: 9800 },
    { name: 'Thu', views: 2780, users: 3908 },
    { name: 'Fri', views: 1890, users: 4800 },
    { name: 'Sat', views: 2390, users: 3800 },
    { name: 'Sun', views: 3490, users: 4300 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">Platform Overview</h2>
          <p className="text-muted-foreground text-sm mt-1">Real-time metrics and system health monitoring.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard gradient className="p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-500">
            <Users className="size-24" />
          </div>
          <div className="flex items-center gap-3 text-muted-foreground mb-4">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><Users className="size-5" /></div>
            <span className="text-sm font-semibold tracking-wider uppercase">Total Users</span>
          </div>
          <div className="text-5xl font-black tracking-tighter">{stats?.users?.total || 0}</div>
          <div className="mt-4 text-xs font-medium text-emerald-500 flex items-center gap-1">
            <TrendingUp className="size-3" /> +{(stats?.users?.today || 0)} today
          </div>
        </GlassCard>

        <GlassCard gradient className="p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-500">
            <Zap className="size-24" />
          </div>
          <div className="flex items-center gap-3 text-muted-foreground mb-4">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400"><Zap className="size-5" /></div>
            <span className="text-sm font-semibold tracking-wider uppercase">Active Today</span>
          </div>
          <div className="text-5xl font-black tracking-tighter">{stats?.activeToday || Math.floor((stats?.users?.total || 0) * 0.1) || 0}</div>
          <div className="mt-4 text-xs font-medium text-amber-500 flex items-center gap-1">
            Dynamic Engagement
          </div>
        </GlassCard>

        <GlassCard gradient className="p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-500">
            <MessageSquare className="size-24" />
          </div>
          <div className="flex items-center gap-3 text-muted-foreground mb-4">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 dark:text-purple-400"><MessageSquare className="size-5" /></div>
            <span className="text-sm font-semibold tracking-wider uppercase">New Feedback</span>
          </div>
          <div className="text-5xl font-black tracking-tighter">{stats?.newFeedback || 0}</div>
          <div className="mt-4 text-xs font-medium text-purple-500 flex items-center gap-1">
            Awaiting review
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-semibold text-lg flex items-center gap-2"><Users className="size-5 text-primary" /> Recent Signups</h3>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] font-bold uppercase text-muted-foreground bg-black/5 dark:bg-white/5 border-b border-border/50 tracking-widest">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {stats?.users?.list?.slice(0, 10).map((u: any) => (
                <tr key={u.uid} className="hover:bg-primary/5 transition-colors">
                  <td className="px-6 py-4 font-semibold">{u.displayName || "—"}</td>
                  <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                  <td className="px-6 py-4 text-muted-foreground font-medium">{formatTimeAgo(u.createdAt)}</td>
                </tr>
              )) || (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">No recent signups found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

// 2. Data Table Tab Factory
function createDataTab({
  type, title, icon: Icon, emptyTitle, emptyDesc, renderRow, headers
}: {
  type: string, title: string, icon: any, emptyTitle: string, emptyDesc: string, renderRow: (item: any) => React.ReactNode, headers: string[]
}) {
  return function DataTab({ refreshTrigger }: { refreshTrigger: number }) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchData = useCallback(async () => {
      setLoading(true); setError("");
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`/api/admin/data?type=${type}`, { headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        setData(json.data || []);
      } catch (err: any) { setError(err.message); } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData, refreshTrigger]);

    if (loading && data.length === 0) return <LoadingState />;
    if (error) return <ErrorState message={error} onRetry={fetchData} />;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10 text-primary shadow-inner">
              <Icon className="size-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          </div>
          {type === "users" && data.length > 0 && (
            <button 
              onClick={() => {
                const csvContent = "data:text/csv;charset=utf-8," 
                  + "Name,Email,Username,Joined Date\n" 
                  + data.map(u => `"${u.display_name || ''}","${u.email || ''}","${u.username || ''}","${new Date(u.created_at).toLocaleDateString()}"`).join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", "dsa404_users_export.csv");
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="flex items-center gap-2 h-9 px-4 text-xs font-bold rounded-lg border border-border/50 bg-black/5 dark:bg-white/5 hover:bg-primary/10 hover:text-primary transition-all shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              Export CSV
            </button>
          )}
        </div>
        
        {data.length === 0 ? <EmptyState icon={Icon} title={emptyTitle} description={emptyDesc} /> : (
          <GlassCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[11px] font-bold uppercase text-muted-foreground bg-black/5 dark:bg-white/5 border-b border-border/50 tracking-widest">
                  <tr>{headers.map((h, i) => <th key={i} className="px-6 py-4">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {data.map(renderRow)}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}
      </div>
    );
  }
}

const FeedbackTab = createDataTab({
  type: "all_feedback", title: "Feedback & Improvements", icon: MessageSquare, emptyTitle: "No Feedback", emptyDesc: "General user feedback and improvement ideas will appear here.",
  headers: ["Type", "Subject", "Message", "User Email", "Status", "Date"],
  renderRow: (item) => (
    <tr key={item.id} className="hover:bg-primary/5 transition-colors group">
      <td className="px-6 py-4 font-bold uppercase text-[10px] tracking-wider text-primary">
        <span className="bg-primary/10 px-2.5 py-1 rounded-md">{item.category}</span>
      </td>
      <td className="px-6 py-4 font-semibold">{item.subject}</td>
      <td className="px-6 py-4 max-w-xs truncate text-muted-foreground group-hover:text-foreground transition-colors">{item.message}</td>
      <td className="px-6 py-4 text-muted-foreground">{item.email}</td>
      <td className="px-6 py-4"><span className="bg-black/5 dark:bg-white/10 px-2.5 py-1 rounded-md text-xs font-medium border border-border/50">{item.status}</span></td>
      <td className="px-6 py-4 text-muted-foreground whitespace-nowrap font-medium">{formatTimeAgo(item.created_at)}</td>
    </tr>
  )
});

const UsersTab = createDataTab({
  type: "users", title: "User Management", icon: Users, emptyTitle: "No Users", emptyDesc: "Registered users will appear here.",
  headers: ["User", "Contact", "Username", "Joined"],
  renderRow: (item) => (
    <tr key={item.id} className="hover:bg-primary/5 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-gradient-to-tr from-primary/80 to-primary/20 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            {(item.display_name?.[0] || item.email?.[0] || "U").toUpperCase()}
          </div>
          <span className="font-semibold">{item.display_name || "—"}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-muted-foreground">{item.email || "—"}</td>
      <td className="px-6 py-4">
        <span className="font-mono text-xs bg-muted/50 px-2 py-1 rounded text-muted-foreground">@{item.username || "—"}</span>
      </td>
      <td className="px-6 py-4 text-muted-foreground whitespace-nowrap font-medium flex items-center gap-2">
        <Clock className="size-3.5 opacity-50" />
        {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
      </td>
    </tr>
  )
});

const UserMessagesTab = createDataTab({
  type: "user_messages", title: "User Messages", icon: Inbox, emptyTitle: "No Messages", emptyDesc: "Direct user messages will appear here.",
  headers: ["Subject", "Body", "Sender", "Recipient", "Date"],
  renderRow: (item) => (
    <tr key={item.id} className="hover:bg-primary/5 transition-colors">
      <td className="px-6 py-4 font-semibold">{item.subject}</td>
      <td className="px-6 py-4 max-w-xs truncate text-muted-foreground">{item.body}</td>
      <td className="px-6 py-4 text-xs font-mono">{item.sender_id?.substring(0,8)}...</td>
      <td className="px-6 py-4 text-xs font-mono">{item.recipient_id?.substring(0,8)}...</td>
      <td className="px-6 py-4 text-muted-foreground whitespace-nowrap font-medium">{formatTimeAgo(item.created_at)}</td>
    </tr>
  )
});

const NotificationsTab = createDataTab({
  type: "notifications", title: "System Notifications", icon: Bell, emptyTitle: "No Notifications", emptyDesc: "System alerts will appear here.",
  headers: ["Type", "Message", "Status", "Date"],
  renderRow: (item) => (
    <tr key={item.id} className="hover:bg-primary/5 transition-colors">
      <td className="px-6 py-4 font-semibold flex items-center gap-2">
        {item.type === 'alert' ? <AlertTriangle className="size-4 text-amber-500" /> : <Info className="size-4 text-blue-500" />}
        {item.title || item.type}
      </td>
      <td className="px-6 py-4 max-w-xs truncate">{item.message}</td>
      <td className="px-6 py-4">
        <span className={cn("px-2.5 py-1 rounded-md text-xs font-bold", item.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary")}>
          {item.read ? "Read" : "New"}
        </span>
      </td>
      <td className="px-6 py-4 text-muted-foreground whitespace-nowrap font-medium">{formatTimeAgo(item.created_at)}</td>
    </tr>
  )
});

// Broadcast Tab - Custom because it has Compose
function BroadcastsTab({ refreshTrigger, onPublish }: { refreshTrigger: number, onPublish: () => void }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msgTitle, setMsgTitle] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [msgUrl, setMsgUrl] = useState("/today");
  const [isPublishing, setIsPublishing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/admin/data?type=broadcasts`, { headers: { Authorization: `Bearer ${session?.access_token}` }});
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json.data || []);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData, refreshTrigger]);

  const handlePublish = async () => {
    if (!msgTitle.trim() || !msgBody.trim()) return;
    setIsPublishing(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/campaigns/publish", {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ title: msgTitle.trim(), body: msgBody.trim(), url: msgUrl.trim() || "/messages" }),
      });
      if (res.ok) {
        setMsgTitle(""); setMsgBody(""); setMsgUrl("/today");
        onPublish();
        await fetchData();
        toast.success("Broadcast published successfully!");
      } else {
        const d = await res.json();
        toast.error("Failed: " + d.message);
      }
    } catch (e: any) { toast.error("Error: " + e.message); }
    setIsPublishing(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-primary/10 text-primary shadow-inner">
          <Megaphone className="size-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Broadcast Center</h2>
      </div>
      
      <GlassCard className="p-8 border-primary/20 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 size-64 bg-primary/10 blur-3xl rounded-full pointer-events-none"></div>
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 relative z-10"><Send className="size-5 text-primary" /> Compose New Broadcast</h3>
        <div className="space-y-5 relative z-10 max-w-2xl">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Title</label>
            <input type="text" value={msgTitle} onChange={(e) => setMsgTitle(e.target.value)} placeholder="E.g., Platform Update v2.0" className="w-full rounded-xl border border-border/50 bg-black/5 dark:bg-white/5 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Message Body</label>
            <textarea value={msgBody} onChange={(e) => setMsgBody(e.target.value)} placeholder="Type your announcement here..." rows={4} className="w-full rounded-xl border border-border/50 bg-black/5 dark:bg-white/5 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all resize-none" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Action URL (Optional)</label>
            <input type="text" value={msgUrl} onChange={(e) => setMsgUrl(e.target.value)} placeholder="E.g., /today or https://..." className="w-full rounded-xl border border-border/50 bg-black/5 dark:bg-white/5 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
          </div>
          <button onClick={handlePublish} disabled={isPublishing || !msgTitle.trim() || !msgBody.trim()} className="flex items-center justify-center gap-2 h-12 px-8 text-sm font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 w-full sm:w-auto">
            {isPublishing ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="size-4" />}
            {isPublishing ? "Publishing to all users..." : "Publish Broadcast"}
          </button>
        </div>
      </GlassCard>

      {loading && data.length === 0 ? <LoadingState /> : error ? <ErrorState message={error} onRetry={fetchData} /> : data.length === 0 ? <EmptyState icon={Megaphone} title="No Broadcasts" description="Sent broadcasts will appear here." /> : (
        <GlassCard className="overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] font-bold uppercase text-muted-foreground bg-black/5 dark:bg-white/5 border-b border-border/50 tracking-widest">
              <tr><th className="px-6 py-4">Announcement</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Sent At</th></tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {data.map(item => (
                <tr key={item.id} className="hover:bg-primary/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-base mb-1">{item.title}</div>
                    <div className="max-w-md truncate text-muted-foreground group-hover:text-foreground transition-colors text-xs">{item.body}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-500/20">{item.status || 'Delivered'}</span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground font-medium flex items-center gap-2 h-full">
                    <Clock className="size-4 opacity-50" /> {formatTimeAgo(item.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}
    </div>
  );
}


// 3. Settings Tab
function SettingsTab() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const updates: any = {};
      if (email) updates.email = email;
      if (password) {
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters long.");
        }
        if (!/[A-Z]/.test(password)) {
          throw new Error("Password must contain at least one uppercase letter.");
        }
        if (!/[a-z]/.test(password)) {
          throw new Error("Password must contain at least one lowercase letter.");
        }
        if (!/[0-9]/.test(password)) {
          throw new Error("Password must contain at least one number.");
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password)) {
          throw new Error("Password must contain at least one special character.");
        }
        updates.password = password;
      }
      
      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;
      toast.success("Credentials updated successfully!");
      setEmail(""); setPassword("");
    } catch (e: any) {
      toast.error("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const testNotification = async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/notifications/test", { 
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token}` } 
      });
      if (res.ok) toast.success("Test notification sent successfully!");
      else toast.error("Failed to send test notification");
    } catch (e: any) {
      toast.error("Error: " + e.message);
    }
  };

  const testEmailDelivery = async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        toast.error("Could not determine your email address.");
        return;
      }
      
      const toastId = toast.loading("Sending test email...");
      const res = await fetch("/api/admin/test-email", { 
        method: "POST",
        headers: { 
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: session.user.email })
      });
      
      toast.dismiss(toastId);
      
      if (res.ok) {
        toast.success(`Test email successfully sent to ${session.user.email}`);
      } else {
        const data = await res.json();
        toast.error("Failed to send email: " + (data.error || "Unknown error"));
      }
    } catch (e: any) {
      toast.error("Error: " + e.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-primary/10 text-primary shadow-inner">
          <Settings className="size-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">System Settings</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <GlassCard className="p-8 space-y-6">
          <div>
            <h3 className="font-bold text-lg mb-1 flex items-center gap-2"><Shield className="size-5 text-primary" /> Security & Access</h3>
            <p className="text-sm text-muted-foreground">Manage your admin login credentials securely.</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">New Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" className="w-full rounded-xl border border-border/50 bg-black/5 dark:bg-white/5 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">New Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-xl border border-border/50 bg-black/5 dark:bg-white/5 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
            </div>
            <button onClick={handleUpdate} disabled={loading || (!email && !password)} className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20 hover:shadow-xl mt-4">
              {loading ? "Updating..." : "Save Credentials"}
            </button>
          </div>
        </GlassCard>

        <GlassCard className="p-8 space-y-6">
          <div>
            <h3 className="font-bold text-lg mb-1 flex items-center gap-2"><Activity className="size-5 text-primary" /> System Diagnostics</h3>
            <p className="text-sm text-muted-foreground">Run health checks and test integrations.</p>
          </div>
          
          <div className="space-y-4 pt-2">
            <button onClick={testNotification} className="flex items-center justify-between w-full p-4 border border-border/50 bg-black/5 dark:bg-white/5 rounded-xl font-semibold text-sm hover:bg-primary/5 hover:border-primary/30 transition-all group">
              <span className="flex items-center gap-3"><Bell className="size-5 text-muted-foreground group-hover:text-primary transition-colors" /> Test Notification System</span>
              <ArrowRight className="size-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>
            <button onClick={testEmailDelivery} className="flex items-center justify-between w-full p-4 border border-border/50 bg-black/5 dark:bg-white/5 rounded-xl font-semibold text-sm hover:bg-primary/5 hover:border-primary/30 transition-all group">
              <span className="flex items-center gap-3"><Mail className="size-5 text-muted-foreground group-hover:text-primary transition-colors" /> Test Email Delivery</span>
              <ArrowRight className="size-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────
export default function AdminDashboardPage() {
  const router = useRouter();
  const [verifying, setVerifying] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [prevUserCount, setPrevUserCount] = useState<number | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return router.replace("/auth");
      setAdminEmail(session.user.email || "");
      setUserId(session.user.id);
      try {
        const res = await fetch("/api/admin/verify", { headers: { Authorization: `Bearer ${session.access_token}` } });
        if (res.ok) setIsAdmin(true); else router.replace("/today");
      } catch { router.replace("/today"); } finally { setVerifying(false); }
    }
    checkAuth();
  }, [router]);

  // Polling for new user notifications
  useEffect(() => {
    if (!isAdmin) return;
    
    let interval: any;
    const checkNewUsers = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        const res = await fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${session?.access_token}` }});
        if (res.ok) {
          const stats = await res.json();
          if (stats.users?.total) {
            setPrevUserCount(prev => {
              if (prev !== null && stats.users.total > prev) {
                const diff = stats.users.total - prev;
                toast.success(`${diff} new user(s) just joined!`, {
                  description: "Real-time activity detected.",
                  icon: "👋",
                  duration: 8000,
                  className: "bg-background/80 backdrop-blur-xl border-primary/20",
                });
              }
              return stats.users.total;
            });
          }
        }
      } catch (e) {
        // Silently fail polling
      }
    };

    // Initial check
    checkNewUsers();
    // Poll every 10 minutes (600,000 ms)
    interval = setInterval(checkNewUsers, 600000);
    
    return () => clearInterval(interval);
  }, [isAdmin]);

  if (verifying) return <QuoteLoader fullScreen />;
  if (!isAdmin) return null;

  const handleRefresh = () => {
    setRefreshTrigger(v => v + 1);
    toast("Refreshing data...", { icon: <RefreshCw className="size-4 animate-spin" /> });
  };
  
  const handleLogout = async () => { 
    await createClient().auth.signOut(); 
    router.replace("/auth"); 
  };

  const navItems: { id: AdminTab, label: string, icon: any }[] = [
    { id: "overview", label: "Dashboard Overview", icon: Activity },
    { id: "users", label: "User Management", icon: Users },
    { id: "feedback", label: "User Feedback", icon: MessageSquare },
    { id: "user_messages", label: "Support Messages", icon: Inbox },
    { id: "broadcasts", label: "Broadcast Center", icon: Megaphone },
    { id: "notifications", label: "System Alerts", icon: Bell },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <SettingsProvider userId={userId}>
      <div className="min-h-screen bg-background text-foreground flex overflow-hidden selection:bg-primary/20 selection:text-primary">
        
        {/* Ambient Background Effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]"></div>
          <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-purple-500/5 blur-[120px]"></div>
        </div>

        {/* Premium Sidebar */}
        <aside className="hidden md:flex fixed top-0 left-0 h-full flex-col w-72 z-30 bg-background/60 backdrop-blur-2xl border-r border-white/10 dark:border-white/5">
          <div className="flex items-center h-20 px-6 border-b border-white/10 dark:border-white/5">
            <Link href="/admin" className="flex items-center gap-3 group">
              <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-all duration-500 group-hover:scale-105">
                <Shield className="size-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tight">Admin<span className="text-primary">.io</span></span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Control Center</span>
              </div>
            </Link>
          </div>
          
          <div className="px-6 py-6">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 pl-1">Menu</div>
            <nav className="space-y-1.5">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative overflow-hidden group",
                    activeTab === item.id 
                      ? "bg-primary/10 text-primary shadow-sm" 
                      : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  {activeTab === item.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                  )}
                  <item.icon className={cn("size-5 transition-transform duration-300 group-hover:scale-110", activeTab === item.id && "fill-primary/20")} />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
          
          <div className="mt-auto border-t border-white/10 dark:border-white/5 p-6">
            <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-border/50">
              <div className="size-10 rounded-full bg-gradient-to-tr from-emerald-500/80 to-emerald-500/20 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                {adminEmail.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold truncate">Administrator</span>
                <span className="text-xs text-muted-foreground truncate">{adminEmail}</span>
              </div>
            </div>
            <button onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-destructive hover:bg-destructive/10 text-sm font-bold transition-colors border border-transparent hover:border-destructive/20"><LogOut className="size-4" /> Secure Sign Out</button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col md:pl-72 min-h-screen relative z-10">
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 dark:border-white/5 bg-background/60 backdrop-blur-2xl px-6 md:px-10 h-20 transition-all">
            <div className="flex items-center gap-3">
              <Shield className="size-6 text-primary md:hidden" />
              <div>
                <h1 className="font-bold text-lg md:text-xl capitalize tracking-tight">{activeTab.replace("_", " ")}</h1>
                <p className="text-xs text-muted-foreground hidden md:block">Real-time administration dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={handleRefresh} className="flex items-center gap-2 h-10 px-4 text-sm font-bold rounded-xl border border-border/50 bg-background/50 backdrop-blur-md hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all shadow-sm group">
                <RefreshCw className="size-4 group-hover:rotate-180 transition-transform duration-700" /> 
                <span className="hidden sm:inline">Refresh Data</span>
              </button>
              <div className="h-6 w-px bg-border/50 hidden sm:block"></div>
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 p-6 md:p-10 max-w-[1600px] mx-auto w-full">
            {activeTab === "overview" && <OverviewTab refreshTrigger={refreshTrigger} />}
            {activeTab === "users" && <UsersTab refreshTrigger={refreshTrigger} />}
            {activeTab === "feedback" && <FeedbackTab refreshTrigger={refreshTrigger} />}
            {activeTab === "user_messages" && <UserMessagesTab refreshTrigger={refreshTrigger} />}
            {activeTab === "broadcasts" && <BroadcastsTab refreshTrigger={refreshTrigger} onPublish={handleRefresh} />}
            {activeTab === "notifications" && <NotificationsTab refreshTrigger={refreshTrigger} />}
            {activeTab === "settings" && <SettingsTab />}
          </main>
        </div>
      </div>
    </SettingsProvider>
  );
}

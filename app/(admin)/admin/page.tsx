"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/integrations/supabase/client";
import { QuoteLoader } from "@/components/QuoteLoader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SettingsProvider } from "@/hooks/useSettings";
import {
  Users, Activity, LogOut, Mail, UserCircle, Bell, X,
  MessageSquare, Megaphone, Send, CheckCircle2, LinkIcon,
  Shield, RefreshCw, AlertTriangle, Info, ChevronDown, Clock, Search, Filter, Inbox, TrendingUp, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

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
function ErrorState({ message, onRetry }: { message: string, onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-border bg-card p-8 text-center flex flex-col items-center justify-center gap-4">
      <AlertTriangle className="size-8 text-destructive" />
      <p className="text-foreground font-medium">{message}</p>
      <button onClick={onRetry} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold">Retry</button>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-12 text-center flex flex-col items-center justify-center space-y-3">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <h3 className="font-bold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">{description}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="p-12 flex justify-center items-center">
      <div className="size-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
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
      const res = await fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${session?.access_token}` }});
      if (!res.ok) throw new Error("Failed to fetch stats");
      setStats(await res.json());
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats, refreshTrigger]);

  if (loading && !stats) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={fetchStats} />;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Platform Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-border bg-card shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-muted-foreground"><Users className="size-4" /><span className="text-xs font-semibold uppercase">Total Users</span></div>
          <div className="text-3xl font-bold">{stats?.users?.total || 0}</div>
        </div>
        <div className="p-5 rounded-xl border border-border bg-card shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-muted-foreground"><TrendingUp className="size-4" /><span className="text-xs font-semibold uppercase">Active Today</span></div>
          <div className="text-3xl font-bold">{stats?.activeToday || Math.floor((stats?.users?.total || 0) * 0.1) || 0}</div>
        </div>
        <div className="p-5 rounded-xl border border-border bg-card shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-muted-foreground"><MessageSquare className="size-4" /><span className="text-xs font-semibold uppercase">New Feedback</span></div>
          <div className="text-3xl font-bold">{stats?.newFeedback || 0}</div>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Activity className="size-5 text-primary" /> Usage Analytics</h3>
        <div className="h-64 flex items-end gap-2 text-xs text-muted-foreground border-b border-border/50 pb-2">
          {[40, 65, 45, 80, 55, 90, 75].map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2 group cursor-default">
              <div className="w-full bg-primary/20 hover:bg-primary/40 rounded-t-sm transition-all relative flex justify-center" style={{ height: `${val}%` }}>
                 <span className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-foreground text-background px-2 py-1 rounded text-[10px] font-bold transition-opacity z-10">{val * 2} views</span>
              </div>
              <span>Day {i+1}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-6 mt-4 text-sm font-medium">
          <span className="flex items-center gap-2"><div className="size-3 bg-primary/40 rounded-sm"></div> Page Views</span>
          <span className="flex items-center gap-2"><div className="size-3 bg-primary rounded-sm"></div> Unique Users</span>
        </div>
      </div>
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
        const res = await fetch(`/api/admin/data?type=${type}`, { headers: { Authorization: `Bearer ${session?.access_token}` }});
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
      <div className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2"><Icon className="size-5 text-primary" /> {title}</h2>
        {data.length === 0 ? <EmptyState icon={Icon} title={emptyTitle} description={emptyDesc} /> : (
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] uppercase text-muted-foreground bg-muted border-b border-border tracking-wider">
                  <tr>{headers.map((h, i) => <th key={i} className="px-6 py-4 font-semibold">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.map(renderRow)}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }
}

const FeedbackTab = createDataTab({
  type: "all_feedback", title: "Feedback & Improvements", icon: MessageSquare, emptyTitle: "No Feedback", emptyDesc: "General user feedback and improvement ideas will appear here.",
  headers: ["Type", "Subject", "Message", "User Email", "Status", "Date"],
  renderRow: (item) => (
    <tr key={item.id} className="hover:bg-muted/50">
      <td className="px-6 py-3 font-semibold uppercase text-[10px] tracking-wider text-primary">{item.category}</td>
      <td className="px-6 py-3 font-medium">{item.subject}</td>
      <td className="px-6 py-3 max-w-xs truncate">{item.message}</td>
      <td className="px-6 py-3 text-muted-foreground">{item.email}</td>
      <td className="px-6 py-3"><span className="bg-muted px-2 py-1 rounded text-xs">{item.status}</span></td>
      <td className="px-6 py-3 text-muted-foreground whitespace-nowrap">{formatTimeAgo(item.created_at)}</td>
    </tr>
  )
});

const UsersTab = createDataTab({
  type: "users", title: "User Management", icon: Users, emptyTitle: "No Users", emptyDesc: "Registered users will appear here.",
  headers: ["Name", "Email", "Username", "Registered"],
  renderRow: (item) => (
    <tr key={item.id} className="hover:bg-muted/50">
      <td className="px-6 py-3 font-medium">{item.display_name || "—"}</td>
      <td className="px-6 py-3 text-muted-foreground">{item.email || "—"}</td>
      <td className="px-6 py-3 text-muted-foreground">{item.username || "—"}</td>
      <td className="px-6 py-3 text-muted-foreground whitespace-nowrap">{new Date(item.created_at).toLocaleDateString()}</td>
    </tr>
  )
});

const UserMessagesTab = createDataTab({
  type: "user_messages", title: "User Messages", icon: Inbox, emptyTitle: "No Messages", emptyDesc: "Direct user messages will appear here.",
  headers: ["Subject", "Body", "Sender", "Recipient", "Date"],
  renderRow: (item) => (
    <tr key={item.id} className="hover:bg-muted/50">
      <td className="px-6 py-3 font-medium">{item.subject}</td>
      <td className="px-6 py-3 max-w-xs truncate">{item.body}</td>
      <td className="px-6 py-3 text-muted-foreground">{item.sender_id}</td>
      <td className="px-6 py-3 text-muted-foreground">{item.recipient_id}</td>
      <td className="px-6 py-3 text-muted-foreground whitespace-nowrap">{formatTimeAgo(item.created_at)}</td>
    </tr>
  )
});

const NotificationsTab = createDataTab({
  type: "notifications", title: "Admin Notifications", icon: Bell, emptyTitle: "No Notifications", emptyDesc: "System alerts will appear here.",
  headers: ["Title", "Message", "Status", "Date"],
  renderRow: (item) => (
    <tr key={item.id} className="hover:bg-muted/50">
      <td className="px-6 py-3 font-medium">{item.title || item.type}</td>
      <td className="px-6 py-3 max-w-xs truncate">{item.message}</td>
      <td className="px-6 py-3"><span className="bg-muted px-2 py-1 rounded text-xs">{item.read ? "Read" : "Unread"}</span></td>
      <td className="px-6 py-3 text-muted-foreground whitespace-nowrap">{formatTimeAgo(item.created_at)}</td>
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
      } else {
        const d = await res.json();
        alert("Failed: " + d.message);
      }
    } catch (e: any) { alert("Error: " + e.message); }
    setIsPublishing(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold flex items-center gap-2"><Megaphone className="size-5 text-primary" /> Broadcast Messages</h2>
      
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Send className="size-4 text-primary" /> Compose Broadcast</h3>
        <div className="space-y-3">
          <input type="text" value={msgTitle} onChange={(e) => setMsgTitle(e.target.value)} placeholder="Title" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
          <textarea value={msgBody} onChange={(e) => setMsgBody(e.target.value)} placeholder="Message Body" rows={3} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
          <input type="text" value={msgUrl} onChange={(e) => setMsgUrl(e.target.value)} placeholder="URL (e.g., /today)" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
          <button onClick={handlePublish} disabled={isPublishing || !msgTitle.trim() || !msgBody.trim()} className="flex items-center gap-2 h-9 px-4 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {isPublishing ? "Publishing..." : "Publish Broadcast"}
          </button>
        </div>
      </div>

      {loading && data.length === 0 ? <LoadingState /> : error ? <ErrorState message={error} onRetry={fetchData} /> : data.length === 0 ? <EmptyState icon={Megaphone} title="No Broadcasts" description="Sent broadcasts will appear here." /> : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] uppercase text-muted-foreground bg-muted border-b border-border tracking-wider">
              <tr><th className="px-6 py-4">Title</th><th className="px-6 py-4">Message</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Sent</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map(item => (
                <tr key={item.id} className="hover:bg-muted/50">
                  <td className="px-6 py-3 font-medium max-w-[150px] truncate">{item.title}</td>
                  <td className="px-6 py-3 max-w-xs truncate">{item.body}</td>
                  <td className="px-6 py-3"><span className="bg-muted px-2 py-1 rounded text-xs">{item.status}</span></td>
                  <td className="px-6 py-3 text-muted-foreground whitespace-nowrap">{formatTimeAgo(item.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


// 3. Settings Tab
function SettingsTab() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleUpdate = async () => {
    setLoading(true); setMsg("");
    try {
      const supabase = createClient();
      const updates: any = {};
      if (email) updates.email = email;
      if (password) updates.password = password;
      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;
      setMsg("Successfully updated! Check email if you changed it.");
      setEmail(""); setPassword("");
    } catch (e: any) {
      setMsg("Error: " + e.message);
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
      if (res.ok) alert("Test notification sent successfully!");
      else alert("Failed to send test notification");
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold flex items-center gap-2"><Settings className="size-5 text-primary" /> Admin Settings</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
          <h3 className="font-semibold">Update Credentials</h3>
          <p className="text-sm text-muted-foreground">Change your admin login details.</p>
          <div className="space-y-3">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="New Email (optional)" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New Password (optional)" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            <button onClick={handleUpdate} disabled={loading || (!email && !password)} className="w-full h-9 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50">
              {loading ? "Updating..." : "Update Credentials"}
            </button>
            {msg && <p className="text-xs font-medium text-primary mt-2">{msg}</p>}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
          <h3 className="font-semibold">System Diagnostics</h3>
          <p className="text-sm text-muted-foreground">Test core system functions to ensure they are working.</p>
          <div className="space-y-3">
            <button onClick={testNotification} className="flex items-center justify-center gap-2 w-full h-9 border border-border bg-background rounded-lg font-medium text-sm hover:bg-accent">
              <Bell className="size-4" /> Test Notification System
            </button>
          </div>
        </div>
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

  if (verifying) return <QuoteLoader fullScreen />;
  if (!isAdmin) return null;

  const handleRefresh = () => setRefreshTrigger(v => v + 1);
  const handleLogout = async () => { await createClient().auth.signOut(); router.replace("/auth"); };

  const navItems: { id: AdminTab, label: string, icon: any }[] = [
    { id: "overview", label: "Dashboard Overview", icon: Activity },
    { id: "users", label: "User Management", icon: Users },
    { id: "feedback", label: "Feedback & Improvements", icon: MessageSquare },
    { id: "user_messages", label: "User Messages", icon: Inbox },
    { id: "broadcasts", label: "Broadcast Messages", icon: Megaphone },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <SettingsProvider userId={userId}>
      <div className="min-h-screen bg-background text-foreground flex">
        {/* Sidebar */}
        <aside className="hidden md:flex fixed top-0 left-0 h-full flex-col w-64 z-30 bg-sidebar border-r border-sidebar-border">
          <div className="flex items-center h-14 px-3 border-b border-sidebar-border">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg border border-border bg-background flex items-center justify-center"><Shield className="size-4 text-primary" /></div>
              <span className="font-display font-black text-lg">Admin<span className="text-primary">⁴⁰⁴</span></span>
            </Link>
          </div>
          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn("flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors", activeTab === item.id ? "bg-primary/10 text-primary" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground")}
              >
                <item.icon className="size-[18px]" />
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="border-t border-sidebar-border p-3">
            <button onClick={handleLogout} className="flex w-full items-center gap-2.5 rounded-lg p-2 text-destructive hover:bg-destructive/10 text-sm font-semibold"><LogOut className="size-4" /> Sign Out</button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col md:pl-64 min-h-screen">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-4 md:px-6 h-14">
            <div className="flex items-center gap-2">
              <Shield className="size-5 text-primary md:hidden" />
              <span className="font-semibold text-sm capitalize">{activeTab.replace("_", " ")}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleRefresh} className="flex items-center gap-2 h-9 px-3 text-sm font-medium rounded-lg border bg-card hover:bg-accent transition-colors"><RefreshCw className="size-3.5" /> Refresh</button>
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
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

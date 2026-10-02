"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/integrations/firebase/client";
import { QuoteLoader } from "@/components/QuoteLoader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SettingsProvider } from "@/hooks/useSettings";
import {
  Users,
  FolderOpen,
  Database,
  HardDrive,
  RefreshCw,
  Shield,
  Clock,
  TrendingUp,
  FileText,
  AlertTriangle,
  Info,
  ChevronDown,
  Activity,
  LogOut,
  Mail,
  UserCircle,
  Bell,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────
interface StatsData {
  notifications: Array<{
    id: string;
    uid: string;
    email: string;
    displayName: string;
    provider: string;
    createdAt: string;
    status: string;
  }>;
  users: {
    total: number;
    today: number;
    last7: number;
    last30: number;
    source: string;
    list: Array<{
      uid: string;
      email: string;
      displayName: string;
      createdAt: string;
      provider: string;
    }>;
  };
  projects: {
    total: number;
    storageEstimateBytes: number;
    source: string;
  };
  firestore: {
    documentsEstimate: number;
    usernameDocuments: number;
    messageDocuments: number;
    source: string;
    note: string;
  };
  storage: {
    usage: string;
    source: string;
    note: string;
  };
  quotas: {
    plan: string;
    firestoreStorage: { limitBytes: number; source: string };
    firestoreReadsPerDay: {
      limit: number;
      currentUsage: string;
      note: string;
      source: string;
    };
    firestoreWritesPerDay: {
      limit: number;
      currentUsage: string;
      note: string;
      source: string;
    };
    cloudStorage: { limitBytes: number; source: string };
    authUsers: { current: number; limit: string; source: string };
  };
  refreshedAt: string;
  cached: boolean;
}

type TimeFilter = "today" | "last7" | "last30";

// ── Helpers ────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

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

// ── Source badge ────────────────────────────────────────────────
function SourceBadge({ source }: { source: string }) {
  const labels: Record<string, { label: string; color: string }> = {
    firebase_auth_admin_sdk: { label: "Exact", color: "text-[var(--success)]" },
    firestore_admin_sdk_sampled: { label: "Estimated", color: "text-[var(--warning)]" },
    firebase_spark_plan_documented_limit: { label: "Documented Limit", color: "text-[var(--info)]" },
    not_available_without_cloud_monitoring: { label: "Unavailable", color: "text-[var(--destructive)]" },
    not_applicable: { label: "N/A", color: "text-muted-foreground" },
  };
  const info = labels[source] || { label: source, color: "text-muted-foreground" };
  return (
    <span className={`text-[10px] font-mono uppercase tracking-wider ${info.color}`}>
      {info.label}
    </span>
  );
}

// ── Stat card ──────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  source,
  note,
  loading,
  error,
  children,
}: {
  icon: typeof Users;
  title: string;
  value: string | number | null;
  subtitle?: string;
  source?: string;
  note?: string;
  loading?: boolean;
  error?: boolean;
  children?: React.ReactNode;
}) {
  const [showNote, setShowNote] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 flex flex-col gap-2 relative overflow-hidden group transition-all hover:border-primary/30 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="size-4 shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
            {title}
          </span>
        </div>
        {source && <SourceBadge source={source} />}
      </div>

      {loading ? (
        <div className="h-8 flex items-center">
          <div className="size-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="size-4" />
          <span className="text-sm">Failed to load</span>
        </div>
      ) : value === null || value === "unavailable" ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Info className="size-4" />
          <span className="text-sm">Unavailable</span>
        </div>
      ) : (
        <div className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          {typeof value === "number" ? formatNumber(value) : value}
        </div>
      )}

      {subtitle && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {subtitle}
        </p>
      )}

      {children}

      {note && (
        <button
          type="button"
          onClick={() => setShowNote(!showNote)}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer mt-1"
        >
          <Info className="size-3" />
          <span>Details</span>
          <ChevronDown
            className={`size-3 transition-transform ${showNote ? "rotate-180" : ""}`}
          />
        </button>
      )}
      {showNote && note && (
        <p className="text-[11px] text-muted-foreground bg-muted rounded-lg p-2 leading-relaxed border border-border mt-2">
          {note}
        </p>
      )}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────
export default function AdminDashboardPage() {
  const router = useRouter();
  const [verifying, setVerifying] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [bypassToken, setBypassToken] = useState<string | null>(null);
  
  // Login form state
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");

  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("last7");
  const [adminEmail, setAdminEmail] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // ── Verify admin claim ─────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/auth");
        return;
      }

      setAdminEmail(user.email || "");
      setUserId(user.uid);

      try {
        const token = await user.getIdToken(true); // force refresh
        const res = await fetch("/api/admin/verify", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setIsAdmin(true);
        } else {
          router.replace("/today");
        }
      } catch {
        router.replace("/today");
      } finally {
        setVerifying(false);
      }
    });
    return () => unsub();
  }, [router]);

  // ── Fetch stats ────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No auth");
      const token = await user.getIdToken();

      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      setStats(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchStats();
  }, [isAdmin, fetchStats]);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/auth");
  };

  // ── Loading / gate ─────────────────────────────────────────
  if (verifying) {
    return <QuoteLoader fullScreen />;
  }
  
  if (!isAdmin) {
    return null; // Handled by redirects
  }

  const newUsersValue =
    timeFilter === "today"
      ? stats?.users.today
      : timeFilter === "last7"
        ? stats?.users.last7
        : stats?.users.last30;

  const filterLabels: Record<TimeFilter, string> = {
    today: "Today",
    last7: "Last 7 days",
    last30: "Last 30 days",
  };

  const unreadNotifs = stats?.notifications?.length || 0;

  return (
    <SettingsProvider userId={userId}>
      <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 flex">
        {/* ── Sidebar (mimicking user app DesktopSidebar) ───────────────────────────────────────── */}
        <aside className="hidden md:flex fixed top-0 left-0 h-full flex-col w-64 z-30 select-none bg-sidebar border-r border-sidebar-border overflow-hidden">
          {/* Brand header */}
          <div className="flex items-center h-14 px-3 border-b border-sidebar-border shrink-0">
            <Link href="/admin" className="flex items-center gap-2.5 min-w-0" title="DSA⁴⁰⁴ Admin">
              <div className="size-8 rounded-lg overflow-hidden border border-border bg-background shrink-0 flex items-center justify-center">
                <Shield className="size-4 text-primary" />
              </div>
              <span className="font-display font-black tracking-tight text-lg leading-none text-foreground">
                Admin<span className="text-primary">⁴⁰⁴</span>
              </span>
            </Link>
          </div>

          {/* Nav links */}
          <nav aria-label="Sidebar navigation" className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
            <div>
              <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-foreground">Overview</p>
              <ul className="space-y-0.5">
                <li>
                  <div className="group flex items-center rounded-lg transition-all duration-150 gap-2.5 px-2.5 py-2 bg-muted text-primary font-medium">
                    <Activity className="size-[18px] shrink-0 text-primary" />
                    <span className="text-[13px] truncate flex-1">Dashboard</span>
                    <span className="ml-auto size-1.5 rounded-full bg-primary shrink-0" />
                  </div>
                </li>
                <li>
                  <a href="#user-directory" className="group flex items-center rounded-lg transition-all duration-150 gap-2.5 px-2.5 py-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground cursor-pointer">
                    <Users className="size-[18px] shrink-0 text-foreground group-hover:text-foreground" />
                    <span className="text-[13px] truncate flex-1">User Management</span>
                  </a>
                </li>
              </ul>
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t border-sidebar-border px-2 py-2.5 space-y-1 shrink-0">
            <div className="flex items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-sidebar-accent">
              <div className="size-8 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                <span className="text-xs font-bold text-primary">A</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate text-sidebar-foreground">{adminEmail.split("@")[0]}</p>
                <p className="text-[10px] text-foreground truncate">Super Admin</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-lg p-2 text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none"
            >
              <LogOut className="size-4 shrink-0" />
              <span className="text-xs font-semibold truncate">Sign Out</span>
            </button>
          </div>
        </aside>

        {/* ── Main Content Area ───────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-h-screen md:pl-64 transition-[padding]">
          
          {/* Header mimicking user header */}
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/80 backdrop-blur-xl px-4 md:px-6 h-14 shrink-0">
            <div className="flex items-center gap-2 min-w-0 md:hidden">
              <Shield className="size-5 text-primary" />
              <span className="font-bold tracking-tight text-foreground">Admin Console</span>
            </div>

            <div className="hidden md:flex items-center gap-2 min-w-0">
              <Activity className="size-4 text-primary shrink-0" />
              <span className="font-semibold text-sm">Dashboard</span>
              <span className="text-foreground mx-1">·</span>
              <span className="text-xs text-foreground truncate">Platform overview and statistics</span>
            </div>

            {/* Right controls */}
            <div className="ml-auto flex items-center gap-2 shrink-0">
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-3">
                  {error && (
                    <span className="text-xs text-destructive font-medium bg-destructive/10 px-2 py-1 rounded">
                      Update failed
                    </span>
                  )}
                  {stats?.refreshedAt && !error && (
                    <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Clock className="size-3" />
                      {formatTimeAgo(stats.refreshedAt)}
                      {stats.cached && <span className="bg-muted px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider border border-border font-medium">Cached</span>}
                    </span>
                  )}
                  
                  <button
                    onClick={fetchStats}
                    disabled={loading}
                    className="flex items-center gap-2 h-9 px-3 text-sm font-medium rounded-lg border border-border bg-card hover:bg-accent transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`size-3.5 text-foreground group-hover:text-primary transition-colors ${loading ? "animate-spin text-primary" : ""}`} />
                    {loading ? "Refreshing..." : "Refresh"}
                  </button>
                </div>
              </div>

              <button
                onClick={() => setNotificationsOpen(true)}
                className="relative flex items-center justify-center size-9 rounded-lg border border-border bg-card hover:bg-accent transition-all group"
                title="Notifications"
              >
                <Bell className="size-4 text-foreground group-hover:text-primary transition-colors" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {unreadNotifs > 99 ? "99+" : unreadNotifs}
                  </span>
                )}
              </button>

              <ThemeToggle />
            </div>
          </header>

          {/* Dashboard Content */}
          <main className="flex-1 overflow-y-auto w-full min-w-0 px-4 pb-24 pt-6 md:pb-8 md:px-6 lg:px-8 max-w-7xl mx-auto">
            
            <div className="space-y-8">
              {/* ── Users Section ───────────────────────────────────── */}
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <Users className="size-3.5" />
                  Audience & Registration
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <StatCard
                    icon={Users}
                    title="Total Registered Users"
                    value={stats?.users.total ?? null}
                    source={stats?.users.source}
                    loading={loading && !stats}
                    error={error}
                  />

                  <StatCard
                    icon={TrendingUp}
                    title={`New Users`}
                    value={newUsersValue ?? null}
                    source={stats?.users.source}
                    loading={loading && !stats}
                    error={error}
                  >
                    <div className="flex gap-1 mt-2">
                      {(["today", "last7", "last30"] as TimeFilter[]).map((f) => (
                        <button
                          key={f}
                          onClick={() => setTimeFilter(f)}
                          className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                            timeFilter === f
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-transparent text-muted-foreground border-border hover:border-foreground/30"
                          }`}
                        >
                          {filterLabels[f]}
                        </button>
                      ))}
                    </div>
                  </StatCard>

                  <StatCard
                    icon={Activity}
                    title="Auth Provider Limit"
                    value={stats?.quotas.authUsers.current ?? null}
                    subtitle={stats ? `Max limit: ${stats.quotas.authUsers.limit}` : undefined}
                    source={stats?.quotas.authUsers.source}
                    loading={loading && !stats}
                    error={error}
                  />
                </div>
              </section>

              {/* ── User List Table ─────────────────────────────────── */}
              <section id="user-directory" className="mt-8">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <UserCircle className="size-3.5" />
                  Recent User Directory (Latest 100)
                </h2>
                <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-[10px] uppercase text-muted-foreground bg-muted border-b border-border tracking-wider">
                        <tr>
                          <th className="px-6 py-4 font-semibold">User</th>
                          <th className="px-6 py-4 font-semibold">Email</th>
                          <th className="px-6 py-4 font-semibold">Registered</th>
                          <th className="px-6 py-4 font-semibold">Provider</th>
                          <th className="px-6 py-4 font-semibold">UID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {!stats ? (
                           <tr>
                             <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                               {loading ? "Loading users..." : error ? "Failed to load" : "No data"}
                             </td>
                           </tr>
                        ) : !stats.users.list || stats.users.list.length === 0 ? (
                           <tr>
                             <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                               No users found
                             </td>
                           </tr>
                        ) : (
                          stats.users.list.map((u) => (
                            <tr key={u.uid} className="hover:bg-muted/50 transition-colors group">
                              <td className="px-6 py-3 font-medium text-foreground whitespace-nowrap">
                                {u.displayName || "—"}
                              </td>
                              <td className="px-6 py-3 text-foreground/80">
                                <div className="flex items-center gap-2">
                                  <Mail className="size-3 text-muted-foreground" />
                                  {u.email || "—"}
                                </div>
                              </td>
                              <td className="px-6 py-3 text-muted-foreground whitespace-nowrap">
                                {new Date(u.createdAt).toLocaleDateString(undefined, {
                                  year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                              </td>
                              <td className="px-6 py-3">
                                <span className="bg-muted text-foreground/80 border border-border text-[10px] px-2 py-1 rounded font-mono tracking-wide">
                                  {u.provider}
                                </span>
                              </td>
                              <td className="px-6 py-3">
                                <span className="font-mono text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">
                                  {u.uid}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* ── Firestore Section ───────────────────────────────── */}
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <Database className="size-3.5" />
                  Firestore Database
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <StatCard
                    icon={FolderOpen}
                    title="User Projects"
                    value={stats?.projects.total ?? null}
                    subtitle={
                      stats
                        ? `Estimated data: ${formatBytes(stats.projects.storageEstimateBytes)}`
                        : undefined
                    }
                    source={stats?.projects.source}
                    loading={loading && !stats}
                    error={error}
                  />

                  <StatCard
                    icon={FileText}
                    title="Total Documents (est.)"
                    value={stats?.firestore.documentsEstimate ?? null}
                    source={stats?.firestore.source}
                    note={stats?.firestore.note}
                    loading={loading && !stats}
                    error={error}
                  >
                    {stats && (
                      <div className="flex flex-col gap-1 mt-2">
                        <div className="flex justify-between items-center bg-muted/50 px-2.5 py-1.5 rounded-md border border-border">
                          <span className="text-[10px] text-muted-foreground font-medium">Usernames</span>
                          <span className="text-[10px] text-foreground font-mono">{formatNumber(stats.firestore.usernameDocuments)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-muted/50 px-2.5 py-1.5 rounded-md border border-border">
                          <span className="text-[10px] text-muted-foreground font-medium">Messages</span>
                          <span className="text-[10px] text-foreground font-mono">{formatNumber(stats.firestore.messageDocuments)}</span>
                        </div>
                      </div>
                    )}
                  </StatCard>

                  <StatCard
                    icon={Database}
                    title="Firestore Limit (Spark)"
                    value={
                      stats
                        ? formatBytes(stats.quotas.firestoreStorage.limitBytes)
                        : null
                    }
                    subtitle="Free tier documented limit"
                    source={stats?.quotas.firestoreStorage.source}
                    loading={loading && !stats}
                    error={error}
                  />
                </div>
              </section>

              {/* ── Storage Section ─────────────────────────────────── */}
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <HardDrive className="size-3.5" />
                  Cloud Storage
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <StatCard
                    icon={HardDrive}
                    title="Current Usage"
                    value={stats?.storage.usage ?? null}
                    source={stats?.storage.source}
                    note={stats?.storage.note}
                    loading={loading && !stats}
                    error={error}
                  />
                  <StatCard
                    icon={HardDrive}
                    title="Capacity Limit (Spark)"
                    value={
                      stats
                        ? formatBytes(stats.quotas.cloudStorage.limitBytes)
                        : null
                    }
                    subtitle="Firebase Storage free tier limit"
                    source={stats?.quotas.cloudStorage.source}
                    loading={loading && !stats}
                    error={error}
                  />
                </div>
              </section>
            </div>
          </main>
        </div>

        {/* ── Admin Notifications Drawer ───────────────────────────────────────── */}
        <div
          className={cn(
            "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-opacity duration-300",
            notificationsOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
          onClick={() => setNotificationsOpen(false)}
        >
          <aside
            className={cn(
              "fixed top-0 right-0 z-50 h-full w-full sm:w-96 flex flex-col",
              "bg-card border-l border-border shadow-xl",
              "transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
              notificationsOpen ? "translate-x-0" : "translate-x-full"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card/80 backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <Bell className="size-4 text-primary" />
                <h2 className="font-semibold text-foreground tracking-tight">Admin Notifications</h2>
              </div>
              <button
                onClick={() => setNotificationsOpen(false)}
                className="rounded-lg p-1.5 text-foreground hover:bg-accent transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {!stats ? (
                <div className="text-center text-sm text-muted-foreground mt-10">Loading notifications...</div>
              ) : !stats.notifications || stats.notifications.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground mt-10">
                  <Bell className="size-8 mx-auto mb-3 opacity-20" />
                  No new notifications
                </div>
              ) : (
                stats.notifications.map((n) => (
                  <div key={n.id} className="p-3 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors text-sm">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-foreground">New User Registered</span>
                      <span className="text-[10px] text-muted-foreground">{formatTimeAgo(n.createdAt)}</span>
                    </div>
                    <p className="text-muted-foreground text-xs mb-2">
                      A new user has joined the platform.
                    </p>
                    <div className="bg-background rounded p-2 border border-border space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="text-foreground font-medium">{n.displayName || "—"}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="text-foreground font-medium">{n.email || "—"}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">Provider:</span>
                        <span className="text-foreground font-mono">{n.provider}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      </div>
    </SettingsProvider>
  );
}

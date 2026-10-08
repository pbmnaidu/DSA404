"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/integrations/supabase/client";
import { usePlan } from "@/hooks/usePlan";
import { useSettings } from "@/hooks/useSettings";
import { useAuth } from "@/hooks/useAuth";
import { currentStreak } from "@/lib/gamification";
import { formatDate } from "@/lib/plan";
import { Button } from "@/components/ui/button";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
 Tooltip,
 TooltipContent,
 TooltipProvider,
 TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DSA404Logo } from "@/components/DSA404Logo";
import {
 CalendarDays,
 CircleUser,
 Cloud,
 Flame,
 Menu,
 Palette,
 PauseCircle,
 Settings,
 LayoutGrid,
 CalendarRange,
 UserCircle2,
 BookmarkCheck,
 Code2,
 Trophy,
 ChevronLeft,
 ChevronRight,
 X,
 LogOut,
 Sparkles,
 Search,
 Megaphone,
 Globe,
 FolderGit2,
 Bell,
 BarChart3,
 MessageSquare,
 BookOpen,
 MoreHorizontal,
 Monitor,
 Smartphone,
  Scale,
} from "lucide-react";
import { loadUserProfile } from "@/lib/db";
import { cn } from "@/lib/utils";
import { useThemeCustomizer } from "../../app/theme-customizer-context";
import { ThemeCustomizerPanel } from "../../app/theme-customizer-panel";
import { GlobalSearchModal } from "@/components/GlobalSearchModal";
import { GitHubRepoLinkModal } from "@/components/GitHubRepoLinkModal";
import { NotificationPanel } from "@/components/NotificationPanel";
import { getLocalGitHubSyncConfig, loadCloudGitHubSyncConfig } from "@/lib/github-sync";
import { useInAppBrowser } from "@/components/in-app-browser/InAppBrowserContext";
import { DemoHelperBanner } from "@/components/DemoHelperBanner";
import { FooterDisclaimer } from "@/components/FooterDisclaimer";
import { LegalDisclaimerModal } from "@/components/LegalDisclaimerModal";
import { isGuestMode, disableGuestMode } from "@/lib/guest-data";

/* ═══════════════════════════════════════════════════════════════════════
 Navigation Configuration — preserves all original route destinations
 ═══════════════════════════════════════════════════════════════════════ */

interface NavItem {
 to: string;
 label: string;
 icon: typeof Sparkles;
 group: "learn" | "practice" | "track" | "compete" | "build" | "coach" | "account";
 hint: string;
}

const NAV: NavItem[] = [
 { to: "/today", label: "Today", icon: Sparkles, group: "learn", hint: "Your daily workspace — today's topic, problems, and streak." },
 { to: "/weeks", label: "Roadmap", icon: CalendarRange, group: "learn", hint: "Your 17-week learning roadmap with day-by-day progress." },
 { to: "/topics", label: "Topics", icon: LayoutGrid, group: "learn", hint: "All 42 Core 404 topics. Expand, track, and skip topics." },
 { to: "/problems", label: "Problems", icon: Code2, group: "practice", hint: "838+ problems — filter by platform, difficulty, or sheet." },
 { to: "/review", label: "Review", icon: BookmarkCheck, group: "practice", hint: "Problems flagged for revision, sorted by day and section." },
 { to: "/backlog", label: "Backlog", icon: CalendarDays, group: "practice", hint: "Past incomplete days. Catch up at your own pace." },
 { to: "/progress", label: "Progress", icon: BarChart3, group: "track", hint: "Streaks, badges, weekly charts, and solving progress." },
 { to: "/contests", label: "Contests", icon: Trophy, group: "compete", hint: "Live, upcoming & past contests from 5 platforms." },
 { to: "/editor", label: "Editor", icon: Code2, group: "learn", hint: "Live code editor with compile, input, output, and submission." },
 { to: "/messages", label: "Messages", icon: MessageSquare, group: "coach", hint: "Platform announcements and broadcast alerts." },
 { to: "/profile", label: "Profile", icon: UserCircle2, group: "account", hint: "Your avatar, bio, and coding platform handles." },
 { to: "/settings", label: "Settings", icon: Settings, group: "account", hint: "Adjust pace, schedule, notifications, and theme." },
 { to: "/guide", label: "Guide", icon: BookOpen, group: "account", hint: "A complete guide to every DSA⁴⁰⁴ feature and workflow." },
] as const;

const NAV_GROUPS: { key: string; label: string; items: NavItem[] }[] = [
 { key: "learn", label: "Learn", items: NAV.filter((n) => n.group === "learn") },
 { key: "practice", label: "Practice", items: NAV.filter((n) => n.group === "practice") },
 { key: "track", label: "Track", items: NAV.filter((n) => n.group === "track") },
 { key: "compete", label: "Compete", items: NAV.filter((n) => n.group === "compete") },
 { key: "coach", label: "Community", items: NAV.filter((n) => n.group === "coach") },
 { key: "account", label: "Account", items: NAV.filter((n) => n.group === "account") },
];

// Mobile bottom bar — 5 items max (design system rule)
const MOBILE_BOTTOM: NavItem[] = [
 NAV.find((n) => n.to === "/today")!,
 NAV.find((n) => n.to === "/problems")!,
 // Center slot is reserved for Search button
 NAV.find((n) => n.to === "/progress")!,
 NAV.find((n) => n.to === "/topics")!,
];

const SIDEBAR_COLLAPSED = 64;
const SIDEBAR_EXPANDED = 240;
const SIDEBAR_STORAGE_KEY = "dsa-sidebar-width";

/* ═══════════════════════════════════════════════════════════════════════
 Desktop Sidebar — Icon rail (collapsed) / Full panel (expanded)
 ═══════════════════════════════════════════════════════════════════════ */
function DesktopSidebar({
 pathname, email, streak, lastSynced, displayName, initials, photoURL, username,
 onSignOut, collapsed: pinnedCollapsed, onToggleCollapse, paused,
}: {
 pathname: string; email: string; streak: number; lastSynced: string | null;
 displayName: string; initials: string; photoURL?: string | null; username?: string;
 onSignOut: () => void; collapsed: boolean; onToggleCollapse: () => void;
 paused?: boolean;
}) {
 const { openPanel } = useThemeCustomizer();
  const [isHovered, setIsHovered] = useState(false);
  const collapsed = pinnedCollapsed && !isHovered;
  const width = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

 return (
 <aside
 className="hidden md:flex fixed top-0 left-0 h-full flex-col z-30 select-none transition-[width] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
 style={{ width }}
 aria-label="Main navigation"
    onMouseEnter={() => setIsHovered(true)}
    onMouseLeave={() => setIsHovered(false)}
  >
 <div className="flex flex-col flex-1 bg-sidebar border-r border-sidebar-border overflow-hidden h-full">

 {/* Brand header */}
 <div className="flex items-center h-14 px-3 border-b border-sidebar-border shrink-0">
 <Link href="/today" className="flex items-center gap-2.5 min-w-0" title="DSA⁴⁰⁴ — Go to Today">
 <div className="size-8 rounded-full overflow-hidden border border-border bg-background shrink-0 flex items-center justify-center">
 <DSA404Logo size={32} />
 </div>
 {!collapsed && (
 <span className="font-display font-black tracking-tight text-lg leading-none text-foreground">
 DSA<span className="text-primary">⁴⁰⁴</span>
 </span>
 )}
 </Link>
 {!collapsed && (
 <button
 onClick={onToggleCollapse}
 className="ml-auto p-1.5 rounded-md text-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
 title="Collapse sidebar"
 aria-label="Collapse sidebar"
 >
 <ChevronLeft className="size-4" />
 </button>
 )}
 </div>

 {/* Nav groups */}
 <nav aria-label="Sidebar navigation" className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
 {NAV_GROUPS.map((group) => (
 <div key={group.key}>
 {!collapsed && (
 <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-foreground">
 {group.label}
 </p>
 )}
 <ul className="space-y-0.5">
 {group.items.map((n) => {
 const isActive = pathname === n.to || (n.to !== "/" && pathname.startsWith(n.to + "/"));
 const exactActive = pathname.startsWith(n.to);

 const linkContent = (
 <Link
 href={n.to}
 aria-current={exactActive ? "page" : undefined}
 className={cn(
 "group flex items-center rounded-lg transition-all duration-150",
 collapsed ? "justify-center p-2.5" : "gap-2.5 px-2.5 py-2",
 exactActive
 ? "bg-muted text-primary font-medium"
 : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
 )}
 >
 <n.icon
 className={cn("size-[18px] shrink-0", exactActive ? "text-primary" : "text-foreground group-hover:text-foreground")}
 aria-hidden="true"
 />
 {!collapsed && (
 <>
 <span className="text-[13px] truncate flex-1">{n.label}</span>
 {n.to === "/today" && paused && (
 <span className="rounded-full bg-muted border border-border px-1.5 py-0.5 text-[9px] font-mono font-bold text-warning">
 Paused
 </span>
 )}
 {exactActive && (!paused || n.to !== "/today") && (
 <span className="ml-auto size-1.5 rounded-full bg-primary shrink-0" />
 )}
 </>
 )}
 </Link>
 );

 if (collapsed) {
 return (
 <li key={n.to}>
 <Tooltip>
 <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
 <TooltipContent side="right" className="text-xs">
 {n.label}
 </TooltipContent>
 </Tooltip>
 </li>
 );
 }

 return <li key={n.to}>{linkContent}</li>;
 })}
 </ul>
 </div>
 ))}
 </nav>

 {/* Footer */}
 <div className="border-t border-sidebar-border px-2 py-2.5 space-y-1 shrink-0">
 {/* Streak badge */}
 {streak > 0 && (
 <div className={cn("flex items-center gap-2 px-2.5 py-1.5 rounded-lg", collapsed && "justify-center")}>
 <Flame className="size-4 text-[var(--streak)] animate-streak" aria-hidden="true" />
 {!collapsed && (
 <span className="text-xs font-semibold text-[var(--streak)]">{streak} day streak</span>
 )}
 </div>
 )}

 {/* Theme & Display button */}
 <button
 onClick={() => openPanel()}
 className={cn(
 "flex w-full items-center gap-2.5 rounded-lg p-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
 collapsed && "justify-center"
 )}
 title="Theme & Display"
 >
 <Palette className="size-4 shrink-0" />
 {!collapsed && <span className="text-xs font-semibold truncate">Theme & Display</span>}
 </button>

 {/* User card */}
 <Link
 href="/profile"
 className={cn(
 "flex items-center gap-2.5 rounded-lg p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 hover:bg-sidebar-accent",
 collapsed && "justify-center"
 )}
 title="View your profile"
 >
 <div className="size-8 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
 {photoURL
 ? <img src={photoURL} alt="avatar" className="size-full object-cover" />
 : <span className="text-xs font-bold text-primary">{initials}</span>
 }
 </div>
 {!collapsed && (
 <div className="min-w-0 flex-1">
 <p className="text-xs font-semibold truncate text-sidebar-foreground">{displayName}</p>
 <p className="text-[10px] text-foreground truncate">@{username || (email ? email.split("@")[0] : "user")}</p>
 </div>
 )}
 </Link>

 {/* Collapse toggle (when expanded, shown if not already in header) */}
 {collapsed && (
 <button
 onClick={onToggleCollapse}
 className="flex w-full items-center justify-center p-2 rounded-lg text-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
 title="Expand sidebar"
 aria-label="Expand sidebar"
 >
 <ChevronRight className="size-4" />
 </button>
 )}
 </div>

 {/* Attribution */}
 {!collapsed && (
 <div className="px-3 pb-3 text-[10px] text-foreground leading-tight select-none">
 <p>
 Created by{" "}
 <a
 href="https://pbmnaiduportfolio.vercel.app"
 target="_blank"
 rel="noopener noreferrer"
 className="text-foreground font-medium hover:text-primary underline decoration-primary/30 underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 cursor-pointer"
 title="Visit Bhanu's Portfolio"
 >
 Bhanu
 </a>
 </p>
 </div>
 )}
 </div>
 </aside>
 );
}

/* ═══════════════════════════════════════════════════════════════════════
 Mobile Drawer — Full navigation (swipe from left edge)
 ═══════════════════════════════════════════════════════════════════════ */
function MobileDrawer({
 open, onClose, pathname, email, streak, lastSynced, displayName, initials, photoURL, username, onSignOut, paused,
}: {
 open: boolean; onClose: () => void; pathname: string; email: string; streak: number;
 lastSynced: string | null; displayName: string; initials: string; photoURL?: string | null; username?: string;
 onSignOut: () => void;
 paused?: boolean;
}) {
 const { openPanel } = useThemeCustomizer();

 return (
 <>
 {/* Backdrop */}
 <div
 className={cn(
 "fixed inset-0 z-40 bg-black/80 transition-opacity duration-300 md:hidden",
 open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
 )}
 aria-hidden="true"
 onClick={onClose}
 />

 {/* Drawer panel */}
 <aside
 aria-label="Navigation drawer"
 className={cn(
 "fixed top-0 left-0 z-50 h-full w-[300px] flex flex-col",
 "bg-card border-r border-border shadow-sm",
 "transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden",
 open ? "translate-x-0" : "-translate-x-full",
 )}
 >
 {/* Header — user identity */}
 <div className="relative border-b border-border px-5 pt-12 pb-5">
 <button
 onClick={onClose}
 aria-label="Close navigation"
 className="absolute top-4 right-4 rounded-lg p-1.5 text-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
 >
 <X className="size-4" />
 </button>

 <Link href="/profile" onClick={onClose} className="flex items-center gap-3">
 <div className="size-11 rounded-full bg-muted border-2 border-border flex items-center justify-center overflow-hidden shrink-0">
 {photoURL
 ? <img src={photoURL} alt="avatar" className="size-full object-cover" />
 : <span className="text-base font-bold text-primary">{initials}</span>
 }
 </div>
 <div className="min-w-0">
 <p className="font-semibold text-sm truncate">{displayName}</p>
 <p className="text-[11px] text-foreground truncate">@{username || (email ? email.split("@")[0] : "user")}</p>
 </div>
 </Link>

 {/* Streak + theme row */}
 <div className="mt-3 flex items-center gap-2">
 {streak > 0 && (
 <span className="flex items-center gap-1 rounded-full bg-[var(--streak)]/15 px-2.5 py-1 text-xs font-semibold text-[var(--streak)]">
 <Flame className="size-3.5 animate-streak" />{streak}d
 </span>
 )}
 <div className="ml-auto flex items-center gap-1">
 <ThemeToggle />
 </div>
 </div>
 </div>

 {/* Nav links grouped */}
 <nav aria-label="Drawer navigation" className="flex-1 overflow-y-auto py-3 px-3">
 {NAV_GROUPS.map((group) => (
 <div key={group.key} className="mb-4">
 <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-foreground">
 {group.label}
 </p>
 <ul className="space-y-0.5">
 {group.items.map((n) => {
 const isActive = pathname.startsWith(n.to);
 return (
 <li key={n.to}>
 <Link
 href={n.to}
 onClick={onClose}
 className={cn(
 "flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-all",
 isActive
 ? "bg-muted text-primary font-medium"
 : "text-foreground hover:bg-accent hover:text-foreground",
 )}
 >
 <n.icon className={cn("size-[18px] shrink-0", isActive ? "text-primary" : "text-foreground")} aria-hidden="true" />
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-1.5">
 <span className="text-sm">{n.label}</span>
 {n.to === "/today" && paused && (
 <span className="rounded-full bg-muted border border-border px-1.5 py-0.5 text-[9px] font-mono font-bold text-warning">
 Paused
 </span>
 )}
 </div>
 <p className="text-[10px] text-foreground line-clamp-1 mt-0.5">{n.hint}</p>
 </div>
 {isActive && <span className="shrink-0 size-1.5 rounded-full bg-primary" />}
 </Link>
 </li>
 );
 })}
 </ul>
 </div>
 ))}
 </nav>

 {/* Footer */}
 <div className="border-t border-border px-3 py-3 space-y-1 shrink-0">
 <button
 onClick={() => { openPanel(); onClose(); }}
 className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium text-foreground hover:bg-accent hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
 >
 <Palette className="size-[18px] shrink-0" />
 <span>Theme & Display</span>
 </button>

 <button
 onClick={onSignOut}
 className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
 >
 <LogOut className="size-[18px] shrink-0" />
 <span>Log Out</span>
 </button>

 <div className="pt-2 px-1 text-[10px] text-foreground leading-tight select-none">
 <p>
 Created by{" "}
 <a
 href="https://pbmnaiduportfolio.vercel.app"
 target="_blank"
 rel="noopener noreferrer"
 className="text-foreground font-medium hover:text-primary underline decoration-primary/30 underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 cursor-pointer"
 title="Visit Bhanu's Portfolio"
 >
 Bhanu
 </a>
 </p>
 </div>
 </div>
 </aside>
 </>
 );
}

/* ═══════════════════════════════════════════════════════════════════════
 AppShell — Main application layout wrapper
 ═══════════════════════════════════════════════════════════════════════ */
export function AppShell({ email, children }: { email: string; children: React.ReactNode }) {
 const [drawerOpen, setDrawerOpen] = useState(false);
 const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
 const { lastSynced, days } = usePlan();
 const { settings } = useSettings();
 const { user } = useAuth();
 const { openPanel, forceView, applyView } = useThemeCustomizer();
 const { openInApp } = useInAppBrowser();
 const router = useRouter();
 const pathname = usePathname();
 const qc = useQueryClient();
 const streak = currentStreak(days);

 const [username, setUsername] = useState<string>("");

 // Load user profile data (preserved from original)
 useEffect(() => {
 if (!user?.uid) return;
 let active = true;
 loadUserProfile(user.uid).then((p) => {
 if (active && p?.username) {
 setUsername(p.username);
 }
 if (active && p?.codingProfiles && typeof window !== "undefined") {
 try {
 localStorage.setItem("dsa_coding_profiles_v2", JSON.stringify(p.codingProfiles));
 localStorage.setItem(`dsa_coding_profiles_${user.uid}`, JSON.stringify(p.codingProfiles));
 } catch { }
 }
 }).catch(() => { });
 return () => { active = false; };
 }, [user?.uid]);

 const displayName = user?.displayName || email?.split("@")[0] || "Coder";
 const initials = displayName[0]?.toUpperCase() ?? "?";
 const photoURL = user?.photoURL;

 // Load persisted sidebar state
 useEffect(() => {
 try {
 const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
 if (saved) {
 const w = Number(saved);
 setSidebarCollapsed(w <= 80);
 }
 } catch { }
 }, []);

 const handleToggleCollapse = useCallback(() => {
 setSidebarCollapsed((prev) => {
 const next = !prev;
 try {
 localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED));
 } catch { }
 return next;
 });
 }, []);

 // Close drawer on route change
 useEffect(() => { setDrawerOpen(false); }, [pathname]);

 // Swipe- drawer (mobile) — preserved from original
 useEffect(() => {
 let startX = 0, startY = 0;
 const onTouchStart = (e: TouchEvent) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; };
 const onTouchEnd = (e: TouchEvent) => {
 const dx = e.changedTouches[0].clientX - startX;
 const dy = Math.abs(e.changedTouches[0].clientY - startY);
 if (startX < 40 && dx > 60 && dy < 80) setDrawerOpen(true);
 if (drawerOpen && dx < -60 && dy < 80) setDrawerOpen(false);
 };
 document.addEventListener("touchstart", onTouchStart, { passive: true });
 document.addEventListener("touchend", onTouchEnd, { passive: true });
 return () => {
 document.removeEventListener("touchstart", onTouchStart);
 document.removeEventListener("touchend", onTouchEnd);
 };
 }, [drawerOpen]);

 const [searchOpen, setSearchOpen] = useState(false);
 const [githubModalOpen, setGithubModalOpen] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
 const [notificationsOpen, setNotificationsOpen] = useState(false);
 const [unreadNotifCount, setUnreadNotifCount] = useState(0);

 // Auto popup for linking GitHub repository on initial start (preserved from original)
 useEffect(() => {
 if (!user?.uid || isGuestMode()) return;
 let isCancelled = false;

 (async () => {
 let cfg = getLocalGitHubSyncConfig(user.uid);
 if (!cfg?.repo) {
 try {
 const cloudCfg = await loadCloudGitHubSyncConfig(user.uid);
 if (cloudCfg?.repo) {
 cfg = cloudCfg;
 }
 } catch { }
 }

 if (isCancelled) return;

 const dismissedSession = typeof window !== "undefined" ? sessionStorage.getItem("gh_link_prompt_dismissed") : null;
 const dismissedLocal = cfg?.autoPromptDismissed;
 const isConfigured = Boolean(cfg?.repo);

 if (!isConfigured && !dismissedSession && !dismissedLocal) {
 const timer = setTimeout(() => {
 if (!isCancelled) setGithubModalOpen(true);
 }, 1500);
 return () => clearTimeout(timer);
 }
 })();

 return () => {
 isCancelled = true;
 };
 }, [user?.uid]);

 // Global listener to open GitHub sync modal from anywhere (preserved)
 useEffect(() => {
 const handleOpen = () => setGithubModalOpen(true);
 window.addEventListener("open-github-sync", handleOpen);
 return () => window.removeEventListener("open-github-sync", handleOpen);
 }, []);

 // Ctrl+K global search shortcut (preserved)
 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
 e.preventDefault();
 setSearchOpen((prev) => !prev);
 }
 };
 window.addEventListener("keydown", handleKeyDown);
 return () => window.removeEventListener("keydown", handleKeyDown);
 }, []);

 const activeNav = NAV.find((n) => pathname.startsWith(n.to)) ?? NAV[0];

 // Sign out logic (preserved)
 async function signOut() {
 await qc.cancelQueries();
 qc.clear();
 if (isGuestMode()) {
 disableGuestMode();
 }
 try {
 await createClient().auth.signOut();
 } catch {}
 router.push("/auth?next=/today");
 }

 const sharedProps = {
 pathname, email, streak, lastSynced, displayName, initials, photoURL, username,
 onSignOut: () => void signOut(),
 paused: settings.paused,
 };

 const sidebarWidth = sidebarCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

 return (
 <TooltipProvider delayDuration={200}>
 {/* Desktop sidebar */}
 <DesktopSidebar
 {...sharedProps}
 collapsed={sidebarCollapsed}
 onToggleCollapse={handleToggleCollapse}
 />

 {/* Mobile drawer */}
 <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} {...sharedProps} />

 {/* Page layout — shifts right by sidebar width on desktop */}
 <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-background">
 <div
 className="md:transition-[padding] md:duration-200 md:pl-[var(--sidebar-w)]"
 style={{ ['--sidebar-w' as string]: `${sidebarWidth}px` } as React.CSSProperties}
 >

 {/* Mobile top header */}
 <header className="sticky top-0 z-30 border-b border-border bg-background md:hidden">
 <div className="flex items-center gap-2.5 px-4 h-14">
 {/* Menu button */}
 <button
 onClick={() => setDrawerOpen((v) => !v)}
 aria-label="Open navigation"
 aria-expanded={drawerOpen}
 className="flex shrink-0 items-center justify-center size-9 rounded-lg border border-border bg-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 hover:bg-accent"
 >
 <Menu className="size-5 text-foreground" />
 </button>

 {/* Brand */}
 <Link href="/today" className="flex items-center gap-1.5">
 <DSA404Logo size={24} className="border border-border bg-background shadow-sm" />
 <span className="font-display font-black tracking-tight text-base leading-none">
 DSA<span className="text-primary">⁴⁰⁴</span>
 </span>
 </Link>

 {/* Right side controls */}
 <div className="ml-auto flex items-center gap-1.5">
 {streak > 0 && (
 <span className="flex items-center gap-1 rounded-full bg-[var(--streak)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--streak)]">
 <Flame className="size-3.5 animate-streak" />{streak}
 </span>
 )}

 {/* Notification bell */}
 <button
 type="button"
 onClick={() => setNotificationsOpen(true)}
 className="relative flex items-center justify-center size-8 rounded-lg border border-border bg-card hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
 title="Notifications"
 aria-label="Open notifications panel"
 >
 <Bell className="size-4 text-foreground" />
 {unreadNotifCount > 0 && (
 <span className="absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
 {unreadNotifCount}
 </span>
 )}
 </button>

 <button
   type="button"
   suppressHydrationWarning
    onClick={() => applyView(forceView === "desktop" ? "auto" : "desktop")}
   className="flex items-center justify-center size-8 rounded-lg border border-border bg-card hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
   title={forceView === "desktop" ? "Switch to Mobile View" : "Switch to Desktop View"}
   aria-label="Toggle view mode"
 >
   {forceView === "desktop" ? <Smartphone className="size-4 text-foreground" /> : <Monitor className="size-4 text-foreground" />}
 </button>

 <ThemeToggle />

 {/* Account dropdown */}
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" size="icon" aria-label="Account menu" className="size-8">
 <CircleUser className="size-5 text-foreground" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-56">
 <DropdownMenuLabel className="truncate text-xs font-normal text-foreground">{email}</DropdownMenuLabel>
 <DropdownMenuSeparator />
 <DropdownMenuItem asChild>
 <Link href={username ? `/profile/${username}` : "/profile"}>
 <Globe className="mr-2 size-4 text-primary" /> Public Portfolio
 </Link>
 </DropdownMenuItem>
 <DropdownMenuItem asChild><Link href="/progress"><BarChart3 className="mr-2 size-4 text-[var(--streak)]" /> Progress</Link></DropdownMenuItem>
 <DropdownMenuItem asChild><Link href="/settings"><Settings className="mr-2 size-4" /> Settings</Link></DropdownMenuItem>
 <DropdownMenuItem onSelect={() => setLegalModalOpen(true)} className="cursor-pointer">
          <Scale className="mr-2 size-4 text-primary" /> Legal &amp; Attribution
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setGithubModalOpen(true)}>
 <FolderGit2 className="mr-2 size-4 text-[var(--success)]" /> GitHub Sync
 </DropdownMenuItem>
 <DropdownMenuItem onSelect={() => openPanel()}><Palette className="mr-2 size-4" /> Theme & Display</DropdownMenuItem>
 <DropdownMenuSeparator />
 <DropdownMenuItem onSelect={() => void signOut()} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
 <LogOut className="mr-2 size-4 shrink-0" /> Log out
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 </div>
 </header>

 {/* Desktop context header */}
 <div className="hidden md:flex sticky top-0 z-20 items-center gap-3 border-b border-border bg-background px-6 h-14">
 {/* Page context */}
 <div className="flex items-center gap-2 min-w-0">
 <activeNav.icon className="size-4 text-primary shrink-0" aria-hidden="true" />
 <span className="font-semibold text-sm">{activeNav.label}</span>
 <span className="hidden lg:inline text-foreground mx-1">·</span>
 <span className="hidden lg:block text-xs text-foreground truncate">{activeNav.hint}</span>
 </div>

 {/* Center search trigger */}
 <div className="flex-1 flex justify-center max-w-xs lg:max-w-sm mx-auto px-2">
 <button
 onClick={() => setSearchOpen(true)}
 className="flex items-center gap-2 rounded-lg border border-border bg-card hover:bg-accent px-3.5 py-1.5 text-xs text-foreground transition-all w-full group"
 title="Search topics, problems, pages (Ctrl+K)"
 aria-label="Open search"
 >
 <Search className="size-3.5 text-primary group-hover:scale-110 transition-transform shrink-0" />
 <span className="truncate flex-1 text-left">Search problems, topics...</span>
 <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono text-foreground shrink-0">
 ⌘K
 </kbd>
 </button>
 </div>

 {/* Right controls */}
 <div className="ml-auto flex items-center gap-2 shrink-0">
 {streak > 0 && (
 <span className="flex items-center gap-1 rounded-full bg-[var(--streak)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--streak)]">
 <Flame className="size-3.5 animate-streak" />{streak}
 </span>
 )}

 <button
 type="button"
 onClick={() => setNotificationsOpen(true)}
 className="relative flex items-center justify-center size-9 rounded-lg border border-border bg-card hover:bg-accent transition-all group"
 title="Notifications"
 aria-label="Open notifications panel"
 >
 <Bell className="size-4 text-foreground group-hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1" />
 {unreadNotifCount > 0 && (
 <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
 {unreadNotifCount}
 </span>
 )}
 </button>

 <button
   type="button"
   suppressHydrationWarning
    onClick={() => applyView(forceView === "desktop" ? "auto" : "desktop")}
   className="relative flex items-center justify-center size-9 rounded-lg border border-border bg-card hover:bg-accent transition-all group"
   title={forceView === "desktop" ? "Switch to Mobile View" : "Switch to Desktop View"}
   aria-label="Toggle view mode"
 >
   {forceView === "desktop" ? (
     <Smartphone className="size-4 text-foreground group-hover:text-primary transition-colors focus-visible:outline-none" />
   ) : (
     <Monitor className="size-4 text-foreground group-hover:text-primary transition-colors focus-visible:outline-none" />
   )}
 </button>

 <span className="hidden xl:flex items-center gap-1.5 text-xs text-foreground">
 <Cloud className="size-3.5" />
 {lastSynced ? `Synced ${new Date(lastSynced).toLocaleTimeString()}` : "Not synced"}
 </span>

 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" size="icon" aria-label="Account menu"><CircleUser className="size-5" /></Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-56">
 <DropdownMenuLabel className="truncate text-xs font-normal text-foreground">{email}</DropdownMenuLabel>
 <DropdownMenuSeparator />
 <DropdownMenuItem onSelect={() => openInApp("https://www.codechef.com/ide", "CodeChef IDE")}>
 <Code2 className="mr-2 size-4 text-[var(--streak)]" /> Open CodeChef IDE
 </DropdownMenuItem>
 <DropdownMenuItem asChild><Link href="/progress"><BarChart3 className="mr-2 size-4 text-[var(--streak)]" /> Progress</Link></DropdownMenuItem>
 <DropdownMenuItem asChild><Link href="/today"><Sparkles className="mr-2 size-4" /> Today</Link></DropdownMenuItem>
 <DropdownMenuItem asChild><Link href="/settings"><Settings className="mr-2 size-4" /> Settings</Link></DropdownMenuItem>
 <DropdownMenuItem onSelect={() => setGithubModalOpen(true)}>
 <FolderGit2 className="mr-2 size-4 text-[var(--success)]" /> GitHub Sync
 </DropdownMenuItem>
 <DropdownMenuSeparator />
 <DropdownMenuItem onSelect={() => void signOut()} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
 <LogOut className="mr-2 size-4 shrink-0" /> Log out
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 </div>

 {/* Pause banner */}
 {settings.paused && (
 <div role="status" className="border-b border-border bg-muted">
 <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 text-sm text-warning">
 <PauseCircle className="size-4 shrink-0" />
 <span>Preparation paused since {formatDate(settings.pausedFrom ?? "")}. Your daily workspace is held at the paused day.</span>
 <Link href="/today" className="ml-auto font-semibold underline underline-offset-4 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1">
 Resume →
 </Link>
 </div>
 </div>
 )}

 {/* Main content */}
 <main className="w-full min-w-0 px-4 pb-24 pt-6 md:pb-8 md:px-6 lg:px-8">
 <DemoHelperBanner />
 {children}
 <FooterDisclaimer />
      </main>

 {/* Theme customizer */}
 <ThemeCustomizerPanel />

 {/* Mobile bottom navigation — 5 items with center search */}
 <nav
 aria-label="Quick navigation"
 className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background md:hidden safe-area-pb"
 >
 <ul className="grid grid-cols-5 items-center h-14">
 {MOBILE_BOTTOM.slice(0, 2).map((n) => (
 <li key={n.to}>
 <Link
 href={n.to}
 className={cn(
 "flex flex-col items-center gap-0.5 py-1.5 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
 pathname.startsWith(n.to) ? "text-primary font-semibold" : "text-foreground",
 )}
 >
 <n.icon className="size-5" />
 <span>{n.label}</span>
 </Link>
 </li>
 ))}

 {/* Center search button */}
 <li className="flex justify-center">
 <button
 onClick={() => setSearchOpen(true)}
 className="flex items-center justify-center size-11 rounded-full bg-primary text-primary-foreground shadow-sm shadow-primary/20 active:scale-95 transition-transform"
 title="Search (Ctrl+K)"
 aria-label="Open search"
 >
 <Search className="size-5" />
 </button>
 </li>

 {MOBILE_BOTTOM.slice(2).map((n) => (
 <li key={n.to}>
 <Link
 href={n.to}
 className={cn(
 "flex flex-col items-center gap-0.5 py-1.5 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
 pathname.startsWith(n.to) ? "text-primary font-semibold" : "text-foreground",
 )}
 >
 <n.icon className="size-5" />
 <span>{n.label}</span>
 </Link>
 </li>
 ))}
 </ul>
 </nav>
 </div>
 </div>

 {/* Global Command Search Modal */}
 <GlobalSearchModal open={searchOpen} onOpenChange={setSearchOpen} onOpenColorPanel={openPanel} />

 {/* GitHub Repository Link & Auto-Sync Modal */}
 <GitHubRepoLinkModal
 open={githubModalOpen}
 onOpenChange={setGithubModalOpen}
 userId={user?.uid}
 />

 {/* Right Side Notification Panel */}
 <LegalDisclaimerModal open={legalModalOpen} onOpenChange={setLegalModalOpen} />

      <NotificationPanel
 open={notificationsOpen}
 onClose={() => setNotificationsOpen(false)}
 onUnreadCountChange={setUnreadNotifCount}
 />
 </TooltipProvider>
 );
}



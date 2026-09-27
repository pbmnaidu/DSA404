"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePlan } from "@/hooks/usePlan";
import { useSettings } from "@/hooks/useSettings";
import { useAuth } from "@/hooks/useAuth";
import { todayIso, formatDate } from "@/lib/plan";
import { currentStreak } from "@/lib/gamification";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Bell,
  X,
  Sparkles,
  Trophy,
  Flame,
  BookmarkCheck,
  FolderGit2,
  CheckCircle2,
  Clock,
  Trash2,
  CheckCheck,
  CalendarDays,
  ChevronRight,
  ExternalLink,
  Smartphone,
} from "lucide-react";

export interface AppNotification {
  id: string;
  category: "plan" | "contest" | "streak" | "review" | "system";
  title: string;
  message: string;
  time: string;
  link?: string;
  read?: boolean;
  priority?: "high" | "normal";
}

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

const READ_STORAGE_KEY = "dsa_read_notifications_v1";
const DISMISSED_STORAGE_KEY = "dsa_dismissed_notifications_v1";

export function NotificationPanel({ open, onClose, onUnreadCountChange }: NotificationPanelProps) {
  const router = useRouter();
  const { days } = usePlan();
  const { settings } = useSettings();
  const { user } = useAuth();
  const streak = useMemo(() => currentStreak(days), [days]);

  const [filter, setFilter] = useState<"all" | "plan" | "contest" | "streak" | "system">("all");
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const saved = localStorage.getItem(READ_STORAGE_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const saved = localStorage.getItem(DISMISSED_STORAGE_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Save read/dismissed IDs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(readIds)));
    } catch {}
  }, [readIds]);

  useEffect(() => {
    try {
      localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(Array.from(dismissedIds)));
    } catch {}
  }, [dismissedIds]);

  // Generate dynamic notification list based on real plan state, streak & contests
  const allNotifications = useMemo<AppNotification[]>(() => {
    const list: AppNotification[] = [];
    const todayStr = todayIso();

    // 1. Today's Topic & Workload Notification
    const todayDay = days.find((d) => d.date === todayStr) || days[0];
    if (todayDay) {
      const remainingCount = todayDay.problems.filter((p) => !p.done).length;
      const solvedCount = todayDay.problems.filter((p) => p.done).length;
      const topicName = todayDay.topic || "Core DSA";

      if (remainingCount > 0) {
        list.push({
          id: `today-topic-${todayStr}`,
          category: "plan",
          title: `Today's Topic: ${topicName}`,
          message: `${remainingCount} problem(s) remaining for today. ${solvedCount} already solved!`,
          time: "Today",
          link: "/today",
          priority: "high",
        });
      } else if (todayDay.problems.length > 0) {
        list.push({
          id: `today-completed-${todayStr}`,
          category: "plan",
          title: `🎉 Day Complete: ${topicName}`,
          message: `Awesome work! All ${todayDay.problems.length} problems for today are completed.`,
          time: "Today",
          link: "/today",
          priority: "normal",
        });
      }
    }

    // 2. Streak Milestone Notification
    if (streak > 0) {
      list.push({
        id: `streak-active-${streak}`,
        category: "streak",
        title: `🔥 ${streak}-Day Streak Active!`,
        message: `You're on a ${streak}-day solving streak. Keep your momentum going today!`,
        time: "Active Streak",
        link: "/progress",
        priority: streak >= 3 ? "high" : "normal",
      });
    }

    // 3. Review & Bookmark Nudge
    const reviewCount = days.flatMap((d) => d.problems.filter((p) => p.forReview)).length;
    if (reviewCount > 0) {
      list.push({
        id: `review-bookmarked-${reviewCount}`,
        category: "review",
        title: `🔖 ${reviewCount} Bookmarked Problem(s)`,
        message: `You have ${reviewCount} problem(s) saved in your Review tab for recap.`,
        time: "Revision Ready",
        link: "/review",
        priority: "normal",
      });
    }

    // 4. Contest Announcement / Nudge
    list.push({
      id: `contest-weekly-alert`,
      category: "contest",
      title: "🏆 Live CP Contests",
      message: "Check live & upcoming coding contests on LeetCode, Codeforces, CodeChef & AtCoder.",
      time: "Scheduled Today",
      link: "/contests",
      priority: "normal",
    });

    // 5. GitHub Auto-Sync Reminder
    list.push({
      id: `github-sync-info`,
      category: "system",
      title: "📁 GitHub Auto-Sync Active",
      message: "Every problem you solve automatically commits solution code & key notes to your GitHub repo.",
      time: "Automated",
      link: "/settings",
      priority: "normal",
    });

    // 6. Chrome PWA / Browser Notification Setting
    if (!settings.pushEnabled) {
      list.push({
        id: `push-enable-nudge`,
        category: "system",
        title: "🔔 Enable Browser Push Reminders",
        message: "Turn on browser notifications in Settings to get morning topic alerts & contest start nudges.",
        time: "System Tip",
        link: "/settings",
        priority: "normal",
      });
    }

    return list;
  }, [days, streak, settings.pushEnabled]);

  // Active notifications (not dismissed)
  const activeNotifications = useMemo(() => {
    return allNotifications
      .filter((n) => !dismissedIds.has(n.id))
      .map((n) => ({
        ...n,
        read: readIds.has(n.id),
      }));
  }, [allNotifications, readIds, dismissedIds]);

  const unreadCount = useMemo(() => {
    return activeNotifications.filter((n) => !n.read).length;
  }, [activeNotifications]);

  // Propagate unread count to parent header badge
  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  const filteredList = useMemo(() => {
    if (filter === "all") return activeNotifications;
    return activeNotifications.filter((n) => n.category === filter);
  }, [activeNotifications, filter]);

  const markAllRead = () => {
    const newSet = new Set(readIds);
    activeNotifications.forEach((n) => newSet.add(n.id));
    setReadIds(newSet);
  };

  const clearAll = () => {
    const newSet = new Set(dismissedIds);
    activeNotifications.forEach((n) => newSet.add(n.id));
    setDismissedIds(newSet);
  };

  const toggleRead = (id: string) => {
    const newSet = new Set(readIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setReadIds(newSet);
  };

  const dismissOne = (id: string) => {
    const newSet = new Set(dismissedIds);
    newSet.add(id);
    setDismissedIds(newSet);
  };

  const getCategoryIcon = (category: AppNotification["category"]) => {
    switch (category) {
      case "plan":
        return <Sparkles className="size-4 text-primary" />;
      case "contest":
        return <Trophy className="size-4 text-amber-500" />;
      case "streak":
        return <Flame className="size-4 text-orange-500" />;
      case "review":
        return <BookmarkCheck className="size-4 text-emerald-500" />;
      case "system":
        return <FolderGit2 className="size-4 text-blue-500" />;
    }
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Right Side Panel */}
      <aside
        aria-label="Notification panel"
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-[380px] max-w-full flex flex-col",
          "bg-card/95 backdrop-blur-2xl border-l border-border shadow-2xl",
          "transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl border border-primary/30 bg-primary/15 p-2 text-primary">
              <Bell className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-foreground">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-primary px-2 py-0.5 font-mono text-[10px] font-extrabold text-primary-foreground">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Daily plan nudges, contest alerts & achievements
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            aria-label="Close notification panel"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Action Controls & Filters */}
        <div className="space-y-2 border-b border-border/60 p-3 bg-muted/20">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-1">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "plan", label: "Plan" },
                  { id: "contest", label: "Contests" },
                  { id: "streak", label: "Streak" },
                  { id: "system", label: "System" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all shrink-0 cursor-pointer",
                    filter === tab.id
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px]">
            <button
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary disabled:opacity-40 transition-colors font-medium cursor-pointer"
            >
              <CheckCheck className="size-3.5" /> Mark all read
            </button>
            <button
              onClick={clearAll}
              disabled={activeNotifications.length === 0}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-destructive disabled:opacity-40 transition-colors font-medium cursor-pointer"
            >
              <Trash2 className="size-3.5" /> Clear all
            </button>
          </div>
        </div>

        {/* Notifications Scrollable List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
          {filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6 space-y-3">
              <div className="rounded-full bg-muted/60 p-4 text-muted-foreground">
                <CheckCircle2 className="size-8" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">
                  You're all caught up!
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  No active notifications under this filter.
                </p>
              </div>
            </div>
          ) : (
            filteredList.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "group relative flex flex-col justify-between rounded-xl border p-3.5 transition-all duration-200",
                  n.read
                    ? "border-border/60 bg-card/60 opacity-80"
                    : "border-primary/40 bg-primary/5 shadow-xs"
                )}
              >
                {/* Top Row: Category icon, Title & Dismiss button */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="rounded-lg border border-border/60 bg-background p-1.5 shrink-0 mt-0.5">
                      {getCategoryIcon(n.category)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4
                          className={cn(
                            "text-xs font-bold text-foreground truncate",
                            !n.read && "text-primary"
                          )}
                        >
                          {n.title}
                        </h4>
                        {!n.read && (
                          <span className="size-2 rounded-full bg-primary shrink-0 animate-pulse" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => dismissOne(n.id)}
                    className="opacity-0 group-hover:opacity-100 rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all shrink-0"
                    title="Dismiss notification"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>

                {/* Bottom Row: Timestamp & Navigation Link */}
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="size-3" /> {n.time}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleRead(n.id)}
                      className="hover:text-foreground transition-colors font-medium cursor-pointer"
                    >
                      {n.read ? "Mark unread" : "Mark read"}
                    </button>
                    {n.link && (
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[11px] font-bold gap-1 text-primary hover:bg-primary/10"
                        onClick={onClose}
                      >
                        <Link href={n.link}>
                          View <ChevronRight className="size-3" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Panel Footer */}
        <div className="border-t border-border p-3 text-center bg-muted/20">
          <p className="text-[11px] text-muted-foreground">
            Manage your daily alert times in{" "}
            <Link
              href="/settings"
              onClick={onClose}
              className="text-primary font-semibold underline decoration-primary underline-offset-2 hover:opacity-80"
            >
              Settings
            </Link>
          </p>
        </div>
      </aside>
    </>
  );
}

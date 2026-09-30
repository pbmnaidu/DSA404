"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  deleteUser,
  EmailAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
  linkWithPopup,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth, isClosingOrHiddenError } from "@/integrations/firebase/client";
import { usePlan } from "@/hooks/usePlan";
import { useSettings } from "@/hooks/useSettings";
import { changeStartDate, deleteAccountData, updateUserProfile } from "@/lib/db";
import {
  addDays,
  daysNeeded,
  diffDays,
  formatDate,
  todayIso,
  TUTOR_PACE_PRESETS,
  getPacePresetByTarget,
  normalizeDailyCounts,
  type DailyCounts,
  type PaceTier,
} from "@/lib/plan";
import { pushState, requestPushPermission, subscribeDevice, showLocalReminder, registerReminderWorker } from "@/lib/push";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { PasswordInput } from "@/components/PasswordInput";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { CURATED_SHEETS, getSheetMeta, type SheetMeta } from "@/lib/sheets-data";
import {
  Bell,
  CalendarDays,
  Palette,
  PauseCircle,
  PlayCircle,
  Sliders,
  UserCog,
  HelpCircle,
  Trash2,
  AlertTriangle,
  Smartphone,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  BookOpen,
  Check,
  Video,
  ExternalLink,
  Layers,
  Loader2,
  Sparkles,
  FolderGit2,
} from "lucide-react";
import { GitHubIcon } from "@/components/SocialIcons";
import { getLocalGitHubSyncConfig, type GitHubSyncConfig } from "@/lib/github-sync";
import { useThemeCustomizer } from "../../../app/theme-customizer-context";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { ChromeInstallModal } from "@/components/ChromeInstallModal";
import { DailyCombinationsBreakdown } from "@/components/DailyCombinationsBreakdown";
import { cn } from "@/lib/utils";

function ChromeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <line x1="21.17" y1="8" x2="12" y2="8" />
      <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
      <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
    </svg>
  );
}




function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Bell;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card-hover mb-6 rounded-xl border border-border bg-card p-5 animate-fade-in-up">
      <div className="mb-4 flex items-start gap-3">
        <Icon className="mt-0.5 size-5 text-primary" aria-hidden="true" />
        <div>
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { settings, loading, update, userId } = useSettings();
  const { days, loading: planLoading, rebalance, shiftSchedule, startDate, reload, activeSheet, switchSheet } = usePlan();
  const qc = useQueryClient();
  const { openPanel } = useThemeCustomizer();

  const [switchingSheetId, setSwitchingSheetId] = useState<string | null>(null);
  const currentSheetId = activeSheet || settings?.activeSheet || "core404";
  const activeMeta = getSheetMeta(currentSheetId);

  const [ghConfig, setGhConfig] = useState<GitHubSyncConfig | null>(null);

  useEffect(() => {
    setGhConfig(getLocalGitHubSyncConfig(userId));
    const handleUpdate = () => {
      setGhConfig(getLocalGitHubSyncConfig(userId));
    };
    window.addEventListener("storage", handleUpdate);
    return () => window.removeEventListener("storage", handleUpdate);
  }, [userId]);

  async function handleSwitchSheet(sheetId: string) {
    if (sheetId === currentSheetId) return;
    setSwitchingSheetId(sheetId);
    try {
      await update({ activeSheet: sheetId });
      await switchSheet(sheetId);
      const targetMeta = getSheetMeta(sheetId);
      toast.success(`Switched to ${targetMeta.name}!`, {
        description: `Your roadmap and daily plan have been re-seeded with ${targetMeta.problemCount} problems across ${targetMeta.topicCount} topics.`
      });
    } catch (err: any) {
      toast.error("Failed to switch sheet", {
        description: err?.message || "Please try again."
      });
    } finally {
      setSwitchingSheetId(null);
    }
  }

  const {
    canInstall,
    isStandalone,
    isIOS,
    promptInstall,
    launchApp,
    isModalOpen,
    setIsModalOpen,
  } = usePWAInstall();




  const [name, setName] = useState(() => auth.currentUser?.displayName ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [counts, setCounts] = useState<DailyCounts>(() => normalizeDailyCounts(settings.counts));
  const [countsDirty, setCountsDirty] = useState(false);
  const [planStartDate, setPlanStartDate] = useState(() => startDate);
  const [startDirty, setStartDirty] = useState(false);
  const [startBusy, setStartBusy] = useState(false);

  // Sync counts when settings load from Firestore
  useEffect(() => {
    if (settings?.counts) {
      setCounts(normalizeDailyCounts(settings.counts));
    }
  }, [settings.counts]);

  const activePreset = getPacePresetByTarget(counts.target || 3);

  const isCountsValid =
    typeof counts.target === "number" &&
    counts.target >= 1 &&
    counts.target <= 8;

  // Live preview of what the new pace does to the finish date.
  const preview = useMemo(() => {
    const validCounts = normalizeDailyCounts(counts);
    const remaining = days.flatMap((d) => d.problems.filter((p) => !p.done));
    const need = daysNeeded(remaining, validCounts);
    const doneDays = days.filter((d) => d.problems.length > 0 && d.problems.every((p) => p.done))
      .length;
    return { remaining: remaining.length, need, finish: addDays(todayIso(), need), doneDays };
  }, [days, counts]);

  async function saveAccount() {
    setBusy(true);
    try {
      if (password || confirm) {
        if (password.length < 8) throw new Error("Password must be at least 8 characters.");
        if (password !== confirm) throw new Error("The two passwords do not match.");
      }
      const user = auth.currentUser;
      if (!user) throw new Error("Not signed in.");
      if (!name.trim() && !password) throw new Error("Nothing to update.");
      if (name.trim()) {
        await updateProfile(user, { displayName: name.trim() });
        await updateUserProfile(userId, { displayName: name.trim() });
      }
      if (password) {
        try {
          await updatePassword(user, password);
        } catch (e: any) {
          // If account was created via Google Auth, link an Email/Password credential
          if (user.email) {
            try {
              const cred = EmailAuthProvider.credential(user.email, password);
              await linkWithCredential(user, cred);
            } catch (linkErr: any) {
              if (
                linkErr?.code === "auth/provider-already-linked" ||
                linkErr?.code === "auth/credential-already-in-use"
              ) {
                await updatePassword(user, password);
              } else {
                throw e;
              }
            }
          } else {
            throw e;
          }
        }
      }
      setPassword("");
      setConfirm("");
      toast.success("Account updated");
    } catch (e) {
      const needsReauth = e instanceof FirebaseError && e.code === "auth/requires-recent-login";
      toast.error("Could not update your account", {
        description: needsReauth
          ? "For security, please sign out and sign back in before changing your password."
          : e instanceof Error
            ? e.message
            : "Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function linkGoogle() {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not signed in.");
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      try {
        await linkWithPopup(user, provider);
      } catch (linkErr: any) {
        if (isClosingOrHiddenError(linkErr)) {
          console.warn("[Auth] IndexedDB closing/hidden error during linkGoogle, retrying...", linkErr);
          await new Promise((res) => setTimeout(res, 500));
          await linkWithPopup(user, provider);
        } else {
          throw linkErr;
        }
      }
      toast.success("Google account connected");
    } catch (e: any) {
      if (e?.code === "auth/popup-closed-by-user") {
        toast.info("Google linking was cancelled.");
        return;
      }
      const already = e instanceof FirebaseError && e.code === "auth/credential-already-in-use";
      toast.error(already ? "That Google account is already linked elsewhere" : "Google sign-in failed", {
        description: isClosingOrHiddenError(e)
          ? "Connection temporarily interrupted. Please try again."
          : e instanceof Error ? e.message : String(e),
      });
    }
  }

  async function applyStartDate() {
    if (!startDirty || !planStartDate) return;
    setStartBusy(true);
    try {
      await changeStartDate(userId, planStartDate);
      reload();
      setStartDirty(false);
      toast.success("Plan start date updated", {
        description: `Your plan now starts on ${formatDate(planStartDate)}. All days have been reset.`,
      });
    } catch (e) {
      toast.error("Could not update start date. Please try again.");
    } finally {
      setStartBusy(false);
    }
  }

  async function applyCounts() {
    if (!isCountsValid) {
      toast.error("Invalid daily pace values", {
        description: "Please choose between 1 and 8 problems per day.",
      });
      return;
    }
    setBusy(true);
    try {
      const normalized = normalizeDailyCounts(counts);
      await update({ counts: normalized });
      const res = await rebalance(normalized);
      setCounts(normalized);
      setCountsDirty(false);
      toast.success("Daily pace updated", {
        description: `Remaining problems redistributed at ${normalized.target} problems/day (${activePreset.label}) — plan is now ${res.after} days (was ${res.before}), finishing ${formatDate(res.finish)}.`,
      });
    } finally {
      setBusy(false);
    }
  }

  async function togglePush(on: boolean) {
    if (!on) {
      await update({ pushEnabled: false });
      return;
    }

    // Step 1: request browser permission
    const state = await requestPushPermission();
    if (state !== "granted") {
      toast.error(
        state === "unsupported"
          ? "This browser does not support notifications"
          : "Notification permission was blocked",
        { description: "Open your browser site settings and allow notifications, then try again." },
      );
      return;
    }

    // Step 2: enable local notifications immediately (no FCM needed)
    await update({ pushEnabled: true });
    toast.success("Browser reminders on", {
      description: "You'll get a nudge at your reminder time when problems are left.",
    });

    // Step 3: attempt FCM background push subscription (best-effort, non-blocking)
    subscribeDevice(userId, true).then((ok) => {
      if (ok) {
        console.info("[push] FCM background subscription active on this device.");
      } else {
        toast.info("Tip for closed-app notifications", {
          description: "In-tab notifications are active! For reliable alerts when the app is completely closed, enable Email Notifications below.",
        });
      }
    }).catch(() => { /* silent */ });
  }

  async function pause() {
    const from = todayIso();
    await update({ paused: true, pausedFrom: from });
    toast.info("Preparation paused", {
      description: "Your schedule and problem dates are frozen. Missed-week checks are off.",
    });
  }

  async function resume() {
    toast.info("Resuming preparation", {
      description: "Resuming your schedule where you left off. Please wait a moment...",
    });
    const from = settings.pausedFrom ?? todayIso();
    const today = todayIso();
    const finish = await shiftSchedule(from);
    const gap = Math.max(0, diffDays(from, today));
    await update({
      paused: false,
      pausedFrom: null,
      pausedDays: (settings.pausedDays ?? 0) + gap,
      resumeDate: today,
    });
    toast.success("Welcome back", {
      description:
        gap > 0
          ? `Preparation resumed from today! Schedule shifted forward by ${gap} day(s). New finish date ${formatDate(finish ?? "")}.`
          : "Preparation resumed right on schedule.",
    });
  }

  const [deleting, setDeleting] = useState(false);

  async function deleteAccount() {
    setDeleting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No active user session.");

      // 1. Delete Firestore data FIRST, while the user is still authenticated.
      // Firestore's security rules key off request.auth.uid — once the Auth
      // account is deleted below, request.auth becomes null and every
      // isOwner(uid) check fails, silently skipping the entire cleanup
      // (it was previously swallowed by a .catch(console.warn)). Doing this
      // step first guarantees the DB is actually wiped.
      if (userId) {
        await deleteAccountData(userId);
      }

      // 2. Delete user from Firebase Auth
      try {
        await deleteUser(user);
      } catch (e: any) {
        if (e?.code === "auth/requires-recent-login") {
          const providerData = user.providerData;
          const isGoogle = providerData.some((p) => p.providerId === "google.com");
          if (isGoogle) {
            toast.info("Re-authenticating with Google to confirm deletion...");
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: "select_account" });
            try {
              await linkWithPopup(user, provider);
            } catch (linkErr: any) {
              if (isClosingOrHiddenError(linkErr)) {
                await new Promise((res) => setTimeout(res, 500));
                await linkWithPopup(user, provider);
              } else {
                throw linkErr;
              }
            }
            await deleteUser(user);
          } else {
            toast.error("Security timeout: Please sign out and sign back in to delete your account.");
            setDeleting(false);
            return;
          }
        } else {
          throw e;
        }
      }

      // 3. Clear local caches
      await qc.cancelQueries();
      qc.clear();
      if (typeof window !== "undefined") {
        window.localStorage.clear();
      }

      toast.success("Your account and all associated data have been permanently deleted.");
      router.push("/auth?next=/today");
    } catch (e: any) {
      toast.error("Could not delete your account", {
        description: e?.message || "Please try again.",
      });
    } finally {
      setDeleting(false);
    }
  }

  if (loading || planLoading) return <Skeleton className="h-96 w-full" />;

  const pushPerm = pushState();

  return (
    <>
      {/* Chrome PWA Install Banner - shown only if not already installed */}
      {!isStandalone && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-card to-card p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl border border-primary/30 bg-primary/15 p-2.5 text-primary shrink-0">
                <ChromeIcon className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display text-base font-bold text-foreground">
                    DSA404 Chrome App (PWA)
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-primary border border-primary/30">
                    <Smartphone className="size-3" /> Installable App
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Install directly from Chrome for home screen access, fast load times, and background notifications.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <Button
                onClick={promptInstall}
                size="sm"
                className="font-mono text-xs gap-1.5 flex-1 sm:flex-initial"
              >
                <ChromeIcon className="size-3.5" />
                Install App
              </Button>
              <Button
                onClick={() => setIsModalOpen(true)}
                variant="outline"
                size="sm"
                className="font-mono text-xs gap-1.5 flex-1 sm:flex-initial"
              >
                Guide
              </Button>
            </div>
          </div>
        </div>
      )}

      <ChromeInstallModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onLaunchApp={launchApp}
        isIOS={isIOS}
        isStandalone={isStandalone}
      />


      <h1 className="mb-1 text-2xl font-bold tracking-tight">Settings</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Account, pace, customized sheet, reminders and pause controls.
      </p>

      {/* ── Customized Sheet Selector Section ── */}
      <Section
        icon={FileSpreadsheet}
        title="Select your customized sheet"
        description="Choose your preferred curated DSA preparation sheet. Your daily plan, topic breakdown, and problem recommendations will dynamically re-seed from your chosen sheet."
      >
        {/* Active Sheet Banner */}
        <div className="mb-6 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-card to-card p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl border border-primary/30 bg-primary/15 p-2.5 text-primary shrink-0">
                <FileSpreadsheet className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display text-base font-bold text-foreground">
                    {activeMeta.name}
                  </h3>
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold border", activeMeta.badgeColor)}>
                    <CheckCircle2 className="size-3" /> Active Sheet
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Curated by <strong>{activeMeta.author}</strong> · Video tutorials by <strong>{activeMeta.channel}</strong>
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-mono text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BookOpen className="size-3.5 text-primary" />
                    <strong className="text-foreground">{activeMeta.problemCount}</strong> problems
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Layers className="size-3.5 text-primary" />
                    <strong className="text-foreground">{activeMeta.topicCount}</strong> topics / sections
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="font-mono text-xs gap-1.5 flex-1 sm:flex-initial border-primary/30 hover:bg-primary/10"
              >
                <a
                  href={activeMeta.excelFile}
                  download={activeMeta.excelFileName}
                  title={`Download ${activeMeta.name} in Excel (.xlsx) format`}
                >
                  <Download className="size-3.5 text-primary" />
                  Download Excel (.xlsx)
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Curated Sheets Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CURATED_SHEETS.map((sheet) => {
            const isActive = sheet.id === currentSheetId;
            const isSwitching = switchingSheetId === sheet.id;

            return (
              <div
                key={sheet.id}
                className={cn(
                  "relative flex flex-col justify-between rounded-xl border p-4 transition-all duration-200",
                  isActive
                    ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                    : "border-border bg-card/60 hover:border-primary/40 hover:bg-card hover:shadow-xs"
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-display font-bold text-sm text-foreground truncate">
                          {sheet.shortName}
                        </h4>
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", sheet.badgeColor)}>
                          {sheet.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        by {sheet.author}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                    {sheet.description}
                  </p>

                  <div className="mb-3 space-y-1.5 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/50">
                    <div className="flex items-center justify-between font-mono">
                      <span>Total Problems:</span>
                      <strong className="text-foreground">{sheet.problemCount}</strong>
                    </div>
                    <div className="flex items-center justify-between font-mono">
                      <span>Topics / Steps:</span>
                      <strong className="text-foreground">{sheet.topicCount}</strong>
                    </div>
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="flex items-center gap-1">
                        <Video className="size-3 text-red-500" /> Channel:
                      </span>
                      <span className="text-foreground font-semibold truncate max-w-[130px] text-right">
                        {sheet.channel}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/60 flex items-center gap-2">
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs font-mono gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <a
                      href={sheet.excelFile}
                      download={sheet.excelFileName}
                      title={`Download ${sheet.name} (.xlsx)`}
                    >
                      <Download className="size-3 text-emerald-500" />
                      .xlsx
                    </a>
                  </Button>

                  {isActive ? (
                    <Button
                      size="sm"
                      disabled
                      className="h-8 flex-1 text-xs font-semibold gap-1 bg-primary/15 text-primary border border-primary/30"
                    >
                      <Check className="size-3.5" />
                      Active Sheet
                    </Button>
                  ) : (
                    <ConfirmDialog
                      trigger={
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={switchingSheetId !== null}
                          className="h-8 flex-1 text-xs font-semibold gap-1 border-primary/40 hover:bg-primary hover:text-primary-foreground"
                        >
                          {isSwitching ? (
                            <>
                              <Loader2 className="size-3.5 animate-spin" />
                              Switching...
                            </>
                          ) : (
                            "Switch to Sheet"
                          )}
                        </Button>
                      }
                      title={`Switch to ${sheet.name}?`}
                      description={`Your study plan will be re-seeded using ${sheet.problemCount} problems across ${sheet.topicCount} topics from ${sheet.name}, starting from your plan start date (${formatDate(startDate)}). Your choice is saved to your account.`}
                      confirmLabel={`Yes, switch to ${sheet.shortName}`}
                      onConfirm={() => handleSwitchSheet(sheet.id)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section
        icon={Sliders}
        title="Daily problem pace"
        description="Choose how many problems you want to solve each day. Your tutor dynamically balances difficulty ratios across curriculum levels so your workload remains realistic."
      >
        <div className="space-y-5 max-w-xl">
          {/* Preset Cards */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Tutor-Recommended Paces
            </Label>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {(["casual", "balanced", "standard", "intensive"] as PaceTier[]).map((tierKey) => {
                const p = TUTOR_PACE_PRESETS[tierKey];
                const isSelected =
                  (counts.tier === tierKey && counts.target === p.target) ||
                  (counts.target === p.target && counts.tier !== "custom");
                return (
                  <button
                    key={tierKey}
                    type="button"
                    onClick={() => {
                      setCounts({
                        target: p.target,
                        tier: p.id,
                        easy: p.levelRatios.level1.easy,
                        medium: p.levelRatios.level2.medium,
                        hard: p.levelRatios.level3.hard,
                        levelRatios: p.levelRatios,
                      });
                      setCountsDirty(true);
                    }}
                    className={cn(
                      "relative flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30"
                        : "border-border bg-card/60 hover:border-primary/40 hover:bg-muted/30"
                    )}
                  >
                    <div className="flex w-full items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold text-foreground truncate">
                        {p.label}
                      </span>
                      {p.badge && (
                        <span className={cn(
                          "text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0",
                          tierKey === "balanced"
                            ? "bg-primary/20 text-primary font-bold"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {tierKey === "balanced" ? "⭐ Rec" : p.badge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-extrabold text-foreground tabular-nums">
                        {p.target}
                      </span>
                      <span className="text-[10px] text-muted-foreground">/ day</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-tight">
                      ~{p.timeEstimateMin}–{p.timeEstimateMax}m/d
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slider for Target */}
          <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Sparkles className="size-3.5 text-primary" />
                Target Problems Per Day
              </Label>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold text-primary tabular-nums">
                  {counts.target || 3}
                </span>
                <span className="text-xs text-muted-foreground">problems / day</span>
              </div>
            </div>
            <Slider
              min={1}
              max={6}
              step={1}
              value={[counts.target || 3]}
              onValueChange={([v]) => {
                const p = getPacePresetByTarget(v);
                const tier = (["casual", "balanced", "standard", "intensive"] as PaceTier[]).find(
                  (t) => TUTOR_PACE_PRESETS[t].target === v
                ) || "custom";
                setCounts({
                  target: v,
                  tier,
                  easy: p.levelRatios.level1.easy,
                  medium: p.levelRatios.level2.medium,
                  hard: p.levelRatios.level3.hard,
                  levelRatios: p.levelRatios,
                });
                setCountsDirty(true);
              }}
              className="py-1"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
              <span>1 problem (Light habit)</span>
              <span>3 problems (Tutor choice ⭐)</span>
              <span>6 problems (Full sprint)</span>
            </div>
          </div>

          {/* Tutor Pedagogical Workload Combinations Breakdown */}
          <DailyCombinationsBreakdown target={counts.target || 3} days={days} />

          {/* Schedule Impact Forecast Box */}
          <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-1">
            <p className="text-xs font-semibold text-foreground">
              Schedule Impact Forecast
            </p>
            <p className="text-xs text-muted-foreground">
              {preview.remaining} remaining problems · <strong>{preview.need}</strong> estimated study days.
            </p>
            <p className="text-xs text-muted-foreground">
              Projected completion date: <strong>{formatDate(preview.finish)}</strong> (based on {counts.target || 3} problems/day).
            </p>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button
              disabled={!countsDirty || busy || !isCountsValid}
              onClick={() => void applyCounts()}
              className="gap-1.5"
            >
              {busy ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Redistributing...
                </>
              ) : (
                "Apply & redistribute schedule"
              )}
            </Button>
            {countsDirty && (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                • Unsaved changes (click Apply to update schedule)
              </span>
            )}
          </div>
        </div>
      </Section>

      <Section
        icon={CalendarDays}
        title="Plan start date"
        description="Pick the date your preparation journey begins. Changing this reseeds all days from scratch."
      >
        <div className="space-y-4 max-w-lg">
          <div className="space-y-1.5">
            <Label htmlFor="plan-start-date">Start Date</Label>
            <Input
              id="plan-start-date"
              type="date"
              value={planStartDate}
              onChange={(e) => {
                setPlanStartDate(e.target.value);
                setStartDirty(true);
              }}
              className="text-sm max-w-xs"
            />
          </div>

          <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 space-y-1">
            <p className="text-xs font-semibold text-foreground">Selected Start Date Summary</p>
            <p className="text-xs text-muted-foreground">
              📅 Starting: {new Date(`${planStartDate}T00:00:00Z`).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })}
            </p>
            <p className="text-xs text-muted-foreground">
              Current active start date: <strong>{formatDate(startDate)}</strong>
            </p>
          </div>

          <ConfirmDialog
            trigger={
              <Button disabled={!startDirty || startBusy}>
                Apply new start date
              </Button>
            }
            title="Reset plan to new start date?"
            description={`This reseeds all ${preview.need} days from the new date (${planStartDate}). Your existing progress marks will be reset. This cannot be undone.`}
            confirmLabel="Yes, reset plan"
            destructive
            onConfirm={applyStartDate}
          />
        </div>
      </Section>

      <Section
        icon={settings.paused ? PlayCircle : PauseCircle}
        title="Pause preparation"
        description="Taking exams or a holiday? Pausing freezes your schedule — when you resume, every upcoming day slides forward by the time you were away, and missed-week detection stays off in the meantime."
      >
        {settings.paused ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm">
              Paused since <strong>{formatDate(settings.pausedFrom ?? "")}</strong> —{" "}
              {Math.max(0, diffDays(settings.pausedFrom ?? todayIso(), todayIso()))} day(s) so far.
            </p>
            <Button onClick={() => void resume()} className="ml-auto">
              Resume preparation
            </Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => void pause()}>
            Pause my preparation
          </Button>
        )}
        {settings.pausedDays > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            Total time paused so far: {settings.pausedDays} day(s).
          </p>
        )}
      </Section>

      <Section
        icon={Bell}
        title="Reminders & Notifications"
        description="Comprehensive configuration for background push and email alerts."
      >
        <div className="space-y-5">
          {/* Brief Detail & Troubleshooting Box */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs space-y-2">
            <p className="font-semibold text-primary text-sm flex items-center gap-1.5">
              <span>🔔 How Notifications Work & Delivery Guide</span>
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Notifications are dispatched directly from the server using background FCM push and email services, so they arrive on your device even when the website or browser tab is completely closed.
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-1">
              <li><strong>Morning Topic Alert:</strong> Sent at your morning reminder time with today's scheduled DSA topic.</li>
              <li><strong>Contest Alerts:</strong> Sent on contest day morning, 1 hour before start, and 10 minutes before start.</li>
              <li><strong>Evening Unresolved Problem Nudge:</strong> Sent at 9:30 PM (or set evening time) if you have 0 problems solved today.</li>
              <li><strong>Motivational Quotes:</strong> Sent weekdays (5 PM – 10 PM) and 4 weekend periods (morning, afternoon, evening, night).</li>
            </ul>
            <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-foreground">
              <p className="font-bold text-amber-600 dark:text-amber-400 mb-0.5">⚠️ Not Receiving Notifications?</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                If push alerts stop arriving, turn OFF the master <strong>Browser notifications</strong> toggle below, turn it back ON once again to re-register your device, allow browser permissions if asked, and click <strong>Test Notification 🔔</strong> to test popup delivery on your OS.
              </p>
            </div>
          </div>

          {/* Master Browser Notification Switch */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Label htmlFor="push" className="font-semibold text-base">Browser notifications</Label>
              <p className="text-xs text-muted-foreground">
                {pushPerm === "unsupported"
                  ? "Not supported in this browser."
                  : pushPerm === "denied"
                    ? "Blocked — open browser site settings and allow notifications."
                    : pushPerm === "granted"
                      ? "✓ Permission granted — browser notifications active."
                      : "Master toggle for all local browser alerts."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {pushPerm === "granted" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await registerReminderWorker();
                    await showLocalReminder(
                      "🔔 Test Notification — DSA404",
                      "Browser notifications are working perfectly on your device!"
                    );
                    toast.success("Test notification sent!", {
                      description: "If you didn't see a popup, check your OS Notification & Focus/Do Not Disturb settings.",
                    });
                  }}
                  className="text-xs h-8"
                >
                  Test Notification 🔔
                </Button>
              )}
              <Switch
                id="push"
                checked={settings.pushEnabled}
                disabled={pushPerm === "unsupported" || pushPerm === "denied"}
                onCheckedChange={(v) => void togglePush(v)}
              />
            </div>
          </div>

          {/* Sub-options for Browser Notifications */}
          {settings.pushEnabled && (
            <div className="ml-4 space-y-4 border-l-2 border-primary/20 pl-4 pt-1">
              {/* Morning Topic Reminder */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Label htmlFor="morning-push">Morning Topic Reminder</Label>
                  <p className="text-xs text-muted-foreground">
                    Reminds you in the morning about today's scheduled DSA topic and problems.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    id="morning-time"
                    type="time"
                    value={settings.morningReminderTime}
                    disabled={!settings.morningReminderEnabled}
                    onChange={(e) => void update({ morningReminderTime: e.target.value })}
                    className="h-8 w-32 text-xs"
                  />
                  <Switch
                    id="morning-push"
                    checked={settings.morningReminderEnabled}
                    onCheckedChange={(v) => void update({ morningReminderEnabled: v })}
                  />
                </div>
              </div>

              {/* Contest 1-Hour Reminder */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="contest-push">Contest Alert (1 hour before)</Label>
                  <p className="text-xs text-muted-foreground">
                    Alerts you 1 hour before any live coding contest (LeetCode, Codeforces, CodeChef, etc.) starts.
                  </p>
                </div>
                <Switch
                  id="contest-push"
                  checked={settings.contestReminderEnabled}
                  onCheckedChange={(v) => void update({ contestReminderEnabled: v })}
                />
              </div>

              {/* Evening Backlog Reminder */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Label htmlFor="time">Evening Backlog Nudge</Label>
                  <p className="text-xs text-muted-foreground">
                    Reminds you at your specified evening time if you still have unsolved problems today.
                  </p>
                </div>
                <Input
                  id="time"
                  type="time"
                  value={settings.reminderTime}
                  onChange={(e) => void update({ reminderTime: e.target.value })}
                  className="h-8 w-32 text-xs"
                />
              </div>
            </div>
          )}

          {/* Email Notification Switch */}
          <div className="flex items-center justify-between gap-4 pt-3 border-t border-border/50">
            <div>
              <Label htmlFor="email" className="font-semibold text-base">Email notifications</Label>
              <p className="text-xs text-muted-foreground">
                Sends email reminders exclusively for scheduled topics in your <strong>Revision tab</strong>.
              </p>
            </div>
            <Switch
              id="email"
              checked={settings.emailEnabled}
              onCheckedChange={(v) => {
                void update({ emailEnabled: v });
                toast.success(v ? "Email notifications enabled for Revision topics" : "Email notifications disabled");
              }}
            />
          </div>

          <p className="text-xs text-muted-foreground pt-1">
            Timezone: {settings.timezone}
          </p>
        </div>
      </Section>


      <Section
        icon={UserCog}
        title="Account"
        description="Change your display name or password, or connect Google."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="name">Display name</Label>
            <Input
              id="name"
              value={name}
              placeholder="Your name"
              autoComplete="name"
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="pw">New password</Label>
            <PasswordInput
              id="pw"
              value={password}
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="pw2">Confirm new password</Label>
            <PasswordInput
              id="pw2"
              value={confirm}
              autoComplete="new-password"
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button disabled={busy} onClick={() => void saveAccount()}>
            Save changes
          </Button>
          <Button variant="outline" onClick={() => void linkGoogle()}>
            Continue with Google
          </Button>
        </div>
      </Section>

      {/* ── Color Customizer ── */}
      <Section
        icon={Palette}
        title="Theme Colors"
        description="Pick from preset palettes or fine-tune every color for both light and dark modes."
      >
        <p className="text-sm text-muted-foreground mb-4">
          Personalise the accent, background, card surface, borders and more. Changes are saved to your browser and apply immediately.
        </p>
        <Button onClick={openPanel} className="gap-2">
          <Palette className="size-4" />
          Open Color Customizer
        </Button>
      </Section>

      {/* ── GitHub Auto-Sync Section ── */}
      <Section
        icon={FolderGit2}
        title="GitHub Auto-Sync"
        description="Automatically create a problem text file and commit every solution into your GitHub repository when saving code."
      >
        <div className="rounded-2xl border border-border bg-background/50 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-2xl bg-zinc-900 dark:bg-white/10 text-white flex items-center justify-center shrink-0 border border-white/15 shadow-sm">
                <GitHubIcon className="size-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display text-base font-bold text-foreground">
                    {ghConfig?.enabled && ghConfig?.repo
                      ? `${ghConfig.owner}/${ghConfig.repo}`
                      : "No GitHub Repository Linked"}
                  </h3>
                  {ghConfig?.enabled && ghConfig?.repo ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold">
                      <CheckCircle2 className="size-3" /> Auto-Sync Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground border border-border px-2 py-0.5 text-[10px] font-semibold">
                      Not connected
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {ghConfig?.enabled && ghConfig?.repo
                    ? `Commits each problem solution to branch "${ghConfig.branch || "main"}" in folder "${ghConfig.folderPath ? ghConfig.folderPath : "root"}" as a .txt file containing Key Patterns & Code.`
                    : "Connect your GitHub account and repository to automatically push every solved problem (key patterns and solution code) directly to GitHub."}
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("open-github-sync"))}
              className="gap-2 shrink-0 rounded-xl text-xs font-bold"
            >
              <FolderGit2 className="size-4" />
              {ghConfig?.enabled && ghConfig?.repo ? "Configure Repository" : "Link GitHub Repo"}
            </Button>
          </div>
        </div>
      </Section>

      {/* ── Danger Zone ── */}
      <section className="mb-6 rounded-xl border border-destructive/40 bg-destructive/5 p-5 animate-fade-in-up">
        <div className="mb-4 flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 text-destructive" aria-hidden="true" />
          <div>
            <h2 className="font-display text-lg font-semibold text-destructive">Danger Zone</h2>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and remove all stored progress, notes, submission code, and settings.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-destructive/20 pt-4">
          <div>
            <p className="text-sm font-medium text-foreground">Delete Account</p>
            <p className="text-xs text-muted-foreground">This action cannot be undone. All your progress will be wiped immediately.</p>
          </div>
        </div>

        <ConfirmDialog
          trigger={
            <Button variant="destructive" disabled={deleting} className="gap-2">
              <Trash2 className="size-4" />
              {deleting ? "Deleting..." : "Delete Account"}
            </Button>
          }
          title="Delete your account permanently?"
          description="Are you absolutely sure? This will permanently delete your user profile, solved problem history, code submissions, reminders, and custom settings. This action CANNOT be undone."
          confirmLabel="Yes, delete my account"
          destructive
          onConfirm={deleteAccount}
        />
      </section>

      {/* ── FAQ Section ── */}
      <Section
        icon={HelpCircle}
        title="Frequently Asked Questions"
        description="Answers to the most complex and advanced features of the platform."
      >
        <div className="space-y-3">
          {[
            {
              q: "Why did my remaining problems redistribute but my completed days stay the same?",
              a: "Your completed days and notes are preserved as your permanent history. When you change your Daily Problem Pace or miss days, the platform only redistributes the remaining problems forward to keep your schedule realistic without altering your past achievements."
            },
            {
              q: "How do I combine two study days if I have extra time to study?",
              a: "You can click the 'Merge Tomorrow' button on your current day's view. This absorbs tomorrow's topics and problems into today's list, allowing you to advance your plan seamlessly without breaking the sequence."
            },
            {
              q: "What is the exact difference between Skipping a day and Postponing a day?",
              a: "Skipping a day removes it entirely from your schedule, moving all future days forward by one. Postponing pushes a specific day to a new date, shifting your entire calendar back while keeping the sequence intact."
            },
            {
              q: "How does the system help me revise topics I completed weeks ago?",
              a: "You can insert a 'Revision Day' at any time. The platform will automatically select 6 problems from your previously completed topics using spaced repetition principles and create a dedicated recap day without disrupting your main plan."
            },
            {
              q: "I checked off a problem, why does it still show as incomplete in my progress?",
              a: "To fully mark a problem as completed, you must use the 'Submit' button to paste your solution code. This ensures you maintain a reviewable record of your approaches and maintains the integrity of your progress tracking."
            },
            {
              q: "Why aren't my browser push notifications working reliably on my phone?",
              a: "Browser push notifications require specific OS permissions and often need the web app to be open or installed as a PWA. For reliable offline alerts, we highly recommend enabling Email Notifications in your Settings instead."
            }
          ].map((faq, i) => (
            <details key={i} className="group rounded-xl border border-border bg-card p-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between font-medium outline-none">
                <span className="pr-4 text-foreground/90">{faq.q}</span>
                <span className="relative flex size-4 shrink-0 items-center justify-center text-muted-foreground">
                  <span className="absolute h-[2px] w-4 bg-current transition-transform duration-300 group-open:rotate-180" />
                  <span className="absolute h-4 w-[2px] bg-current transition-transform duration-300 group-open:rotate-90 group-open:opacity-0" />
                </span>
              </summary>
              <div className="mt-3 text-sm text-muted-foreground leading-relaxed animate-in slide-in-from-top-2 fade-in-50 duration-300">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </Section>

      <div className="mt-8 pt-6 border-t border-border/60 text-center space-y-2 pb-6">
        <p className="text-sm font-semibold text-foreground">
          🚀 DSA404 — a platform to help students organize and stay consistent with their DSA preparation.
        </p>
        <p className="text-xs text-muted-foreground">
          Created by{" "}
          <a
            href="https://pbmnaiduportfolio.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-foreground hover:text-primary underline decoration-primary decoration-2 underline-offset-2 transition-colors cursor-pointer"
            title="Visit Bhanu's Portfolio"
          >
            Bhanu
          </a>
        </p>
      </div>
    </>
  );
}

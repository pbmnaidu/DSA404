// src/components/ContestsPlatformBar.tsx
"use client";

import { useState } from "react";
import {
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Plus,
  Settings,
  Sparkles,
  Unlink,
  Globe,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  SUPPORTED_CONTEST_PLATFORMS,
  ContestPlatformMeta,
  extractHandleFromInput,
  getCanonicalProfileUrl,
} from "@/lib/contest-platform-linker";
import { CodingProfiles } from "@/lib/db";
import { NormalizedCodingProfile, PlatformId } from "@/lib/coding-platforms/types";

interface ContestsPlatformBarProps {
  codingProfiles: CodingProfiles;
  platformStats: Record<string, NormalizedCodingProfile>;
  onUpdateProfile: (platform: PlatformId, input: string) => Promise<void>;
  onRemoveProfile: (platform: PlatformId) => Promise<void>;
  onSyncAll: () => Promise<void>;
  isSyncing: boolean;
  modalPlatform: PlatformId | null;
  setModalPlatform: (p: PlatformId | null) => void;
  modalOnly?: boolean;
}

export function ContestsPlatformBar({
  codingProfiles,
  platformStats,
  onUpdateProfile,
  onRemoveProfile,
  onSyncAll,
  isSyncing,
  modalPlatform,
  setModalPlatform,
  modalOnly = false,
}: ContestsPlatformBarProps) {
  const [inputValue, setInputValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // When opening modal for a platform, initialize input with existing handle/URL
  const openModal = (platformId: PlatformId) => {
    const existing = codingProfiles[platformId as keyof CodingProfiles];
    setInputValue(typeof existing === "string" ? existing : "");
    setModalPlatform(platformId);
  };

  const closeModal = () => {
    setModalPlatform(null);
    setInputValue("");
    setIsSaving(false);
  };

  const activeMeta = SUPPORTED_CONTEST_PLATFORMS.find((p) => p.id === modalPlatform);
  const extractedHandle = activeMeta ? extractHandleFromInput(activeMeta.id, inputValue) : "";
  const existingRaw = modalPlatform ? (codingProfiles[modalPlatform as keyof CodingProfiles] as string | undefined) : undefined;
  const isCurrentlyLinked = Boolean(existingRaw && extractHandleFromInput(modalPlatform!, existingRaw));

  const handleSave = async () => {
    if (!modalPlatform || !activeMeta) return;
    if (!inputValue.trim()) {
      toast.error("Please enter a username or profile URL");
      return;
    }

    const cleanHandle = extractHandleFromInput(modalPlatform, inputValue);
    if (!cleanHandle) {
      toast.error("Could not extract a valid username or URL");
      return;
    }

    setIsSaving(true);
    try {
      await onUpdateProfile(modalPlatform, inputValue);
      toast.success(`${activeMeta.label} connected!`, {
        description: `@${cleanHandle} linked. Contests and ratings synced.`,
      });
      closeModal();
    } catch (err: any) {
      toast.error("Failed to connect platform", { description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnlink = async () => {
    if (!modalPlatform || !activeMeta) return;
    setIsSaving(true);
    try {
      await onRemoveProfile(modalPlatform);
      toast.success(`${activeMeta.label} unlinked`, {
        description: "Contest attendance will revert to manual marking.",
      });
      closeModal();
    } catch (err: any) {
      toast.error("Failed to unlink platform", { description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const linkedCount = SUPPORTED_CONTEST_PLATFORMS.filter((p) => {
    const raw = codingProfiles[p.id as keyof CodingProfiles];
    return raw && typeof raw === "string" && extractHandleFromInput(p.id, raw);
  }).length;

  return (
    <>
      {!modalOnly && (
        <section className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-4 sm:p-5 shadow-sm transition-all">
          {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                <Sparkles className="size-4" />
              </span>
              <h2 className="text-base font-semibold text-foreground tracking-tight">
                Linked Coding Accounts &amp; Auto-Attendance
              </h2>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {linkedCount} / {SUPPORTED_CONTEST_PLATFORMS.length} Connected
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Connect your contest profile URLs. Contests you attend will be{" "}
              <strong className="text-foreground font-medium">automatically marked as Attended</strong>, and missed contests as{" "}
              <strong className="text-foreground font-medium">Not Attended</strong> with verified ratings.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onSyncAll}
              disabled={isSyncing || linkedCount === 0}
              className="h-8 gap-1.5 text-xs font-medium"
              title="Sync latest contest participation and ratings from all linked platforms"
            >
              <RefreshCw className={cn("size-3.5", isSyncing && "animate-spin text-primary")} />
              <span>{isSyncing ? "Syncing..." : "Sync All"}</span>
            </Button>
          </div>
        </div>

        {/* Platform Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {SUPPORTED_CONTEST_PLATFORMS.map((meta) => {
            const raw = codingProfiles[meta.id as keyof CodingProfiles];
            const handle = raw && typeof raw === "string" ? extractHandleFromInput(meta.id, raw) : "";
            const isLinked = Boolean(handle);
            const stats = platformStats[meta.id];
            const profileUrl = isLinked ? getCanonicalProfileUrl(meta.id, handle) : "";

            return (
              <div
                key={meta.id}
                className={cn(
                  "relative flex flex-col justify-between rounded-xl border p-3 transition-all",
                  isLinked
                    ? "border-border/80 bg-background/50 hover:bg-background/80 shadow-xs"
                    : "border-dashed border-border/70 bg-muted/20 hover:bg-muted/40 hover:border-primary/40"
                )}
              >
                {/* Top Row: Platform Icon & Name */}
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm shrink-0">{meta.icon}</span>
                    <span className="text-xs font-semibold text-foreground truncate">
                      {meta.label}
                    </span>
                  </div>
                  {isLinked && (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-2.5" />
                      Linked
                    </span>
                  )}
                </div>

                {/* Middle info */}
                <div className="min-w-0 my-1">
                  {isLinked ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono font-medium text-foreground truncate max-w-[120px]">
                          @{handle}
                        </span>
                        {profileUrl && (
                          <a
                            href={profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors"
                            title={`Open ${handle} on ${meta.label}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>
                      {stats?.rating ? (
                        <p className="text-[11px] text-muted-foreground font-mono">
                          Rating: <span className="font-semibold text-primary">{stats.rating}</span>
                          {stats.contestsParticipated ? ` · ${stats.contestsParticipated} contests` : ""}
                        </p>
                      ) : (
                        <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">
                          Auto-tracking active
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      Not connected yet
                    </p>
                  )}
                </div>

                {/* Bottom button */}
                <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between">
                  {isLinked ? (
                    <button
                      onClick={() => openModal(meta.id)}
                      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Settings className="size-3" />
                      <span>Edit Account</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => openModal(meta.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                    >
                      <Plus className="size-3" />
                      <span>Link Handle</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      )}

      {/* Link Platform Modal */}
      <Dialog open={Boolean(modalPlatform)} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-md">
          {activeMeta && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{activeMeta.icon}</span>
                  <div>
                    <DialogTitle className="text-lg">
                      {isCurrentlyLinked ? `Manage ${activeMeta.label} Account` : `Link ${activeMeta.label} Account`}
                    </DialogTitle>
                    <DialogDescription className="text-xs mt-0.5">
                      Enter your {activeMeta.label} profile URL or handle for auto contest attendance.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Profile URL or Username
                  </label>
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={activeMeta.placeholder}
                    className="font-mono text-xs"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && inputValue.trim()) {
                        handleSave();
                      }
                    }}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Example: <span className="font-mono text-muted-foreground/90">{activeMeta.exampleUrl}</span>
                  </p>
                </div>

                {/* Live handle detection preview */}
                {extractedHandle && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">Detected Handle:</span>
                      <span className="font-mono font-bold text-primary">@{extractedHandle}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Canonical Profile:</span>
                      <a
                        href={getCanonicalProfileUrl(activeMeta.id, extractedHandle)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-foreground flex items-center gap-1 font-mono truncate max-w-[200px]"
                      >
                        {getCanonicalProfileUrl(activeMeta.id, extractedHandle)}
                        <ExternalLink className="size-2.5" />
                      </a>
                    </div>
                  </div>
                )}

                <div className="rounded-lg border border-border/70 bg-muted/40 p-3 text-[11px] text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground flex items-center gap-1">
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    Automatic Contest Tracking
                  </p>
                  <p>
                    Once linked, any contest on {activeMeta.label} that you participate in will automatically be marked as <strong>Attended ✓</strong>, with rank and rating history pulled directly from your public profile.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                {isCurrentlyLinked ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUnlink}
                    disabled={isSaving}
                    className="text-destructive hover:bg-destructive/10 text-xs gap-1"
                  >
                    <Unlink className="size-3" />
                    <span>Unlink Account</span>
                  </Button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={closeModal} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isSaving || !inputValue.trim()}>
                    {isSaving ? "Saving & Syncing..." : isCurrentlyLinked ? "Update & Sync" : "Save & Link"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

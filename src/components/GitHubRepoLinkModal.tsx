"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  loadCloudGitHubSyncConfig,
  saveGitHubSyncConfig,
  cleanupOldGitHubTokens,
  type GitHubSyncConfig,
} from "@/lib/github-sync";
import { GitHubIcon } from "./SocialIcons";
import { CheckCircle2, FolderGit2, Key, RefreshCw, Sparkles, ExternalLink, Globe, Lock } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface GitHubRepoLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string | null;
  onConfigSaved?: (config: GitHubSyncConfig) => void;
}

export function GitHubRepoLinkModal({
  open,
  onOpenChange,
  userId,
  onConfigSaved,
}: GitHubRepoLinkModalProps) {
  const router = useRouter();
  
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [branch, setBranch] = useState("main");
  const [folderPath, setFolderPath] = useState("solutions");
  const [notesFolderPath, setNotesFolderPath] = useState("notes");
  const [enabled, setEnabled] = useState(true);

  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoList, setRepoList] = useState<
    { fullName: string; owner: string; name: string; defaultBranch: string; isPrivate: boolean }[]
  >([]);
  const [testing, setTesting] = useState(false);
  
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Load existing configuration on open
  useEffect(() => {
    if (open) {
      let active = true;
      setLoadingStatus(true);
      
      // Cleanup legacy data first
      if (userId) {
          cleanupOldGitHubTokens(userId);
      }
      
      const targetUid = userId || null;
      
      if (targetUid) {
        loadCloudGitHubSyncConfig(targetUid).then((cloudCfg) => {
          if (!active) return;
          if (cloudCfg) {
            setIsAuthorized(true);
            setOwner(cloudCfg.owner || "");
            setRepo(cloudCfg.repo || "");
            setBranch(cloudCfg.branch || "main");
            setFolderPath(cloudCfg.folderPath ?? "solutions");
            setNotesFolderPath(cloudCfg.notesFolderPath ?? "notes");
            setEnabled(cloudCfg.enabled ?? true);
            fetchRepos();
          } else {
            setIsAuthorized(false);
            setOwner("");
            setRepo("");
            setBranch("main");
            setFolderPath("solutions");
            setNotesFolderPath("notes");
            setEnabled(true);
          }
          setLoadingStatus(false);
        }).catch(() => {
            if (active) setLoadingStatus(false);
        });
      } else {
          setLoadingStatus(false);
      }

      return () => { active = false; };
    }
  }, [open, userId]);

  const fetchRepos = async () => {
    setLoadingRepos(true);
    try {
      const res = await fetch("/api/github/repositories");
      if (!res.ok) {
        let errorMsg = "Failed to fetch repositories.";
        try {
          const errData = await res.json();
          if (errData.error) errorMsg = errData.error;
        } catch(e) {}
        
        if (res.status === 401) {
            setIsAuthorized(false);
            setOwner("");
            setRepo("");
            setRepoList([]);
        }
        
        throw new Error(errorMsg);
      }
      const repos = await res.json();
      setRepoList(repos);
      if (repos.length > 0 && !repo) {
         setOwner(repos[0].owner);
         setRepo(repos[0].name);
         setBranch(repos[0].defaultBranch || "main");
      }
    } catch (err: any) {
      toast.error("Could not fetch repositories", { description: err.message + " If it's not fetching, please try to reconnect." });
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleRepoSelect = (fullName: string) => {
    const selected = repoList.find((r) => r.fullName === fullName);
    if (selected) {
      setOwner(selected.owner);
      setRepo(selected.name);
      setBranch(selected.defaultBranch || "main");
    }
  };

  const handleSave = async () => {
    if (!owner.trim() || !repo.trim()) {
      toast.error("Please specify both the owner username and repository name.");
      return;
    }

    setTesting(true);
    try {
      const res = await fetch("/api/github/connection", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              owner: owner.trim(),
              repository: repo.trim(),
              branch: branch.trim(),
              folderPath: folderPath.trim(),
              notesFolderPath: notesFolderPath.trim()
          })
      });
      
      const data = await res.json();
      if (!res.ok) {
          throw new Error(data.error || "Failed to update repository settings");
      }

      const config: GitHubSyncConfig = {
        enabled,
        owner: owner.trim(),
        repo: repo.trim(),
        branch: branch.trim(),
        folderPath: folderPath.trim(),
        notesFolderPath: notesFolderPath.trim(),
        autoPromptDismissed: true,
      };

      const targetUid = userId || null;
      await saveGitHubSyncConfig(targetUid, config);
      if (onConfigSaved) onConfigSaved(config);

      toast.success("GitHub Repository linked securely! 🐙", {
        description: `Solutions will automatically push to ${owner}/${repo}.`,
      });
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Failed to connect GitHub repository", { description: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
        const res = await fetch("/api/github/connection", { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to disconnect");
        
        const config: GitHubSyncConfig = {
            enabled: false,
            owner: "",
            repo: "",
            branch: "main",
            folderPath: "solutions",
            notesFolderPath: "notes",
            autoPromptDismissed: true,
        };
        const targetUid = userId || null;
        await saveGitHubSyncConfig(targetUid, config);
        
        setIsAuthorized(false);
        setOwner("");
        setRepo("");
        setRepoList([]);
        toast.info("GitHub sync disconnected.");
    } catch (error) {
        toast.error("Error disconnecting GitHub");
    }
  };

  const handleDismiss = () => {
    const targetUid = userId || null;
    saveGitHubSyncConfig(targetUid, {
      enabled: false,
      owner: "",
      repo: "",
      branch: "main",
      autoPromptDismissed: true,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-lg border border-border bg-card -2xl shadow-sm p-6">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-lg bg-muted border border-border flex items-center justify-center text-white shrink-0 shadow-sm">
              <GitHubIcon className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                <span>Auto-Push Solutions to GitHub</span>
                <span className="rounded-full bg-muted text-primary border border-border px-2 py-0.5 text-[10px] font-bold">
                  NEW
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-foreground">
                Whenever you add your solution code and key pattern, DSA404 will automatically commit a <span className="font-mono text-foreground">.txt</span> file to your chosen repository.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {loadingStatus ? (
             <div className="flex justify-center items-center py-8">
                 <RefreshCw className="size-6 animate-spin text-primary" />
             </div>
        ) : (
            <div className="space-y-4 py-2">
            {/* Step 1: Authorization */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Key className="size-3.5 text-primary" />
                    GitHub Connection
                </Label>
                {isAuthorized && (
                    <span className="text-[11px] font-semibold text-success flex items-center gap-1">
                        <CheckCircle2 className="size-3" /> Authorized
                    </span>
                )}
                </div>
                {!isAuthorized ? (
                    <div className="flex flex-col gap-2">
                        <Button
                            type="button"
                            onClick={() => window.location.href = `/api/github/connect?next=${encodeURIComponent(window.location.pathname + window.location.search)}`}
                            className="w-full rounded-lg text-xs font-semibold h-10 gap-2 bg-foreground text-background hover:bg-foreground/90"
                        >
                            <GitHubIcon className="size-4" />
                            <span>Connect with GitHub</span>
                        </Button>
                        <p className="text-[10px] text-muted-foreground text-center">
                            Authorizing grants the <strong>repo</strong> scope, which allows reading and writing to your public and private repositories.
                        </p>
                    </div>
                ) : (
                    <div className="flex items-center justify-between rounded-lg border border-border bg-muted p-3">
                        <div className="flex items-center gap-2">
                            <GitHubIcon className="size-4 text-foreground" />
                            <span className="text-sm font-medium text-foreground">Connected to GitHub</span>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleDisconnect}
                            className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                        >
                            Disconnect
                        </Button>
                    </div>
                )}
            </div>

            {/* Step 2: Repository Selection */}
            {isAuthorized && (
                <>
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <FolderGit2 className="size-3.5 text-success" />
                        Target Repository
                    </Label>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={fetchRepos}
                            disabled={loadingRepos}
                            className="h-6 px-2 text-[10px]"
                        >
                            <RefreshCw className={loadingRepos ? "size-3 animate-spin mr-1" : "size-3 mr-1"} />
                            Refresh
                        </Button>
                    </div>
                    </div>

                    {repoList.length > 0 ? (
                    <select
                        value={owner && repo ? `${owner}/${repo}` : ""}
                        onChange={(e) => handleRepoSelect(e.target.value)}
                        className="w-full h-9 rounded-lg bg-background border border-border px-3 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                        <option value="">-- Select a repository --</option>
                        {repoList.map((r) => (
                        <option key={r.fullName} value={r.fullName} className="bg-popover text-popover-foreground">
                            {r.fullName} {r.isPrivate ? "🔒" : "🌐"}
                        </option>
                        ))}
                    </select>
                    ) : (
                    <div className="grid grid-cols-2 gap-2">
                        <Input
                        placeholder="Owner (e.g. username)"
                        value={owner}
                        onChange={(e) => setOwner(e.target.value)}
                        className="font-mono text-xs rounded-lg bg-background border-border"
                        />
                        <Input
                        placeholder="Repo (e.g. dsa-solutions)"
                        value={repo}
                        onChange={(e) => setRepo(e.target.value)}
                        className="font-mono text-xs rounded-lg bg-background border-border"
                        />
                    </div>
                    )}
                </div>

                {/* Step 3: Branch and Subfolder */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Branch</Label>
                    <Input
                        placeholder="main"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        className="font-mono text-xs rounded-lg bg-background border-border h-8"
                    />
                    </div>
                    <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Solutions Folder</Label>
                    <Input
                        placeholder="solutions (blank for root)"
                        value={folderPath}
                        onChange={(e) => setFolderPath(e.target.value)}
                        className="font-mono text-xs rounded-lg bg-background border-border h-8"
                    />
                    </div>
                    <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Notes Folder</Label>
                    <Input
                        placeholder="notes"
                        value={notesFolderPath}
                        onChange={(e) => setNotesFolderPath(e.target.value)}
                        className="font-mono text-xs rounded-lg bg-background border-border h-8"
                    />
                    </div>
                </div>

                {/* Step 4: Auto-sync toggle */}
                <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                    <div className="space-y-0.5">
                    <Label htmlFor="auto-sync-toggle" className="text-xs font-bold text-foreground cursor-pointer">
                        Auto-Push Every Solved Problem
                    </Label>
                    <p className="text-[11px] text-foreground">
                        Creates a <span className="font-mono text-foreground">&lt;Problem_Name&gt;.txt</span> with Key Patterns &amp; Code automatically.
                    </p>
                    </div>
                    <Switch id="auto-sync-toggle" checked={enabled} onCheckedChange={setEnabled} />
                </div>
                </>
            )}
            </div>
        )}

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            {!isAuthorized && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="rounded-lg text-xs h-8 text-foreground"
              >
                Maybe Later
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-lg text-xs h-8"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={testing || !isAuthorized || !repo.trim()}
              className="rounded-lg text-xs h-8 font-bold bg-primary hover:bg-muted text-primary-foreground shadow-sm gap-1.5"
            >
              {testing ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : isAuthorized ? (
                <>
                  <CheckCircle2 className="size-3.5" />
                  <span>Update Settings</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5" />
                  <span>Setup required</span>
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

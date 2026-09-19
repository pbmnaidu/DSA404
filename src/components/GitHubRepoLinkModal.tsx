// src/components/GitHubRepoLinkModal.tsx
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
  getLocalGitHubSyncConfig,
  saveGitHubSyncConfig,
  fetchUserRepositories,
  validateGitHubRepo,
  createGitHubRepository,
  type GitHubSyncConfig,
} from "@/lib/github-sync";
import { GitHubIcon } from "./SocialIcons";
import { CheckCircle2, ExternalLink, FolderGit2, Key, RefreshCw, Sparkles, AlertCircle, Plus, Lock, Globe } from "lucide-react";
import { toast } from "sonner";

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
  const [token, setToken] = useState("");
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [branch, setBranch] = useState("main");
  const [folderPath, setFolderPath] = useState("solutions");
  const [enabled, setEnabled] = useState(true);

  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoList, setRepoList] = useState<
    { fullName: string; owner: string; name: string; defaultBranch: string; isPrivate: boolean }[]
  >([]);
  const [testing, setTesting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // In-modal repo creation state
  const [showCreateRepo, setShowCreateRepo] = useState(false);
  const [newRepoName, setNewRepoName] = useState("dsa-solutions");
  const [newRepoPrivate, setNewRepoPrivate] = useState(false);
  const [creatingRepo, setCreatingRepo] = useState(false);

  // Load existing configuration on open
  useEffect(() => {
    if (open) {
      const cfg = getLocalGitHubSyncConfig(userId);
      if (cfg) {
        setToken(cfg.token || "");
        setOwner(cfg.owner || "");
        setRepo(cfg.repo || "");
        setBranch(cfg.branch || "main");
        setFolderPath(cfg.folderPath ?? "solutions");
        setEnabled(cfg.enabled ?? true);
        setIsConnected(Boolean(cfg.token && cfg.repo));
      } else {
        setToken("");
        setOwner("");
        setRepo("");
        setBranch("main");
        setFolderPath("solutions");
        setEnabled(true);
        setIsConnected(false);
      }
    }
  }, [open, userId]);

  const handleFetchRepos = async () => {
    if (!token.trim()) {
      toast.error("Please enter your GitHub Personal Access Token first.");
      return;
    }
    setLoadingRepos(true);
    try {
      const repos = await fetchUserRepositories(token);
      setRepoList(repos);
      if (repos.length > 0) {
        toast.success(`Found ${repos.length} repositories! Select one from the list.`);
        // Auto-select first repo if none selected
        if (!repo) {
          setOwner(repos[0].owner);
          setRepo(repos[0].name);
          setBranch(repos[0].defaultBranch || "main");
        }
      } else {
        toast.info("No repositories found on this account.");
      }
    } catch (err: any) {
      toast.error("Could not fetch repositories", { description: err.message });
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

  const handleCreateRepo = async () => {
    if (!token.trim()) {
      toast.error("Please enter your GitHub Personal Access Token in Step 1 first.");
      return;
    }
    if (!newRepoName.trim()) {
      toast.error("Please enter a repository name.");
      return;
    }

    setCreatingRepo(true);
    try {
      const res = await createGitHubRepository(token, newRepoName, newRepoPrivate);
      if (!res.success) {
        toast.error("Failed to create repository", { description: res.error });
        return;
      }

      const newEntry = {
        fullName: res.fullName || `${res.owner}/${res.name}`,
        owner: res.owner || "",
        name: res.name || newRepoName,
        defaultBranch: res.defaultBranch || "main",
        isPrivate: newRepoPrivate,
      };

      setRepoList((prev) => [newEntry, ...prev]);
      setOwner(newEntry.owner);
      setRepo(newEntry.name);
      setBranch(newEntry.defaultBranch);
      setShowCreateRepo(false);
      toast.success(`Repository "${newEntry.fullName}" created successfully on GitHub! 🎉`, {
        description: "Selected as your target repository with initialized main branch.",
      });
    } catch (err: any) {
      toast.error("Failed to create repository", { description: err.message });
    } finally {
      setCreatingRepo(false);
    }
  };

  const handleSave = async () => {
    if (!token.trim()) {
      toast.error("Please enter a GitHub Personal Access Token.");
      return;
    }
    if (!owner.trim() || !repo.trim()) {
      toast.error("Please specify a target repository.");
      return;
    }

    setTesting(true);
    try {
      const check = await validateGitHubRepo(token, owner, repo);
      if (!check.valid) {
        toast.error("Repository verification failed", { description: check.error });
        setTesting(false);
        return;
      }

      const finalBranch = branch.trim() || check.defaultBranch || "main";
      const config: GitHubSyncConfig = {
        enabled,
        token: token.trim(),
        owner: owner.trim(),
        repo: repo.trim(),
        branch: finalBranch,
        folderPath: folderPath.trim(),
        lastSyncedAt: new Date().toISOString(),
        autoPromptDismissed: true,
      };

      await saveGitHubSyncConfig(userId, config);
      setIsConnected(true);
      if (onConfigSaved) onConfigSaved(config);

      toast.success("GitHub Repository linked successfully! 🚀", {
        description: `Solutions will automatically push to ${owner}/${repo} as .txt files.`,
      });
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Failed to connect GitHub repository", { description: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    const config: GitHubSyncConfig = {
      enabled: false,
      token: "",
      owner: "",
      repo: "",
      branch: "main",
      folderPath: "solutions",
      autoPromptDismissed: true,
    };
    await saveGitHubSyncConfig(userId, config);
    setToken("");
    setOwner("");
    setRepo("");
    setIsConnected(false);
    toast.info("GitHub sync disconnected.");
    onOpenChange(false);
  };

  const handleDismiss = () => {
    const existing = getLocalGitHubSyncConfig(userId);
    if (!existing) {
      // Mark as dismissed so startup popup doesn't reappear repeatedly
      saveGitHubSyncConfig(userId, {
        enabled: false,
        token: "",
        owner: "",
        repo: "",
        branch: "main",
        autoPromptDismissed: true,
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl border border-white/15 bg-card/95 backdrop-blur-2xl shadow-2xl p-6">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-2xl bg-zinc-900 dark:bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-md">
              <GitHubIcon className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                <span>Auto-Push Solutions to GitHub</span>
                <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[10px] font-bold">
                  NEW
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Whenever you add your solution code and key pattern, DSA404 will automatically commit a <span className="font-mono text-foreground">.txt</span> file to your chosen repository.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Step 1: Personal Access Token */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="gh-token" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Key className="size-3.5 text-primary" />
                GitHub Personal Access Token (PAT)
              </Label>
              <a
                href="https://github.com/settings/tokens/new?description=DSA404%20Solutions%20Sync&scopes=repo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
              >
                <span>Generate token</span>
                <ExternalLink className="size-2.5" />
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Input
                id="gh-token"
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="font-mono text-xs rounded-xl bg-background/60 border-white/10"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleFetchRepos}
                disabled={loadingRepos || !token.trim()}
                className="shrink-0 rounded-xl text-xs font-semibold gap-1.5 h-9"
              >
                <RefreshCw className={loadingRepos ? "size-3.5 animate-spin" : "size-3.5"} />
                <span>Fetch Repos</span>
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Needs <strong className="text-foreground font-mono">repo</strong> scope to create solution text files in your repository.
            </p>
          </div>

          {/* Step 2: Repository Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="gh-repo" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <FolderGit2 className="size-3.5 text-emerald-400" />
                Target Repository
              </Label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateRepo((v) => !v)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                >
                  <Plus className="size-3" />
                  <span>{showCreateRepo ? "Select Existing" : "Create New Repo"}</span>
                </button>
                <span className="text-muted-foreground/40 text-[10px]">|</span>
                <a
                  href="https://github.com/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                  title="Create repo directly on GitHub.com"
                >
                  <span>GitHub.com</span>
                  <ExternalLink className="size-2.5" />
                </a>
              </div>
            </div>

            {/* Inline Create Repo Box */}
            {showCreateRepo && (
              <div className="p-3 rounded-2xl border border-primary/30 bg-primary/5 space-y-3 animate-fade-in-up">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Plus className="size-3.5 text-primary" /> Create Repository on GitHub
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">auto-initialized with main</span>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground font-semibold">Repository Name</Label>
                  <Input
                    placeholder="e.g. dsa-solutions"
                    value={newRepoName}
                    onChange={(e) => setNewRepoName(e.target.value)}
                    className="font-mono text-xs rounded-xl bg-background/70 border-white/10 h-8"
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5">
                    {newRepoPrivate ? <Lock className="size-3.5 text-amber-400" /> : <Globe className="size-3.5 text-blue-400" />}
                    <Label htmlFor="new-repo-private" className="text-xs font-medium cursor-pointer">
                      {newRepoPrivate ? "Private Repository" : "Public Repository"}
                    </Label>
                  </div>
                  <Switch
                    id="new-repo-private"
                    checked={newRepoPrivate}
                    onCheckedChange={setNewRepoPrivate}
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreateRepo(false)}
                    className="h-7 text-xs rounded-lg text-muted-foreground"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateRepo}
                    disabled={creatingRepo || !token.trim() || !newRepoName.trim()}
                    className="h-7 text-xs rounded-lg font-bold gap-1 bg-primary text-primary-foreground"
                  >
                    {creatingRepo ? (
                      <>
                        <RefreshCw className="size-3 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="size-3" />
                        Create &amp; Select
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {!showCreateRepo && repoList.length > 0 && (
              <select
                value={owner && repo ? `${owner}/${repo}` : ""}
                onChange={(e) => handleRepoSelect(e.target.value)}
                className="w-full h-9 rounded-xl bg-background/60 border border-white/10 px-3 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">-- Select a repository --</option>
                {repoList.map((r) => (
                  <option key={r.fullName} value={r.fullName} className="bg-popover text-popover-foreground">
                    {r.fullName} {r.isPrivate ? "🔒" : "🌐"}
                  </option>
                ))}
              </select>
            )}

            {!showCreateRepo && repoList.length === 0 && (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Owner (e.g. username)"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="font-mono text-xs rounded-xl bg-background/60 border-white/10"
                />
                <Input
                  placeholder="Repo (e.g. dsa-solutions)"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  className="font-mono text-xs rounded-xl bg-background/60 border-white/10"
                />
              </div>
            )}
          </div>

          {/* Step 3: Branch and Subfolder */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-muted-foreground">Branch</Label>
              <Input
                placeholder="main"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="font-mono text-xs rounded-xl bg-background/60 border-white/10 h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-muted-foreground">Folder Path</Label>
              <Input
                placeholder="solutions (or blank for root)"
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                className="font-mono text-xs rounded-xl bg-background/60 border-white/10 h-8"
              />
            </div>
          </div>

          {/* Step 4: Auto-sync toggle */}
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-background/40 p-3">
            <div className="space-y-0.5">
              <Label htmlFor="auto-sync-toggle" className="text-xs font-bold text-foreground cursor-pointer">
                Auto-Push Every Solved Problem
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Creates a <span className="font-mono text-foreground">&lt;Problem_Name&gt;.txt</span> with Key Patterns &amp; Code automatically.
              </p>
            </div>
            <Switch id="auto-sync-toggle" checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-white/10">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDisconnect}
                className="text-destructive hover:bg-destructive/10 rounded-xl text-xs h-8"
              >
                Disconnect
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="rounded-xl text-xs h-8 text-muted-foreground"
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
              className="rounded-xl text-xs h-8"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={testing || !token.trim() || !repo.trim()}
              className="rounded-xl text-xs h-8 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md gap-1.5"
            >
              {testing ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : isConnected ? (
                <>
                  <CheckCircle2 className="size-3.5" />
                  <span>Update Settings</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5" />
                  <span>Connect &amp; Auto-Sync</span>
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

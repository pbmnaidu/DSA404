"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Code2,
  ExternalLink,
  Trash2,
  CheckCircle2,
  Save,
  Lightbulb,
  Play,
  RotateCcw,
  Loader2,
  Sparkles,
  Terminal,
  FileCode,
  Globe,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Zap,
} from "lucide-react";
import type { CodeSubmission } from "@/lib/db";
import { getCanonicalProblemLink } from "@/lib/problems";
import {
  getLocalGitHubSyncConfig,
  type GitHubSyncConfig,
} from "@/lib/github-sync";
import { useAuth } from "@/hooks/useAuth";
import { GitHubRepoLinkModal } from "./GitHubRepoLinkModal";
import { GitHubIcon } from "./SocialIcons";
import { toast } from "sonner";
import {
  SUPPORTED_LANGUAGES,
  executeCode,
  type CompileResult,
} from "@/lib/codeCompiler";
import { useInAppBrowser } from "./in-app-browser/InAppBrowserContext";
import { CodeEditor } from "./CodeEditor";

interface CodeChefCompilerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  problemName: string;
  existingSubmission?: CodeSubmission;
  onSave: (code: string, link: string, keyPoints: string) => Promise<void>;
  onDelete?: () => Promise<void>;
  readOnly?: boolean;
  initialTab?: "solution" | "compiler" | "codechef_ide";
}

export function CodeChefCompilerModal({
  open,
  onOpenChange,
  problemName,
  existingSubmission,
  onSave,
  onDelete,
  readOnly = false,
  initialTab = "solution",
}: CodeChefCompilerModalProps) {
  const { user } = useAuth();
  const { openInApp } = useInAppBrowser();

  const [activeTab, setActiveTab] = useState<"solution" | "compiler" | "codechef_ide">(initialTab);

  const [selectedLang, setSelectedLang] = useState<string>("cpp");
  const [code, setCode] = useState<string>("");
  const [stdin, setStdin] = useState<string>("");
  const [link, setLink] = useState<string>("");
  const [keyPoints, setKeyPoints] = useState<string>("");

  const [compiling, setCompiling] = useState<boolean>(false);
  const [compileResult, setCompileResult] = useState<CompileResult | null>(null);

  const [busy, setBusy] = useState<boolean>(false);
  const [ghConfig, setGhConfig] = useState<GitHubSyncConfig | null>(null);
  const [showGitHubModal, setShowGitHubModal] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [isIdeMaximized, setIsIdeMaximized] = useState<boolean>(false);
  const [ideReloadKey, setIdeReloadKey] = useState<number>(0);

  // Sync state whenever modal opens
  useEffect(() => {
    if (open) {
      setActiveTab(initialTab || "solution");
      setGhConfig(getLocalGitHubSyncConfig(user?.uid));
      const draftCode =
        typeof window !== "undefined"
          ? localStorage.getItem(`draft_code_${problemName}`)
          : null;
      const draftKeyPoints =
        typeof window !== "undefined"
          ? localStorage.getItem(`draft_keypoints_${problemName}`)
          : null;
      const canonicalLink = getCanonicalProblemLink(problemName) || "";

      const initialCode = existingSubmission?.code || draftCode || "";
      setCode(initialCode);
      setLink(existingSubmission?.link || canonicalLink);
      setKeyPoints(existingSubmission?.keyPoints || draftKeyPoints || "");

      // If code is empty, populate with default language starter template
      if (!initialCode.trim()) {
        const langObj = SUPPORTED_LANGUAGES.find((l) => l.id === selectedLang);
        if (langObj) {
          setCode(langObj.starterCode);
        }
      }
    }
  }, [open, existingSubmission, problemName, initialTab]);

  const handleLanguageChange = (newLangId: string) => {
    setSelectedLang(newLangId);
    const langObj = SUPPORTED_LANGUAGES.find((l) => l.id === newLangId);

    // If current code matches starter code of another language or is empty, auto-insert template
    const isDefaultOrEmpty =
      !code.trim() ||
      SUPPORTED_LANGUAGES.some((l) => l.starterCode.trim() === code.trim());

    if (isDefaultOrEmpty && langObj) {
      setCode(langObj.starterCode);
    }
  };

  const handleResetTemplate = () => {
    const langObj = SUPPORTED_LANGUAGES.find((l) => l.id === selectedLang);
    if (langObj) {
      setCode(langObj.starterCode);
      toast.info(`Reset to default ${langObj.name} template`);
    }
  };

  const handleRunCode = async () => {
    if (!code.trim()) {
      toast.error("Please enter code to compile!");
      return;
    }
    setCompiling(true);
    setCompileResult(null);
    try {
      const result = await executeCode(selectedLang, code, stdin);
      setCompileResult(result);
      if (result.code === 0 && !result.stderr) {
        toast.success(`Executed successfully in ${result.time || "0s"}! 🎉`);
      } else {
        toast.warning("Code executed with errors or non-zero exit status");
      }
    } catch (err: any) {
      toast.error("Compilation failed", { description: err.message });
    } finally {
      setCompiling(false);
    }
  };

  const handleSave = async () => {
    if (!code.trim()) {
      toast.error("Please enter your solution code before submitting!");
      return;
    }
    setBusy(true);
    try {
      const effectiveLink = link.trim() || getCanonicalProblemLink(problemName) || "";
      await onSave(code, effectiveLink, keyPoints);
      if (typeof window !== "undefined" && problemName) {
        localStorage.removeItem(`draft_code_${problemName}`);
        localStorage.removeItem(`draft_keypoints_${problemName}`);
      }
      toast.success("Solution code saved successfully!");
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Failed to save solution code", { description: err.message });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setBusy(true);
    try {
      await onDelete();
      if (typeof window !== "undefined" && problemName) {
        localStorage.removeItem(`draft_code_${problemName}`);
        localStorage.removeItem(`draft_keypoints_${problemName}`);
      }
      toast.success("Solution deleted");
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Failed to delete solution", { description: err.message });
    } finally {
      setBusy(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      toast.success("Code copied to clipboard!");
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      toast.error("Failed to copy code");
    }
  };

  const handleOpenCodeChefIde = (switchTab: boolean = true) => {
    if (switchTab) {
      setActiveTab("codechef_ide");
    }
    try {
      const opened = window.open("https://www.codechef.com/ide", "_blank", "noopener,noreferrer");
      if (opened) {
        toast.success("CodeChef Official IDE opened in new tab! 👨‍🍳", {
          description: "You can copy your problem code and paste it directly into CodeChef.",
        });
      } else {
        toast.info("Opening CodeChef IDE in DSA404 In-App Browser...");
        openInApp("https://www.codechef.com/ide", "CodeChef IDE");
      }
    } catch {
      openInApp("https://www.codechef.com/ide", "CodeChef IDE");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`flex flex-col transition-all duration-200 border border-white/15 bg-card/95 backdrop-blur-2xl shadow-2xl ${
          isIdeMaximized
            ? "!fixed !top-0 !left-0 !right-0 !bottom-0 !translate-x-0 !translate-y-0 !w-screen !h-screen !max-w-none !max-h-none !rounded-none z-[999999]"
            : "w-[96vw] max-w-6xl h-[94vh] max-h-[94vh] rounded-3xl"
        }`}
      >
        <DialogHeader className="pb-2 border-b border-white/10 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-extrabold text-foreground truncate">
              <span className="p-1.5 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400">
                <Zap className="size-4" />
              </span>
              <span className="truncate">Code Solution &amp; IDE — {problemName}</span>
            </DialogTitle>

            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenCodeChefIde(false)}
                className="h-7 px-2.5 rounded-xl text-xs font-semibold border-orange-500/40 text-orange-400 hover:bg-orange-500/10 gap-1.5 cursor-pointer shadow-xs"
                title="Automatically launches CodeChef IDE in your browser"
              >
                <span>CodeChef IDE</span>
                <ExternalLink className="size-3" />
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsIdeMaximized((prev) => !prev)}
                className="h-7 px-2.5 rounded-xl text-xs font-bold gap-1 cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors"
                title={isIdeMaximized ? "Restore size" : "Expand IDE to full screen"}
              >
                {isIdeMaximized ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
                <span>{isIdeMaximized ? "Exit Fullscreen" : "Fullscreen"}</span>
              </Button>
            </div>
          </div>

          {/* Modal Header Tabs: 1. Saved Submission & Key Points (DEFAULT), 2. Live Code Compiler & IDE, 3. CodeChef Official IDE */}
          <div className="flex items-center gap-1.5 pt-2 overflow-x-auto select-none">
            <button
              type="button"
              onClick={() => setActiveTab("solution")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "solution"
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                  : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <FileCode className="size-3.5" />
              <span>Saved Submission &amp; Key Points</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("compiler")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "compiler"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Terminal className="size-3.5" />
              <span>Live Code Compiler &amp; IDE</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenCodeChefIde(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "codechef_ide"
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                  : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
              title="Click to automatically open CodeChef IDE in new tab"
            >
              <Globe className="size-3.5" />
              <span>CodeChef Official IDE 👨‍🍳</span>
            </button>
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-3 py-2 flex flex-col">
          {/* TAB 1: SAVED SUBMISSION & KEY POINTS (DEFAULT TAB ON OPEN) */}
          {activeTab === "solution" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10">
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="size-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      {existingSubmission ? "Saved Solution & Notes" : "Draft Your Problem Solution"}
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Save optimal solution code, key patterns/intuition, and submission link.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("compiler")}
                    className="h-7 px-2.5 rounded-xl text-xs font-semibold border-white/15 text-foreground hover:bg-white/10 gap-1.5 cursor-pointer"
                  >
                    <Terminal className="size-3 text-primary" />
                    <span>Run in Live Compiler</span>
                  </Button>
                </div>
              </div>

              {/* Submission link */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="submission-link-full" className="text-xs font-bold text-foreground">
                    Submission Link (optional)
                  </Label>
                  {link && link.startsWith("http") && (
                    <a
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
                {readOnly ? (
                  existingSubmission?.link ? (
                    <a
                      href={existingSubmission.link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs text-primary font-semibold underline"
                    >
                      {existingSubmission.link} <ExternalLink className="size-3.5" />
                    </a>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No submission link provided</p>
                  )
                ) : (
                  <Input
                    id="submission-link-full"
                    placeholder="https://leetcode.com/submissions/detail/... or https://www.codechef.com/viewsolution/..."
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="text-xs rounded-xl bg-background/50 border-white/10"
                  />
                )}
              </div>

              {/* Key Points / Pattern / Hints */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="key-points-full" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Lightbulb className="size-3.5 text-amber-400" />
                    Key Points / Pattern / Hints / Intuition
                  </Label>
                  <span className="text-[10px] text-muted-foreground">
                    Time/Space complexity, edge cases &amp; core intuition
                  </span>
                </div>
                {readOnly ? (
                  existingSubmission?.keyPoints || keyPoints ? (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 text-xs text-foreground font-sans whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                      {existingSubmission?.keyPoints || keyPoints}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No key points or hints recorded</p>
                  )
                ) : (
                  <Textarea
                    id="key-points-full"
                    placeholder="E.g. Pattern: Monotonic Stack / Two Pointers&#10;Time Complexity: O(N), Space: O(1)&#10;Key insight: Track maximum elements from right to left..."
                    value={keyPoints}
                    onChange={(e) => {
                      setKeyPoints(e.target.value);
                      if (typeof window !== "undefined" && problemName && !readOnly) {
                        localStorage.setItem(`draft_keypoints_${problemName}`, e.target.value);
                      }
                    }}
                    className="font-sans text-xs h-24 resize-y bg-background/60 border-white/10 rounded-2xl p-3 focus-visible:ring-primary leading-relaxed"
                  />
                )}
              </div>

              {/* GitHub Auto-Sync Status */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl border border-white/10 bg-background/50">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-7 rounded-xl bg-zinc-900 dark:bg-white/10 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <GitHubIcon className="size-4" />
                  </div>
                  {ghConfig?.enabled && ghConfig?.repo ? (
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-foreground">GitHub Auto-Sync:</span>
                        <span className="text-xs font-mono font-bold text-primary truncate">
                          {ghConfig.owner}/{ghConfig.repo}
                        </span>
                        <span className="rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold">
                          ACTIVE
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">
                        Commits {ghConfig.folderPath ? `${ghConfig.folderPath}/` : ""}&lt;Problem_Name&gt;.txt
                      </p>
                    </div>
                  ) : (
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground">Auto-Push Solutions to GitHub</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        Link a GitHub repository to automatically commit solutions &amp; key patterns
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGitHubModal(true)}
                  className="h-7 px-2.5 rounded-xl text-[11px] font-semibold shrink-0 gap-1 hover:border-primary/40 cursor-pointer"
                >
                  <span>{ghConfig?.enabled && ghConfig?.repo ? "Configure Repo" : "Link GitHub Repo"}</span>
                </Button>
              </div>

              {/* Solution Code Section with full-featured CodeEditor */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Code2 className="size-3.5 text-primary" /> Solution Code
                    </Label>
                    <select
                      value={selectedLang}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="text-[11px] font-semibold rounded-lg bg-card border border-white/15 px-2 py-0.5 text-foreground focus:outline-none cursor-pointer"
                    >
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.id} value={lang.id}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {existingSubmission && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                      <CheckCircle2 className="size-3.5" /> Solution Saved
                    </span>
                  )}
                </div>

                <CodeEditor
                  value={code}
                  readOnly={readOnly}
                  onChange={(val) => {
                    setCode(val);
                    if (typeof window !== "undefined" && problemName && !readOnly) {
                      localStorage.setItem(`draft_code_${problemName}`, val);
                    }
                  }}
                  language={selectedLang}
                  placeholder="// Paste your C++, Java, Python, or JavaScript solution code here..."
                  minHeight="280px"
                />
              </div>
            </div>
          )}

          {/* TAB 2: LIVE CODE COMPILER & IDE */}
          {activeTab === "compiler" && (
            <div className="flex flex-col flex-1 h-full space-y-3">
              {/* Language Toolbar & Run Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl border border-white/10 bg-background/60 shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Label htmlFor="lang-select" className="text-xs font-bold text-foreground">
                    Language:
                  </Label>
                  <select
                    id="lang-select"
                    value={selectedLang}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="text-xs font-semibold rounded-xl bg-card border border-white/15 px-3 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang.id} value={lang.id}>
                        {lang.name}
                      </option>
                    ))}
                  </select>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResetTemplate}
                    className="h-7 text-[11px] px-2.5 rounded-xl border-white/15 text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Reset editor with starter template"
                  >
                    <RotateCcw className="size-3 mr-1" /> Template
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleRunCode}
                    disabled={compiling || !code.trim()}
                    className="h-8 px-4 rounded-xl font-bold bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 text-white shadow-lg shadow-orange-500/20 hover:opacity-95 cursor-pointer"
                  >
                    {compiling ? (
                      <>
                        <Loader2 className="size-3.5 mr-1.5 animate-spin" /> Compiling...
                      </>
                    ) : (
                      <>
                        <Play className="size-3.5 mr-1.5 fill-white" /> Run Code (Compile)
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Code Editor & Custom Stdin Input Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-1 min-h-[350px]">
                {/* Left 2 Cols: Main Editor with full IDE features */}
                <div className="lg:col-span-2 flex flex-col space-y-1.5 h-full">
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span className="flex items-center gap-1.5">
                      <Code2 className="size-4 text-primary" /> Live Code Editor (Formatted &amp; Enhanced)
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {code.split("\n").length} lines
                    </span>
                  </div>
                  <CodeEditor
                    value={code}
                    onChange={(newVal) => {
                      setCode(newVal);
                      if (typeof window !== "undefined" && problemName && !readOnly) {
                        localStorage.setItem(`draft_code_${problemName}`, newVal);
                      }
                    }}
                    language={selectedLang}
                    readOnly={readOnly}
                    minHeight="320px"
                    placeholder="// Write your solution code here..."
                  />
                </div>

                {/* Right 1 Col: Custom Input (stdin) */}
                <div className="flex flex-col space-y-1.5 h-full">
                  <Label htmlFor="custom-stdin" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Terminal className="size-4 text-amber-400" /> Custom Input (stdin)
                  </Label>
                  <Textarea
                    id="custom-stdin"
                    value={stdin}
                    onChange={(e) => setStdin(e.target.value)}
                    placeholder="Enter custom input / test cases here..."
                    className="font-mono text-xs flex-1 min-h-[140px] bg-background/60 border border-white/15 rounded-2xl p-3 focus-visible:ring-primary resize-y"
                  />
                  <p className="text-[10px] text-muted-foreground italic">
                    Input is passed as standard input stream (stdin) when clicking Run Code.
                  </p>
                </div>
              </div>

              {/* Console Execution Output Window */}
              <div className="space-y-1.5 shrink-0">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="size-4 text-emerald-400" /> Execution Console
                  </span>
                  {compileResult && (
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className={compileResult.code === 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                        Status: {compileResult.code === 0 ? "SUCCESS (0)" : `ERROR (${compileResult.code})`}
                      </span>
                      {compileResult.time && (
                        <span className="text-muted-foreground">· Time: {compileResult.time}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="font-mono text-xs p-3.5 rounded-2xl bg-zinc-950 border border-white/15 min-h-[110px] max-h-[220px] overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner text-zinc-200">
                  {compiling ? (
                    <div className="flex items-center gap-2 text-amber-400 py-2">
                      <Loader2 className="size-4 animate-spin" />
                      <span>Sending code to Code Compiler engine...</span>
                    </div>
                  ) : compileResult ? (
                    <>
                      {compileResult.stdout && (
                        <div className="text-emerald-300">{compileResult.stdout}</div>
                      )}
                      {compileResult.stderr && (
                        <div className="text-rose-400 font-bold border-t border-rose-500/20 pt-1 mt-1">
                          {compileResult.stderr}
                        </div>
                      )}
                      {!compileResult.stdout && !compileResult.stderr && (
                        <span className="text-muted-foreground italic">Code executed with no output.</span>
                      )}
                    </>
                  ) : (
                    <span className="text-muted-foreground/60 italic">
                      Click &quot;Run Code (Compile)&quot; above to compile and view stdout/stderr output here.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: OFFICIAL CODECHEF IDE EMBED & LAUNCHER */}
          {activeTab === "codechef_ide" && (
            <div className="flex flex-col flex-1 h-full space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-orange-500/30 bg-orange-500/10 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 shrink-0">
                    <Zap className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-foreground">CodeChef Official Online IDE</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                        AUTOMATICALLY LAUNCHED
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      https://www.codechef.com/ide — Run and test your code directly on CodeChef with multi-language compiler.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCode}
                    className="h-8 text-xs font-semibold rounded-xl border-white/15 text-foreground hover:bg-white/10 cursor-pointer gap-1.5"
                    title="Copy your current code to paste into CodeChef"
                  >
                    {copiedCode ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                    <span>{copiedCode ? "Code Copied!" : "Copy Code for CodeChef"}</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIdeReloadKey((k) => k + 1)}
                    className="h-8 text-xs rounded-xl border-white/15 text-foreground hover:bg-white/10 cursor-pointer"
                  >
                    <RotateCcw className="size-3 mr-1" /> Refresh Frame
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleOpenCodeChefIde(false)}
                    className="h-8 text-xs font-bold px-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 cursor-pointer gap-1.5"
                  >
                    <span>Launch Again</span>
                    <ExternalLink className="size-3.5" />
                  </Button>
                </div>
              </div>

              {/* Full height Iframe container with friendly fallback info */}
              <div className="relative flex-1 w-full min-h-[500px] h-full rounded-2xl border border-white/15 overflow-hidden bg-white shadow-inner">
                <iframe
                  key={ideReloadKey}
                  src="https://www.codechef.com/ide"
                  title="CodeChef IDE"
                  className="w-full h-full border-0 min-h-[500px]"
                  sandbox="allow-downloads allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
                  allow="accelerometer; autoplay; camera; clipboard-read; clipboard-write; encrypted-media; fullscreen; geolocation; gyroscope; microphone; midi; payment; picture-in-picture; screen-wake-lock; usb; web-share"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between pt-2 border-t border-white/10 shrink-0">
          {!readOnly && existingSubmission && onDelete && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={busy}
              className="text-destructive hover:bg-destructive/10 rounded-xl text-xs h-8 cursor-pointer"
            >
              <Trash2 className="size-3.5 mr-1" /> Delete Solution
            </Button>
          )}

          <div className="ml-auto flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs h-8 cursor-pointer"
            >
              {readOnly ? "Close" : "Cancel"}
            </Button>
            {!readOnly && (
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={busy || !code.trim()}
                className="rounded-xl text-xs h-8 font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <Save className="size-3.5 mr-1" />
                {busy ? "Saving..." : existingSubmission ? "Update Code" : "Submit Code & Complete"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>

      <GitHubRepoLinkModal
        open={showGitHubModal}
        onOpenChange={setShowGitHubModal}
        userId={user?.uid}
        onConfigSaved={(cfg) => setGhConfig(cfg)}
      />
    </Dialog>
  );
}

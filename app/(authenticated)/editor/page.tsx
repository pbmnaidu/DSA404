"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronRight, Code2, Loader2, Play, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProblemCompletions } from "@/hooks/useProblemCompletions";
import { toast } from "sonner";
import { executeCode, type CompileResult } from "@/lib/codeCompiler";

/* ------------------------------------------------------------------ */
/* Language starter code — syntax scaffolding only, nothing executes. */
/* ------------------------------------------------------------------ */

interface LanguageConfig {
  id: string;
  label: string;
  starter: string;
}

const LANGUAGES: LanguageConfig[] = [
  {
    id: "javascript",
    label: "JavaScript (Node.js)",
    starter: `function solve(input) {
    // Write your code here
}
`,
  },
  {
    id: "typescript",
    label: "TypeScript",
    starter: `function solve(input: string): any {
    // Write your code here
}
`,
  },
  {
    id: "cpp",
    label: "C++17",
    starter: `#include <bits/stdc++.h>
using namespace std;

int main() {
    // Write your solution here
    return 0;
}`,
  },
  {
    id: "java",
    label: "Java 17",
    starter: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        // Write your solution here
    }
}`,
  },
  {
    id: "python",
    label: "Python 3",
    starter: `def solve():
    # Write your code here
    pass

solve()`,
  },
];

/* ------------------------------------------------------------------ */
/* Persisted submission shape — read by the "View Code" screen.       */
/* ------------------------------------------------------------------ */

export interface SavedSubmission {
  problemName: string;
  topic: string;
  language: string;
  code: string;
  submittedAt: string; // ISO timestamp
}

const STORAGE_KEY = "dsa-tracker:submissions";

function saveSubmission(submission: SavedSubmission) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all: SavedSubmission[] = raw ? JSON.parse(raw) : [];
    // Keep only the latest submission per problem name.
    const filtered = all.filter((s) => s.problemName !== submission.problemName);
    filtered.push(submission);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // localStorage unavailable (SSR/private mode) — submission simply won't persist.
  }
}

import { CodeEditor } from "@/components/CodeEditor";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useOptionalPlan } from "@/hooks/usePlan";


function EditorPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { submissions, submitCode } = useProblemCompletions();
  const plan = useOptionalPlan();

  const problemName = params.get("name");
  const problem = useMemo(
    () => ({
      name: problemName || "Scratchpad",
      topic: params.get("topic") || "Free Code",
      link: params.get("link") || "",
      isScratchpad: !problemName
    }),
    [params, problemName]
  );

  const existingSubmission = submissions[problem.name];

  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(LANGUAGES[0].starter);
  const [langOpen, setLangOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stdin, setStdin] = useState("");
  const [compiling, setCompiling] = useState(false);
  const [compileResult, setCompileResult] = useState<CompileResult | null>(null);
  const canSubmit = compileResult?.code === 0 && !compileResult.stderr;

  useEffect(() => {
    if (existingSubmission?.code) {
      setCode(existingSubmission.code);
    }
  }, [existingSubmission, problem.name]);

  const currentLang = LANGUAGES.find((l) => l.id === language) || LANGUAGES[0];

  const handleLanguageChange = (id: string) => {
    setLanguage(id);
    setCompileResult(null);
    const selected = LANGUAGES.find((l) => l.id === id);
    if (selected) setCode(selected.starter);
    setLangOpen(false);
  };

  const handleRun = async () => {
    if (!code.trim()) {
      toast.error("Write code before compiling.");
      return;
    }
    setCompiling(true);
    setCompileResult(null);
    try {
      const result = await executeCode(language, code, stdin);
      setCompileResult(result);
      if (result.code === 0 && !result.stderr) toast.success("Compiled and ran successfully.");
      else toast.error("Compilation or execution failed. Fix the errors before submitting.");
    } catch (error: any) {
      setCompileResult({ code: 1, stdout: "", stderr: error?.message || "Compilation failed", output: "", error: error?.message });
      toast.error("Compilation failed", { description: error?.message });
    } finally {
      setCompiling(false);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error("Please enter your solution code before submitting!");
      return;
    }
    if (!canSubmit) {
      toast.error("Compile successfully before submitting your solution.", { description: "Run the code and fix every error first." });
      return;
    }
    setSubmitting(true);
    try {
      await submitCode(problem.name, code, problem.link || "");
      if (plan) {
        const day = plan.days.find(d => d.problems.some(p => p.name === problem.name));
        if (day) {
          await plan.updateDay(day.dayNumber, (d) => ({
            ...d,
            problems: d.problems.map((p) => (p.name === problem.name ? { ...p, done: true } : p)),
            checklist: d.checklist.map((c) => (c.label === problem.name ? { ...c, done: true } : c)),
          }));
        }
      }
      toast.success(`Solution for "${problem.name}" submitted!`);
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push("/today");
      }
    } catch (err: any) {
      toast.error("Failed to submit solution", { description: err?.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-screen w-full bg-background text-foreground font-sans overflow-hidden border-t md:border-t-0 border-border">
      {/* ── IDE Top Menu Bar ── */}
      <div className="h-12 shrink-0 flex items-center justify-between gap-3 px-3 border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Go Back"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="text-primary">DSA⁴⁰⁴ Workspace</span>
            <span className="text-border">/</span>
            <span className="text-muted-foreground">{problem.topic}</span>
            <span className="text-border">/</span>
            <span className="text-foreground truncate max-w-[28vw]">{problem.name}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           {!problem.isScratchpad && (
             <button
              onClick={handleSubmit}
              disabled={submitting || !canSubmit}
              title={canSubmit ? "Submit compiled solution" : "Run successfully before submitting"}
              className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-sm"
            >
              {submitting && <Loader2 size={13} className="animate-spin" />}
              Submit Solution
            </button>
           )}
        </div>
      </div>

      {/* ── IDE Main Workspace ── */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar (Problem Info) */}
        {!problem.isScratchpad && (
          <div className="w-[300px] shrink-0 border-r border-border bg-card flex flex-col hidden md:flex">
            <div className="h-10 border-b border-border flex items-center px-4">
              <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Explorer</span>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto">
              <div>
                <h2 className="text-sm font-bold text-foreground mb-1">{problem.name}</h2>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-1.5 py-0.5 rounded-lg bg-primary/10 text-primary font-mono border border-primary/30">{problem.topic}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Write your solution in the editor pane. Make sure your logic correctly solves the problem requirements on the platform.
                </p>
                {problem.link && (
                  <a href={problem.link} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                    View Problem Description <ChevronRight size={12} />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Right Pane (Editor) */}
        <div className="flex-1 flex flex-col min-w-0 bg-background">
          {/* Editor Tabs */}
          <div className="h-10 shrink-0 flex items-end border-b border-border bg-card px-2 gap-1 overflow-visible">
            <div className="h-9 px-4 flex items-center gap-2 border-t border-x border-border bg-background rounded-t-md border-b-transparent translate-y-[1px] relative">
              <Code2 size={14} className="text-primary" />
              <span className="text-xs font-mono text-foreground">solution.{language === "javascript" ? "js" : language === "typescript" ? "ts" : language === "cpp" ? "cpp" : language === "java" ? "java" : "py"}</span>
              <div className="absolute top-0 left-0 w-full h-[2px] bg-primary" />
            </div>
            
            <div className="ml-auto relative mb-1">
              <button
                onClick={() => setLangOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-[11px] font-semibold text-foreground hover:bg-accent transition-colors border border-border"
              >
                {currentLang.label}
                <ChevronDown size={12} className="text-muted-foreground" />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-md border border-border bg-popover text-popover-foreground py-1 shadow-lg z-50">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => handleLanguageChange(l.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 text-[11px] font-mono hover:bg-accent hover:text-accent-foreground transition-colors",
                        l.id === language ? "text-primary bg-primary/10" : "text-popover-foreground"
                      )}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <ResizablePanelGroup direction="vertical" className="flex-1 min-h-0">
            <ResizablePanel defaultSize={70} minSize={30} className="flex flex-col relative min-h-0">
              <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-3 py-2 shrink-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Terminal size={14} className="text-success" />
                  <span>Run code to validate before submitting</span>
                </div>
                <button
                  type="button"
                  onClick={handleRun}
                  disabled={compiling || !code.trim()}
                  className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {compiling ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} fill="currentColor" />}
                  {compiling ? "Running..." : "Run"}
                </button>
              </div>
              <div className="flex-1 relative">
              <CodeEditor
                value={code}
                onChange={(value) => {
                  setCode(value);
                  setCompileResult(null);
                }}
                language={language}
                className="absolute inset-0 border-0"
              />
              </div>
            </ResizablePanel>
            
            <ResizableHandle withHandle className="hover:bg-primary/20 transition-colors" />
            
            <ResizablePanel defaultSize={30} minSize={15} className="flex flex-col min-h-0 bg-card">
              <div className="flex flex-col gap-4 p-3 flex-1 overflow-y-auto">
                <label className="flex flex-col gap-2 text-[11px] text-muted-foreground min-h-0 h-full">
                  Input (stdin)
                  <textarea value={stdin} onChange={(e) => setStdin(e.target.value)} placeholder="Enter test input..." className="flex-1 min-h-0 resize-none rounded-md border border-border bg-background p-2 font-mono text-xs text-foreground outline-none focus:border-primary" />
                </label>
                <div className="flex flex-col gap-2 text-[11px] text-muted-foreground min-h-0 h-full">
                  <div className="flex items-center justify-between shrink-0">
                    <span>Output</span>
                    <div className="flex items-center gap-2">
                      {compileResult && !canSubmit && (
                        <a 
                          href={`https://chatgpt.com/?q=${encodeURIComponent("I am getting an error in my code. Please give me a hint on how to fix it, but DO NOT give me the exact code solution.\n\nCode:\n" + code + "\n\nError:\n" + (compileResult.stderr || "Compilation failed"))}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-primary/10 text-primary hover:bg-primary/20 px-2 py-0.5 rounded text-[10px] font-bold transition-colors flex items-center gap-1"
                        >
                          Ask ChatGPT for Hints
                        </a>
                      )}
                      {compileResult && <span className={canSubmit ? "text-success" : "text-destructive"}>{canSubmit ? "Success" : "Error"}</span>}
                    </div>
                  </div>
                  <textarea readOnly value={compiling ? "Running..." : compileResult ? (compileResult.stdout || compileResult.stderr || "No output") : "Run your code to see output."} aria-label="Execution output" className={cn("flex-1 min-h-0 resize-none overflow-auto rounded-md border bg-background p-2 font-mono text-xs outline-none", compileResult && !canSubmit ? "border-destructive text-destructive" : "border-border text-foreground")} />
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={null}>
      <EditorPageInner />
    </Suspense>
  );
}

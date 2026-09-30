"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronRight, Code2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProblemCompletions } from "@/hooks/useProblemCompletions";
import { toast } from "sonner";

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


function EditorPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { submissions, submitCode } = useProblemCompletions();

  const problem = useMemo(
    () => ({
      name: params.get("name") || "Untitled Problem",
      topic: params.get("topic") || "General",
      link: params.get("link") || "",
    }),
    [params]
  );

  const existingSubmission = submissions[problem.name];

  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(LANGUAGES[0].starter);
  const [langOpen, setLangOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (existingSubmission?.code) {
      setCode(existingSubmission.code);
    }
  }, [existingSubmission, problem.name]);

  const currentLang = LANGUAGES.find((l) => l.id === language) || LANGUAGES[0];

  const handleLanguageChange = (id: string) => {
    setLanguage(id);
    const selected = LANGUAGES.find((l) => l.id === id);
    if (selected) setCode(selected.starter);
    setLangOpen(false);
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error("Please enter your solution code before submitting!");
      return;
    }
    setSubmitting(true);
    try {
      await submitCode(problem.name, code, problem.link || "");
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
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0d1117] text-[#c9d1d9] font-sans">
      {/* ── IDE Top Menu Bar ── */}
      <div className="h-10 shrink-0 flex items-center justify-between px-3 border-b border-[#30363d] bg-[#010409]">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center rounded-md p-1.5 text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] transition-colors"
            title="Go Back"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="text-[#58a6ff]">DSA⁴⁰⁴ Workspace</span>
            <span className="text-[#30363d]">/</span>
            <span className="text-[#8b949e]">{problem.topic}</span>
            <span className="text-[#30363d]">/</span>
            <span className="text-[#c9d1d9]">{problem.name}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-1.5 rounded-md bg-[#238636] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#2ea043] disabled:opacity-50 transition-colors shadow-sm border border-[rgba(240,253,244,0.1)]"
          >
            {submitting && <Loader2 size={13} className="animate-spin" />}
            Submit Solution
          </button>
        </div>
      </div>

      {/* ── IDE Main Workspace ── */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar (Problem Info) */}
        <div className="w-[300px] shrink-0 border-r border-[#30363d] bg-[#0d1117] flex flex-col hidden md:flex">
          <div className="h-9 border-b border-[#30363d] flex items-center px-4">
            <span className="text-[11px] font-bold tracking-wider text-[#8b949e] uppercase">Explorer</span>
          </div>
          <div className="p-4 space-y-4 overflow-y-auto">
            <div>
              <h2 className="text-sm font-bold text-[#c9d1d9] mb-1">{problem.name}</h2>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-1.5 py-0.5 rounded-sm bg-[#1f6feb]/20 text-[#58a6ff] font-mono border border-[#1f6feb]/30">{problem.topic}</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-[#30363d]">
              <p className="text-xs text-[#8b949e] leading-relaxed">
                Write your solution in the editor pane. Make sure your logic correctly solves the problem requirements on the platform.
              </p>
              {problem.link && (
                <a href={problem.link} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#58a6ff] hover:underline">
                  View Problem Description <ChevronRight size={12} />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right Pane (Editor) */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0d1117]">
          {/* Editor Tabs */}
          <div className="h-9 shrink-0 flex items-end border-b border-[#30363d] bg-[#010409] px-2 gap-1 overflow-x-auto">
            <div className="h-8 px-4 flex items-center gap-2 border-t border-x border-[#30363d] bg-[#0d1117] rounded-t-md border-b-transparent translate-y-[1px] relative">
              <Code2 size={14} className="text-[#e3b341]" />
              <span className="text-xs font-mono text-[#c9d1d9]">solution.{language === "javascript" ? "js" : language === "typescript" ? "ts" : language === "cpp" ? "cpp" : language === "java" ? "java" : "py"}</span>
              <div className="absolute top-0 left-0 w-full h-[2px] bg-[#f78166]" />
            </div>
            
            <div className="ml-auto relative mb-1">
              <button
                onClick={() => setLangOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold text-[#8b949e] hover:bg-[#21262d] transition-colors border border-[#30363d]"
              >
                {currentLang.label}
                <ChevronDown size={12} className="text-[#8b949e]" />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-1 w-40 rounded-md border border-[#30363d] bg-[#161b22] py-1 shadow-xl z-20">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => handleLanguageChange(l.id)}
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-[11px] font-mono hover:bg-[#1f6feb] hover:text-white transition-colors",
                        l.id === language ? "text-[#58a6ff] bg-[#1f6feb]/10" : "text-[#c9d1d9]"
                      )}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 relative">
            <CodeEditor
              value={code}
              onChange={setCode}
              language={language}
              className="absolute inset-0 rounded-none border-0"
              theme="vs-dark"
            />
          </div>
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
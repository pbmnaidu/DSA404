"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  type KeyboardEvent,
} from "react";
import {
  Wand2,
  Copy,
  Check,
  Search,
  RotateCcw,
  Undo2,
  Redo2,
  Trash2,
  WrapText,
  Type,
  Palette,
  Code2,
  Sparkles,
  ChevronDown,
  X,
  ArrowDown,
  ArrowUp,
  Replace,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCode } from "@/lib/codeFormatter";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  minHeight?: string;
  maxHeight?: string;
  placeholder?: string;
  className?: string;
  onRun?: () => void;
  isCompiling?: boolean;
}

// Built-in Competitive Programming Snippets
const CODE_SNIPPETS: Record<string, { label: string; snippet: string }[]> = {
  cpp: [
    {
      label: "⚡ Fast I/O Boilerplate",
      snippet: `ios_base::sync_with_stdio(false);\ncin.tie(NULL);\ncout.tie(NULL);`,
    },
    {
      label: "🔁 Test Cases Loop (t--)",
      snippet: `int t;\ncin >> t;\nwhile (t--) {\n    solve();\n}`,
    },
    {
      label: "🔍 Binary Search Template",
      snippet: `int low = 0, high = n - 1, ans = -1;\nwhile (low <= high) {\n    int mid = low + (high - low) / 2;\n    if (check(mid)) {\n        ans = mid;\n        high = mid - 1;\n    } else {\n        low = mid + 1;\n    }\n}`,
    },
    {
      label: "🌐 DFS Graph Traversal",
      snippet: `void dfs(int u, vector<bool>& vis, const vector<vector<int>>& adj) {\n    vis[u] = true;\n    for (int v : adj[u]) {\n        if (!vis[v]) dfs(v, vis, adj);\n    }\n}`,
    },
    {
      label: "🎯 Two Pointers Loop",
      snippet: `int left = 0, right = n - 1;\nwhile (left < right) {\n    // check condition\n    if (/* condition */) left++;\n    else right--;\n}`,
    },
    {
      label: "🔢 Modulo 1e9+7 Helpers",
      snippet: `const int MOD = 1e9 + 7;\nlong long power(long long base, long long exp) {\n    long long res = 1;\n    base %= MOD;\n    while (exp > 0) {\n        if (exp % 2 == 1) res = (res * base) % MOD;\n        base = (base * base) % MOD;\n        exp /= 2;\n    }\n    return res;\n}`,
    },
  ],
  java: [
    {
      label: "⚡ Fast Reader (BufferedReader)",
      snippet: `BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\nStringTokenizer st = new StringTokenizer(br.readLine());`,
    },
    {
      label: "🔁 Test Cases Loop",
      snippet: `int t = scanner.nextInt();\nwhile (t-- > 0) {\n    solve();\n}`,
    },
    {
      label: "🔍 Binary Search",
      snippet: `int low = 0, high = n - 1, ans = -1;\nwhile (low <= high) {\n    int mid = low + (high - low) / 2;\n    if (check(mid)) {\n        ans = mid;\n        high = mid - 1;\n    } else {\n        low = mid + 1;\n    }\n}`,
    },
  ],
  python: [
    {
      label: "⚡ Fast I/O (sys.stdin)",
      snippet: `import sys\ninput = sys.stdin.readline`,
    },
    {
      label: "🔁 Test Cases Loop",
      snippet: `t = int(input())\nfor _ in range(t):\n    solve()`,
    },
    {
      label: "📦 Defaultdict & Counter",
      snippet: `from collections import defaultdict, Counter\ncount = Counter(arr)\ngraph = defaultdict(list)`,
    },
    {
      label: "🔍 Binary Search",
      snippet: `low, high, ans = 0, n - 1, -1\nwhile low <= high:\n    mid = (low + high) // 2\n    if check(mid):\n        ans = mid\n        high = mid - 1\n    else:\n        low = mid + 1`,
    },
  ],
  javascript: [
    {
      label: "🔁 Fast Array Map/Filter",
      snippet: `const ans = nums.filter(x => x > 0).map(x => x * 2);`,
    },
    {
      label: "🔍 Binary Search",
      snippet: `let low = 0, high = arr.length - 1, ans = -1;\nwhile (low <= high) {\n    const mid = Math.floor(low + (high - low) / 2);\n    if (check(mid)) {\n        ans = mid;\n        high = mid - 1;\n    } else {\n        low = mid + 1;\n    }\n}`,
    },
  ],
};

const THEMES = [
  { id: "dark", label: "VS Code Dark+", bg: "bg-[#0c1017]", border: "border-[#1e293b]" },
  { id: "obsidian", label: "Obsidian Jet", bg: "bg-[#050507]", border: "border-[#222222]" },
  { id: "cyberpunk", label: "Cyberpunk", bg: "bg-[#0b0f19]", border: "border-cyan-500/20" },
  { id: "matrix", label: "Matrix Terminal", bg: "bg-[#020d06]", border: "border-emerald-500/25" },
];

export function CodeEditor({
  value,
  onChange,
  language = "cpp",
  readOnly = false,
  minHeight = "340px",
  placeholder = "// Write your solution code here...",
  className,
  onRun,
  isCompiling = false,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  // Editor states
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("sm");
  const [theme, setTheme] = useState<string>("dark");
  const [wordWrap, setWordWrap] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Undo / Redo history
  const historyRef = useRef<string[]>([value]);
  const historyIndexRef = useRef<number>(0);
  const isUndoRedoRef = useRef<boolean>(false);

  // Find & Replace state
  const [showFindReplace, setShowFindReplace] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [replaceQuery, setReplaceQuery] = useState<string>("");
  const [matchCount, setMatchCount] = useState<number>(0);
  const [currentMatchIdx, setCurrentMatchIdx] = useState<number>(0);

  // Snippets dropdown
  const [showSnippets, setShowSnippets] = useState<boolean>(false);

  // Cursor & line stats
  const [cursorPos, setCursorPos] = useState<{ line: number; col: number }>({ line: 1, col: 1 });
  const [selectedChars, setSelectedChars] = useState<number>(0);

  // Calculate lines
  const lines = useMemo(() => value.split("\n"), [value]);
  const totalLines = lines.length;

  // Sync history on value changes
  useEffect(() => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }
    const history = historyRef.current;
    const currIdx = historyIndexRef.current;
    if (history[currIdx] !== value) {
      const nextHistory = history.slice(0, currIdx + 1);
      nextHistory.push(value);
      if (nextHistory.length > 50) nextHistory.shift();
      historyRef.current = nextHistory;
      historyIndexRef.current = nextHistory.length - 1;
    }
  }, [value]);

  // Synchronize gutter scrolling with textarea
  const handleScroll = () => {
    if (gutterRef.current && textareaRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Update cursor position stats
  const updateCursorStats = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const pos = el.selectionStart;
    const selectedLen = el.selectionEnd - pos;
    setSelectedChars(selectedLen);

    const textBefore = value.substring(0, pos);
    const lineNum = textBefore.split("\n").length;
    const lastNewline = textBefore.lastIndexOf("\n");
    const colNum = lastNewline === -1 ? pos + 1 : pos - lastNewline;
    setCursorPos({ line: lineNum, col: colNum });
  }, [value]);

  // Code Formatting
  const handleFormat = useCallback(() => {
    if (!value.trim()) {
      toast.info("No code to format");
      return;
    }
    try {
      const formatted = formatCode(value, language);
      if (formatted === value) {
        toast.info("Code is already clean & formatted! ✨");
      } else {
        onChange(formatted);
        toast.success("Code formatted successfully! ✨");
      }
    } catch {
      toast.error("Could not format code");
    }
  }, [value, language, onChange]);

  // Copy code
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy code");
    }
  };

  // Undo action
  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      isUndoRedoRef.current = true;
      historyIndexRef.current--;
      const prev = historyRef.current[historyIndexRef.current];
      onChange(prev);
    }
  };

  // Redo action
  const handleRedo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      isUndoRedoRef.current = true;
      historyIndexRef.current++;
      const next = historyRef.current[historyIndexRef.current];
      onChange(next);
    }
  };

  // Clear code
  const handleClear = () => {
    if (!value.trim()) return;
    if (window.confirm("Are you sure you want to clear the editor?")) {
      onChange("");
      toast.info("Editor cleared");
    }
  };

  // Insert Snippet
  const handleInsertSnippet = (snippet: string) => {
    const el = textareaRef.current;
    if (!el) {
      onChange(value + (value.endsWith("\n") ? "" : "\n") + snippet);
    } else {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const prefix = value.substring(0, start);
      const suffix = value.substring(end);
      const needsLeadingNewline = prefix.length > 0 && !prefix.endsWith("\n");
      const inserted = (needsLeadingNewline ? "\n" : "") + snippet + "\n";
      const nextVal = prefix + inserted + suffix;
      onChange(nextVal);
      requestAnimationFrame(() => {
        el.focus();
        el.selectionStart = el.selectionEnd = start + inserted.length;
      });
    }
    setShowSnippets(false);
    toast.success("Snippet inserted!");
  };

  // Find occurrences
  useEffect(() => {
    if (!searchQuery) {
      setMatchCount(0);
      setCurrentMatchIdx(0);
      return;
    }
    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "gi");
    const matches = value.match(regex);
    setMatchCount(matches ? matches.length : 0);
    setCurrentMatchIdx(matches && matches.length > 0 ? 1 : 0);
  }, [searchQuery, value]);

  // Navigate next match
  const handleFindNext = (direction: "next" | "prev" = "next") => {
    if (!searchQuery || !textareaRef.current) return;
    const el = textareaRef.current;
    const content = value.toLowerCase();
    const query = searchQuery.toLowerCase();
    const currentPos = direction === "next" ? el.selectionEnd : el.selectionStart - 1;

    let targetIndex = -1;
    if (direction === "next") {
      targetIndex = content.indexOf(query, currentPos);
      if (targetIndex === -1) {
        // wrap around to beginning
        targetIndex = content.indexOf(query, 0);
      }
    } else {
      targetIndex = content.lastIndexOf(query, Math.max(0, currentPos - 1));
      if (targetIndex === -1) {
        // wrap around to end
        targetIndex = content.lastIndexOf(query);
      }
    }

    if (targetIndex !== -1) {
      el.focus();
      el.setSelectionRange(targetIndex, targetIndex + query.length);
      updateCursorStats();
    }
  };

  // Replace current match
  const handleReplaceOne = () => {
    if (!searchQuery || !textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.substring(start, end);

    if (selected.toLowerCase() === searchQuery.toLowerCase()) {
      const next = value.substring(0, start) + replaceQuery + value.substring(end);
      onChange(next);
      requestAnimationFrame(() => {
        handleFindNext("next");
      });
    } else {
      handleFindNext("next");
    }
  };

  // Replace all matches
  const handleReplaceAll = () => {
    if (!searchQuery) return;
    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "gi");
    const count = (value.match(regex) || []).length;
    if (count === 0) {
      toast.info("No matches found to replace");
      return;
    }
    const next = value.replace(regex, replaceQuery);
    onChange(next);
    toast.success(`Replaced ${count} occurrences!`);
  };

  // Advanced Keydown Handler (Tab, Auto-Closing Brackets, Shortcuts)
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const el = textareaRef.current;
    if (!el) return;

    // Format Code shortcut: Alt + Shift + F or Ctrl + Shift + F
    if (e.shiftKey && (e.altKey || (e.ctrlKey && !e.metaKey)) && (e.key === "f" || e.key === "F")) {
      e.preventDefault();
      handleFormat();
      return;
    }

    // Find shortcut: Ctrl + F or Cmd + F
    if ((e.ctrlKey || e.metaKey) && (e.key === "f" || e.key === "F") && !e.shiftKey) {
      e.preventDefault();
      setShowFindReplace((prev) => !prev);
      return;
    }

    // Escape closes Find & Replace
    if (e.key === "Escape" && showFindReplace) {
      e.preventDefault();
      setShowFindReplace(false);
      return;
    }

    if (readOnly) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;

    // ── 1. TAB & SHIFT+TAB INDENTATION ──
    if (e.key === "Tab") {
      e.preventDefault();
      const tabSpaces = "    "; // 4 spaces

      if (start === end) {
        // Single cursor position
        if (e.shiftKey) {
          // Outdent line
          const lineStart = value.lastIndexOf("\n", start - 1) + 1;
          const linePrefix = value.substring(lineStart, lineStart + 4);
          let removeCount = 0;
          for (let i = 0; i < linePrefix.length; i++) {
            if (linePrefix[i] === " ") removeCount++;
            else if (linePrefix[i] === "\t") {
              removeCount = 1;
              break;
            } else break;
          }
          if (removeCount > 0) {
            const next = value.substring(0, lineStart) + value.substring(lineStart + removeCount);
            onChange(next);
            requestAnimationFrame(() => {
              el.selectionStart = el.selectionEnd = Math.max(lineStart, start - removeCount);
              updateCursorStats();
            });
          }
        } else {
          // Indent 4 spaces
          const next = value.substring(0, start) + tabSpaces + value.substring(end);
          onChange(next);
          requestAnimationFrame(() => {
            el.selectionStart = el.selectionEnd = start + 4;
            updateCursorStats();
          });
        }
      } else {
        // Multi-line selection: indent or outdent all selected lines
        const firstLineStart = value.lastIndexOf("\n", start - 1) + 1;
        const lastLineEnd = value.indexOf("\n", end);
        const effectiveEnd = lastLineEnd === -1 ? value.length : lastLineEnd;
        const block = value.substring(firstLineStart, effectiveEnd);
        const blockLines = block.split("\n");

        if (e.shiftKey) {
          // Outdent lines
          let totalRemoved = 0;
          const newLines = blockLines.map((line) => {
            if (line.startsWith("    ")) {
              totalRemoved += 4;
              return line.substring(4);
            }
            if (line.startsWith("\t")) {
              totalRemoved += 1;
              return line.substring(1);
            }
            const spaces = line.match(/^ +/)?.[0].length || 0;
            const toCut = Math.min(spaces, 4);
            totalRemoved += toCut;
            return line.substring(toCut);
          });
          const next = value.substring(0, firstLineStart) + newLines.join("\n") + value.substring(effectiveEnd);
          onChange(next);
          requestAnimationFrame(() => {
            el.selectionStart = firstLineStart;
            el.selectionEnd = Math.max(firstLineStart, effectiveEnd - totalRemoved);
            updateCursorStats();
          });
        } else {
          // Indent lines
          const newLines = blockLines.map((line) => tabSpaces + line);
          const next = value.substring(0, firstLineStart) + newLines.join("\n") + value.substring(effectiveEnd);
          onChange(next);
          requestAnimationFrame(() => {
            el.selectionStart = firstLineStart;
            el.selectionEnd = effectiveEnd + tabSpaces.length * blockLines.length;
            updateCursorStats();
          });
        }
      }
      return;
    }

    // ── 2. SMART ENTER INDENTATION ──
    if (e.key === "Enter") {
      e.preventDefault();
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const currentLine = value.substring(lineStart, start);
      const matchIndent = currentLine.match(/^[ \t]*/);
      let indent = matchIndent ? matchIndent[0] : "";

      const trimmedBeforeCursor = currentLine.trimEnd();
      const openBrace = trimmedBeforeCursor.endsWith("{");
      const openColon = trimmedBeforeCursor.endsWith(":");
      const nextChar = value[start] || "";

      let insertion = "\n" + indent;
      let extraIndent = "    ";

      if (openBrace || openColon) {
        insertion += extraIndent;
      }

      if (openBrace && nextChar === "}") {
        // e.g. typing Enter inside `{}` -> put closing brace on its own indented line
        const fullInsert = insertion + "\n" + indent;
        const next = value.substring(0, start) + fullInsert + value.substring(end);
        onChange(next);
        requestAnimationFrame(() => {
          el.selectionStart = el.selectionEnd = start + insertion.length;
          updateCursorStats();
        });
        return;
      }

      const next = value.substring(0, start) + insertion + value.substring(end);
      onChange(next);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + insertion.length;
        updateCursorStats();
      });
      return;
    }

    // ── 3. AUTO-CLOSING PAIRS ──
    const PAIRS: Record<string, string> = {
      "(": ")",
      "[": "]",
      "{": "}",
      '"': '"',
      "'": "'",
      "`": "`",
    };

    if (PAIRS[e.key]) {
      const openChar = e.key;
      const closeChar = PAIRS[e.key];

      // If text selected, wrap selection in the pair
      if (start !== end) {
        e.preventDefault();
        const selected = value.substring(start, end);
        const wrapped = openChar + selected + closeChar;
        const next = value.substring(0, start) + wrapped + value.substring(end);
        onChange(next);
        requestAnimationFrame(() => {
          el.selectionStart = start + 1;
          el.selectionEnd = end + 1;
          updateCursorStats();
        });
        return;
      }

      // If typing closing quote/bracket and next character is identical, just step over it
      if (openChar === closeChar && value[start] === closeChar) {
        e.preventDefault();
        el.selectionStart = el.selectionEnd = start + 1;
        updateCursorStats();
        return;
      }

      // Auto-insert pair with cursor between
      e.preventDefault();
      const pair = openChar + closeChar;
      const next = value.substring(0, start) + pair + value.substring(end);
      onChange(next);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 1;
        updateCursorStats();
      });
      return;
    }

    // Stepping over closing bracket/parenthesis if user manually types it
    if ((e.key === ")" || e.key === "]" || e.key === "}") && value[start] === e.key && start === end) {
      e.preventDefault();
      el.selectionStart = el.selectionEnd = start + 1;
      updateCursorStats();
      return;
    }

    // ── 4. BACKSPACE PAIR DELETION ──
    if (e.key === "Backspace" && start === end && start > 0) {
      const charBefore = value[start - 1];
      const charAfter = value[start];
      if (PAIRS[charBefore] && PAIRS[charBefore] === charAfter) {
        e.preventDefault();
        const next = value.substring(0, start - 1) + value.substring(start + 1);
        onChange(next);
        requestAnimationFrame(() => {
          el.selectionStart = el.selectionEnd = start - 1;
          updateCursorStats();
        });
        return;
      }
    }
  };

  const currentTheme = THEMES.find((t) => t.id === theme) || THEMES[0];
  const langSnippets = CODE_SNIPPETS[language.toLowerCase()] || CODE_SNIPPETS.cpp;

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border transition-all duration-150 overflow-hidden shadow-xl",
        currentTheme.bg,
        currentTheme.border,
        isFullscreen && "!fixed !inset-0 !z-[999999] !rounded-none !w-screen !h-screen",
        className
      )}
    >
      {/* ── TOP EDITOR TOOLBAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 px-3 py-2 border-b border-white/10 bg-black/40 shrink-0 text-xs">
        {/* Left Toolbar: Language tag, Format Button, Snippets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-[11px]">
            <Code2 className="size-3.5" />
            <span className="uppercase">{language}</span>
          </div>

          {/* FORMAT CODE BUTTON */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFormat}
            disabled={readOnly || !value.trim()}
            className="h-7 px-2.5 rounded-xl text-[11px] font-bold border-amber-500/30 text-amber-400 hover:bg-amber-500/10 cursor-pointer shadow-xs gap-1.5"
            title="Auto-format and beautify code (Alt+Shift+F)"
          >
            <Sparkles className="size-3 text-amber-400" />
            <span>Format Code</span>
          </Button>

          {/* SNIPPETS POPUP */}
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSnippets((p) => !p)}
              disabled={readOnly}
              className="h-7 px-2 rounded-xl text-[11px] border-white/10 text-muted-foreground hover:text-foreground cursor-pointer gap-1"
              title="Insert competitive programming templates"
            >
              <span>Snippets</span>
              <ChevronDown className="size-3" />
            </Button>

            {showSnippets && (
              <div className="absolute left-0 top-full mt-1.5 w-64 rounded-xl border border-white/15 bg-zinc-950 p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-white/10 mb-1">
                  {language.toUpperCase()} Snippets
                </div>
                {langSnippets.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleInsertSnippet(item.snippet)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-200 hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* FIND & REPLACE TOGGLE */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowFindReplace((p) => !p)}
            className={cn(
              "h-7 px-2 rounded-xl text-[11px] border-white/10 cursor-pointer gap-1",
              showFindReplace
                ? "bg-primary/20 text-primary border-primary/40 font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Find & Replace (Ctrl+F)"
          >
            <Search className="size-3" />
            <span>Find</span>
          </Button>
        </div>

        {/* Right Toolbar: Undo/Redo, Wrap, Font, Theme, Copy, Clear, Fullscreen */}
        <div className="flex items-center gap-1 flex-wrap">
          {/* Undo / Redo */}
          {!readOnly && (
            <div className="flex items-center border border-white/10 rounded-xl overflow-hidden bg-white/5">
              <button
                type="button"
                onClick={handleUndo}
                className="p-1 px-1.5 hover:bg-white/10 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                title="Undo"
              >
                <Undo2 className="size-3" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                className="p-1 px-1.5 hover:bg-white/10 text-muted-foreground hover:text-foreground cursor-pointer transition-colors border-l border-white/10"
                title="Redo"
              >
                <Redo2 className="size-3" />
              </button>
            </div>
          )}

          {/* Word Wrap */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setWordWrap((w) => !w)}
            className={cn(
              "h-7 px-2 rounded-xl text-[11px] cursor-pointer gap-1",
              wordWrap ? "bg-white/15 text-foreground font-bold" : "text-muted-foreground hover:text-foreground"
            )}
            title={wordWrap ? "Disable line wrapping" : "Enable line wrapping"}
          >
            <WrapText className="size-3" />
            <span className="hidden sm:inline">{wordWrap ? "Wrap On" : "Wrap Off"}</span>
          </Button>

          {/* Font Size Toggle */}
          <div className="flex items-center border border-white/10 rounded-xl px-1.5 h-7 bg-white/5 text-[10px] font-bold text-muted-foreground gap-1">
            <Type className="size-3" />
            <button
              type="button"
              onClick={() => setFontSize("sm")}
              className={cn("px-1 py-0.5 rounded cursor-pointer", fontSize === "sm" && "text-primary font-extrabold bg-primary/20")}
            >
              12
            </button>
            <button
              type="button"
              onClick={() => setFontSize("base")}
              className={cn("px-1 py-0.5 rounded cursor-pointer", fontSize === "base" && "text-primary font-extrabold bg-primary/20")}
            >
              14
            </button>
            <button
              type="button"
              onClick={() => setFontSize("lg")}
              className={cn("px-1 py-0.5 rounded cursor-pointer", fontSize === "lg" && "text-primary font-extrabold bg-primary/20")}
            >
              16
            </button>
          </div>

          {/* Copy Code */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2 rounded-xl text-[11px] border-white/10 text-muted-foreground hover:text-foreground cursor-pointer gap-1"
            title="Copy all code to clipboard"
          >
            {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </Button>

          {/* Clear Code */}
          {!readOnly && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={!value.trim()}
              className="h-7 px-2 rounded-xl text-[11px] text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
              title="Clear editor"
            >
              <Trash2 className="size-3" />
            </Button>
          )}

          {/* Fullscreen */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="h-7 px-2 rounded-xl text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
            title={isFullscreen ? "Exit fullscreen" : "Expand editor to fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="size-3" /> : <Maximize2 className="size-3" />}
          </Button>
        </div>
      </div>

      {/* ── FIND & REPLACE EXPANDABLE BAR ── */}
      {showFindReplace && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 border-b border-white/10 bg-zinc-950/90 text-xs animate-in slide-in-from-top duration-150 shrink-0">
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Find in code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleFindNext(e.shiftKey ? "prev" : "next");
                  }
                }}
                className="h-7 px-2 text-xs rounded-lg bg-zinc-900 border border-white/15 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary w-40 sm:w-48"
                autoFocus
              />
              {matchCount > 0 && (
                <span className="text-[10px] text-muted-foreground font-mono ml-1.5 shrink-0">
                  {matchCount} {matchCount === 1 ? "match" : "matches"}
                </span>
              )}
            </div>

            {/* Next / Prev Buttons */}
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleFindNext("prev")}
                disabled={!searchQuery}
                className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                title="Previous match (Shift+Enter)"
              >
                <ArrowUp className="size-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleFindNext("next")}
                disabled={!searchQuery}
                className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                title="Next match (Enter)"
              >
                <ArrowDown className="size-3" />
              </Button>
            </div>

            {!readOnly && (
              <>
                {/* Replace Input */}
                <input
                  type="text"
                  placeholder="Replace with..."
                  value={replaceQuery}
                  onChange={(e) => setReplaceQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleReplaceOne();
                    }
                  }}
                  className="h-7 px-2 text-xs rounded-lg bg-zinc-900 border border-white/15 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary w-36 sm:w-44"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReplaceOne}
                  disabled={!searchQuery}
                  className="h-7 px-2 rounded-lg text-[11px] border-white/15 cursor-pointer"
                >
                  Replace
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReplaceAll}
                  disabled={!searchQuery}
                  className="h-7 px-2 rounded-lg text-[11px] border-white/15 cursor-pointer"
                >
                  Replace All
                </Button>
              </>
            )}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowFindReplace(false)}
            className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer ml-auto"
            title="Close (Esc)"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      {/* ── EDITOR BODY: GUTTER + TEXTAREA ── */}
      <div
        className="flex flex-1 min-h-0 relative font-mono overflow-hidden"
        style={{ height: isFullscreen ? "calc(100vh - 80px)" : (minHeight || "340px") }}
      >
        {/* Line Numbers Gutter */}
        <div
          ref={gutterRef}
          aria-hidden="true"
          className="select-none overflow-hidden text-right py-3.5 pl-3 pr-2.5 border-r border-white/10 bg-black/50 text-zinc-500/70 shrink-0 font-mono"
          style={{
            minWidth: totalLines > 999 ? "58px" : totalLines > 99 ? "48px" : "40px",
            fontSize: fontSize === "sm" ? "12px" : fontSize === "base" ? "13.5px" : "15.5px",
            lineHeight: "22px",
          }}
        >
          {Array.from({ length: totalLines }, (_, i) => i + 1).map((n) => (
            <div
              key={n}
              className={cn(
                "transition-colors",
                n === cursorPos.line ? "text-primary font-bold bg-primary/10 -mr-2.5 pr-2.5 rounded-l" : ""
              )}
            >
              {n}
            </div>
          ))}
        </div>

        {/* Code Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            updateCursorStats();
          }}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          onKeyUp={updateCursorStats}
          onClick={updateCursorStats}
          onSelect={updateCursorStats}
          readOnly={readOnly}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          placeholder={placeholder}
          className={cn(
            "flex-1 w-full p-3.5 bg-transparent text-zinc-100 outline-none leading-[22px] font-mono shadow-inner resize-none",
            wordWrap ? "whitespace-pre-wrap break-words overflow-y-auto" : "whitespace-pre overflow-auto",
            fontSize === "sm" ? "text-xs" : fontSize === "base" ? "text-[13.5px]" : "text-[15.5px]"
          )}
          style={{
            tabSize: 4,
          }}
        />
      </div>

      {/* ── STATUS FOOTER BAR ── */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-white/10 bg-black/60 text-[10px] text-muted-foreground font-mono shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span>
            Ln <strong className="text-foreground">{cursorPos.line}</strong>, Col{" "}
            <strong className="text-foreground">{cursorPos.col}</strong>
          </span>
          {selectedChars > 0 && (
            <span className="text-primary font-bold">({selectedChars} selected)</span>
          )}
          <span>
            {totalLines} {totalLines === 1 ? "line" : "lines"}
          </span>
          <span>{value.length} chars</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-muted-foreground/60">
            Alt+Shift+F to Format · Tab to Indent
          </span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            UTF-8
          </span>
        </div>
      </div>
    </div>
  );
}

import { SECTIONS } from "@/lib/a2z-data";
import { EXTRA_PROBLEMS, type Sheet } from "@/lib/extra-problems-data";
import { SHEET_PROBLEMS_MAP } from "@/lib/sheets-data";
import type { Difficulty } from "@/lib/types";

export type Platform = "All" | "LeetCode" | "GeeksforGeeks" | "GFG" | "HackerRank" | "CodeStudio";

export type SheetFilter =
  | "All"
  | "Core 404"
  | "Striver's A2Z"
  | "Striver's SDE"
  | "NeetCode 150"
  | "Love Babbar 450"
  | "RisingBrains"
  | Sheet;

export interface FlatProblem {
  name: string;
  difficulty: Difficulty;
  platform: Platform;
  topic: string;
  sheet: SheetFilter;
  link: string;
}

function canonicalPlatform(p: string): Platform {
  if (p === "LC" || p === "LeetCode") return "LeetCode";
  if (p === "GFG" || p === "GeeksforGeeks") return "GeeksforGeeks";
  if (p === "HR" || p === "HackerRank") return "HackerRank";
  if (p === "CS" || p === "CodeStudio") return "CodeStudio";
  return "LeetCode";
}

function buildAllProblems(): FlatProblem[] {
  const coreProblems: FlatProblem[] = (SHEET_PROBLEMS_MAP.core404 || []).map((p) => ({
    name: p.name,
    difficulty: p.difficulty,
    platform: canonicalPlatform(p.platform),
    topic: p.topic || p.pattern || "Core DSA",
    sheet: "Core 404" as SheetFilter,
    link: p.link || "",
  }));

  const a2zProblems: FlatProblem[] = (SHEET_PROBLEMS_MAP.striver_a2z || []).map((p) => ({
    name: p.name,
    difficulty: p.difficulty,
    platform: canonicalPlatform(p.platform),
    topic: p.topic || "A2Z DSA",
    sheet: "Striver's A2Z" as SheetFilter,
    link: p.link || "",
  }));

  const sdeProblems: FlatProblem[] = (SHEET_PROBLEMS_MAP.striver_sde || []).map((p) => ({
    name: p.name,
    difficulty: p.difficulty,
    platform: canonicalPlatform(p.platform),
    topic: p.topic || "SDE Sheet",
    sheet: "Striver's SDE" as SheetFilter,
    link: p.link || "",
  }));

  const neetcodeProblems: FlatProblem[] = (SHEET_PROBLEMS_MAP.neetcode150 || []).map((p) => ({
    name: p.name,
    difficulty: p.difficulty,
    platform: canonicalPlatform(p.platform),
    topic: p.topic || "NeetCode 150",
    sheet: "NeetCode 150" as SheetFilter,
    link: p.link || "",
  }));

  const babbarProblems: FlatProblem[] = (SHEET_PROBLEMS_MAP.love_babbar || []).map((p) => ({
    name: p.name,
    difficulty: p.difficulty,
    platform: canonicalPlatform(p.platform),
    topic: p.topic || "Love Babbar 450",
    sheet: "Love Babbar 450" as SheetFilter,
    link: p.link || "",
  }));

  const risingProblems: FlatProblem[] = (SHEET_PROBLEMS_MAP.rising_brains || []).map((p) => ({
    name: p.name,
    difficulty: p.difficulty,
    platform: canonicalPlatform(p.platform),
    topic: p.topic || "RisingBrains",
    sheet: "RisingBrains" as SheetFilter,
    link: p.link || "",
  }));

  const extra: FlatProblem[] = EXTRA_PROBLEMS.map((p) => ({
    name: p.name,
    difficulty: p.difficulty,
    platform: p.platform as Platform,
    topic: p.topic,
    sheet: p.sheet as SheetFilter,
    link: p.link || "",
  }));

  const all = [
    ...coreProblems,
    ...a2zProblems,
    ...sdeProblems,
    ...neetcodeProblems,
    ...babbarProblems,
    ...risingProblems,
    ...extra,
  ];

  const seen = new Set<string>();
  return all.filter((p) => {
    const key = `${p.sheet}|${p.name.toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const ALL_PROBLEMS = buildAllProblems();

const CANONICAL_MAP = new Map<string, string>();
ALL_PROBLEMS.forEach((p) => {
  if (p.link && !p.link.includes("search?q=") && !p.link.includes("search/?gq=")) {
    CANONICAL_MAP.set(p.name.toLowerCase().trim(), p.link);
  }
});

export function getCanonicalProblemLink(name: string): string | undefined {
  if (!name) return undefined;
  return CANONICAL_MAP.get(name.toLowerCase().trim());
}

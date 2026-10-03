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

export function normalizePlatformName(rawPlatform?: string, link?: string): string {
 if (link) {
 const l = link.toLowerCase();
 if (l.includes("leetcode.com")) return "LeetCode";
 if (l.includes("geeksforgeeks.org")) return "GeeksforGeeks";
 if (l.includes("codeforces.com")) return "Codeforces";
 if (l.includes("codechef.com")) return "CodeChef";
 if (l.includes("hackerrank.com")) return "HackerRank";
 if (l.includes("atcoder.jp")) return "AtCoder";
 if (l.includes("naukri.com") || l.includes("codingninjas.com")) return "CodeStudio";
 }
 if (!rawPlatform) return "DSA";
 const p = rawPlatform.trim();
 const lower = p.toLowerCase();
 if (lower === "lc" || lower.includes("leetcode")) return "LeetCode";
 if (lower === "gfg" || lower.includes("geeks")) return "GeeksforGeeks";
 if (lower === "cf" || lower.includes("codeforces")) return "Codeforces";
 if (lower === "cc" || lower.includes("codechef")) return "CodeChef";
 if (lower === "hr" || lower.includes("hackerrank")) return "HackerRank";
 if (lower === "ac" || lower.includes("atcoder")) return "AtCoder";
 if (lower.includes("ninja") || lower.includes("studio")) return "CodeStudio";

 if (
 lower.includes("array") ||
 lower.includes("string") ||
 lower.includes("tree") ||
 lower.includes("graph") ||
 lower.includes("dp") ||
 lower.includes("dynamic") ||
 lower.includes("pointer") ||
 lower.includes("search") ||
 lower.includes("sort") ||
 lower.includes("stack") ||
 lower.includes("queue") ||
 lower.includes("heap") ||
 lower.includes("hash") ||
 lower.includes("recursion")
 ) {
 return "DSA";
 }
 return p;
}

export function getProblemMetadata(name: string): {
 link?: string;
 platform?: string;
 difficulty?: Difficulty;
 topic?: string;
 sheet?: SheetFilter;
} {
 if (!name) return {};
 const cleanName = name.toLowerCase().trim();
 const match = ALL_PROBLEMS.find((p) => p.name.toLowerCase().trim() === cleanName);
 if (match) {
 const rawPlat = match.platform === "GFG" ? "GeeksforGeeks" : match.platform;
 return {
 link: match.link || getCanonicalProblemLink(name),
 platform: normalizePlatformName(rawPlat, match.link),
 difficulty: match.difficulty,
 topic: match.topic,
 sheet: match.sheet,
 };
 }
 return {
 link: getCanonicalProblemLink(name),
 };
}


import { SECTIONS, type SeedProblem } from "./a2z-data";
import { getSectionsForSheet, getSheetMeta, CURATED_SHEETS } from "./sheets-data";
import type { ChecklistItem, Day, Difficulty, Problem } from "./types";

export const START_DATE = "2026-08-01";
export const BASE_DAYS = 120;

export const CHECKLIST_TEMPLATE = [
  "Watch video",
  "Read notes",
  "Understand brute force",
  "Derive better approach",
  "Code it",
  "Optimize",
  "Dry run",
  "Submit",
  "Read editorial",
  "Revise yesterday",
  "Push to GitHub",
  "Update notes",
];

export const newChecklist = (): ChecklistItem[] =>
  CHECKLIST_TEMPLATE.map((label) => ({ label, done: false }));

export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function diffDays(a: string, b: string): number {
  return Math.round(
    (new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / 86400000,
  );
}

export const todayIso = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/**
 * Upgrade 1: prefer the verified direct problem page. Only fall back to the
 * old search URL when we could not confirm a canonical link.
 */
function platformLink(p: any): string {
  const raw = p.link || p.l;
  if (raw && !raw.includes("search?q=") && !raw.includes("search/?gq=")) return raw;
  const name = p.name || p.n || "";
  const topic = p.topic || "";
  const q = encodeURIComponent(`${name} ${topic}`);
  const plat = p.platform || p.p || "LeetCode";
  if (plat === "LeetCode") return `https://leetcode.com/problemset/?search=${q}`;
  if (plat === "GFG" || plat === "GeeksforGeeks") return `https://www.geeksforgeeks.org/search/?gq=${q}`;
  return `https://www.google.com/search?q=${q}`;
}

const estFor = (d: Difficulty) => (d === "Easy" ? 15 : d === "Medium" ? 30 : 45);

function toProblem(p: any): Problem {
  const name = p.name || p.n;
  const diff = (p.difficulty || p.d || "Easy") as Difficulty;
  const plat = p.platform || p.p || "LeetCode";
  const rawLink = p.link || p.l;
  const normPlat = plat === "GFG" || plat === "GeeksforGeeks" ? "GeeksforGeeks" : plat;
  const isDirect = Boolean(rawLink && !rawLink.includes("search?q=") && !rawLink.includes("search/?gq="));
  return {
    name,
    difficulty: diff,
    platform: normPlat,
    link: platformLink(p),
    linkVerified: isDirect,
    takeUForwardLink: p.videoUrl || null,
    estTime: estFor(diff),
    done: false,
    isHard: diff === "Hard",
    level: p.level || p.lvl || "Level 1",
  };
}

export const TOTAL_PROBLEMS = SECTIONS.reduce((a, s) => a + s.problems.length, 0);

/** Distribute the topic sections across target days, preserving order. */
export function dayAllocationForSections(sections: { problems: any[] }[], targetDays = BASE_DAYS): number[] {
  const counts = sections.map((s) => Math.max(1, s.problems.length));
  const total = counts.reduce((a, b) => a + b, 0);
  const raw = counts.map((c) => (c / total) * targetDays);
  const alloc = raw.map((r) => Math.max(1, Math.floor(r)));
  let remaining = targetDays - alloc.reduce((a, b) => a + b, 0);
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac);
  let k = 0;
  while (remaining > 0 && order.length > 0) {
    alloc[order[k % order.length].i] += 1;
    remaining -= 1;
    k += 1;
  }
  while (remaining < 0) {
    const idx = alloc.findIndex((v, i) => v > 1 && counts[i] / v < 3);
    alloc[idx === -1 ? alloc.indexOf(Math.max(...alloc)) : idx] -= 1;
    remaining += 1;
  }
  return alloc;
}

function dayAllocation(): number[] {
  return dayAllocationForSections(SECTIONS);
}

/**
 * Teacher/student rhythm: Monday–Saturday cover new topics, and every Sunday
 * (relative to the plan's own start date) is set aside as a Weekly Revision
 * day listing that week's study days so the student can revisit and
 * re-solve everything before moving on.
 *
 * This is factored out of `seedDays` so `rebalanceRemaining` can re-run the
 * exact same interleaving after it rebuilds the tail of a plan — otherwise a
 * rebalance (which flattens every remaining problem and repacks days purely
 * by pace) would silently drop every Sunday revision day it touches.
 *
 * `startPosition` is the count of *active* (non-skipped) days that will sit
 * ahead of `contentDays` in the final sequence once merged back in. Every
 * entry — content or revision — consumes exactly one calendar day and one
 * dayNumber, in lockstep, so `startPosition` doubles as both the Sunday/weekday
 * offset and the base dayNumber to keep `revisionDayNumbers` correct; the
 * caller's later `renumber()` call re-derives the same numbers as long as
 * order is preserved, so this only needs to be self-consistent, not final.
 */
function interleaveWeeklyRevision(
  contentDays: Day[],
  startDate: string,
  startPosition = 0,
): Day[] {
  const startDow = new Date(`${startDate}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  const isThuToSun = startDow === 4 || startDow === 5 || startDow === 6 || startDow === 0;

  const days: Day[] = [];
  let contentIdx = 0;
  let weekDayNumbers: number[] = [];
  let position = startPosition;
  let dayNumber = startPosition;
  let firstSundayHandled = false;

  while (contentIdx < contentDays.length) {
    const isSunday = (startDow + position) % 7 === 0;
    dayNumber += 1;

    let isRevision = false;
    if (isSunday) {
      if (!firstSundayHandled) {
        firstSundayHandled = true;
        // If starting day is Thursday..Sunday, skip revision on the 1st Sunday!
        isRevision = !isThuToSun;
      } else {
        isRevision = true;
      }
    }

    if (isRevision) {
      days.push({
        id: `revision-week-${Math.ceil(dayNumber / 7)}`,
        dayNumber: 0,
        date: startDate,
        section: "Revision",
        topic: "Weekly Revision",
        subtopics: [],
        problems: [],
        checklist: [],
        status: "pending",
        notes: "",
        revisionNotes: "",
        skipped: false,
        isRevisionDay: true,
        revisionDayNumbers: weekDayNumbers,
      });
      weekDayNumbers = [];
    } else {
      const c = contentDays[contentIdx];
      contentIdx += 1;
      days.push(c);
      weekDayNumbers.push(dayNumber);
    }
    position += 1;
  }

  return days;
}

export function seedDays(startDate = START_DATE, sheetId = "core404"): Day[] {
  const sections = getSectionsForSheet(sheetId);
  const alloc = dayAllocationForSections(sections);
  const contentDays: Omit<Day, "dayNumber" | "date">[] = [];

  sections.forEach((section, si) => {
    const nDays = alloc[si] || 1;
    const problems = section.problems;
    const per = Math.ceil(problems.length / nDays);
    for (let i = 0; i < nDays; i++) {
      const chunk = problems.slice(i * per, (i + 1) * per);
      if (chunk.length === 0 && i > 0) continue;
      const subCount = Math.max(1, Math.ceil(section.subtopics.length / nDays));
      const subs = section.subtopics.slice(i * subCount, (i + 1) * subCount);
      contentDays.push({
        id: `${slug(section.topic)}-${sheetId}-${i + 1}`,
        section: section.topic,
        topic: nDays > 1 ? `${section.topic} — Part ${i + 1}` : section.topic,
        subtopics: subs.length ? subs : section.subtopics.slice(0, 2),
        problems: chunk.map((p) => toProblem(p)),
        checklist: newChecklist(),
        status: "pending",
        notes: "",
        revisionNotes: "",
        skipped: false,
        level: chunk[0]?.level || "Level 1",
      });
    }
  });

  const placeholder: Day[] = contentDays.map((c) => ({ ...c, dayNumber: 0, date: startDate }));
  const interleaved = interleaveWeeklyRevision(placeholder, startDate, 0);
  const days: Day[] = interleaved.map((d, i) => ({
    ...d,
    dayNumber: i + 1,
    date: addDays(startDate, i),
  }));

  return renumber(days, startDate);
}

/**
 * Re-derive dayNumber + date from array order. Sequence is the source of truth.
 * Guarantees every single active day has a strictly consecutive calendar date without leaving any date missing.
 *
 * If `isPaused` is true, all day dates and numbers are frozen.
 * If `isPaused` is false, active days flow consecutively day by day with zero gaps.
 */
export function renumber(
  days: Day[],
  startDate = START_DATE,
  offset = 0,
  isPaused = false,
): Day[] {
  if (isPaused) {
    let seq = 0;
    let skippedSeq = 0;
    return days.map((d) => {
      if (d.skipped) {
        skippedSeq += 1;
        return { ...d, dayNumber: -skippedSeq };
      }
      seq += 1;
      return { ...d, dayNumber: seq };
    });
  }

  const firstActive = days.find((d) => !d.skipped);
  if (!firstActive) {
    let skippedSeq = 0;
    return days.map((d) => {
      skippedSeq += 1;
      return { ...d, dayNumber: -skippedSeq };
    });
  }

  // Determine starting calendar anchor
  // Must anchor on startDate + offset so every single calendar date is strictly covered without leaving any date missing
  const baseDate = addDays(startDate, offset);

  let seq = 0;
  let skippedSeq = 0;
  let calOffset = 0;

  return days.map((d) => {
    if (d.skipped) {
      skippedSeq += 1;
      return { ...d, dayNumber: -skippedSeq };
    }

    seq += 1;
    // Strictly consecutive calendar date: diffDays between consecutive active days is always exactly 1
    const calDate = addDays(baseDate, calOffset);
    calOffset += 1;

    return { ...d, dayNumber: seq, date: calDate };
  });
}

/**
 * Current calendar offset of a plan versus its pure start-date schedule.
 *
 * Anchors on the first *active* (non-skipped) day rather than literally
 * `days[0]`. Skipped days don't get their date refreshed by `renumber` (it's
 * irrelevant to them), so if a skipped day happened to sit first in the
 * array, its stale date would get read as the offset here and that wrong
 * offset would then get baked into every future renumber — which is exactly
 * what caused "today" to keep drifting to a later and later date after a
 * few skips. Comparing an active day's actual date against its own expected
 * date (from its current dayNumber) sidesteps that regardless of position.
 */
export const planOffset = (days: Day[], startDate = START_DATE) => {
  const anchor = days.find((d) => !d.skipped);
  if (!anchor) return 0;
  const expected = addDays(startDate, anchor.dayNumber - 1);
  return diffDays(expected, anchor.date);
};


export const dayProgress = (d: Day) => {
  const total = d.problems.length;
  const done = d.problems.filter((p) => p.done).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
};

export function deriveStatus(d: Day): Day["status"] {
  if (d.skipped) return "skipped";
  if (d.status === "postponed" || d.status === "merged" || d.status === "revision") return d.status;
  const { done, total } = dayProgress(d);
  const checks = d.checklist.filter((c) => c.done).length;
  if (total > 0 && done === total) return "completed";
  if (done > 0 || checks > 0) return "in_progress";
  return "pending";
}

export const isDayComplete = (d: Day) =>
  d.problems.length > 0 && d.problems.every((p) => p.done);

export const STATUS_META: Record<Day["status"], { icon: string; label: string; className: string }> =
{
  pending: { icon: "⏳", label: "Pending", className: "text-muted-foreground" },
  in_progress: { icon: "◐", label: "In progress", className: "text-warning" },
  completed: { icon: "✅", label: "Completed", className: "text-success" },
  postponed: { icon: "⏸", label: "Postponed", className: "text-warning" },
  merged: { icon: "🔀", label: "Merged", className: "text-accent-foreground" },
  revision: { icon: "🔁", label: "Revision", className: "text-primary" },
  skipped: { icon: "⛔", label: "Skipped", className: "text-muted-foreground" },
};
/* ------------------------------------------------------------------ */
/* Upgrade 5b: Tutor & Student Daily Problem Count & Level Ratios      */
/* ------------------------------------------------------------------ */

export type PaceTier = "casual" | "balanced" | "standard" | "intensive" | "custom";

export interface LevelRatio {
  easy: number;
  medium: number;
  hard: number;
}

export interface TutorPacePreset {
  id: PaceTier;
  label: string;
  badge?: string;
  target: number; // total problems to solve per day
  timeEstimateMin: number;
  timeEstimateMax: number;
  description: string;
  tagline: string;
  levelRatios: {
    level1: LevelRatio; // Foundations (Level 1)
    level2: LevelRatio; // Core DSA (Level 2)
    level3: LevelRatio; // Advanced (Level 3)
  };
}

export const TUTOR_PACE_PRESETS: Record<PaceTier, TutorPacePreset> = {
  casual: {
    id: "casual",
    label: "Casual",
    badge: "Low Stress",
    target: 2,
    timeEstimateMin: 35,
    timeEstimateMax: 50,
    tagline: "2 problems / day · Consistent habit without pressure",
    description: "Perfect for busy college semesters, exam weeks, or working developers.",
    levelRatios: {
      level1: { easy: 2, medium: 0, hard: 0 },
      level2: { easy: 0, medium: 1, hard: 0 },
      level3: { easy: 0, medium: 1, hard: 0 },
    },
  },
  balanced: {
    id: "balanced",
    label: "Balanced",
    badge: "⭐ Tutor Recommended",
    target: 3,
    timeEstimateMin: 65,
    timeEstimateMax: 90,
    tagline: "3 problems / day · The golden standard for DSA mastery",
    description: "Recommended by top mentors: master 1 core pattern + solve solid variations every day without mental burnout.",
    levelRatios: {
      level1: { easy: 1, medium: 1, hard: 0 },
      level2: { easy: 1, medium: 1, hard: 0 },
      level3: { easy: 0, medium: 0, hard: 1 },
    },
  },
  standard: {
    id: "standard",
    label: "Standard",
    badge: "Placement Track",
    target: 4,
    timeEstimateMin: 90,
    timeEstimateMax: 120,
    tagline: "4 problems / day · Fast-track campus & interview prep",
    description: "Structured sprint with balanced weightage (2E=1M, 3E=1H, 2M=1H).",
    levelRatios: {
      level1: { easy: 2, medium: 1, hard: 0 },
      level2: { easy: 0, medium: 2, hard: 0 },
      level3: { easy: 1, medium: 0, hard: 1 },
    },
  },
  intensive: {
    id: "intensive",
    label: "Intensive",
    badge: "Bootcamp Mode",
    target: 5,
    timeEstimateMin: 120,
    timeEstimateMax: 160,
    tagline: "5 problems / day · Dedicated full-time coding sprint",
    description: "For vacations or students dedicating whole days to competitive programming.",
    levelRatios: {
      level1: { easy: 3, medium: 1, hard: 0 },
      level2: { easy: 1, medium: 2, hard: 0 },
      level3: { easy: 0, medium: 1, hard: 1 },
    },
  },
  custom: {
    id: "custom",
    label: "Custom",
    target: 3,
    timeEstimateMin: 60,
    timeEstimateMax: 120,
    tagline: "Custom problems / day",
    description: "Customized daily workload.",
    levelRatios: {
      level1: { easy: 1, medium: 1, hard: 0 },
      level2: { easy: 1, medium: 1, hard: 0 },
      level3: { easy: 0, medium: 0, hard: 1 },
    },
  },
};

export interface DailyProblemCombination {
  id: string;
  label: string;
  easy: number;
  medium: number;
  hard: number;
  totalProblems: number;
  weight: number;
  timeEstimateMin: number;
  dayType: string;
  description: string;
}

export const DAILY_COMBINATIONS_BY_TARGET: Record<number, DailyProblemCombination[]> = {
  1: [
    {
      id: "1-easy",
      label: "1 Easy",
      easy: 1,
      medium: 0,
      hard: 0,
      totalProblems: 1,
      weight: 1,
      timeEstimateMin: 15,
      dayType: "Foundations & Syntax Drill",
      description: "Core programming syntax & warmup problems",
    },
    {
      id: "1-medium",
      label: "1 Medium",
      easy: 0,
      medium: 1,
      hard: 0,
      totalProblems: 1,
      weight: 2,
      timeEstimateMin: 30,
      dayType: "Core Interview Pattern Day",
      description: "Standard interview pattern (Two Pointers, Hash Map, Binary Search)",
    },
    {
      id: "1-hard",
      label: "1 Hard",
      easy: 0,
      medium: 0,
      hard: 1,
      totalProblems: 1,
      weight: 3,
      timeEstimateMin: 45,
      dayType: "Advanced Algorithmic Challenge",
      description: "Complex DP, Graph algorithms or Trie optimization",
    },
  ],
  2: [
    {
      id: "2-easy",
      label: "2 Easy",
      easy: 2,
      medium: 0,
      hard: 0,
      totalProblems: 2,
      weight: 2,
      timeEstimateMin: 30,
      dayType: "Foundations & Basics Days",
      description: "Rapid fundamentals & syntax consolidation",
    },
    {
      id: "1e-1m",
      label: "1 Easy + 1 Medium",
      easy: 1,
      medium: 1,
      hard: 0,
      totalProblems: 2,
      weight: 3,
      timeEstimateMin: 45,
      dayType: "Concept + Interview Application",
      description: "1 concept builder + 1 standard interview question",
    },
    {
      id: "2-medium",
      label: "2 Medium",
      easy: 0,
      medium: 2,
      hard: 0,
      totalProblems: 2,
      weight: 4,
      timeEstimateMin: 60,
      dayType: "Standard Interview Practice",
      description: "2 solid interview problems (2M = 1H equivalent weight)",
    },
    {
      id: "1-hard",
      label: "1 Hard",
      easy: 0,
      medium: 0,
      hard: 1,
      totalProblems: 1,
      weight: 3,
      timeEstimateMin: 45,
      dayType: "Dedicated Deep Dive",
      description: "Focused advanced problem session (3E = 1H balance)",
    },
  ],
  3: [
    {
      id: "3-easy",
      label: "3 Easy",
      easy: 3,
      medium: 0,
      hard: 0,
      totalProblems: 3,
      weight: 3,
      timeEstimateMin: 45,
      dayType: "Foundations Sprint Days",
      description: "Rapid basics practice across basic data structures",
    },
    {
      id: "2e-1m",
      label: "2 Easy + 1 Medium",
      easy: 2,
      medium: 1,
      hard: 0,
      totalProblems: 3,
      weight: 4,
      timeEstimateMin: 60,
      dayType: "Balanced Ramp-up Days",
      description: "2 foundational questions + 1 interview variation",
    },
    {
      id: "1e-2m",
      label: "1 Easy + 2 Medium",
      easy: 1,
      medium: 2,
      hard: 0,
      totalProblems: 3,
      weight: 5,
      timeEstimateMin: 75,
      dayType: "Core Interview Sprint Days",
      description: "1 concept refresher + 2 medium interview patterns",
    },
    {
      id: "1m-1h",
      label: "1 Medium + 1 Hard",
      easy: 0,
      medium: 1,
      hard: 1,
      totalProblems: 2,
      weight: 5,
      timeEstimateMin: 75,
      dayType: "Advanced Mastery Days",
      description: "1 medium warm-up + 1 hard algorithmic deep dive",
    },
    {
      id: "1e-1h",
      label: "1 Easy + 1 Hard",
      easy: 1,
      medium: 0,
      hard: 1,
      totalProblems: 2,
      weight: 4,
      timeEstimateMin: 60,
      dayType: "Focused Challenge Days",
      description: "1 basic idea + 1 hard extension (3E = 1H balance)",
    },
  ],
  4: [
    {
      id: "4-easy",
      label: "4 Easy",
      easy: 4,
      medium: 0,
      hard: 0,
      totalProblems: 4,
      weight: 4,
      timeEstimateMin: 60,
      dayType: "Foundations Sprint Days",
      description: "Fast-track programming basics & syntax fluency",
    },
    {
      id: "2e-1m",
      label: "2 Easy + 1 Medium",
      easy: 2,
      medium: 1,
      hard: 0,
      totalProblems: 3,
      weight: 4,
      timeEstimateMin: 60,
      dayType: "Concept & Variation Days",
      description: "2 Easy + 1 Medium = 4 weight units (2E = 1M rule)",
    },
    {
      id: "2-medium",
      label: "2 Medium",
      easy: 0,
      medium: 2,
      hard: 0,
      totalProblems: 2,
      weight: 4,
      timeEstimateMin: 60,
      dayType: "Standard Interview Days",
      description: "2 Medium = 4 weight units (2M = 1H equivalent)",
    },
    {
      id: "1e-1h",
      label: "1 Easy + 1 Hard",
      easy: 1,
      medium: 0,
      hard: 1,
      totalProblems: 2,
      weight: 4,
      timeEstimateMin: 60,
      dayType: "Advanced Pattern Days",
      description: "1 Easy + 1 Hard = 4 weight units (3E = 1H rule)",
    },
    {
      id: "2e-2m",
      label: "2 Easy + 2 Medium",
      easy: 2,
      medium: 2,
      hard: 0,
      totalProblems: 4,
      weight: 6,
      timeEstimateMin: 90,
      dayType: "Comprehensive Practice Days",
      description: "2 concept builders + 2 real company interview problems",
    },
    {
      id: "2m-1h",
      label: "2 Medium + 1 Hard",
      easy: 0,
      medium: 2,
      hard: 1,
      totalProblems: 3,
      weight: 7,
      timeEstimateMin: 105,
      dayType: "FAANG / Top-Tier Sprint Days",
      description: "2 medium patterns + 1 advanced hard problem",
    },
  ],
  5: [
    {
      id: "5-easy",
      label: "5 Easy",
      easy: 5,
      medium: 0,
      hard: 0,
      totalProblems: 5,
      weight: 5,
      timeEstimateMin: 75,
      dayType: "High-Volume Foundations Days",
      description: "Rapid coverage of basics, recursion & math",
    },
    {
      id: "3e-1m",
      label: "3 Easy + 1 Medium",
      easy: 3,
      medium: 1,
      hard: 0,
      totalProblems: 4,
      weight: 5,
      timeEstimateMin: 75,
      dayType: "Foundations + Applied Days",
      description: "3 concept warmups + 1 core interview challenge",
    },
    {
      id: "1e-2m",
      label: "1 Easy + 2 Medium",
      easy: 1,
      medium: 2,
      hard: 0,
      totalProblems: 3,
      weight: 5,
      timeEstimateMin: 75,
      dayType: "Standard Interview Days",
      description: "1 concept builder + 2 interview patterns",
    },
    {
      id: "2e-1h",
      label: "2 Easy + 1 Hard",
      easy: 2,
      medium: 0,
      hard: 1,
      totalProblems: 3,
      weight: 5,
      timeEstimateMin: 75,
      dayType: "Concept + Advanced Days",
      description: "2 Easy + 1 Hard = 5 weight units (3E = 1H)",
    },
    {
      id: "1m-1h",
      label: "1 Medium + 1 Hard",
      easy: 0,
      medium: 1,
      hard: 1,
      totalProblems: 2,
      weight: 5,
      timeEstimateMin: 75,
      dayType: "Intensive Deep Dive Days",
      description: "1 core interview problem + 1 hard algorithmic problem",
    },
    {
      id: "2e-2m-1h",
      label: "2 Easy + 2 Medium + 1 Hard",
      easy: 2,
      medium: 2,
      hard: 1,
      totalProblems: 5,
      weight: 9,
      timeEstimateMin: 135,
      dayType: "Full Bootcamp Sprint Days",
      description: "Maximum pace across all 3 difficulty tiers",
    },
  ],
  6: [
    {
      id: "6-easy",
      label: "6 Easy",
      easy: 6,
      medium: 0,
      hard: 0,
      totalProblems: 6,
      weight: 6,
      timeEstimateMin: 90,
      dayType: "Maximum Foundations Drill",
      description: "Comprehensive drill across fundamentals & basic arrays",
    },
    {
      id: "4e-1m",
      label: "4 Easy + 1 Medium",
      easy: 4,
      medium: 1,
      hard: 0,
      totalProblems: 5,
      weight: 6,
      timeEstimateMin: 90,
      dayType: "Fundamentals + Medium Sprint",
      description: "4 rapid drills + 1 solid medium interview problem",
    },
    {
      id: "2e-2m",
      label: "2 Easy + 2 Medium",
      easy: 2,
      medium: 2,
      hard: 0,
      totalProblems: 4,
      weight: 6,
      timeEstimateMin: 90,
      dayType: "Balanced Heavy Day",
      description: "2 Easy + 2 Medium = 6 weight units",
    },
    {
      id: "3-medium",
      label: "3 Medium",
      easy: 0,
      medium: 3,
      hard: 0,
      totalProblems: 3,
      weight: 6,
      timeEstimateMin: 90,
      dayType: "Triple Interview Challenge",
      description: "3 solid medium interview problems (3 × 2 = 6 pts)",
    },
    {
      id: "3e-1h",
      label: "3 Easy + 1 Hard",
      easy: 3,
      medium: 0,
      hard: 1,
      totalProblems: 4,
      weight: 6,
      timeEstimateMin: 90,
      dayType: "Concept + Hard Algorithmic Day",
      description: "3 Easy + 1 Hard = 6 weight units (3E = 1H)",
    },
    {
      id: "1e-1m-1h",
      label: "1 Easy + 1 Medium + 1 Hard",
      easy: 1,
      medium: 1,
      hard: 1,
      totalProblems: 3,
      weight: 6,
      timeEstimateMin: 90,
      dayType: "Staircase Difficulty Day",
      description: "1 warmup + 1 medium pattern + 1 hard challenge",
    },
    {
      id: "2-hard",
      label: "2 Hard",
      easy: 0,
      medium: 0,
      hard: 2,
      totalProblems: 2,
      weight: 6,
      timeEstimateMin: 90,
      dayType: "Elite Competitive Coding Day",
      description: "2 Hard problems = 6 weight units (2 × 3 = 6 pts)",
    },
  ],
};

export function getDailyCombinationsForTarget(target: number): DailyProblemCombination[] {
  const bounded = Math.min(6, Math.max(1, target));
  return DAILY_COMBINATIONS_BY_TARGET[bounded] || DAILY_COMBINATIONS_BY_TARGET[3];
}

export function analyzePlanDailyCombinations(days: Day[]): {
  combinationCounts: Record<string, { easy: number; medium: number; hard: number; count: number }>;
  uniqueCombinations: { label: string; easy: number; medium: number; hard: number; count: number; sampleTopics: string[] }[];
} {
  const map = new Map<string, { easy: number; medium: number; hard: number; count: number; sampleTopics: Set<string> }>();

  for (const d of days) {
    if (d.skipped || d.isRevisionDay || !d.problems || d.problems.length === 0) continue;
    let easy = 0, medium = 0, hard = 0;
    for (const p of d.problems) {
      if (p.difficulty === "Easy") easy++;
      else if (p.difficulty === "Medium") medium++;
      else if (p.difficulty === "Hard") hard++;
    }
    const key = `${easy}E_${medium}M_${hard}H`;
    const existing = map.get(key) || { easy, medium, hard, count: 0, sampleTopics: new Set<string>() };
    existing.count += 1;
    if (existing.sampleTopics.size < 3) {
      existing.sampleTopics.add(d.topic.replace(/ — Part \d+$/, ""));
    }
    map.set(key, existing);
  }

  const unique = Array.from(map.values())
    .map((item) => {
      const parts: string[] = [];
      if (item.easy > 0) parts.push(`${item.easy} Easy`);
      if (item.medium > 0) parts.push(`${item.medium} Medium`);
      if (item.hard > 0) parts.push(`${item.hard} Hard`);
      const label = parts.join(" + ") || "0 Problems";
      return {
        label,
        easy: item.easy,
        medium: item.medium,
        hard: item.hard,
        count: item.count,
        sampleTopics: Array.from(item.sampleTopics),
      };
    })
    .sort((a, b) => b.count - a.count);

  return {
    combinationCounts: Object.fromEntries(map.entries()),
    uniqueCombinations: unique,
  };
}

export interface DailyCounts {
  /** Target problems to solve each day (e.g. 2, 3, 4, 5, 6) */
  target: number;
  /** Active pace tier */
  tier: PaceTier;
  /** Effective per-difficulty weights for backward compatibility */
  easy: number;
  medium: number;
  hard: number;
  /** Ratios for levels */
  levelRatios?: {
    level1: LevelRatio;
    level2: LevelRatio;
    level3: LevelRatio;
  };
}

export const DEFAULT_DAILY_COUNTS: DailyCounts = {
  target: 3,
  tier: "balanced",
  easy: 1,
  medium: 1,
  hard: 0,
  levelRatios: TUTOR_PACE_PRESETS.balanced.levelRatios,
};

export function getPacePresetByTarget(target: number): TutorPacePreset {
  if (target <= 2) return TUTOR_PACE_PRESETS.casual;
  if (target === 3) return TUTOR_PACE_PRESETS.balanced;
  if (target === 4) return TUTOR_PACE_PRESETS.standard;
  if (target >= 5) return TUTOR_PACE_PRESETS.intensive;
  return TUTOR_PACE_PRESETS.balanced;
}

export function normalizeDailyCounts(raw?: Partial<DailyCounts> | null): DailyCounts {
  if (!raw) return { ...DEFAULT_DAILY_COUNTS };

  // If already has target
  if (typeof raw.target === "number" && raw.target > 0) {
    const target = Math.min(8, Math.max(1, raw.target));
    const preset = getPacePresetByTarget(target);
    const tier = (raw.tier as PaceTier) || preset.id;
    return {
      target,
      tier,
      easy: raw.easy ?? preset.levelRatios.level1.easy,
      medium: raw.medium ?? preset.levelRatios.level1.medium,
      hard: raw.hard ?? preset.levelRatios.level1.hard,
      levelRatios: raw.levelRatios ?? preset.levelRatios,
    };
  }

  // If legacy counts { easy, medium, hard }
  if (typeof raw.easy === "number" && typeof raw.medium === "number") {
    if (raw.easy === 4 && raw.medium === 3 && raw.hard === 2) {
      return { ...DEFAULT_DAILY_COUNTS };
    }
    const derivedTarget = Math.min(6, Math.max(2, Math.round((raw.easy + raw.medium + (raw.hard || 0)) / 2.5)));
    const preset = getPacePresetByTarget(derivedTarget);
    return {
      target: derivedTarget,
      tier: preset.id,
      easy: raw.easy,
      medium: raw.medium,
      hard: raw.hard ?? 0,
      levelRatios: preset.levelRatios,
    };
  }

  return { ...DEFAULT_DAILY_COUNTS };
}

/**
 * Cost of one problem as a fraction of a day based on tutor equivalence:
 * 1 Easy = 1 weight unit
 * 1 Medium = 2 weight units (2E = 1M)
 * 1 Hard = 3 weight units (3E = 1H, 2M ≈ 1H)
 *
 * Daily capacity budget = target (e.g. 4 problems = 4 weight units).
 * A student can solve 4 Easy, OR 2 Easy + 1 Medium, OR 2 Medium, OR 1 Easy + 1 Hard.
 * Ensures the student never feels burdened by overwhelming daily tasks.
 */
export const problemCost = (d: Difficulty, counts: DailyCounts) => {
  const norm = normalizeDailyCounts(counts);
  const target = Math.max(1, norm.target || 3);
  const weight = d === "Easy" ? 1 : d === "Medium" ? 2 : 3;
  return weight / target;
};

/** How many days a bag of problems needs at the given pace. */
export const daysNeeded = (problems: Problem[], counts: DailyCounts) => {
  const norm = normalizeDailyCounts(counts);
  return Math.max(1, Math.ceil(problems.reduce((a, p) => a + problemCost(p.difficulty, norm), 0)));
};

/**
 * Redistribute every *not yet completed* problem across freshly-sized days,
 * using the per-difficulty pace. Completed days are never touched, so history
 * is preserved. Section/topic order is preserved — the sequence stays the
 * source of truth and dates are re-derived by `renumber()` afterwards.
 */
export function rebalanceRemaining(
  days: Day[],
  counts: DailyCounts,
  startDate = START_DATE,
  offset = 0,
): Day[] {
  const firstOpen = days.findIndex((d) => !isDayComplete(d) && d.status !== "merged" && !d.skipped);
  if (firstOpen === -1) return days;

  const keep = days.slice(0, firstOpen);
  const rest = days.slice(firstOpen);

  // Skipped days are never redistributed and never contribute to the pending
  // bag — they're preserved as-is, just pulled out of the reshuffle.
  const skippedRest = rest.filter((d) => d.skipped);
  // Old revision days in the touched range are dropped too — they carry no
  // problems of their own, and fresh ones get re-interleaved below once the
  // rebuilt content days are known, keeping the Sunday rhythm intact instead
  // of silently losing every revision day the rebalance touches.
  const activeRest = rest.filter((d) => !d.skipped && !d.isRevisionDay);

  // Flatten remaining work, keeping syllabus order. Anything already ticked in
  // a partially-done day stays with that problem so nothing is lost.
  const pending: { problem: Problem; section: string; subtopics: string[]; level?: string }[] = [];
  activeRest.forEach((d) => {
    d.problems.forEach((p) => {
      if (!p.done) pending.push({ problem: p, section: d.section, subtopics: d.subtopics, level: d.level });
    });
  });
  if (pending.length === 0) return days;

  const carriedDone = activeRest.flatMap((d) => d.problems.filter((p) => p.done));

  const rebuilt: Day[] = [];
  let bucket: typeof pending = [];
  let dayBudget = 0;
  let currentSection = pending[0].section;
  let partIndex = 1;

  const flush = () => {
    if (bucket.length === 0) return;
    const section = bucket[0].section;
    const subs = Array.from(new Set(bucket.flatMap((b) => b.subtopics))).slice(0, 4);
    const sameSection = rebuilt.filter((d) => d.section === section).length;
    rebuilt.push({
      id: `${slug(section)}-r${rebuilt.length + 1}`,
      dayNumber: 0,
      date: startDate,
      section,
      topic: sameSection > 0 ? `${section} — Part ${sameSection + 1}` : section,
      subtopics: subs.length ? subs : [section],
      problems: bucket.map((b) => b.problem),
      checklist: newChecklist(),
      status: "pending",
      notes: "",
      revisionNotes: "",
      skipped: false,
      level: bucket[0]?.level,
    });
    bucket = [];
    dayBudget = 0;
    partIndex += 1;
  };

  pending.forEach((item) => {
    const cost = problemCost(item.problem.difficulty, counts);

    // Flush day ONLY when cumulative workload budget + cost exceeds 1 full day capacity (1.0001)
    if (dayBudget > 0 && dayBudget + cost > 1.0001) {
      flush();
    }

    bucket.push(item);
    dayBudget += cost;
  });
  flush();

  // Park the already-solved problems from the reshuffled tail on the first new
  // day so the history and the totals both stay intact.
  if (carriedDone.length && rebuilt.length) {
    rebuilt[0] = { ...rebuilt[0], problems: [...carriedDone, ...rebuilt[0].problems] };
  }

  // Re-interleave Sunday Weekly Revision days into the freshly rebuilt tail,
  // continuing the same Mon–Sat rhythm from wherever `keep`'s active days
  // left off (skipped days don't consume a calendar slot, so they're
  // excluded from the count).
  const startPosition = keep.filter((d) => !d.skipped).length;
  const interleaved = interleaveWeeklyRevision(rebuilt, startDate, startPosition);

  return renumber([...keep, ...skippedRest, ...interleaved], startDate, offset);
}

/* ------------------------------------------------------------------ */
/* Skip Day / Skip Topic / Skip Section                                 */
/* ------------------------------------------------------------------ */

/**
 * Marks the given day(s) — pass a single dayNumber or an array — as skipped
 * or active again, then re-derives the sequence with `renumber`.
 *
 * Deliberately does NOT touch `problems`: a skipped day keeps every one of
 * its problems exactly as they were (done or not), it's simply excluded
 * from the active 1..N day-number sequence, which is what makes every later
 * day shift forward to fill the gap. Un-skipping just puts it back in that
 * sequence — since nothing was ever moved off the day, everything reappears
 * exactly as it was. (An earlier version cascaded problems onto other days
 * when skipping, which meant un-skipping couldn't get them back — that
 * cascade has been removed for exactly that reason.)
 *
 * All requested days are applied together in one pass so day numbers stay
 * consistent throughout, whether this is one day (Skip Day / Skip Topic) or
 * a whole section's worth (Skip Section).
 */
export function setSkipped(
  days: Day[],
  dayNumbers: number | number[],
  skipped: boolean,
  startDate = START_DATE,
  isPaused = false,
): Day[] {
  const set = new Set(Array.isArray(dayNumbers) ? dayNumbers : [dayNumbers]);
  if (set.size === 0) return days;

  const oldFirstOpen = days.find((d) => !d.skipped && !isDayComplete(d) && d.status !== "merged");

  const result = days.map((d) =>
    set.has(d.dayNumber)
      ? { ...d, skipped, status: skipped ? ("skipped" as const) : ("pending" as const) }
      : d,
  );

  const newFirstOpen = result.find((d) => !d.skipped && !isDayComplete(d) && d.status !== "merged");

  // If the first open day changed (e.g. we skipped the current "Today" or unskipped a day that becomes the new "Today"),
  // the new first open day MUST anchor on the exact same real-world date the open sequence was previously anchored on.
  // Otherwise, the calendar will drift forward/backward incorrectly.
  if (oldFirstOpen && newFirstOpen && oldFirstOpen.id !== newFirstOpen.id && oldFirstOpen.date) {
    newFirstOpen.date = oldFirstOpen.date;
  }

  return renumber(result, startDate, 0, isPaused);
}

/**
 * Same as setSkipped but matches by `day.id` instead of `dayNumber`.
 * Used when a day may already have a negative dayNumber (i.e. it is currently
 * skipped) and we still need to act on it — matching by the stable `id` field
 * avoids the negative-number collision problem.
 */
export function setSkippedById(
  days: Day[],
  ids: string | string[],
  skipped: boolean,
  startDate = START_DATE,
  isPaused = false,
): Day[] {
  const idSet = new Set(Array.isArray(ids) ? ids : [ids]);
  if (idSet.size === 0) return days;

  const oldFirstOpen = days.find((d) => !d.skipped && !isDayComplete(d) && d.status !== "merged");

  const result = days.map((d) =>
    idSet.has(d.id)
      ? { ...d, skipped, status: skipped ? ("skipped" as const) : ("pending" as const) }
      : d,
  );

  const newFirstOpen = result.find((d) => !d.skipped && !isDayComplete(d) && d.status !== "merged");

  if (oldFirstOpen && newFirstOpen && oldFirstOpen.id !== newFirstOpen.id && oldFirstOpen.date) {
    newFirstOpen.date = oldFirstOpen.date;
  }

  return renumber(result, startDate, 0, isPaused);
}

export interface PauseWindow {
  from: string;
  to: string;
}

/** Shift the calendar (not the sequence) of every active day from `fromDayNumber` on. */
export const shiftFrom = (days: Day[], fromDayNumber: number, byDays: number): Day[] =>
  days.map((d) =>
    d.dayNumber >= fromDayNumber && !d.skipped ? { ...d, date: addDays(d.date, byDays) } : d,
  );

export const isWithinPause = (iso: string, pause: PauseWindow | null) =>
  Boolean(pause && iso >= pause.from && iso < pause.to);

/**
 * Resumes a plan from where it was left off:
 * Finds the first active, unfinished day on or after `fromDate` (fallback to any active on/after fromDate),
 * and shifts that day and all subsequent days forward so that it resumes on `resumeDate` (default today).
 */
export function resumePlan(
  days: Day[],
  fromDate: string,
  resumeDate = todayIso(),
): { days: Day[]; gap: number; finishDate: string } {
  const first =
    days.find((d) => !d.skipped && !isDayComplete(d) && d.date >= fromDate) ??
    days.find((d) => !d.skipped && d.date >= fromDate);

  if (!first) {
    return { days, gap: 0, finishDate: days[days.length - 1]?.date ?? resumeDate };
  }

  const gap = Math.max(0, diffDays(first.date, resumeDate));
  if (gap === 0) {
    return { days, gap: 0, finishDate: days[days.length - 1]?.date ?? first.date };
  }

  const shifted = shiftFrom(days, first.dayNumber, gap);
  const finishDate = shifted[shifted.length - 1]?.date ?? resumeDate;
  return { days: shifted, gap, finishDate };
}

/* ------------------------------------------------------------------ */
/* Per-difficulty daily problem allocation for Topics view             */
/* ------------------------------------------------------------------ */

/**
 * Returns problems that fit within the student's daily target problem count.
 */
export function problemsWithinDailyLimit(
  problems: Problem[],
  counts: DailyCounts,
): Problem[] {
  const norm = normalizeDailyCounts(counts);
  const target = norm.target || 3;
  return problems.slice(0, target);
}

/**
 * How much daily capacity remains after allocating problems from `problems`
 * against the student's daily target.
 */
export function remainingCapacity(
  problems: Problem[],
  counts: DailyCounts,
): DailyCounts {
  const norm = normalizeDailyCounts(counts);
  const target = norm.target || 3;
  const left = Math.max(0, target - problems.length);
  return {
    ...norm,
    easy: left,
    medium: left,
    hard: left,
  };
}
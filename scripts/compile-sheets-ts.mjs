import fs from 'fs';

console.log("Compiling src/lib/sheets-data.ts...");

const coreData = JSON.parse(fs.readFileSync('./scripts/core404_data.json', 'utf8'));
const striverSdeData = JSON.parse(fs.readFileSync('./scripts/data/striver_sde.json', 'utf8'));
const neetcodeData = JSON.parse(fs.readFileSync('./scripts/data/neetcode150.json', 'utf8'));
const a2zData = JSON.parse(fs.readFileSync('./scripts/data/striver_a2z.json', 'utf8'));
const babbarData = JSON.parse(fs.readFileSync('./scripts/data/love_babbar.json', 'utf8'));
const risingData = JSON.parse(fs.readFileSync('./scripts/data/rising_brains.json', 'utf8'));

// Format Core problems with channel
const coreFormatted = coreData.map(p => ({
  ...p,
  channel: "takeUforward",
  videoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(p.name + " takeUforward striver solution")}`
}));

function buildSections(problems) {
  const map = new Map();
  problems.forEach(p => {
    const topic = p.topic;
    if (!map.has(topic)) {
      map.set(topic, {
        topicNo: map.size + 1,
        topic,
        subtopics: new Set(),
        problems: []
      });
    }
    const sec = map.get(topic);
    if (p.pattern) sec.subtopics.add(p.pattern);
    sec.problems.push(p);
  });

  return Array.from(map.values()).map(s => ({
    topicNo: s.topicNo,
    topic: s.topic,
    subtopics: Array.from(s.subtopics).length > 0 ? Array.from(s.subtopics) : [s.topic],
    problems: s.problems
  }));
}

const tsContent = `// Master Curated Sheets Database
import type { Difficulty } from "./types";
import { CORE_SECTIONS, type CoreSection, type MasterProblem } from "./master-problems";

export interface SheetMeta {
  id: string;
  name: string;
  shortName: string;
  author: string;
  channel: string;
  description: string;
  problemCount: number;
  topicCount: number;
  badge: string;
  badgeColor: string;
  excelFile: string;
  excelFileName: string;
}

export const CURATED_SHEETS: SheetMeta[] = [
  {
    id: "core404",
    name: "Core 404 DSA Roadmap",
    shortName: "Core 404",
    author: "404 DSA Team",
    channel: "takeUforward / NeetCode",
    description: "28 dependency-aware topics covering 381 handpicked core problems from Foundations to Advanced DP.",
    problemCount: ${coreFormatted.length},
    topicCount: 28,
    badge: "Official Default",
    badgeColor: "bg-primary/10 text-primary border-primary/30",
    excelFile: "/sheets/Core404_Problems_Grouped_By_Pattern.xlsx",
    excelFileName: "Core404_Problems_Grouped_By_Pattern.xlsx"
  },
  {
    id: "striver_a2z",
    name: "Striver's A2Z DSA Sheet",
    shortName: "Striver A2Z",
    author: "Raj Vikramaditya (Striver)",
    channel: "takeUforward",
    description: "16 structured steps from basics to advanced DP & Graphs with takeUforward video tutorials.",
    problemCount: ${a2zData.length},
    topicCount: 16,
    badge: "Most Popular",
    badgeColor: "bg-red-500/10 text-red-500 border-red-500/30",
    excelFile: "/sheets/Striver_A2Z_DSA_Sheet.xlsx",
    excelFileName: "Striver_A2Z_DSA_Sheet.xlsx"
  },
  {
    id: "striver_sde",
    name: "Striver's SDE Sheet",
    shortName: "Striver SDE",
    author: "Raj Vikramaditya (Striver)",
    channel: "takeUforward",
    description: "Top 190 high-frequency interview questions for MAANG & Tier-1 tech company SDE interviews.",
    problemCount: ${striverSdeData.length},
    topicCount: 26,
    badge: "Interview Classic",
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    excelFile: "/sheets/Striver_SDE_Sheet.xlsx",
    excelFileName: "Striver_SDE_Sheet.xlsx"
  },
  {
    id: "neetcode150",
    name: "NeetCode 150 Sheet",
    shortName: "NeetCode 150",
    author: "NeetCode",
    channel: "NeetCode",
    description: "150 essential LeetCode problems categorized into 18 core patterns with visual intuition.",
    problemCount: ${neetcodeData.length},
    topicCount: 18,
    badge: "Pattern Based",
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    excelFile: "/sheets/NeetCode_150_Sheet.xlsx",
    excelFileName: "NeetCode_150_Sheet.xlsx"
  },
  {
    id: "love_babbar",
    name: "Love Babbar 450 DSA Cracker",
    shortName: "Love Babbar 450",
    author: "Love Babbar (CodeHelp)",
    channel: "CodeHelp - by Babbar",
    description: "450 comprehensive DSA problems across 15 topics curated by Love Babbar for rigorous placement prep.",
    problemCount: ${babbarData.length},
    topicCount: 15,
    badge: "Placement Rigor",
    badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
    excelFile: "/sheets/Love_Babbar_450_DSA_Cracker.xlsx",
    excelFileName: "Love_Babbar_450_DSA_Cracker.xlsx"
  },
  {
    id: "rising_brains",
    name: "RisingBrains Sheet",
    shortName: "RisingBrains",
    author: "RisingBrains",
    channel: "RisingBrains",
    description: "Curated problem set targeting high-bar product startups and top global technology companies.",
    problemCount: ${risingData.length},
    topicCount: 11,
    badge: "Product Focus",
    badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    excelFile: "/sheets/RisingBrains_DSA_Sheet.xlsx",
    excelFileName: "RisingBrains_DSA_Sheet.xlsx"
  }
];

export const SHEET_PROBLEMS_MAP: Record<string, MasterProblem[]> = {
  core404: ${JSON.stringify(coreFormatted, null, 2)},
  striver_a2z: ${JSON.stringify(a2zData, null, 2)},
  striver_sde: ${JSON.stringify(striverSdeData, null, 2)},
  neetcode150: ${JSON.stringify(neetcodeData, null, 2)},
  love_babbar: ${JSON.stringify(babbarData, null, 2)},
  rising_brains: ${JSON.stringify(risingData, null, 2)}
};

export const SHEET_SECTIONS_MAP: Record<string, CoreSection[]> = {
  core404: CORE_SECTIONS,
  striver_a2z: ${JSON.stringify(buildSections(a2zData), null, 2)},
  striver_sde: ${JSON.stringify(buildSections(striverSdeData), null, 2)},
  neetcode150: ${JSON.stringify(buildSections(neetcodeData), null, 2)},
  love_babbar: ${JSON.stringify(buildSections(babbarData), null, 2)},
  rising_brains: ${JSON.stringify(buildSections(risingData), null, 2)}
};

export function getSheetMeta(sheetId = "core404"): SheetMeta {
  return CURATED_SHEETS.find((s) => s.id === sheetId) || CURATED_SHEETS[0];
}

export function getSectionsForSheet(sheetId = "core404"): CoreSection[] {
  return SHEET_SECTIONS_MAP[sheetId] || CORE_SECTIONS;
}

export function getProblemsForSheet(sheetId = "core404"): MasterProblem[] {
  return SHEET_PROBLEMS_MAP[sheetId] || SHEET_PROBLEMS_MAP.core404;
}

export function getRespectedChannelForProblem(problemName: string, activeSheet = "core404"): { channel: string; youtubeSearchUrl: string } {
  const meta = getSheetMeta(activeSheet);
  const channel = meta.channel;
  let q = \`\${problemName} \${channel} solution\`;
  if (channel.includes("takeUforward")) {
    q = \`\${problemName} takeUforward striver solution\`;
  } else if (channel.includes("NeetCode")) {
    q = \`\${problemName} NeetCode solution\`;
  } else if (channel.includes("CodeHelp")) {
    q = \`\${problemName} Love Babbar CodeHelp DSA solution\`;
  } else if (channel.includes("RisingBrains")) {
    q = \`\${problemName} RisingBrains DSA solution\`;
  }
  return {
    channel,
    youtubeSearchUrl: \`https://www.youtube.com/results?search_query=\${encodeURIComponent(q)}\`
  };
}
`;

fs.writeFileSync('./src/lib/sheets-data.ts', tsContent, 'utf8');
console.log("Compiled src/lib/sheets-data.ts successfully!");

import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

console.log("Building all sheets datasets and Excel workbooks...");

// 1. Load Core 404 from core404_data.json
const coreRaw = JSON.parse(fs.readFileSync('./scripts/core404_data.json', 'utf8'));

// Helper to convert list of problems to CoreSection[]
function groupIntoSections(problems) {
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

// Write helper for generating Excel files matching Core404 format
function exportToExcel(filePath, sheetTitle, subtitle, problems) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Problems by Pattern
  const ws1Data = [
    { [sheetTitle]: subtitle },
  ];

  let currentPattern = "";
  let patternIdx = 0;
  problems.forEach((p, idx) => {
    const pat = p.pattern || p.topic;
    if (pat !== currentPattern) {
      currentPattern = pat;
      patternIdx++;
      ws1Data.push({});
      ws1Data.push({
        [sheetTitle]: `Pattern ${patternIdx}: ${currentPattern} — Topic: ${p.topic}`
      });
      ws1Data.push({
        [sheetTitle]: "#",
        __EMPTY: "Problem ID",
        __EMPTY_1: "Problem Name",
        __EMPTY_2: "Difficulty",
        __EMPTY_3: "Platform",
        __EMPTY_4: "Roadmap Level",
        __EMPTY_5: "Primary Topic",
        __EMPTY_6: "Pattern",
        __EMPTY_7: "Practice Link",
        __EMPTY_8: "Video Channel",
        __EMPTY_9: "Status Tracker"
      });
    }
    ws1Data.push({
      [sheetTitle]: idx + 1,
      __EMPTY: p.id,
      __EMPTY_1: p.name,
      __EMPTY_2: p.difficulty,
      __EMPTY_3: p.platform,
      __EMPTY_4: p.level || "Level 1",
      __EMPTY_5: p.topic,
      __EMPTY_6: pat,
      __EMPTY_7: p.link || `https://www.google.com/search?q=${encodeURIComponent(p.name + " " + p.topic)}`,
      __EMPTY_8: p.channel || "takeUforward",
      __EMPTY_9: "Pending"
    });
  });

  const ws1 = XLSX.utils.json_to_sheet(ws1Data, { skipHeader: false });
  XLSX.utils.book_append_sheet(wb, ws1, "Problems by Pattern");

  // Sheet 2: All Problems Flat Table
  const flatData = problems.map((p, i) => ({
    "S.No": i + 1,
    "Problem ID": p.id,
    "Problem Name": p.name,
    "Pattern": p.pattern || p.topic,
    "Difficulty": p.difficulty,
    "Platform": p.platform,
    "Roadmap Level": p.level || "Level 1",
    "Topic": p.topic,
    "Practice Link": p.link || `https://www.google.com/search?q=${encodeURIComponent(p.name + " " + p.topic)}`,
    "Video Channel": p.channel || "takeUforward",
    "Status Tracker": "Pending"
  }));
  const ws2 = XLSX.utils.json_to_sheet(flatData);
  XLSX.utils.book_append_sheet(wb, ws2, "All Problems Flat Table");

  // Sheet 3: Topics Summary
  const topicsMap = new Map();
  problems.forEach(p => {
    if (!topicsMap.has(p.topic)) {
      topicsMap.set(p.topic, { topic: p.topic, easy: 0, medium: 0, hard: 0, total: 0 });
    }
    const t = topicsMap.get(p.topic);
    t.total++;
    if (p.difficulty === 'Easy') t.easy++;
    else if (p.difficulty === 'Medium') t.medium++;
    else t.hard++;
  });
  const summaryData = Array.from(topicsMap.values()).map((t, i) => ({
    "Topic No": i + 1,
    "Topic Name": t.topic,
    "Easy": t.easy,
    "Medium": t.medium,
    "Hard": t.hard,
    "Total Problems": t.total
  }));
  const ws3 = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, ws3, "Topics Summary");

  XLSX.writeFile(wb, filePath);
  console.log(`Saved Excel sheet: ${filePath}`);
}

// Generate Core 404 Excel copy in public/sheets/
exportToExcel(
  './public/sheets/Core404_Problems_Grouped_By_Pattern.xlsx',
  'CORE 404 DSA ROADMAP — PROBLEMS GROUPED BY PATTERN',
  '381 Verified Problems | 28 Major Topics | Topic-Order Learning',
  coreRaw.map(p => ({ ...p, channel: "takeUforward" }))
);

console.log("Core 404 Excel generated.");

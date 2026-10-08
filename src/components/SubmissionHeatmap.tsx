"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { format, parseISO, startOfWeek, addDays, getMonth, getYear } from "date-fns";
import { DayDetailModal } from "./DayDetailModal";
import { Flame, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
export interface SubmissionHeatmapProps {
 data: { date: string; solved: number; platform?: string }[];
 detailMap: Record<string, any[]>;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""];

// GitHub/LeetCode style color levels
function getHeatmapLevel(count: number): number {
 if (count === 0) return 0;
 if (count <= 2) return 1;
 if (count <= 4) return 2;
 if (count <= 6) return 3;
 return 4;
}

const PLATFORM_HEX_COLORS: Record<string, string> = {
  "LeetCode": "#FFA116",
  "GeeksforGeeks": "#2F8D46",
  "Codeforces": "#3B5998",
  "CodeChef": "#5B4638",
  "HackerRank": "#2EC866",
  "AtCoder": "#222222",
};

export function getPlatformColorClass(platform: string | undefined, level: number): string {
  if (level === 0) return "bg-muted/50 border border-border/50 hover:border-foreground/20";
  
  let normalized = "DSA";
  if (platform) {
    const p = platform.toLowerCase();
    if (p.includes("leetcode")) normalized = "LeetCode";
    else if (p.includes("geeks") || p.includes("gfg")) normalized = "GeeksforGeeks";
    else if (p.includes("codeforces")) normalized = "Codeforces";
    else if (p.includes("hackerrank")) normalized = "HackerRank";
    else if (p.includes("codechef")) normalized = "CodeChef";
    else if (p.includes("atcoder")) normalized = "AtCoder";
  }
  
  const opacities = ["", "opacity-30", "opacity-50", "opacity-75", "opacity-100"];
  
  if (normalized !== "DSA" && PLATFORM_HEX_COLORS[normalized]) {
    return `border ${opacities[level]}`;
  }
  
  return `bg-primary border-primary ${opacities[level]}`;
}

export function getPlatformHexColor(platform: string | undefined): string | undefined {
  if (!platform) return undefined;
  let normalized = "DSA";
  const p = platform.toLowerCase();
  if (p.includes("leetcode")) normalized = "LeetCode";
  else if (p.includes("geeks") || p.includes("gfg")) normalized = "GeeksforGeeks";
  else if (p.includes("codeforces")) normalized = "Codeforces";
  else if (p.includes("hackerrank")) normalized = "HackerRank";
  else if (p.includes("codechef")) normalized = "CodeChef";
  else if (p.includes("atcoder")) normalized = "AtCoder";
  return PLATFORM_HEX_COLORS[normalized];
}

const LEVEL_CLASSES: Record<number, string> = {
 0: "bg-muted/50 border border-border/50 hover:border-foreground/20",
 1: "bg-primary border border-primary opacity-30",
 2: "bg-primary border border-primary opacity-50",
 3: "bg-primary border border-primary opacity-75",
 4: "bg-primary border border-primary opacity-100",
};

export function SubmissionHeatmap({ data, detailMap }: SubmissionHeatmapProps) {
 const [selectedDate, setSelectedDate] = useState<string | null>(null);
 const [selectedYear, setSelectedYear] = useState<string>("All");

 // Available years in data
 const availableYears = useMemo(() => {
 const years = new Set<string>();
 data.forEach((d) => {
 if (d.date && d.date.length >= 4) {
 years.add(d.date.slice(0, 4));
 }
 });
 const currentYr = new Date().getFullYear().toString();
 years.add(currentYr);
 return ["All", ...Array.from(years).sort().reverse()];
 }, [data]);

 // Filter data by selected year
 const filteredData = useMemo(() => {
 if (selectedYear === "All") return data;
 return data.filter((d) => d.date.startsWith(selectedYear));
 }, [data, selectedYear]);

 // Total solved count across filtered dates
 const totalSubmissions = useMemo(
 () => filteredData.reduce((acc, d) => acc + d.solved, 0),
 [filteredData]
 );

 // Map date -> solved count for O(1) lookup
 const countMap = useMemo(() => {
 const map = new Map<string, { solved: number; platform?: string }>();
 filteredData.forEach((d) => map.set(d.date, { solved: d.solved, platform: d.platform }));
 return map;
 }, [filteredData]);

 // Month chunks / sliding window (12 months desktop, 3 months mobile)
 const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);


 // Construct calendar weeks grid (guaranteed 52 weeks or full selected year)
 const allWeeksData = useMemo(() => {
 const today = new Date();
 let firstDate: Date;
 let lastDate: Date;

 // Filter valid YYYY-MM-DD dates only
 const validDates = (filteredData || [])
 .map((d) => d?.date)
 .filter((dateStr): dateStr is string => typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr))
 .sort();

 if (selectedYear !== "All") {
 const yrNum = parseInt(selectedYear, 10);
 firstDate = new Date(yrNum, 0, 1);
 lastDate = yrNum === today.getFullYear() ? today : new Date(yrNum, 11, 31);
 } else {
 lastDate = today;
 // Rolling 52 weeks back from today
 const defaultStartDate = addDays(today, -51 * 7);
 if (validDates.length > 0) {
 const earliest = parseISO(validDates[0]);
 firstDate = !isNaN(earliest.getTime()) && earliest < defaultStartDate ? earliest : defaultStartDate;
 } else {
 firstDate = defaultStartDate;
 }
 }

 let curr = startOfWeek(firstDate, { weekStartsOn: 1 });
 const endLimit = addDays(lastDate, 6);
 const weeksList: { dateStr: string; dayIndex: number; month: number }[][] = [];
 const months: { name: string; weekIndex: number; year: number }[] = [];

 let lastMonth = -1;
 let weekIdx = 0;

 while ((curr <= endLimit || weeksList.length < 52) && weeksList.length < 104) {
 const week: { dateStr: string; dayIndex: number; month: number }[] = [];
 const monthOfFirstDay = getMonth(curr);
 const yearOfFirstDay = getYear(curr);

 if (monthOfFirstDay !== lastMonth) {
 months.push({ name: MONTH_NAMES[monthOfFirstDay], weekIndex: weekIdx, year: yearOfFirstDay });
 lastMonth = monthOfFirstDay;
 }

 for (let day = 0; day < 7; day++) {
 const dateStr = format(curr, "yyyy-MM-dd");
 week.push({ dateStr, dayIndex: day, month: getMonth(curr) });
 curr = addDays(curr, 1);
 }
 weeksList.push(week);
 weekIdx++;
 }

 return { weeks: weeksList, monthHeaders: months };
 }, [filteredData, selectedYear]);

 const totalWeeks = allWeeksData.weeks.length;
 const visibleWeeksWindow = isMobile ? 13 : 52;
 const maxStartWeek = Math.max(0, totalWeeks - visibleWeeksWindow);

 const [windowStartWeek, setWindowStartWeek] = useState<number | null>(null);
 const currentWindowStartWeek = windowStartWeek !== null
 ? Math.min(maxStartWeek, Math.max(0, windowStartWeek))
 : maxStartWeek;
 const currentWindowEndWeek = Math.min(totalWeeks, currentWindowStartWeek + visibleWeeksWindow);

 const visibleWeeks = useMemo(() => {
 return allWeeksData.weeks.slice(currentWindowStartWeek, currentWindowEndWeek);
 }, [allWeeksData.weeks, currentWindowStartWeek, currentWindowEndWeek]);

 const visibleMonthHeaders = useMemo(() => {
 return allWeeksData.monthHeaders
 .filter(
 (m) =>
 m.weekIndex >= currentWindowStartWeek &&
 m.weekIndex < currentWindowEndWeek
 )
 .map((m) => ({
 ...m,
 relWeekIndex: m.weekIndex - currentWindowStartWeek,
 }));
 }, [allWeeksData.monthHeaders, currentWindowStartWeek, currentWindowEndWeek]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [selectedYear, windowStartWeek, allWeeksData]);
 return (
 <div className="space-y-4">
 {/* ── Submissions Summary & Controls Header ── */}
 <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border pb-3">
 <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium">
 <Flame className="size-3.5 sm:size-4 text-warning animate-pulse shrink-0" />
 <span className="truncate">
 <strong className="text-foreground text-xs sm:text-base tabular-nums">{totalSubmissions}</strong> submissions
 {selectedYear !== "All" ? ` in ${selectedYear}` : " total"}
 </span>
 </div>

 <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
 {/* Year Filter Dropdown / Pills */}
 <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-0.5 text-xs">
 <Calendar className="size-3.5 ml-1.5 text-foreground shrink-0" />
 {availableYears.map((yr) => (
 <button
 key={yr}
 onClick={() => {
 setSelectedYear(yr);
 setWindowStartWeek(null);
 }}
 className={`rounded-md px-2 py-0.5 sm:py-1 text-xs font-medium transition-all ${selectedYear === yr
 ? "bg-background text-foreground shadow-sm font-semibold"
 : "text-foreground hover:text-foreground"
 }`}
 >
 {yr}
 </button>
 ))}
 </div>

 {/* Month Slider Navigation Controls */}
 <div className="flex items-center gap-1">
 <Button
 variant="outline"
 size="icon"
 className="size-7 rounded-lg"
 onClick={() => setWindowStartWeek(Math.max(0, currentWindowStartWeek - 4))}
 disabled={currentWindowStartWeek <= 0}
 title="Previous months"
 >
 <ChevronLeft className="size-3.5 sm:size-4" />
 </Button>
 <Button
 variant="outline"
 size="icon"
 className="size-7 rounded-lg"
 onClick={() => setWindowStartWeek(Math.min(maxStartWeek, currentWindowStartWeek + 4))}
 disabled={currentWindowStartWeek >= maxStartWeek}
 title="Next months"
 >
 <ChevronRight className="size-3.5 sm:size-4" />
 </Button>
 </div>
 </div>
 </div>

 {/* ── Larger GitHub / LeetCode Heatmap Grid ── */}
 <div className="overflow-x-auto pb-2 scrollbar-thin" ref={scrollRef}>
 <div className="inline-block min-w-full align-middle">
 {/* Month headers row */}
 <div className="flex text-[11px] font-medium text-foreground mb-1.5 pl-8">
 {visibleMonthHeaders.map((m, i) => {
 const nextCol =
 visibleMonthHeaders[i + 1]?.relWeekIndex ?? visibleWeeks.length;
 const span = Math.max(1, nextCol - m.relWeekIndex);
 return (
 <span
 key={`${m.name}-${m.relWeekIndex}`}
 style={{ width: `${span * 20}px` }}
 className="truncate font-mono"
 >
 {m.name}
 </span>
 );
 })}
 </div>

 {/* Grid rows (Days x Weeks) */}
 <div className="flex items-start gap-1.5">
 {/* Day of week labels (Mon, Wed, Fri) */}
 <div className="grid grid-rows-7 gap-1 pr-1.5 text-[11px] font-mono text-foreground select-none shrink-0 pt-[2px]">
 {DAY_LABELS.map((lbl, idx) => (
 <span key={idx} className="h-4 leading-4 flex items-center">
 {lbl}
 </span>
 ))}
 </div>

 {/* Weeks columns (larger squares: size-4 sm:size-4.5) */}
 <div className="flex gap-1">
 {visibleWeeks.map((week, wi) => (
 <div key={wi} className="grid grid-rows-7 gap-1 shrink-0">
 {week.map(({ dateStr }) => {
 const cellData = countMap.get(dateStr) || { solved: 0 };
 const count = cellData.solved;
 const platform = cellData.platform;
 const level = getHeatmapLevel(count);
 let formattedDate = dateStr;
 try {
 const parsed = parseISO(dateStr);
 if (!isNaN(parsed.getTime())) {
 formattedDate = format(parsed, "MMM d, yyyy");
 }
 } catch {
 formattedDate = dateStr;
 }
 
 const isToday = dateStr === format(new Date(), "yyyy-MM-dd");
 const todayClass = isToday ? "ring-2 ring-primary ring-offset-1 ring-offset-background z-10" : "";
 
 return (
 <button
 key={dateStr}
 style={getPlatformHexColor(platform) && level > 0 ? { backgroundColor: getPlatformHexColor(platform), borderColor: getPlatformHexColor(platform) } : undefined} onClick={() => setSelectedDate(dateStr)}
 className={`relative size-4 sm:size-4.5 rounded-[3px] transition-all hover:scale-125 hover:z-20 focus:outline-none focus:ring-2 focus:ring-ring ${getPlatformColorClass(platform, level)} ${todayClass}`}
 title={`${isToday ? "Today, " : ""}${formattedDate}: ${count} problem${count === 1 ? "" : "s"} solved`}
 aria-label={`${isToday ? "Today, " : ""}${formattedDate}: ${count} solved`}
 />
 );
 })}
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>

 {/* ── Heatmap Footer / Legend ── */}
 <div className="flex items-center justify-end gap-2 text-xs text-foreground pt-1">
 <div className="flex items-center gap-1.5">
 <span>Less</span>
 {[0, 1, 2, 3, 4].map((lvl) => (
 <span
 key={lvl}
 className={`size-3.5 rounded-[3px] ${LEVEL_CLASSES[lvl]}`}
 />
 ))}
 <span>More</span>
 </div>
 </div>

 {/* ── Day Details Modal on Click ── */}
 {selectedDate && (
 <DayDetailModal
 date={selectedDate}
 problems={detailMap[selectedDate] ?? []}
 onClose={() => setSelectedDate(null)}
 />
 )}
 </div>
 );
}

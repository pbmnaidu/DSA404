"use client";

import { useMemo } from "react";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";
import { Flame, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";
import { todayIso } from "@/lib/plan";

interface LeetCodeCalendarWidgetProps {
 heatmapData: { date: string; solved: number }[];
 streakCount: number;
 selectedDate?: string | null;
 onSelectDate?: (dateStr: string) => void;
}

const WEEK_DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function LeetCodeCalendarWidget({
 heatmapData,
 streakCount,
 selectedDate,
 onSelectDate,
}: LeetCodeCalendarWidgetProps) {
 const todayDate = useMemo(() => new Date(), []);
 const todayStr = todayIso();

 // Create count map: dateStr -> solved count
 const countMap = useMemo(() => {
 const map = new Map<string, number>();
 heatmapData.forEach((d) => {
 if (d.solved > 0) {
 map.set(d.date, d.solved);
 }
 });
 return map;
 }, [heatmapData]);

 // Month days range
 const { daysInMonth, monthLabel, leadingPaddingDays, activeDaysInMonth } = useMemo(() => {
 const start = startOfMonth(todayDate);
 const end = endOfMonth(todayDate);
 const days = eachDayOfInterval({ start, end });
 const padding = getDay(start); // 0 (Sun) to 6 (Sat)
 const mLabel = format(todayDate, "MMMM yyyy");

 let activeCount = 0;
 days.forEach((d) => {
 const dStr = format(d, "yyyy-MM-dd");
 if ((countMap.get(dStr) ?? 0) > 0) {
 activeCount++;
 }
 });

 return {
 daysInMonth: days,
 monthLabel: mLabel,
 leadingPaddingDays: padding,
 activeDaysInMonth: activeCount,
 };
 }, [todayDate, countMap]);

 return (
 <div className="rounded-lg border border-border bg-card p-4 sm:p-5 shadow-sm flex flex-col justify-between h-full space-y-3">
 {/* Widget Header */}
 <div className="flex items-center justify-between gap-2 border-b border-border pb-2.5">
 <div className="flex items-center gap-2">
 <CalendarIcon className="size-4 text-success" />
 <h4 className="text-sm font-bold tracking-tight text-foreground">{monthLabel}</h4>
 </div>
 <div className="flex items-center gap-1.5 rounded-full border border-warning bg-warning px-2.5 py-0.5 text-xs font-bold text-warning">
 <Flame className="size-3.5 text-warning" />
 <span>{streakCount} Active</span>
 </div>
 </div>

 {/* Days Grid Header (S M T W T F S) */}
 <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-foreground select-none">
 {WEEK_DAYS.map((d, i) => (
 <span key={i}>{d}</span>
 ))}
 </div>

 {/* Calendar Days Grid */}
 <div className="grid grid-cols-7 gap-1">
 {/* Empty padding cells for start of month */}
 {Array.from({ length: leadingPaddingDays }).map((_, i) => (
 <div key={`pad-${i}`} className="size-7 sm:size-7.5" />
 ))}

 {/* Month Day Cells */}
 {daysInMonth.map((dayDate) => {
 const dateStr = format(dayDate, "yyyy-MM-dd");
 const dayNum = format(dayDate, "d");
 const count = countMap.get(dateStr) ?? 0;
 const isToday = dateStr === todayStr;
 const isSelected = selectedDate === dateStr;
 const isSolved = count > 0;

 return (
 <button
 key={dateStr}
 onClick={() => onSelectDate?.(dateStr)}
 className={`group relative flex size-7 sm:size-7.5 items-center justify-center rounded-lg text-xs font-semibold transition-all duration-200 select-none cursor-pointer ${
 isSelected
 ? "bg-primary text-white font-extrabold shadow-sm ring-2 ring-primary/60 scale-105 z-10"
 : isSolved
 ? "bg-success text-white font-bold shadow-sm shadow-success hover:scale-110"
 : isToday
 ? "border border-border bg-muted text-primary font-bold"
 : "bg-muted text-foreground hover:bg-white hover:text-foreground"
 }`}
 title={`${format(dayDate, "MMM d, yyyy")}: ${count} problem${count === 1 ? "" : "s"} solved. Click to view!`}
 >
 <span>{dayNum}</span>

 {/* Tooltip on Hover */}
 <div className="absolute bottom-full mb-1.5 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
 <div className="rounded-lg bg-popover border border-border px-2 py-1 text-[10px] text-popover-foreground shadow-sm whitespace-nowrap font-medium">
 {format(dayDate, "MMM d")}: {count} solved (Click)
 </div>
 </div>
 </button>
 );
 })}
 </div>

 {/* Widget Footer */}
 <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-foreground pt-2 border-t border-border">
 <span className="flex items-center gap-1">
 <CheckCircle2 className="size-3 text-success" />
 <strong className="text-foreground">{activeDaysInMonth}</strong> active days
 </span>
 <span className="flex items-center gap-1">
 <span className="size-2 rounded-full bg-success inline-block" /> Solved
 </span>
 </div>
 </div>
 );
}

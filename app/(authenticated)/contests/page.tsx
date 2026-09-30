"use client";



import { ContestsPageSection } from "@/components/ContestsSection";


export default function ContestsPage() {
  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <svg className="size-48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
        </div>
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-foreground">Global Contests</h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl">
            Live, upcoming, and past coding competitions from LeetCode, Codeforces, CodeChef, and GeeksforGeeks. Build real-world problem-solving speed.
          </p>
        </div>
      </div>
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <ContestsPageSection />
      </div>
    </div>
  );
}

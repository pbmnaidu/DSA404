const fs = require('fs');
const filePath = 'p:/DSA404-chatBot/src/components/MergedTodayProfile.tsx';

let content = fs.readFileSync(filePath, 'utf8');

// Replace the max-w-6xl centered wrapper with a full-width responsive workspace wrapper
content = content.replace(
  /<div className="mx-auto max-w-6xl space-y-10">/,
  `<div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 space-y-12 pt-6">`
);

// We should also replace the main grid layout to ensure the spacing and wrapping requirements are met.
// Instead of replacing blindly, let's inject the new sidebar elements.
const workspaceSplitStart = '{/* ── WORKSPACE SPLIT ── */}';
const codeModalStart = '{/* Code Modal for viewing stored solutions';

if (content.includes(workspaceSplitStart) && content.includes(codeModalStart)) {
  const parts1 = content.split(workspaceSplitStart);
  const parts2 = parts1[1].split(codeModalStart);

  const newWorkspaceSplit = `
        {/* ── WORKSPACE SPLIT ── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* PRIMARY LEARNING COLUMN (Left side, 8 cols) */}
          <main className="xl:col-span-8 space-y-10 min-w-0">
            
            {/* Topic Context (Editorial Style) */}
            {sanitizedDay && (
              <section className="space-y-5">
                <h2 className="font-display text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Target className="size-5 text-primary" /> Current Topic
                </h2>
                <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden p-1">
                  <DayDetail
                    day={sanitizedDay}
                    readOnly={false}
                    lateMode={false}
                    headerOnly
                  />
                </div>
              </section>
            )}

            {/* Main Problem Queue */}
            {sanitizedDay && (
              <section className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <ListTodo className="size-5 text-primary" /> Daily Problem List
                  </h2>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                    {sanitizedDay.problems.filter(p => p.done).length} / {sanitizedDay.problems.length} Done
                  </span>
                </div>
                
                {/* The actual problems wrapped cleanly */}
                <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden p-2 sm:p-6">
                  <DayDetail
                    day={sanitizedDay}
                    readOnly={false}
                    lateMode={false}
                    hideHeader
                  />
                </div>
              </section>
            )}
            
            {/* Review Queue (Placeholder) */}
            <section className="space-y-5">
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <RotateCcw className="size-5 text-amber-500" /> Review Queue
              </h2>
              <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 shadow-sm p-8 text-center flex flex-col items-center justify-center">
                <RotateCcw className="size-8 text-amber-500/50 mb-3" />
                <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-1">Spaced Repetition</h3>
                <p className="text-sm text-amber-700/80 dark:text-amber-300/80 max-w-sm mb-4">No problems due for review today. Keep pushing forward!</p>
              </div>
            </section>
            
          </main>

          {/* SECONDARY SIDEBAR (Right side, 4 cols) */}
          <aside className="xl:col-span-4 space-y-8 min-w-0">
            
            {/* Progress Summary & Consistency */}
            <section className="space-y-4">
              <h2 className="font-display text-lg font-bold tracking-tight border-b border-border pb-2">
                Progress Summary
              </h2>
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <SubmissionHeatmap data={heatmapData} detailMap={detailMap} />
              </div>
            </section>

            {/* Weekly Completion & Milestones */}
            <section className="space-y-4">
              <h2 className="font-display text-lg font-bold tracking-tight border-b border-border pb-2">
                Milestones
              </h2>
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted-foreground font-bold uppercase tracking-wider">Problems Solved</span>
                    <span className="font-black text-primary">{stats.total}</span>
                  </div>
                  <Progress value={Math.min(100, (stats.total / (ALL_PROBLEMS.length || 1)) * 100)} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted-foreground font-bold uppercase tracking-wider">Badges Earned</span>
                    <span className="font-black text-emerald-500">{badges.length}</span>
                  </div>
                  <Progress value={Math.min(100, (badges.length / 10) * 100)} className="h-2" />
                </div>
              </div>
            </section>
            
            {/* AI Tutor Entry Point */}
            <section className="space-y-4">
              <h2 className="font-display text-lg font-bold tracking-tight border-b border-border pb-2">
                AI Assistance
              </h2>
              <div className="rounded-3xl border border-purple-500/30 bg-purple-500/10 p-6 shadow-sm relative overflow-hidden group hover:border-purple-500/50 transition-colors cursor-pointer">
                <div className="absolute -right-4 -top-4 size-24 bg-purple-500/20 blur-2xl rounded-full group-hover:bg-purple-500/30 transition-all"></div>
                <Sparkles className="size-6 text-purple-500 mb-3 relative z-10" />
                <h3 className="font-bold text-foreground mb-1 relative z-10">AI Coding Tutor</h3>
                <p className="text-xs text-muted-foreground relative z-10 mb-4">Stuck on a problem? Ask your AI tutor for a conceptual hint without revealing the code.</p>
                <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold relative z-10">Launch Tutor</Button>
              </div>
            </section>
            
            {/* Recommendations */}
            <section className="space-y-4">
              <h2 className="font-display text-lg font-bold tracking-tight border-b border-border pb-2">
                Recommended Next
              </h2>
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                 <p className="text-xs text-muted-foreground italic text-center">Complete today's queue to unlock personalized recommendations.</p>
              </div>
            </section>

          </aside>

        </div>

        `;

  content = parts1[0] + newWorkspaceSplit + "\n\n        " + codeModalStart + parts2[1];
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Updated MergedTodayProfile workspace split");
} else {
  console.log("Could not find markers to replace in MergedTodayProfile");
}

const fs = require('fs');
const filePath = 'p:/DSA404-chatBot/src/components/MergedTodayProfile.tsx';

let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import if not exists
if (!content.includes('TodayMissionOrbit')) {
  content = content.replace(
    'import { TodayContestsSection } from "@/components/ContestsSection";',
    'import { TodayContestsSection } from "@/components/ContestsSection";\nimport { TodayMissionOrbit } from "@/components/TodayMissionOrbit";'
  );
}

// 2. Replace the flex container holding the text
const h1Str = '<h1 className="font-display text-4xl sm:text-5xl font-black tracking-tight text-foreground leading-none">';
const beforeH1 = content.substring(0, content.indexOf(h1Str));
const innerTextFlexStr = beforeH1.substring(beforeH1.lastIndexOf('<div className="space-y-2">'));

content = content.replace('<div className="space-y-2">', '<div className="space-y-2 flex-1">');

// 3. Add the orbit before the streak badge
const streakBadgeStr = '<div className="flex flex-col items-end gap-3 shrink-0">';
content = content.replace(streakBadgeStr, `
            <div className="hidden sm:flex flex-1 items-center justify-end pr-8 xl:pr-16 pointer-events-auto">
              <TodayMissionOrbit 
                topic={sanitizedDay?.topic}
                solvedCount={sanitizedDay?.problems?.filter(p => p.done).length}
                totalCount={sanitizedDay?.problems?.length}
                streakCount={streakCount}
                totalSolved={stats.total}
              />
            </div>

            <div className="flex flex-col items-end gap-3 shrink-0 z-10">
`);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully replaced hero section robustly");

const fs = require('fs');

// SubmissionHeatmap.tsx
let subFile = fs.readFileSync('src/components/SubmissionHeatmap.tsx', 'utf8');
if (!subFile.includes('useRef')) {
    subFile = subFile.replace('import { useMemo, useState } from "react";', 'import { useMemo, useState, useRef, useEffect } from "react";');
}
if (!subFile.includes('const scrollRef = useRef<HTMLDivElement>(null);')) {
    subFile = subFile.replace('const isMobile = useIsMobile();', 'const isMobile = useIsMobile();\n  const scrollRef = useRef<HTMLDivElement>(null);\n  useEffect(() => {\n    if (scrollRef.current) {\n      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;\n    }\n  }, [selectedYear, windowStartWeek, allWeeksData]);\n');
}
subFile = subFile.replace('<div className="overflow-x-auto pb-2 scrollbar-thin">', '<div className="overflow-x-auto pb-2 scrollbar-thin" ref={scrollRef}>');
fs.writeFileSync('src/components/SubmissionHeatmap.tsx', subFile);

// PlatformActivityHeatmap.tsx
let platFile = fs.readFileSync('src/components/coding-profiles/PlatformActivityHeatmap.tsx', 'utf8');
if (!platFile.includes('useRef')) {
    platFile = platFile.replace('import React, { useMemo, useState } from "react";', 'import React, { useMemo, useState, useRef, useEffect } from "react";');
}
if (!platFile.includes('const scrollRef = useRef<HTMLDivElement>(null);')) {
    platFile = platFile.replace('const hasActivity = totalSubmissionsCount > 0 || totalActiveDays > 0;', 'const hasActivity = totalSubmissionsCount > 0 || totalActiveDays > 0;\n  const scrollRef = useRef<HTMLDivElement>(null);\n  useEffect(() => {\n    if (scrollRef.current) {\n      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;\n    }\n  }, [weeks]);\n');
}
platFile = platFile.replace('<div className="w-full overflow-x-auto pb-1 pt-1">', '<div className="w-full overflow-x-auto pb-1 pt-1" ref={scrollRef}>');
fs.writeFileSync('src/components/coding-profiles/PlatformActivityHeatmap.tsx', platFile);

// GitHubContributionHeatmap.tsx (if it exists)
if (fs.existsSync('src/components/GitHubContributionHeatmap.tsx')) {
    let ghFile = fs.readFileSync('src/components/GitHubContributionHeatmap.tsx', 'utf8');
    if (!ghFile.includes('useRef')) {
        ghFile = ghFile.replace('import { useMemo, useState } from "react";', 'import { useMemo, useState, useRef, useEffect } from "react";');
    }
    if (!ghFile.includes('const scrollRef = useRef<HTMLDivElement>(null);')) {
        ghFile = ghFile.replace('return (', 'const scrollRef = useRef<HTMLDivElement>(null);\n  useEffect(() => {\n    if (scrollRef.current) {\n      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;\n    }\n  }, [weeks]);\n  return (');
    }
    ghFile = ghFile.replace('<div className="w-full overflow-x-auto pb-2 pt-1 scrollbar-thin">', '<div className="w-full overflow-x-auto pb-2 pt-1 scrollbar-thin" ref={scrollRef}>');
    ghFile = ghFile.replace('<div className="overflow-x-auto pb-2 scrollbar-thin">', '<div className="overflow-x-auto pb-2 scrollbar-thin" ref={scrollRef}>');
    ghFile = ghFile.replace('<div className="w-full overflow-x-auto pb-1 pt-1">', '<div className="w-full overflow-x-auto pb-1 pt-1" ref={scrollRef}>');
    fs.writeFileSync('src/components/GitHubContributionHeatmap.tsx', ghFile);
}

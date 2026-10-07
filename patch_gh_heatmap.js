const fs = require('fs');

let ghFile = fs.readFileSync('src/components/GitHubContributionHeatmap.tsx', 'utf8');

ghFile = ghFile.replace('  }, [weeks]);\n', '  }, [loading]);\n');

if (!ghFile.includes('ref={scrollRef}')) {
    ghFile = ghFile.replace('<div className="w-full overflow-x-auto rounded-lg border border-border bg-background p-3 sm:p-4 shadow-sm relative">', '<div className="w-full overflow-x-auto rounded-lg border border-border bg-background p-3 sm:p-4 shadow-sm relative" ref={scrollRef}>');
}

// Fix imports in GitHubContributionHeatmap
if (!ghFile.includes('useRef')) {
    ghFile = ghFile.replace('import { useState } from "react";', 'import { useState, useRef, useEffect } from "react";');
}

fs.writeFileSync('src/components/GitHubContributionHeatmap.tsx', ghFile);

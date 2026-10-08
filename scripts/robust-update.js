const fs = require('fs');

let text = fs.readFileSync('app/(authenticated)/problems/page.tsx', 'utf8');

const target1 = '<DropdownMenuContent align="start" className="w-56 rounded-lg border border-border bg-card p-1 shadow-sm">';
const target10 = ' <DropdownMenuItem asChild>';

const indexOfT1 = text.indexOf(target1);
const indexOfT10 = text.indexOf(target10, indexOfT1);

const before = text.substring(0, indexOfT1);
const after = text.substring(indexOfT10);

const replacement = `<DropdownMenuContent align="start" className="w-56 rounded-lg border border-border bg-card p-1 shadow-sm">
 {problem.link && (
 <DropdownMenuItem asChild>
 <a href={problem.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
 <ExternalLink className="size-3.5 text-[#FFA116]" />
 <span>LeetCode Problem Page</span>
 </a>
 </DropdownMenuItem>
 )}
 {problem.gfgLink && (
 <DropdownMenuItem asChild>
 <a href={problem.gfgLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
 <ExternalLink className="size-3.5 text-[#2F8D46]" />
 <span>GeeksforGeeks Page</span>
 </a>
 </DropdownMenuItem>
 )}
 {(() => {
    let sheetName = '';
    let searchDomain = '';
    if (problem.sheet === "Striver's A2Z" || problem.sheet === "Striver's SDE") {
      sheetName = 'takeUforward';
      searchDomain = 'takeuforward';
    } else if (problem.sheet === 'NeetCode 150') {
      sheetName = 'NeetCode';
      searchDomain = 'neetcode';
    } else if (problem.sheet === 'Love Babbar 450') {
      sheetName = 'CodeHelp';
      searchDomain = 'codehelp';
    }
    
    if (sheetName) {
      const q = encodeURIComponent('\\\\' + searchDomain + ' ' + problem.name);
      return (
        <DropdownMenuItem asChild>
          <a href={'https://duckduckgo.com/?q=' + q} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <ExternalLink className="size-3.5 text-primary" />
            <span>{sheetName} Page</span>
          </a>
        </DropdownMenuItem>
      );
    }
    return null;
 })()}
`;

fs.writeFileSync('app/(authenticated)/problems/page.tsx', before + replacement + after);
console.log("Successfully patched page.tsx!");

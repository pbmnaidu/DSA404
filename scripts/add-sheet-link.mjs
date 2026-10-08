import fs from 'fs';

let text = fs.readFileSync('app/(authenticated)/problems/page.tsx', 'utf8');

const target = ` {problem.gfgLink && (
 <DropdownMenuItem asChild>
 <a href={problem.gfgLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
 <ExternalLink className="size-3.5 text-[#2F8D46]" />
 <span>GeeksforGeeks Page</span>
 </a>
 </DropdownMenuItem>
 )}`;

const sheetLinkCode = `
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
      const q = encodeURIComponent(\`\\\\\\${searchDomain} \${problem.name}\`);
      return (
        <DropdownMenuItem asChild>
          <a href={\`https://duckduckgo.com/?q=\${q}\`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <ExternalLink className="size-3.5 text-primary" />
            <span>{sheetName} Page</span>
          </a>
        </DropdownMenuItem>
      );
    }
    return null;
  })()}`;

if (text.includes(target)) {
    text = text.replace(target, target + '\n' + sheetLinkCode);
} else {
    // try removing carriage returns for the search target
    const targetUnix = target.replace(/\r\n/g, '\n');
    if (text.includes(targetUnix)) {
        text = text.replace(targetUnix, targetUnix + '\n' + sheetLinkCode);
    } else {
        console.error("Target string not found in page.tsx!");
        process.exit(1);
    }
}

fs.writeFileSync('app/(authenticated)/problems/page.tsx', text);
console.log('updated page.tsx with sheet links');

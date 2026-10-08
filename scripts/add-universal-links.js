const fs = require('fs');
let text = fs.readFileSync('app/(authenticated)/problems/page.tsx', 'utf8');

const targetStart = ' {(() => {';
const targetEnd = ' })()}';

const startIdx = text.indexOf(targetStart);
if (startIdx !== -1) {
  const endIdx = text.indexOf(targetEnd, startIdx) + targetEnd.length;
  
  const replacement = ` <DropdownMenuItem asChild>
 <a href={'https://duckduckgo.com/?q=' + encodeURIComponent('\\\\takeuforward ' + problem.name)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
 <ExternalLink className="size-3.5 text-[#F87171]" />
 <span>takeUforward Page</span>
 </a>
 </DropdownMenuItem>
 <DropdownMenuItem asChild>
 <a href={'https://duckduckgo.com/?q=' + encodeURIComponent('\\\\neetcode ' + problem.name)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
 <ExternalLink className="size-3.5 text-[#60A5FA]" />
 <span>NeetCode Page</span>
 </a>
 </DropdownMenuItem>`;

  text = text.substring(0, startIdx) + replacement + text.substring(endIdx);
  fs.writeFileSync('app/(authenticated)/problems/page.tsx', text);
  console.log('Replaced specific sheet logic with universal takeUforward & NeetCode links.');
} else {
  console.log('Could not find the target block.');
}

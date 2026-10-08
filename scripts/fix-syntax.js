const fs = require('fs');
let text = fs.readFileSync('app/(authenticated)/problems/page.tsx', 'utf8');

const target1 = ' <DropdownMenuItem asChild>';
const target2 = ' <a href={problem.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-semibold cursor-pointer">';
const target3 = ' <ExternalLink className="size-3.5 text-primary" />';
const target4 = ' <span>Official Problem Page</span>';
const target5 = ' </a>';
const target6 = ' </DropdownMenuItem>';
const target7 = ' )}';
const target8 = ' <DropdownMenuItem asChild>';
const target9 = ' <a href={youtubeSearchUrl(problem.name)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-medium cursor-pointer">';

const indexOfT7 = text.indexOf(target7, text.indexOf('return null;'));
if (indexOfT7 !== -1) {
    const startToRemove = text.lastIndexOf(target1, indexOfT7);
    const endToRemove = indexOfT7 + target7.length;
    text = text.substring(0, startToRemove) + text.substring(endToRemove);
    fs.writeFileSync('app/(authenticated)/problems/page.tsx', text);
    console.log("Fixed syntax error!");
} else {
    console.log("Could not find the dangling brace");
}

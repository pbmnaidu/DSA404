import fs from 'fs';

let text = fs.readFileSync('app/(authenticated)/problems/page.tsx', 'utf8');

const target = ` <DropdownMenuContent align="start" className="w-56 rounded-lg border border-border bg-card p-1 shadow-sm">
 {problem.link && (
 <DropdownMenuItem asChild>
 <a href={problem.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
 <ExternalLink className="size-3.5 text-primary" />
 <span>Official Problem Page</span>
 </a>
 </DropdownMenuItem>
 )}
 <DropdownMenuItem asChild>`;

const repl = ` <DropdownMenuContent align="start" className="w-56 rounded-lg border border-border bg-card p-1 shadow-sm">
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
 <DropdownMenuItem asChild>`;

text = text.replace(target, repl);
text = text.replace(target.replace(/\r\n/g, '\n'), repl);

// also add gfgLink to FlatProblem interface in page.tsx
text = text.replace(' link: string;\r\n}', ' link: string;\r\n gfgLink?: string;\r\n}');
text = text.replace(' link: string;\n}', ' link: string;\n gfgLink?: string;\n}');

// and to mapping
text = text.replace(' sheet: p.sheet as SheetFilter,\r\n link: p.link,\r\n}));', ' sheet: p.sheet as SheetFilter,\r\n link: p.link,\r\n gfgLink: (p as any).gfgLink,\r\n}));');
text = text.replace(' sheet: p.sheet as SheetFilter,\n link: p.link,\n}));', ' sheet: p.sheet as SheetFilter,\n link: p.link,\n gfgLink: (p as any).gfgLink,\n}));');

fs.writeFileSync('app/(authenticated)/problems/page.tsx', text);
console.log('updated page.tsx');

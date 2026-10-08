import fs from 'fs';

let text = fs.readFileSync('src/lib/problems.ts', 'utf8');

text = text.replace(
  '  link: string;\r\n}',
  '  link: string;\r\n  gfgLink?: string;\r\n}'
);
text = text.replace(
  '  link: string;\n}',
  '  link: string;\n  gfgLink?: string;\n}'
);

text = text.replace(/  link: p\.link \|\| "",\r?\n\s+\}\)\);/g, '  link: p.link || "",\n  gfgLink: (p as any).gfgLink,\n  }));');

fs.writeFileSync('src/lib/problems.ts', text);

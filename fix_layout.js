const fs = require('fs');
const path = 'p:/DSA404-chatBot/src/components/ContestsSection.tsx';
let data = fs.readFileSync(path, 'utf8');

// replace the grid classes
data = data.replace(
  /className=\{cn\(\s*"grid min-w-0 gap-4 pt-1",\s*todaysContests\.length === 1\s*\?\s*"grid-cols-1"\s*:\s*"grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"\s*\)\}/g,
  'className="flex flex-col min-w-0 gap-4 pt-1"'
);

// add text wrap to the title
data = data.replace(
  /<span>\{c\.title\}<\/span>/g,
  '<span className="break-words whitespace-normal text-wrap min-w-0">{c.title}</span>'
);

// fix the link itself to make sure it doesn't overflow flex container
data = data.replace(
  /className="flex items-start justify-between gap-1 text-sm font-semibold leading-snug text-foreground hover:text-primary"/g,
  'className="flex items-start justify-between gap-1 text-sm font-semibold leading-snug text-foreground hover:text-primary w-full min-w-0"'
);

fs.writeFileSync(path, data);
console.log('Done!');

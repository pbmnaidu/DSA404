const fs = require('fs');
let file = fs.readFileSync('src/components/MergedTodayProfile.tsx', 'utf8');
const lines = file.split('\n');
let idx = lines.findIndex(l => l.includes('<DayDetail'));
lines.splice(idx-1, 1); // remove <div className="rounded-lg border...
lines.splice(idx+5, 1); // remove </div> (since array shifted by 1)
fs.writeFileSync('src/components/MergedTodayProfile.tsx', lines.join('\n'));

const fs = require('fs');
let file = fs.readFileSync('src/components/MergedTodayProfile.tsx', 'utf8');

const lines = file.split('\n');
let newLines = [];
let skip = false;
for(let i=0; i<lines.length; i++) {
    if(i >= 970 && lines[i].includes('Keep contests in the open right-side workspace')) {
        skip = true;
    }
    if(!skip) {
        newLines.push(lines[i]);
    }
    if(skip && lines[i].includes('</section>')) {
        skip = false;
    }
}
fs.writeFileSync('src/components/MergedTodayProfile.tsx', newLines.join('\n'));

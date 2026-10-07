const fs = require('fs');
let file = fs.readFileSync('src/components/MergedTodayProfile.tsx', 'utf8');

const target = ` <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden p-1">
 <DayDetail
 day={sanitizedDay}
 readOnly={false}
 lateMode={false}
 headerOnly
 hideContests
 />
 </div>`;

const replacement = ` <DayDetail
 day={sanitizedDay}
 readOnly={false}
 lateMode={false}
 headerOnly
 hideContests
 />`;

if(file.includes(target)) {
    file = file.replace(target, replacement);
    fs.writeFileSync('src/components/MergedTodayProfile.tsx', file);
    console.log('Replaced successfully');
} else {
    console.log('Target string not found');
}

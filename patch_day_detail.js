const fs = require('fs');
let file = fs.readFileSync('src/components/DayDetail.tsx', 'utf8');

// 1. Fix the top import
file = file.replace('import { useState } from "react";', 'import { useState, useEffect } from "react";');

// 2. Remove the duplicate import
file = file.replace('  import { useEffect } from "react";\r\n', '');
file = file.replace('  import { useEffect } from "react";\n', '');

// 3. Add message below Textarea
const replacement = ` <Textarea
 id={\`notes-\${day.dayNumber}\`}
 rows={5}
 defaultValue={day.notes}
 placeholder="Write key code snippets, intuitions, or algorithm patterns..."
 disabled={locked}
 className="flex-1 bg-secondary border-border rounded-lg text-sm resize-none focus-visible:ring-primary/20 p-4"
 onBlur={(e) => void updateDay(day.dayNumber, (d) => ({ ...d, notes: e.target.value }))}
 />
 {(!day.notesPushedAt || day.notesPushedAt.split("T")[0] !== new Date().toISOString().split("T")[0]) && day.notes && (
    <p className="text-[11px] text-warning flex items-center gap-1.5 mt-1">
      <AlertTriangle className="size-3" />
      Notes not pushed today. Please push manually if the auto-push at 11:55 PM was missed.
    </p>
 )}
 {day.notesPushedAt && day.notesPushedAt.split("T")[0] === new Date().toISOString().split("T")[0] && (
    <p className="text-[11px] text-success flex items-center gap-1.5 mt-1">
      <CheckCircle2 className="size-3" />
      Notes successfully pushed today!
    </p>
 )}
 </div>`;

file = file.replace(/ <Textarea[\s\S]*?id={`notes-\$\{day\.dayNumber\}`}[\s\S]*?<\/div>/, replacement);

fs.writeFileSync('src/components/DayDetail.tsx', file);

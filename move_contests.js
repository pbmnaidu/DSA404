const fs = require('fs');
let file = fs.readFileSync('src/components/MergedTodayProfile.tsx', 'utf8');

// The block to insert:
const contestsBlock = ` {/* Keep contests in the open right-side workspace, not below the full dashboard. */}
 <section className="min-w-0 pt-2" aria-label="Today&apos;s contests and competitions">
 <TodayContestsSection />
 </section>
`;

// First, remove it if it exists at the bottom
file = file.replace(contestsBlock + '\n </aside>', ' </aside>');

// Second, find where Milestones ends and AI tutor begins
const milestonesEndStr = ` </section>\n \n {/* AI Tutor Entry Point */}`;
if (file.includes(milestonesEndStr)) {
  file = file.replace(milestonesEndStr, ` </section>\n \n${contestsBlock}\n {/* AI Tutor Entry Point */}`);
}

fs.writeFileSync('src/components/MergedTodayProfile.tsx', file);

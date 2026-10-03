const fs = require('fs');

let pagePath = 'p:\\DSA404-chatBot\\app\\page.tsx';
let pageContent = fs.readFileSync(pagePath, 'utf8');

// Insert Missing Features into the Bento Grid before the closing `</div>` of the grid.
const newCards = `

  {/* Global Contests */}
  <div className="md:col-span-4 bg-card border border-border rounded-[2rem] p-6 md:p-8 shadow-sm">
  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-primary font-mono text-[10px] md:text-xs font-bold mb-4 uppercase tracking-wider">
  <Trophy className="size-3.5" /> Global Contests
  </div>
  <h3 className="text-lg md:text-xl font-bold mb-3">Sync Competitions.</h3>
  <p className="text-foreground text-sm leading-relaxed">
  Automatically track and sync upcoming coding competitions from LeetCode, Codeforces, CodeChef, and AtCoder in one unified calendar.
  </p>
  </div>

  {/* Backlog Manager */}
  <div className="md:col-span-4 bg-card border border-border rounded-[2rem] p-6 md:p-8 shadow-sm">
  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-warning font-mono text-[10px] md:text-xs font-bold mb-4 uppercase tracking-wider">
  <History className="size-3.5" /> Backlog Manager
  </div>
  <h3 className="text-lg md:text-xl font-bold mb-3">Guilt-Free Catch-Up.</h3>
  <p className="text-foreground text-sm leading-relaxed">
  Missed a day? Our dedicated backlog system safely queues missed problems and allows you to seamlessly shift your entire schedule forward.
  </p>
  </div>

  {/* PWA App */}
  <div className="md:col-span-4 bg-card border border-border rounded-[2rem] p-6 md:p-8 shadow-sm">
  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-success font-mono text-[10px] md:text-xs font-bold mb-4 uppercase tracking-wider">
  <Laptop className="size-3.5" /> Native Experience
  </div>
  <h3 className="text-lg md:text-xl font-bold mb-3">Install Anywhere.</h3>
  <p className="text-foreground text-sm leading-relaxed">
  Install DSA⁴⁰⁴ as a native progressive web app on your desktop or mobile device. Complete with Android APK support.
  </p>
  </div>
`;

// Find the end of the bento grid. The grid has `md:col-span-4` elements.
// I'll just append it right before `</div>\n  </div>\n  </section>\n  );`
pageContent = pageContent.replace(
  /(\s+)<\/div>\s+<\/div>\s+<\/section>\s+\);\s+}\s+\/\/\s+---\s+8\.\s+Product\s+Preview\s+Section\s+---/g,
  `${newCards}$1</div>\n  </div>\n  </section>\n  );\n}\n\n// --- 8. Product Preview Section ---`
);

// Add loading state to handleEnterDemo
pageContent = pageContent.replace(
  'const handleEnterDemo = useCallback(() => {',
  `const [isDemoLoading, setIsDemoLoading] = useState(false);
  const handleEnterDemo = useCallback(() => {
    if (isDemoLoading) return;
    setIsDemoLoading(true);`
);

// We need to pass isDemoLoading to buttons
pageContent = pageContent.replace(
  /onClick=\{onEnterDemo\}/g,
  `onClick={onEnterDemo} disabled={isDemoLoading}`
);

fs.writeFileSync(pagePath, pageContent, 'utf8');
console.log("Features added!");

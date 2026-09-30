const fs = require('fs');

function restructureProfileLayout(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(
    /\{\/\* ── TWO COLUMN (PUBLIC )?WORKSPACE ── \*\/\}\r?\n\s*<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">/,
    `{/* ── PROFILE WORKSPACE ── */}
        <div className="space-y-12">
          {/* Top Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">`
  );

  content = content.replace(
    /\{\/\* LEFT COLUMN: Narrative & Badges \*\/\}\r?\n\s*<aside className="lg:col-span-4 space-y-8">/,
    `{/* Story & Secondary Info */}
          <aside className="lg:col-span-4 space-y-8">`
  );

  content = content.replace(
    /\{\/\* RIGHT COLUMN: Progress & Integration \*\/\}\r?\n\s*<main className="lg:col-span-8 space-y-8 min-w-0">/,
    `{/* Primary Highlights */}
          <main className="lg:col-span-8 space-y-8 min-w-0">`
  );

  const dashboardStartStr = `{/* Unified Platform Profiles`;
  
  let parts = content.split(dashboardStartStr);

  if (parts.length === 2) {
    const newContent = parts[0] + 
      `</main>
          </div>

          {/* Full Width Analytics */}
          <div className="w-full space-y-12 min-w-0">
            ` + dashboardStartStr + parts[1];
    
    // For CoderProfilePage.tsx:
    let finalContent = newContent.replace(
      /<\/main>\r?\n\s*<\/div>\r?\n\s*\{\/\* Gmail Requirement Modal \*\/\}/g,
      `</div>\n      {/* Gmail Requirement Modal */}`
    );
    
    // For app/profile/[uid]/page.tsx:
    finalContent = finalContent.replace(
      /<\/main>\r?\n\s*<\/div>\r?\n\s*\{\/\* ── Footer ── \*\/\}/g,
      `</div>\n        {/* ── Footer ── */}`
    );

    fs.writeFileSync(filePath, finalContent, 'utf8');
    console.log("Successfully updated", filePath);
  } else {
    console.log("Could not split on dashboard comment for", filePath);
  }
}

restructureProfileLayout('p:/DSA404-chatBot/src/components/CoderProfilePage.tsx');
restructureProfileLayout('p:/DSA404-chatBot/app/profile/[uid]/page.tsx');

const fs = require('fs');
const path = require('path');

const cssPath = path.join('p:', 'DSA404-chatBot', 'app', 'globals.css');
let cssContent = fs.readFileSync(cssPath, 'utf8');

// 1. Update globals.css to separate :root and .dark and add foregrounds
const newCss = `
/* ─── PREMIUM LIGHT — PEARL & ROYAL ─── */
:root {
  color-scheme: light;

  --background:          #FAF9F6;
  --foreground:          #172554;
  
  --card:                #FFFFFF;
  --card-foreground:     #172554;
  
  --popover:             #FFFFFF;
  --popover-foreground:  #172554;

  --primary:             #4169E1;
  --primary-foreground:  #FFFFFF;

  --secondary:           #F1F5F9;
  --secondary-foreground: #1E293B;

  --muted:               #F1F5F9;
  --muted-foreground:    #64748B;

  --accent:              #E0E7FF;
  --accent-foreground:   #4169E1;

  --destructive:         #EF4444;
  --destructive-foreground: #FFFFFF;
  --success:             #22C55E;
  --success-foreground:  #FFFFFF;
  --warning:             #F59E0B;
  --warning-foreground:  #FFFFFF;
  --info:                #3B82F6;
  --info-foreground:     #FFFFFF;
  --streak:              #F97316;

  --border:              #E2E8F0;
  --input:               #E2E8F0;
  --ring:                #4169E1;

  --chart-1:             #4169E1;
  --chart-2:             #60A5FA;
  --chart-3:             #93C5FD;
  --chart-4:             #BFDBFE;
  --chart-5:             #DBEAFE;

  --radius: 0.5rem;

  --sidebar:             #FFFFFF;
  --sidebar-foreground:  #172554;
  --sidebar-primary:     #4169E1;
  --sidebar-primary-foreground: #FFFFFF;
  --sidebar-accent:      #F1F5F9;
  --sidebar-accent-foreground: #1E293B;
  --sidebar-border:      #E2E8F0;
  --sidebar-ring:        #4169E1;

  --difficulty-easy:     #22C55E;
  --difficulty-medium:   #F59E0B;
  --difficulty-hard:     #EF4444;
}

.dark {
  color-scheme: dark;

  --background:          #101623;
  --foreground:          #FDFDFC;
  
  --card:                #161E2E;
  --card-foreground:     #FDFDFC;
  
  --popover:             #161E2E;
  --popover-foreground:  #FDFDFC;

  --primary:             #3B82F6;
  --primary-foreground:  #FFFFFF;

  --secondary:           #1F2937;
  --secondary-foreground: #F9FAFB;

  --muted:               #1F2937;
  --muted-foreground:    #9CA3AF;

  --accent:              #1E3A8A;
  --accent-foreground:   #60A5FA;

  --destructive:         #F87171;
  --destructive-foreground: #450A0A;
  --success:             #4ADE80;
  --success-foreground:  #052E16;
  --warning:             #FBBF24;
  --warning-foreground:  #451A03;
  --info:                #60A5FA;
  --info-foreground:     #1E3A8A;
  --streak:              #FB923C;

  --border:              #374151;
  --input:               #374151;
  --ring:                #3B82F6;

  --chart-1:             #3B82F6;
  --chart-2:             #60A5FA;
  --chart-3:             #93C5FD;
  --chart-4:             #BFDBFE;
  --chart-5:             #DBEAFE;

  --radius: 0.5rem;

  --sidebar:             #161E2E;
  --sidebar-foreground:  #FDFDFC;
  --sidebar-primary:     #3B82F6;
  --sidebar-primary-foreground: #FFFFFF;
  --sidebar-accent:      #1F2937;
  --sidebar-accent-foreground: #F9FAFB;
  --sidebar-border:      #374151;
  --sidebar-ring:        #3B82F6;

  --difficulty-easy:     #4ADE80;
  --difficulty-medium:   #FBBF24;
  --difficulty-hard:     #F87171;
}
`;

cssContent = cssContent.replace(
  /\/\* ─── PREMIUM LIGHT — PEARL & ROYAL ─── \*\/\s*:root, \.dark \{[\s\S]*?--difficulty-hard:\s*#EF4444;\s*\}/,
  newCss.trim()
);

fs.writeFileSync(cssPath, cssContent, 'utf8');

// 2. Add static missing variables to buildCssVars so it doesn't accidentally overwrite globals.css with nothing
const ctxPath = path.join('p:', 'DSA404-chatBot', 'app', 'theme-customizer-context.tsx');
let ctxContent = fs.readFileSync(ctxPath, 'utf8');

ctxContent = ctxContent.replace(
  /"--sidebar-ring": pr,/,
  `"--sidebar-ring": pr,
    "--destructive": mode === "dark" ? "oklch(0.65 0.15 25)" : "oklch(0.6 0.18 25)",
    "--destructive-foreground": mode === "dark" ? "oklch(0.2 0.05 25)" : "oklch(0.98 0 0)",
    "--success": mode === "dark" ? "oklch(0.7 0.15 140)" : "oklch(0.65 0.15 140)",
    "--success-foreground": mode === "dark" ? "oklch(0.2 0.05 140)" : "oklch(0.98 0 0)",
    "--warning": mode === "dark" ? "oklch(0.8 0.15 80)" : "oklch(0.7 0.15 80)",
    "--warning-foreground": mode === "dark" ? "oklch(0.2 0.05 80)" : "oklch(0.98 0 0)",
    "--info": mode === "dark" ? "oklch(0.7 0.15 250)" : "oklch(0.6 0.15 250)",
    "--info-foreground": mode === "dark" ? "oklch(0.2 0.05 250)" : "oklch(0.98 0 0)",`
);

fs.writeFileSync(ctxPath, ctxContent, 'utf8');

console.log('Fixed CSS Tokens');

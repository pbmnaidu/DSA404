const fs = require('fs');
const path = 'p:/DSA404-chatBot/src/components/AppShell.tsx';
let data = fs.readFileSync(path, 'utf8');

data = data.replace(
  /onSignOut, collapsed, onToggleCollapse, paused,/g,
  'onSignOut, collapsed: pinnedCollapsed, onToggleCollapse, paused,'
);

data = data.replace(
  /const { openPanel } = useThemeCustomizer\(\);\r?\n\s*const width = collapsed \? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;/g,
  'const { openPanel } = useThemeCustomizer();\n  const [isHovered, setIsHovered] = useState(false);\n  const collapsed = pinnedCollapsed && !isHovered;\n  const width = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;'
);

data = data.replace(
  /aria-label="Main navigation"\r?\n\s*>/g,
  'aria-label="Main navigation"\n    onMouseEnter={() => setIsHovered(true)}\n    onMouseLeave={() => setIsHovered(false)}\n  >'
);

fs.writeFileSync(path, data);
console.log('AppShell updated using regex!');

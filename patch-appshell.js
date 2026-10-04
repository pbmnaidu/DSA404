const fs = require('fs');
let content = fs.readFileSync('src/components/AppShell.tsx', 'utf8');
content = content.replace('MoreHorizontal,\n} from "lucide-react";', 'MoreHorizontal,\n  BookOpen,\n} from "lucide-react";');
content = content.replace('{ to: "/settings", label: "Settings", icon: Settings, group: "account", hint: "Adjust pace, schedule, notifications, and theme." },\n] as const;', '{ to: "/settings", label: "Settings", icon: Settings, group: "account", hint: "Adjust pace, schedule, notifications, and theme." },\n  { to: "/guide", label: "Guide", icon: BookOpen, group: "account", hint: "Complete documentation of all platform features." },\n] as const;');
fs.writeFileSync('src/components/AppShell.tsx', content);
console.log('done');

const fs = require('fs');
let content = fs.readFileSync('app/page.tsx', 'utf8');

// replace 1
content = content.replace('import { User, Bell, Settings, Mail } from "lucide-react";', 'import { User, Bell, Settings, Mail, Monitor, Smartphone } from "lucide-react";');

// replace 2
content = content.replace('import { DSA404Logo } from "@/components/DSA404Logo";', 'import { DSA404Logo } from "@/components/DSA404Logo";\nimport { useThemeCustomizer } from "./theme-customizer-context";');

// replace 3
content = content.replace('const { promptInstall, isModalOpen, setIsModalOpen, isIOS, isStandalone } = usePWAInstall();', 'const { promptInstall, isModalOpen, setIsModalOpen, isIOS, isStandalone } = usePWAInstall();\n const { forceView, applyView } = useThemeCustomizer();');

// replace 4
const target = `<Button asChild variant="secondary" size="sm" className="hidden md:flex rounded-full px-5 font-bold font-mono text-xs text-primary hover:text-primary">
 <Link href="/auth?mode=signup">Start Learning</Link>
 </Button>`;

const replacement = `<Button asChild variant="secondary" size="sm" className="hidden md:flex rounded-full px-5 font-bold font-mono text-xs text-primary hover:text-primary">
 <Link href="/auth?mode=signup">Start Learning</Link>
 </Button>
 <Button
   onClick={() => applyView(forceView === "desktop" ? "auto" : "desktop")}
   variant="secondary"
   size="sm"
   className="md:hidden relative flex items-center justify-center size-8 rounded-full text-[10px] font-mono font-bold text-primary group shadow-sm shadow-black/20 hover:text-primary"
   title={forceView === "desktop" ? "Switch to Mobile View" : "Switch to Desktop View"}
 >
   {forceView === "desktop" ? (
     <Smartphone className="size-4" />
   ) : (
     <>
       <Monitor className="size-4" />
       {/* Highlight Hint */}
       <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-destructive animate-ping opacity-75" />
       <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-destructive" />
     </>
   )}
 </Button>`;

content = content.replace(target, replacement);

fs.writeFileSync('app/page.tsx', content);

const fs = require('fs');
const path = 'p:/DSA404-chatBot/app/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Import
if (!content.includes('AnimatedHeroBackground')) {
  content = content.replace(
    'import { DemoShell } from "@/components/demo/DemoShell";',
    'import { DemoShell } from "@/components/demo/DemoShell";\nimport { AnimatedHeroBackground } from "@/components/AnimatedHeroBackground";'
  );
}

// 2. Background
content = content.replace(
  '<div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl aspect-square bg-muted blur-[120px] rounded-full pointer-events-none" />',
  '<AnimatedHeroBackground />'
);

// 3. Heading
content = content.replace(
  '<h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] text-foreground max-w-4xl mb-6">',
  '<h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] text-foreground max-w-4xl mb-6 relative z-10">'
);
content = content.replace(
  '<span className="text-primary">One focused session at a time.</span>',
  '<span className="bg-gradient-to-r from-[var(--gradient-start)] via-[var(--gradient-mid)] to-[var(--gradient-end)] bg-clip-text text-transparent transition-colors duration-500 relative z-10 inline-block drop-shadow-[0_4px_10px_var(--glow-soft)]">One focused session at a time.</span>'
);

// 4. CTA Button
content = content.replace(
  '<div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">',
  '<div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto relative z-10">'
);
content = content.replace(
  '<Button asChild size="lg" className="h-14 px-8 text-sm sm:text-base font-bold rounded-lg w-full sm:w-auto shadow-sm shadow-primary/20">',
  '<Button asChild size="lg" className="h-14 px-8 text-sm sm:text-base font-bold rounded-lg w-full sm:w-auto bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)] shadow-[0_10px_30px_var(--glow-soft)] hover:shadow-[0_10px_40px_var(--glow-strong)] transition-all duration-400 ease-in-out hover:-translate-y-0.5 border-none">'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Updated page.tsx');

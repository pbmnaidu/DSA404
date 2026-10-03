const fs = require('fs');
const path = require('path');

const pagePath = path.join('p:', 'DSA404-chatBot', 'app', 'page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

// 1. Add Mail to lucide-react imports if it's missing
if (!content.includes('Mail')) {
  content = content.replace(
    'import { User, Bell, Settings } from "lucide-react";',
    'import { User, Bell, Settings, Mail } from "lucide-react";'
  );
}

// 2. Define StayConsistentSection before LandingPage export
const stayConsistentCode = `
// --- Stay Consistent. Compete Smarter. ---
function StayConsistentSection() {
  return (
    <section className="py-20 md:py-28 bg-background border-y border-border">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">Stay Consistent. Compete Smarter.</h2>
          <p className="text-foreground max-w-2xl mx-auto text-sm md:text-base">Powerful analytics, unified leaderboards, and scheduled reminders to keep you on track.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <Link href="/settings" className="bg-card border border-border rounded-[2rem] p-6 shadow-sm hover:border-primary/50 transition-colors block">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-primary font-mono text-[10px] md:text-xs font-bold mb-4 uppercase tracking-wider">
              <Mail className="size-3.5" /> Emails
            </div>
            <h3 className="text-lg md:text-xl font-bold mb-3 text-foreground">Daily Problem Emails</h3>
            <p className="text-foreground text-sm leading-relaxed mb-4">
              Receive a clear daily reminder with the problems planned for your next focused practice session.
            </p>
            <p className="text-foreground/70 text-xs font-medium">Benefit: Know exactly what to solve without opening multiple tools or losing your routine.</p>
          </Link>

          <Link href="/settings" className="bg-card border border-border rounded-[2rem] p-6 shadow-sm hover:border-warning/50 transition-colors block">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-warning font-mono text-[10px] md:text-xs font-bold mb-4 uppercase tracking-wider">
              <Bell className="size-3.5" /> Reminders
            </div>
            <h3 className="text-lg md:text-xl font-bold mb-3 text-foreground">Contest Reminders</h3>
            <p className="text-foreground text-sm leading-relaxed mb-4">
              Track upcoming coding contests and configure reminders so you can prepare and participate on time.
            </p>
            <p className="text-foreground/70 text-xs font-medium">Benefit: Never miss an important contest because you forgot the schedule.</p>
          </Link>

          <Link href="/profile" className="bg-card border border-border rounded-[2rem] p-6 shadow-sm hover:border-success/50 transition-colors block">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-success font-mono text-[10px] md:text-xs font-bold mb-4 uppercase tracking-wider">
              <LineChart className="size-3.5" /> Ratings
            </div>
            <h3 className="text-lg md:text-xl font-bold mb-3 text-foreground">Unified Coding Ratings</h3>
            <p className="text-foreground text-sm leading-relaxed mb-4">
              Connect supported coding platforms and view your competitive-programming ratings in one profile.
            </p>
            <p className="text-foreground/70 text-xs font-medium">Benefit: Understand your progress without checking every platform separately.</p>
          </Link>

          <Link href="/profile" className="bg-card border border-border rounded-[2rem] p-6 shadow-sm hover:border-info/50 transition-colors block">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-info font-mono text-[10px] md:text-xs font-bold mb-4 uppercase tracking-wider">
              <Trophy className="size-3.5" /> Ranking
            </div>
            <h3 className="text-lg md:text-xl font-bold mb-3 text-foreground">Cross-Platform Ranking</h3>
            <p className="text-foreground text-sm leading-relaxed mb-4">
              Compare your ranking and performance across supported coding platforms from one unified dashboard.
            </p>
            <p className="text-foreground/70 text-xs font-medium">Benefit: See your overall competitive position and identify where to improve.</p>
          </Link>

        </div>
      </div>
    </section>
  );
}

// --- Main Page Component ---
`;

if (!content.includes('function StayConsistentSection()')) {
  content = content.replace(
    '// --- Main Page Component ---',
    stayConsistentCode
  );
}

// 3. Insert <StayConsistentSection /> into the main render
if (!content.includes('<StayConsistentSection />')) {
  content = content.replace(
    '<CoreFeaturesBento />',
    '<CoreFeaturesBento />\n        <StayConsistentSection />'
  );
}

fs.writeFileSync(pagePath, content, 'utf8');
console.log('Successfully updated page.tsx');

const fs = require('fs');

// Fix src/lib/settings.ts
let settingsPath = 'p:\\DSA404-chatBot\\src\\lib\\settings.ts';
let settingsContent = fs.readFileSync(settingsPath, 'utf8');
settingsContent = settingsContent.replace('counts: data.counts as any,', '');
settingsContent = settingsContent.replace(
  'const raw: Fields = {',
  'const raw: Fields = {'
);
// wait, I need to insert the counts parsing
settingsContent = settingsContent.replace(
  /activeSheet: data\.active_sheet,\s*};/m,
  `activeSheet: data.active_sheet,
  };
  if (data.counts) {
    const c = typeof data.counts === "string" ? JSON.parse(data.counts) : data.counts;
    raw.dailyTarget = c.target ?? c.dailyTarget;
    raw.paceTier = c.tier ?? c.paceTier;
    raw.easyPerDay = c.easy ?? c.easyPerDay;
    raw.mediumPerDay = c.medium ?? c.mediumPerDay;
    raw.hardPerDay = c.hard ?? c.hardPerDay;
  }`
);
fs.writeFileSync(settingsPath, settingsContent, 'utf8');

// Fix Guest Mode in app/page.tsx
let pagePath = 'p:\\DSA404-chatBot\\app\\page.tsx';
let pageContent = fs.readFileSync(pagePath, 'utf8');
// The "Try as Guest" button triggers `onEnterDemo` which is defined as:
// const onEnterDemo = async () => { ... enableGuestMode(); ... }
// It might just be redirecting to / or somewhere else. Let's look for onEnterDemo and change its redirect to /today
pageContent = pageContent.replace(
  /router\.push\(['"`]\/['"`]\)/g,
  'router.push("/today")'
);
fs.writeFileSync(pagePath, pageContent, 'utf8');

console.log('Fixed settings.ts and page.tsx');

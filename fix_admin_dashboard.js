const fs = require('fs');
const path = 'p:/DSA404-chatBot/app/(admin)/admin/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Change grid columns
content = content.replace(
  '<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">',
  '<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">'
);

// Remove Auth Provider Limit StatCard
const authProviderLimitRegex = /<StatCard\s+icon=\{Activity\}[\s\S]*?error=\{error\}\s+\/>/;
content = content.replace(authProviderLimitRegex, '');

// Remove Firestore Section & Storage Section
const firestoreStorageRegex = /\{\/\* ── Firestore Section ───────────────────────────────── \*\/\}[\s\S]*?\{\/\* ── Storage Section ─────────────────────────────────── \*\/\}[\s\S]*?<\/section>/;
content = content.replace(firestoreStorageRegex, '');

fs.writeFileSync(path, content, 'utf8');
console.log('Admin dashboard updated.');

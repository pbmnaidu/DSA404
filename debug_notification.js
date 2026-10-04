const fs = require('fs');
const path = 'p:/DSA404-chatBot/src/components/NotificationPanel.tsx';
let data = fs.readFileSync(path, 'utf8');

// Find the exact bytes
const idx = data.indexOf('github-sync-info');
console.log('Found at index:', idx);
if (idx !== -1) {
  // show 20 chars before and 200 chars after
  console.log('Context:', JSON.stringify(data.substring(idx - 20, idx + 250)));
}

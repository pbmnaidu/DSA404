const fs = require('fs');
const path = 'p:/DSA404-chatBot/src/lib/github-sync.ts';
let lines = fs.readFileSync(path, 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('}*!*!') || lines[i].includes('}*`*;*') || lines[i] === ' }`;') {
    console.log("Found bad line: " + lines[i]);
  }
}

// Alternatively, just replace line 155 to 159 (0-indexed 155 to 159).
// Let's check if line 155 is }`;
if (lines[155].includes('}`;')) {
  // lines 155 to 159 should be removed.
  lines.splice(155, 5); // Removes lines 155, 156, 157, 158, 159
  fs.writeFileSync(path, lines.join('\n'));
  console.log('Fixed by removing lines 155-159.');
} else {
  // Search for }`;
  const idx = lines.findIndex(l => l.includes('}`;'));
  if (idx !== -1) {
    lines.splice(idx, 5);
    fs.writeFileSync(path, lines.join('\n'));
    console.log('Fixed by finding and removing lines starting at ' + idx);
  }
}

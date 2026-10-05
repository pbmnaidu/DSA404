const fs = require('fs');
const lines = fs.readFileSync('p:/DSA404-chatBot/src/lib/github-sync.ts', 'utf8').split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes(String.fromCharCode(96))) {
    console.log((i + 1) + ": " + lines[i]);
  }
}

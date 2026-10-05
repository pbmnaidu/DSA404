const fs = require('fs');
const path = 'p:/DSA404-chatBot/src/lib/github-sync.ts';
let content = fs.readFileSync(path, 'utf8');

const regex = /  \}\n \}\`;\n localStorage\.setItem\(key, JSON\.stringify\(config\)\);\n localStorage\.setItem\("dsa404_github_sync_config_default", JSON\.stringify\(config\)\);\n  \}\n\}/;

content = content.replace(regex, '  }\n}');
fs.writeFileSync(path, content);
console.log("Patched github-sync.ts to remove garbage.");

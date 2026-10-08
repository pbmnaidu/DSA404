import fs from 'fs';

const files = [
  'scripts/core404_data.json',
  'scripts/data/striver_a2z.json',
  'scripts/data/striver_sde.json',
  'scripts/data/neetcode150.json',
  'scripts/data/love_babbar.json',
  'scripts/data/rising_brains.json'
];

files.forEach(f => {
    let data = JSON.parse(fs.readFileSync(f));
    let modified = false;
    data.forEach(p => {
        let name = p.name.trim();
        
        // Fix main link if it's missing or google search
        if (!p.link || p.link.includes('google.com/search')) {
            p.link = 'https://duckduckgo.com/?q=' + encodeURIComponent('\\leetcode ' + name);
            modified = true;
        }
        
        // Add or fix gfgLink
        if (!p.gfgLink || p.gfgLink.includes('google.com/search')) {
            p.gfgLink = 'https://duckduckgo.com/?q=' + encodeURIComponent('\\geeksforgeeks ' + name);
            modified = true;
        }
    });
    if (modified) fs.writeFileSync(f, JSON.stringify(data, null, 2));
});

console.log('Fixed links across all sheets.');

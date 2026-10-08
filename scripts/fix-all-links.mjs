import fs from 'fs';

const files = [
  'scripts/core404_data.json',
  'scripts/data/striver_a2z.json',
  'scripts/data/striver_sde.json',
  'scripts/data/neetcode150.json',
  'scripts/data/love_babbar.json',
  'scripts/data/rising_brains.json'
];

let cache = {};
if (fs.existsSync('scripts/link-cache.json')) {
    cache = JSON.parse(fs.readFileSync('scripts/link-cache.json', 'utf8'));
}

async function searchLink(query, platform) {
    const url = 'https://lite.duckduckgo.com/lite/';
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({ q: query + ' ' + platform })
        });
        if (!res.ok) {
            console.error(`Rate limited or error on ${query}: ${res.status}`);
            return null;
        }
        const text = await res.text();
        let match;
        if (platform === 'leetcode') {
            match = text.match(/https:\/\/leetcode\.com\/problems\/[a-zA-Z0-9-_]+/);
        } else {
            match = text.match(/https:\/\/(www\.)?geeksforgeeks\.org\/problems\/[a-zA-Z0-9-_]+/);
        }
        if (match) return match[0];
    } catch (e) {
        console.error(e);
    }
    return null;
}

const delay = ms => new Promise(res => setTimeout(res, ms));

async function run() {
    let tasks = [];
    
    // Pass 1: gather missing links
    files.forEach(f => {
        const data = JSON.parse(fs.readFileSync(f, 'utf8'));
        data.forEach(p => {
            let name = p.name.trim();
            if (!cache[name]) cache[name] = {};
            
            let hasLC = (p.link && p.link.includes('leetcode.com')) || cache[name].leetcode;
            let hasGFG = (p.link && p.link.includes('geeksforgeeks.org')) || (p.gfgLink && p.gfgLink.includes('geeksforgeeks.org')) || cache[name].gfg;
            
            if (!hasLC) {
                tasks.push({ name, platform: 'leetcode' });
            }
            if (!hasGFG) {
                tasks.push({ name, platform: 'geeksforgeeks' });
            }
        });
    });
    
    // Deduplicate tasks
    const uniqueTasksMap = new Map();
    tasks.forEach(t => uniqueTasksMap.set(t.name + '-' + t.platform, t));
    tasks = Array.from(uniqueTasksMap.values());
    
    console.log(`Need to fetch ${tasks.length} links...`);
    
    const CONCURRENCY = 3;
    for (let i = 0; i < tasks.length; i += CONCURRENCY) {
        const batch = tasks.slice(i, i + CONCURRENCY);
        await Promise.all(batch.map(async t => {
            console.log(`Fetching ${t.platform} for ${t.name}...`);
            const link = await searchLink(t.name + ' data structures', t.platform);
            if (link) {
                cache[t.name][t.platform] = link;
            } else {
                cache[t.name][t.platform] = 'not_found';
            }
        }));
        
        // Save cache periodically
        fs.writeFileSync('scripts/link-cache.json', JSON.stringify(cache, null, 2));
        await delay(500); // polite delay
    }
    
    // Pass 2: apply
    files.forEach(f => {
        const data = JSON.parse(fs.readFileSync(f, 'utf8'));
        let modified = false;
        data.forEach(p => {
            let name = p.name.trim();
            const cached = cache[name];
            if (!cached) return;
            
            // Fix LC link
            let hasLC = (p.link && p.link.includes('leetcode.com'));
            if (!hasLC && cached.leetcode && cached.leetcode !== 'not_found') {
                if (p.link && p.link.includes('geeksforgeeks')) {
                    // Current link is GFG, move it to gfgLink
                    p.gfgLink = p.link;
                }
                p.link = cached.leetcode; // Prefer LC for main link
                modified = true;
            }
            
            // Fix GFG link
            let hasGFG = (p.link && p.link.includes('geeksforgeeks.org')) || (p.gfgLink && p.gfgLink.includes('geeksforgeeks.org'));
            if (!hasGFG && cached.gfg && cached.gfg !== 'not_found') {
                if (!p.link || p.link.includes('google.com')) {
                    p.link = cached.gfg;
                } else if (!p.gfgLink || p.gfgLink.includes('google.com')) {
                    p.gfgLink = cached.gfg;
                }
                modified = true;
            }
            
            // Final cleanup of search fallback links
            if (p.link && p.link.includes('google.com/search')) {
                 if (p.gfgLink && !p.gfgLink.includes('google.com')) {
                     p.link = p.gfgLink;
                 }
            }
            if (p.gfgLink && p.gfgLink.includes('google.com/search')) {
                 delete p.gfgLink; // just remove it if it's a fallback
            }
        });
        
        if (modified) {
            fs.writeFileSync(f, JSON.stringify(data, null, 2));
            console.log(`Updated ${f}`);
        }
    });
}
run();

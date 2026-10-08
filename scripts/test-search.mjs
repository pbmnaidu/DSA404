import fs from 'fs';

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

async function run() {
    const l = await searchLink('two sum', 'leetcode');
    const g = await searchLink('two sum', 'geeksforgeeks');
    console.log("LeetCode:", l);
    console.log("GFG:", g);
}
run();

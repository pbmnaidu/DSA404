const fs = require('fs');
const file = 'p:/DSA404-chatBot/app/(authenticated)/settings/page.tsx';
let f = fs.readFileSync(file, 'utf8');

const regex = /if\s*\(userId\)\s*\{\s*await deleteAccountData\(userId\);\s*\}/g;

const replacement = `const res = await fetch("/api/auth/delete-account", { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || "Failed to delete account");
    }`;

f = f.replace(regex, replacement);
fs.writeFileSync(file, f);
console.log("Done");

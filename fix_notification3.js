const fs = require('fs');
const path = 'p:/DSA404-chatBot/src/components/NotificationPanel.tsx';
let data = fs.readFileSync(path, 'utf8');

// Use the exact characters from the debug output
const oldBlock = " list.push({\r\n  id: `github-sync-info`,\r\n  category: \"system\",\r\n  title: \"📁 GitHub Auto-Sync Active\",\r\n  message: \"Every problem you solve automatically commits solution code & key notes to your GitHub repo.\",\r\n  time: \"Automated\",\r\n  link: \"/settings\",\r\n  priority: \"normal\",\r\n  });";

const newBlock = ` if (ghConfig?.enabled && ghConfig?.repo) {\r\n    list.push({\r\n      id: \`github-sync-active-\${ghConfig.repo}\`,\r\n      category: "system",\r\n      title: "📁 GitHub Auto-Sync Active",\r\n      message: \`Your solutions auto-commit to \${ghConfig.owner}/\${ghConfig.repo} (branch: \${ghConfig.branch || "main"}).\`,\r\n      time: "Automated",\r\n      link: "/settings",\r\n      priority: "normal",\r\n    });\r\n  } else {\r\n    list.push({\r\n      id: "github-sync-tip",\r\n      category: "system",\r\n      title: "🐙 Link GitHub Repo",\r\n      message: "Connect a GitHub repo in Settings to auto-commit your solutions on every save.",\r\n      time: "Tip",\r\n      link: "/settings",\r\n      priority: "normal",\r\n    });\r\n  }`;

if (data.includes(oldBlock)) {
  data = data.replace(oldBlock, newBlock);
  console.log('Block replaced OK');
} else {
  console.log('Not found, trying simpler match...');
  // Try replacing just by searching for the id
  data = data.replace(
    /list\.push\(\{\r?\n\s+id: `github-sync-info`[\s\S]*?\}\);/,
    newBlock
  );
  console.log('Regex replace done');
}

// Fix dependency array
data = data.replace(
  /}, \[days, streak, settings\.pushEnabled, settings\.paused, settings\.pausedFrom, contests, reminders\]\);/,
  '}, [days, streak, settings.pushEnabled, settings.paused, settings.pausedFrom, contests, reminders, ghConfig]);'
);

// Add ghConfig useMemo after streak if not already present
if (!data.includes('getLocalGitHubSyncConfig(user.id)')) {
  data = data.replace(
    /const streak = useMemo\(\(\) => currentStreak\(days\), \[days\]\);(\r?\n)/,
    `const streak = useMemo(() => currentStreak(days), [days]);\r\n\r\n  // Load GitHub sync config from localStorage (conditional notification)\r\n  const ghConfig = useMemo(() => {\r\n    if (!user?.id) return null;\r\n    return getLocalGitHubSyncConfig(user.id);\r\n  }, [user?.id]);\r\n`
  );
}

fs.writeFileSync(path, data, 'utf8');

// Verify
const verify = fs.readFileSync(path, 'utf8');
console.log('ghConfig present:', verify.includes('getLocalGitHubSyncConfig(user.id)'));
console.log('conditional GitHub:', verify.includes('ghConfig?.enabled'));
console.log('dep array updated:', verify.includes('reminders, ghConfig]);'));

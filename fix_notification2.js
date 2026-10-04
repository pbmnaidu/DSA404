const fs = require('fs');
const path = 'p:/DSA404-chatBot/src/components/NotificationPanel.tsx';
let data = fs.readFileSync(path, 'utf8');

// Replace the old unconditional block
const oldBlock = "  list.push({\r\n  id: `github-sync-info`,\r\n  category: \"system\",\r\n  title: \"📁 GitHub Auto-Sync Active\",\r\n  message: \"Every problem you solve automatically commits solution code & key notes to your GitHub repo.\",\r\n  time: \"Automated\",\r\n  link: \"/settings\",\r\n  priority: \"normal\",\r\n  });";

const newBlock = `  if (ghConfig?.enabled && ghConfig?.repo) {\r\n    list.push({\r\n      id: \`github-sync-active-\${ghConfig.repo}\`,\r\n      category: "system",\r\n      title: "📁 GitHub Auto-Sync Active",\r\n      message: \`Your solutions auto-commit to \${ghConfig.owner}/\${ghConfig.repo} (branch: \${ghConfig.branch || "main"}).\`,\r\n      time: "Automated",\r\n      link: "/settings",\r\n      priority: "normal",\r\n    });\r\n  } else {\r\n    list.push({\r\n      id: \`github-sync-tip\`,\r\n      category: "system",\r\n      title: "🐙 Link GitHub Repo",\r\n      message: "Connect a GitHub repo in Settings to auto-commit your solutions on every save.",\r\n      time: "Tip",\r\n      link: "/settings",\r\n      priority: "normal",\r\n    });\r\n  }`;

if (data.includes(oldBlock)) {
  data = data.replace(oldBlock, newBlock);
  // Also fix dependency array
  data = data.replace(
    '}, [days, streak, settings.pushEnabled, settings.paused, settings.pausedFrom, contests, reminders]);',
    '}, [days, streak, settings.pushEnabled, settings.paused, settings.pausedFrom, contests, reminders, ghConfig]);'
  );
  fs.writeFileSync(path, data, 'utf8');
  console.log('SUCCESS - replaced');
} else {
  console.log('Block not found - checking for partial match');
  console.log('Has github-sync-info:', data.includes('github-sync-info'));
}

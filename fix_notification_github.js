const fs = require('fs');
const path = 'p:/DSA404-chatBot/src/components/NotificationPanel.tsx';
let data = fs.readFileSync(path, 'utf8');

// 1. Add ghConfig after streak line
data = data.replace(
  /const streak = useMemo\(\(\) => currentStreak\(days\), \[days\]\);(\r?\n)/,
  `const streak = useMemo(() => currentStreak(days), [days]);$1$1  // Load GitHub sync config from localStorage$1  const ghConfig = useMemo(() => {$1    if (!user?.id) return null;$1    return getLocalGitHubSyncConfig(user.id);$1  }, [user?.id]);$1`
);

// 2. Replace the always-show GitHub notification with conditional one
const oldGithub = `  // ──────────────────────────────────────────────────────────────────────────\r\n  // 4. SYSTEM UTILITIES\r\n  // ──────────────────────────────────────────────────────────────────────────\r\n  list.push({\r\n  id: \`github-sync-info\`,\r\n  category: "system",\r\n  title: "📁 GitHub Auto-Sync Active",\r\n  message: "Every problem you solve automatically commits solution code & key notes to your GitHub repo.",\r\n  time: "Automated",\r\n  link: "/settings",\r\n  priority: "normal",\r\n  });`;

const newGithub = `  // ──────────────────────────────────────────────────────────────────────────
  // 4. SYSTEM UTILITIES
  // ──────────────────────────────────────────────────────────────────────────
  if (ghConfig?.enabled && ghConfig?.repo) {
    list.push({
      id: \`github-sync-active-\${ghConfig.repo}\`,
      category: "system",
      title: "📁 GitHub Auto-Sync Active",
      message: \`Your solutions auto-commit to \${ghConfig.owner}/\${ghConfig.repo} (branch: \${ghConfig.branch || "main"}).\`,
      time: "Automated",
      link: "/settings",
      priority: "normal",
    });
  } else {
    list.push({
      id: \`github-sync-tip\`,
      category: "system",
      title: "🐙 Link GitHub Repo",
      message: "Connect a GitHub repo in Settings to auto-commit your solutions on every save.",
      time: "Tip",
      link: "/settings",
      priority: "normal",
    });
  }`;

data = data.replace(oldGithub, newGithub);

// 3. Add ghConfig to dependency array
data = data.replace(
  /}, \[days, streak, settings\.pushEnabled, settings\.paused, settings\.pausedFrom, contests, reminders\]\);/,
  `}, [days, streak, settings.pushEnabled, settings.paused, settings.pausedFrom, contests, reminders, ghConfig]);`
);

fs.writeFileSync(path, data, 'utf8');
console.log('NotificationPanel updated!');
// verify
const verify = fs.readFileSync(path, 'utf8');
console.log('ghConfig present:', verify.includes('getLocalGitHubSyncConfig'));
console.log('conditional GitHub:', verify.includes('ghConfig?.enabled'));

const fs = require('fs');

function removeSyncEffect(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  
  // We want to find the useEffect block that contains syncPublicSolvedProblems and remove it.
  // Using a regex to match the useEffect block.
  // In MergedTodayProfile.tsx it starts with "// Keep public profile solved problems & activity heatmap automatically in sync"
  // In CoderProfilePage.tsx it starts with "// Auto-sync solved problems to world-readable userDoc in the background"

  content = content.replace(/\/\/ Keep public profile solved problems[^]*?\}, \[user\?\.uid, loading, days, pbCompleted, submissions\]\);/m, '');
  content = content.replace(/\/\/ Auto-sync solved problems to world-readable[^]*?\}, \[user\?\.uid, completedProblems\.length, days, pbCompleted, submissions\]\);/m, '');
  
  // Just to be absolutely sure, let's also remove any imports of syncPublicSolvedProblems if they are unused, 
  // but it's safer to just remove the specific block.
  
  fs.writeFileSync(filepath, content, 'utf8');
}

removeSyncEffect('p:\\DSA404-chatBot\\src\\components\\MergedTodayProfile.tsx');
removeSyncEffect('p:\\DSA404-chatBot\\src\\components\\CoderProfilePage.tsx');
console.log('Removed destructive sync entirely.');

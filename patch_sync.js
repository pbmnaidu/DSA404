const fs = require('fs');

function patchFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  const target = "void syncPublicSolvedProblems(user.uid, Array.from(pbCompleted).map(p => ({ name: p, platform: 'Unknown', difficulty: 'Unknown', link: '' })) as any)";
  
  if (content.includes(target)) {
    const replacement = `const snapshot = Array.from(pbCompleted).map(p => {
      const sub = submissions[p];
      if (sub) {
        return {
          name: p,
          platform: sub.platform || 'Unknown',
          difficulty: 'Unknown',
          link: sub.link || '',
          code: sub.code,
          keyPoints: sub.keyPoints,
          submissionLink: sub.submissionLink,
          submittedAt: sub.submittedAt
        };
      }
      return { name: p, platform: 'Unknown', difficulty: 'Unknown', link: '' };
    });
    void syncPublicSolvedProblems(user.uid, snapshot as any)`;
    
    content = content.replace(target, replacement);
  }
  
  // also fix .catch if it was attached
  const target2 = "void syncPublicSolvedProblems(user.uid, Array.from(pbCompleted).map(p => ({ name: p, platform: 'Unknown', difficulty: 'Unknown', link: '' })) as any).catch";
  if (content.includes(target2)) {
    const replacement2 = `const snapshot = Array.from(pbCompleted).map(p => {
      const sub = submissions[p];
      if (sub) {
        return {
          name: p,
          platform: sub.platform || 'Unknown',
          difficulty: 'Unknown',
          link: sub.link || '',
          code: sub.code,
          keyPoints: sub.keyPoints,
          submissionLink: sub.submissionLink,
          submittedAt: sub.submittedAt
        };
      }
      return { name: p, platform: 'Unknown', difficulty: 'Unknown', link: '' };
    });
    void syncPublicSolvedProblems(user.uid, snapshot as any).catch`;
    
    content = content.replace(target2, replacement2);
  }

  fs.writeFileSync(filepath, content, 'utf8');
}

patchFile('p:\\DSA404-chatBot\\src\\components\\MergedTodayProfile.tsx');
patchFile('p:\\DSA404-chatBot\\src\\components\\CoderProfilePage.tsx');
console.log('Patched destructive sync.');

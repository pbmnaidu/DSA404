const fs = require('fs');

const path = 'p:\\DSA404-chatBot\\src\\hooks\\useProblemCompletions.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('import { createClient }')) {
  content = content.replace(
    /import \{ getLocalGitHubSyncConfig, pushProblemSolutionToGitHub \} from "@\/lib\/github-sync";/g,
    'import { getLocalGitHubSyncConfig, pushProblemSolutionToGitHub } from "@/lib/github-sync";\nimport { createClient } from "@/integrations/supabase/client";'
  );
}

if (!content.includes('supabase.channel')) {
  const target = `  window.addEventListener('visibilitychange', onFocus);
  window.addEventListener('focus', onFocus);

  return () => {
  isMounted = false;
  window.removeEventListener('visibilitychange', onFocus);
  window.removeEventListener('focus', onFocus);
  };
  }, [user]);`;

  const replacement = `  window.addEventListener('visibilitychange', onFocus);
  window.addEventListener('focus', onFocus);

  const supabase = createClient();
  const channel = supabase
    .channel(\`profiles_\${currentUid}\`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'profiles', filter: \`id=eq.\${currentUid}\` },
      () => {
        fetchCompletions();
      }
    )
    .subscribe();

  return () => {
  isMounted = false;
  window.removeEventListener('visibilitychange', onFocus);
  window.removeEventListener('focus', onFocus);
  supabase.removeChannel(channel);
  };
  }, [user]);`;

  let replaced = false;
  
  if (content.includes(target.replace(/\r\n/g, '\n'))) {
    content = content.replace(target.replace(/\r\n/g, '\n'), replacement.replace(/\r\n/g, '\n'));
    replaced = true;
  }
  
  if (!replaced && content.includes(target)) {
    content = content.replace(target, replacement);
    replaced = true;
  }
}

fs.writeFileSync(path, content, 'utf8');
console.log('Patched useProblemCompletions.tsx');

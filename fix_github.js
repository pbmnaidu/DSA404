const fs = require('fs');
const path = 'p:/DSA404-chatBot/src/lib/github-sync.ts';
let content = fs.readFileSync(path, 'utf8');

const regex = /\/\*\* Loads sync config from cloud \*\/[\s\S]*?export async function loadCloudGitHubSyncConfig[^{]*\{[\s\S]*?\n\}/;

const replacement = `/** Loads sync config from cloud */
export async function loadCloudGitHubSyncConfig(userId?: string | null): Promise<GitHubSyncConfig | null> {
  const targetUid = userId || null;
  const local = getLocalGitHubSyncConfig(targetUid);

  if (typeof window !== "undefined" && targetUid) {
    try {
      const { createClient } = await import("@/integrations/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.user_metadata?.github_sync_config) {
        const cloudConfig = user.user_metadata.github_sync_config as GitHubSyncConfig;
        if (cloudConfig.token && cloudConfig.token.startsWith("enc:v1:")) {
          const decryptedToken = await decryptSecret(cloudConfig.token, targetUid);
          if (decryptedToken) {
            cloudConfig.token = decryptedToken;
            localStorage.setItem(STORAGE_KEY_PREFIX + targetUid, JSON.stringify(cloudConfig));
            return cloudConfig;
          }
        } else if (cloudConfig.token) {
          localStorage.setItem(STORAGE_KEY_PREFIX + targetUid, JSON.stringify(cloudConfig));
          return cloudConfig;
        }
      }
    } catch (err) {
      console.warn("Failed to load GitHub config from cloud", err);
    }
  }
  return local;
}`;

content = content.replace(regex, replacement);
fs.writeFileSync(path, content);
console.log("Patched github-sync.ts successfully");

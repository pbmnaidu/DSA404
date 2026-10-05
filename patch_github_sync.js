const fs = require('fs');
const path = 'p:/DSA404-chatBot/src/lib/github-sync.ts';
let content = fs.readFileSync(path, 'utf8');

const targetRegex = /\/\*\* Saves config to both localStorage \*\/[\s\S]*?export async function saveGitHubSyncConfig\([\s\S]*?\}[\s\S]*?\}/;

const targetRegex2 = /\/\*\* Loads sync config from cloud \(mocked to local\) \*\/[\s\S]*?export async function loadCloudGitHubSyncConfig[^{]*\{[\s\S]*?\}/;

const replacement1 = `/** Saves config to both localStorage and cloud */
export async function saveGitHubSyncConfig(
 userId: string | null | undefined,
 config: GitHubSyncConfig,
): Promise<void> {
 const targetUid = userId || null;

 if (typeof window !== "undefined") {
 const key = \`\${STORAGE_KEY_PREFIX}\${targetUid || "default"}\`;
 localStorage.setItem(key, JSON.stringify(config));
 localStorage.setItem("dsa404_github_sync_config_default", JSON.stringify(config));

 if (targetUid) {
  try {
  const cloudConfig = { ...config };
  if (cloudConfig.token) {
   cloudConfig.token = await encryptSecret(cloudConfig.token, targetUid);
  }
  const { createClient } = await import("@/integrations/supabase/client");
  const supabase = createClient();
  await supabase.auth.updateUser({ data: { github_sync_config: cloudConfig } });
  } catch (err) {
  console.warn("Failed to sync GitHub config to cloud", err);
  }
 }
 }
}`;

const replacement2 = `/** Loads sync config from cloud */
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
   localStorage.setItem(\`\${STORAGE_KEY_PREFIX}\${targetUid}\`, JSON.stringify(cloudConfig));
   return cloudConfig;
   }
  } else if (cloudConfig.token) {
   localStorage.setItem(\`\${STORAGE_KEY_PREFIX}\${targetUid}\`, JSON.stringify(cloudConfig));
   return cloudConfig;
  }
  }
 } catch (err) {
  console.warn("Failed to load GitHub config from cloud", err);
 }
 }
 return local;
}`;

content = content.replace(targetRegex, replacement1);
content = content.replace(targetRegex2, replacement2);

fs.writeFileSync(path, content);
console.log("Patched github-sync.ts successfully.");

import dotenv from 'dotenv';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ENCRYPTION_KEY = process.env.GITHUB_ENCRYPTION_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ENCRYPTION_KEY) {
  console.error("Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or GITHUB_ENCRYPTION_KEY.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function decryptCBC(encryptedString, baseKeyString) {
  const parts = encryptedString.split(":");
  if (parts.length !== 2) throw new Error("Invalid CBC format");
  const iv = Buffer.from(parts[0], "hex");
  const encryptedText = Buffer.from(parts[1], "hex");
  
  const oldKeyString = crypto.createHash('sha256').update(String(baseKeyString)).digest('base64').substring(0, 32);
  const oldKey = Buffer.from(oldKeyString);
  
  const decipher = crypto.createDecipheriv("aes-256-cbc", oldKey, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

function encryptGCM(text, baseKeyString) {
  const key = crypto.createHash('sha256').update(String(baseKeyString)).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `v2:${iv.toString("hex")}:${authTag}:${encrypted}`;
}

async function run() {
  console.log("Fetching connections...");
  const { data: connections, error } = await supabase.from('github_connections').select('id, encrypted_access_token');
  if (error) {
    console.error("Failed to fetch:", error);
    process.exit(1);
  }
  
  let migrated = 0;
  for (const conn of connections) {
    if (conn.encrypted_access_token && !conn.encrypted_access_token.startsWith('v2:')) {
      try {
        const plain = decryptCBC(conn.encrypted_access_token, ENCRYPTION_KEY);
        const newEncrypted = encryptGCM(plain, ENCRYPTION_KEY);
        await supabase.from('github_connections').update({ encrypted_access_token: newEncrypted }).eq('id', conn.id);
        migrated++;
      } catch (err) {
        console.error(`Failed to migrate connection ${conn.id}:`, err.message);
      }
    }
  }
  console.log(`Migration complete. Migrated ${migrated} connections.`);
}

run();

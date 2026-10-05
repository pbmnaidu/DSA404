import crypto from "crypto";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const GCM_IV_LENGTH = 12;

function getEncryptionKey() {
    const key = process.env.GITHUB_ENCRYPTION_KEY;
    if (!key || key.length < 32) {
        throw new Error("GITHUB_ENCRYPTION_KEY is required and must be at least 32 characters");
    }
    return crypto.createHash('sha256').update(String(key)).digest();
}

export function encryptToken(text: string): string {
    const key = getEncryptionKey();
    if (!key) throw new Error("Server misconfigured: missing encryption key");
    const iv = crypto.randomBytes(GCM_IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    const authTag = cipher.getAuthTag().toString("hex");
    
    return `v2:${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decryptToken(encryptedString: string): string {
    const key = getEncryptionKey();
    if (!key) throw new Error("Server misconfigured: missing encryption key");
    
    const parts = encryptedString.split(":");
    
    if (parts[0] === "v2" && parts.length === 4) {
        // GCM format: v2:iv:authTag:ciphertext
        const iv = Buffer.from(parts[1], "hex");
        const authTag = Buffer.from(parts[2], "hex");
        const encryptedText = parts[3];
        
        if (iv.length !== GCM_IV_LENGTH || authTag.length !== 16) {
            throw new Error("Invalid encryption format");
        }
        
        const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
        decipher.setAuthTag(authTag);
        
        try {
            let decrypted = decipher.update(encryptedText, "hex", "utf8");
            decrypted += decipher.final("utf8");
            return decrypted;
        } catch (e) {
            throw new Error("Failed to authenticate or decrypt token");
        }
    } 
    
    throw new Error("Unknown encryption format");
}

export async function createServerSupabase() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                        });
                    } catch (error) {
                        // Ignore for Server Components
                    }
                },
            },
        }
    );
}

export async function getServerUser() {
    const supabase = await createServerSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        return null;
    }
    return user;
}

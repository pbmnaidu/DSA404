// src/lib/profileService.ts
// Handles profile CRUD in Supabase.
// Profile photo is compressed to ≤50KB base64 and stored as a string field

import { createClient } from "@/integrations/supabase/client";
import { loadUserProfile, saveUserProfile, resolveProfileIdentifier } from "./db";
import type { UserProfile } from "./db";

// ─── Image compression ────────────────────────────────────────────────────────

/**
 * Compresses an image File to a low-quality JPEG data-URL (≤50 KB by default).
 * Stored as a plain string field.
 */
export async function compressImageToDataURL(
 file: File,
 maxSizeKB = 50,
 maxDim = 200
): Promise<string> {
 return new Promise((resolve, reject) => {
 const reader = new FileReader();
 reader.onload = (e) => {
 const img = new Image();
 img.onload = () => {
 const canvas = document.createElement("canvas");
 const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
 canvas.width = Math.round(img.width * scale);
 canvas.height = Math.round(img.height * scale);
 const ctx = canvas.getContext("2d")!;
 ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

 // Start at quality 0.7, drop until under maxSizeKB
 let quality = 0.7;
 let dataUrl = canvas.toDataURL("image/jpeg", quality);
 while (dataUrl.length > maxSizeKB * 1024 * 1.37 && quality > 0.1) {
 quality -= 0.05;
 dataUrl = canvas.toDataURL("image/jpeg", quality);
 }
 resolve(dataUrl);
 };
 img.onerror = reject;
 img.src = e.target?.result as string;
 };
 reader.onerror = reject;
 reader.readAsDataURL(file);
 });
}

// ─── Supabase helpers ────────────────────────────────────────────────────────

export async function getProfile(uid: string): Promise<UserProfile | null> {
 const data = await loadUserProfile(uid);
 if (Object.keys(data).length === 0) return null;
 return data as UserProfile;
}

export async function upsertProfile(
 uid: string,
 data: Partial<UserProfile>
): Promise<void> {
 await saveUserProfile(uid, data);
}

/** Look up a profile by shareSlug (username) for public profile page. */
export async function getProfileBySlug(
 slug: string
): Promise<UserProfile | null> {
 const uid = await resolveProfileIdentifier(slug);
 if (!uid) return null;
 return getProfile(uid);
}
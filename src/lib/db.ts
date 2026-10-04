import { createClient } from "@/integrations/supabase/client";
import type { Day } from "./types";
import { SCHEMA_VERSION } from "./types";
import { DEFAULT_DAILY_COUNTS, type DailyCounts, rebalanceRemaining, seedDays, START_DATE, todayIso } from "./plan";
import { getCanonicalProblemLink, normalizePlatformName, getProblemMetadata } from "./problems";
import { loadSettings } from "./settings";
import {
 isGuestUser,
 getGuestPlan,
 saveGuestPlan,
 saveGuestDay,
 getGuestProfile,
 saveGuestProfile,
 getGuestProblemCompletions,
 getGuestCodeSubmissions,
 saveGuestCodeSubmission,
 removeGuestCodeSubmission,
 getGuestScheduleEvents,
} from "./guest-data";

export interface PlanMeta {
 startDate: string;
 lastActiveDate: string;
 lastSyncedAt: string;
}

export interface CustomLink { label: string; url: string; }
export interface SocialLinkItem { platform: string; url: string; }
export interface CodingProfiles {
 leetcode?: string; codeforces?: string; codechef?: string; atcoder?: string;
 hackerrank?: string; hackerearth?: string; gfg?: string; github?: string; customLinks?: CustomLink[];
}
export interface PublicStats { totalSolved: number; byPlatform: Record<string, number>; lastUpdated: string; }
export interface CompletedProblemSnapshot {
 name: string; platform: string; difficulty: string; link: string; code?: string; submissionLink?: string;
 keyPoints?: string; completedAt?: string; submittedAt?: string; topic?: string; section?: string;
}

export interface UserProfile {
 displayName: string; photoURL: string; bannerURL?: string; bio: string; aboutMe?: string; notes?: string;
 username?: string; email?: string; linkedin?: string; github?: string; portfolio?: string;
 socialLinks?: SocialLinkItem[]; codingProfiles: CodingProfiles; publicStats: PublicStats;
 platformStats?: Record<string, any>; completedProblems: CompletedProblemSnapshot[]; activityHeatmap?: Record<string, number>;
}

export const USERNAME_REGEX = /^[a-z0-9_-]{3,20}$/;
export function normalizeUsername(raw: string): string { return raw.trim().toLowerCase(); }

const supabase = createClient();

async function deleteAllDays(uid: string) {
 await supabase.from("study_days").delete().eq("user_id", uid);
}

async function writeAllDays(uid: string, days: Day[]) {
 const rows = days.map((d, seq_index) => ({
 id: d.id,
 user_id: uid,
 date: d.date,
 topic: d.topic,
 problems: d.problems,
 day_number: d.dayNumber,
 seq_index,
 is_skipped: d.skipped,
 // Add additional JSON fields if necessary or map them
 }));
 for (let i = 0; i < rows.length; i += 200) {
 await supabase.from("study_days").upsert(rows.slice(i, i + 200));
 }
}


// Ensure a profiles row exists for this user. The DB trigger creates it on signup,
// but existing users (before the trigger) or race conditions may miss it.
// NOTE: ignoreDuplicates: false ensures email/displayName are updated on every login
// so that username-based login (which queries profiles.email) works correctly.
export async function ensureProfileExists(uid: string, meta?: { email?: string; displayName?: string; photoURL?: string }) {
 if (isGuestUser(uid)) return;
 await supabase.from("profiles").upsert(
 {
 id: uid,
 ...(meta?.email ? { email: meta.email } : {}),
 ...(meta?.displayName ? { display_name: meta.displayName } : {}),
 ...(meta?.photoURL ? { photo_url: meta.photoURL } : {}),
 },
 { onConflict: "id", ignoreDuplicates: false }
 );
}

export async function updateUserProfile(uid: string, patch: { displayName?: string }) {
 await supabase.from("profiles").update({ display_name: patch.displayName }).eq("id", uid);
}

export async function loadUserProfile(uid: string): Promise<Partial<UserProfile>> {
 if (isGuestUser(uid)) return getGuestProfile();
 const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
 if (!data) return {};
 return {
 displayName: data.display_name || "",
 photoURL: data.photo_url || "",
 bannerURL: data.banner_url || "",
 bio: data.bio || "",
 aboutMe: data.about_me || "",
 username: data.username || "",
 email: data.email || "",
 linkedin: data.linkedin || "",
 github: data.github || "",
 portfolio: data.portfolio || "",
 socialLinks: data.social_links || [],
 codingProfiles: data.coding_profiles || {},
 publicStats: data.public_stats || { totalSolved: 0, byPlatform: {}, lastUpdated: "" },
 platformStats: data.platform_stats || {},
 completedProblems: data.completed_problems || [],
 activityHeatmap: data.activity_heatmap || {},
 };
}

export async function loadOwnerProfile(uid: string): Promise<Partial<UserProfile>> {
 if (isGuestUser(uid)) return getGuestProfile();
 const pub = await loadUserProfile(uid);
 const { data } = await supabase.from("profiles").select("notes").eq("id", uid).single();
 return { ...pub, notes: data?.notes || "" };
}

export async function saveUserProfile(uid: string, patch: Partial<UserProfile>) {
 if (isGuestUser(uid)) { saveGuestProfile(patch); return; }
 
 const updatePayload: any = {};
 if (patch.displayName !== undefined) updatePayload.display_name = patch.displayName;
 if (patch.photoURL !== undefined) updatePayload.photo_url = patch.photoURL;
 if (patch.bannerURL !== undefined) updatePayload.banner_url = patch.bannerURL;
 if (patch.bio !== undefined) updatePayload.bio = patch.bio;
 if (patch.aboutMe !== undefined) updatePayload.about_me = patch.aboutMe;
 if (patch.notes !== undefined) updatePayload.notes = patch.notes;
 if (patch.linkedin !== undefined) updatePayload.linkedin = patch.linkedin;
 if (patch.github !== undefined) updatePayload.github = patch.github;
 if (patch.portfolio !== undefined) updatePayload.portfolio = patch.portfolio;
 if (patch.socialLinks !== undefined) updatePayload.social_links = patch.socialLinks;
 if (patch.codingProfiles !== undefined) updatePayload.coding_profiles = patch.codingProfiles;
 if (patch.publicStats !== undefined) updatePayload.public_stats = patch.publicStats;
 if (patch.platformStats !== undefined) updatePayload.platform_stats = patch.platformStats;
 if (patch.completedProblems !== undefined) updatePayload.completed_problems = patch.completedProblems;
 if (patch.activityHeatmap !== undefined) updatePayload.activity_heatmap = patch.activityHeatmap;

 if (Object.keys(updatePayload).length > 0) {
 await supabase.from("profiles").update(updatePayload).eq("id", uid);
 }
}

export async function savePlatformStats(uid: string, platformStats: Record<string, any>): Promise<void> {
 if (isGuestUser(uid)) { saveGuestProfile({ platformStats }); return; }
 await supabase.from("profiles").update({ platform_stats: platformStats }).eq("id", uid);
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
 const u = normalizeUsername(username);
 if (!USERNAME_REGEX.test(u)) return false;
 const { data } = await supabase.from("profiles").select("id").eq("username", u).maybeSingle();
 return !data;
}

export async function claimUsername(uid: string, username: string, email?: string): Promise<void> {
 const u = normalizeUsername(username);
 if (!USERNAME_REGEX.test(u)) throw new Error("USERNAME_INVALID");
 const available = await isUsernameAvailable(u);
 if (!available) throw new Error("USERNAME_TAKEN");
 await supabase.from("profiles").update({ username: u }).eq("id", uid);
}

export async function getEmailByUsername(username: string): Promise<string | null> {
 const u = normalizeUsername(username);
 if (!USERNAME_REGEX.test(u)) return null;
 const { data } = await supabase.from("profiles").select("email").eq("username", u).maybeSingle();
 return data?.email || null;
}

export async function resolveProfileIdentifier(identifier: string): Promise<string | null> {
 const asUsername = normalizeUsername(identifier);
 if (USERNAME_REGEX.test(asUsername)) {
 const { data } = await supabase.from("profiles").select("id").eq("username", asUsername).maybeSingle();
 if (data) return data.id;
 }
 const { data } = await supabase.from("profiles").select("id").eq("id", identifier).maybeSingle();
 return data ? identifier : null;
}

function mapDayRow(row: any): Day {
 return {
 id: row.id,
 dayNumber: row.day_number,
 date: row.date,
 topic: row.topic,
 section: row.section || "",
 subtopics: row.subtopics || [],
 problems: row.problems || [],
 checklist: row.checklist || [],
 status: row.status || "pending",
 notes: row.notes || "",
 revisionNotes: row.revision_notes || "",
 skipped: row.is_skipped || false,
 level: row.level,
 mergeSnapshot: row.merge_snapshot,
 isRevisionDay: row.is_revision_day,
 revisionDayNumbers: row.revision_day_numbers,
 };
}

export async function loadPublicDays(uid: string): Promise<Day[]> {
 const { data } = await supabase.from("study_days").select("*").eq("user_id", uid).order("seq_index", { ascending: true });
 return (data || []).map(mapDayRow);
}

export async function loadPlan(userId: string): Promise<{ days: Day[]; meta: PlanMeta; sheetId?: string }> {
 if (isGuestUser(userId)) return getGuestPlan();
 
 const { data: daysData } = await supabase.from("study_days").select("*").eq("user_id", userId).order("seq_index", { ascending: true });
 const { data: settingsData } = await supabase.from("user_settings").select("*").eq("user_id", userId).single();
 
 if (!daysData || daysData.length === 0) {
 const counts = settingsData?.counts as DailyCounts;
 return seedPlan(userId, undefined, counts, settingsData?.active_sheet || undefined);
 }

 return {
 days: daysData.map(mapDayRow),
 meta: {
 startDate: settingsData?.start_date || START_DATE,
 lastActiveDate: settingsData?.last_active_date || todayIso(),
 lastSyncedAt: settingsData?.updated_at || new Date().toISOString(),
 },
 sheetId: settingsData?.active_sheet || "core404",
 };
}

export async function seedPlan(userId: string, startDate?: string, counts?: DailyCounts, sheetId?: string): Promise<{ days: Day[]; meta: PlanMeta }> {
 const now = new Date();
 const effectiveStartDate = startDate || now.toISOString().slice(0, 10);
 const effectiveCounts = counts || DEFAULT_DAILY_COUNTS;
 const effectiveSheet = sheetId || "core404";

 let days = seedDays(effectiveStartDate, effectiveSheet);
 days = rebalanceRemaining(days, effectiveCounts, effectiveStartDate);

 await deleteAllDays(userId);
 await writeAllDays(userId, days);

 await supabase.from("user_settings").upsert({
 user_id: userId,
 start_date: effectiveStartDate,
 last_active_date: effectiveStartDate,
 active_sheet: effectiveSheet,
 }, { onConflict: "user_id" });

 return {
 days,
 meta: { startDate: effectiveStartDate, lastActiveDate: effectiveStartDate, lastSyncedAt: now.toISOString() }
 };
}

export async function savePlan(userId: string, days: Day[], meta: PlanMeta, sheetId?: string) {
 if (isGuestUser(userId)) { saveGuestPlan(days); return; }
 await writeAllDays(userId, days);
 await supabase.from("user_settings").update({
 start_date: meta.startDate,
 last_active_date: meta.lastActiveDate,
 }).eq("user_id", userId);
}

export async function saveDayProgress(uid: string, dayId: string, patch: Partial<Day>) {
  if (isGuestUser(uid)) { 
    const plan = getGuestPlan();
    const currentDay = plan.days.find((d: Day) => d.id === dayId || d.dayNumber.toString() === dayId);
    if (currentDay) {
      saveGuestDay({ ...currentDay, ...patch });
    }
    return; 
  }
 
 const updatePayload: any = {};
 if (patch.status !== undefined) updatePayload.status = patch.status;
 if (patch.notes !== undefined) updatePayload.notes = patch.notes;
 if (patch.revisionNotes !== undefined) updatePayload.revision_notes = patch.revisionNotes;
 if (patch.problems !== undefined) updatePayload.problems = patch.problems;
 if (patch.checklist !== undefined) updatePayload.checklist = patch.checklist;

 if (Object.keys(updatePayload).length > 0) {
 // Add user_id filter so a day update can never affect another user's rows
 await supabase.from("study_days").update(updatePayload).eq("id", dayId).eq("user_id", uid);
 }
}

export async function deleteTopicNotes(uid: string, dayId: string) {
 await saveDayProgress(uid, dayId, { notes: "" });
}

export async function recordCodeSubmission(uid: string, p: { name: string; platform: string; difficulty: string; link: string; code?: string; submissionLink?: string; keyPoints?: string }, dateIso: string) {
 if (isGuestUser(uid)) { saveGuestCodeSubmission(p.name, p as CodeSubmission); return; }
 
 const profile = await loadOwnerProfile(uid);
 const existing = profile.completedProblems || [];
 
 const snapshot: CompletedProblemSnapshot = {
 ...p,
 completedAt: new Date().toISOString(),
 submittedAt: dateIso,
 };
 
 // Update logic to remove old duplicates
 const filtered = existing.filter(ex => !(ex.name === p.name && ex.platform === p.platform));
 filtered.push(snapshot);
 
 await saveUserProfile(uid, { completedProblems: filtered });
}

export async function removeCodeSubmission(uid: string, p: { name: string; platform: string }) {
 if (isGuestUser(uid)) { removeGuestCodeSubmission(p.name); return; }
 
 const profile = await loadOwnerProfile(uid);
 const existing = profile.completedProblems || [];
 const filtered = existing.filter(ex => !(ex.name === p.name && ex.platform === p.platform));
 
 await saveUserProfile(uid, { completedProblems: filtered });
}

export async function getCompletedProblems(uid: string): Promise<CompletedProblemSnapshot[]> {
 if (isGuestUser(uid)) return Array.from(getGuestProblemCompletions()).map(p => typeof p === 'string' ? { name: p, platform: 'Unknown', difficulty: 'Unknown', link: '' } : p) as any;
 const p = await loadOwnerProfile(uid);
 return p.completedProblems || [];
}

export async function saveRevisionEvent(uid: string, kind: string, detail: string, snapshot?: string) {
 if (isGuestUser(uid)) return;
 await supabase.from("revision_events").insert({
 user_id: uid,
 kind,
 detail,
 snapshot,
 });
}

export async function listEvents(uid: string) {
 if (isGuestUser(uid)) return getGuestScheduleEvents();
 const { data } = await supabase.from("revision_events").select("*").eq("user_id", uid).order("created_at", { ascending: false });
 const now = Date.now();
 return (data || []).map(row => {
 const isWithinWeek = now - new Date(row.created_at).getTime() < 7 * 86400000;
 return {
 id: row.id,
 date: row.created_at,
 kind: row.kind,
 detail: row.detail,
 snapshot: row.snapshot,
 canRevert: !!row.snapshot && isWithinWeek,
 isWithinWeek,
 };
 });
}

export async function getPushSubscriptions(uid: string) {
 const { data } = await supabase.from("push_subscriptions").select("token").eq("user_id", uid);
 return (data || []).map(r => r.token);
}

export async function savePushSubscription(uid: string, token: string, info: string) {
 await supabase.from("push_subscriptions").upsert({ token, user_id: uid, device_info: info });
}

export async function clearPushSubscriptions(uid: string) {
 await supabase.from("push_subscriptions").delete().eq("user_id", uid);
}

export async function removePushSubscription(uid: string, token: string) {
 await supabase.from("push_subscriptions").delete().eq("user_id", uid).eq("token", token);
}

export async function clearAccountData(uid: string) {
 // Rely on ON DELETE CASCADE from profiles table
 // Admin auth delete will wipe everything
}

export async function syncPublicSolvedProblems(uid: string, snapshot: CompletedProblemSnapshot[]) {
 await saveUserProfile(uid, { completedProblems: snapshot });
}

// Ensure base64 avatars/banners are stored natively since Firebase Storage is replaced
export async function saveAvatarBase64(uid: string, b64: string): Promise<string> {
  let publicUrl = b64;
  if (!isGuestUser(uid) && b64.startsWith('data:image')) {
    try {
      const res = await fetch(b64);
      const blob = await res.blob();
      const ext = blob.type.split('/')[1] || 'png';
      const filePath = `${uid}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('avatars').upload(filePath, blob, { upsert: true, contentType: blob.type });
      if (!error) {
        publicUrl = supabase.storage.from('avatars').getPublicUrl(filePath).data.publicUrl;
      } else {
        console.error('Avatar storage upload failed:', error);
      }
    } catch (e) {
      console.error('Avatar upload error:', e);
    }
  }

  await saveUserProfile(uid, { photoURL: publicUrl });
  if (!isGuestUser(uid)) {
    // Update auth metadata so UserMenu instantly reflects the change (only if it's a real URL)
    if (!publicUrl.startsWith('data:image')) {
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl, photoURL: publicUrl } });
    }
  }
  return publicUrl;
}

export async function saveBannerBase64(uid: string, b64: string): Promise<string> {
  let publicUrl = b64;
  if (!isGuestUser(uid) && b64.startsWith('data:image')) {
    try {
      const res = await fetch(b64);
      const blob = await res.blob();
      const ext = blob.type.split('/')[1] || 'png';
      const filePath = `${uid}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('banners').upload(filePath, blob, { upsert: true, contentType: blob.type });
      if (!error) {
        publicUrl = supabase.storage.from('banners').getPublicUrl(filePath).data.publicUrl;
      } else {
        console.error('Banner storage upload failed:', error);
      }
    } catch (e) {
      console.error('Banner upload error:', e);
    }
  }

  await saveUserProfile(uid, { bannerURL: publicUrl });
  return publicUrl;
}

export async function saveSequence(userId: string, days: Day[]) {
 if (isGuestUser(userId)) {
 saveGuestPlan(days);
 return;
 }
 await deleteAllDays(userId);
 await writeAllDays(userId, days);
}

export async function switchUserSheet(userId: string, sheetId: string, startDate?: string): Promise<{ days: Day[]; meta: PlanMeta }> {
 if (isGuestUser(userId)) return seedPlan(userId, startDate, undefined, sheetId);
 const settings = await loadSettings(userId);
 await supabase.from("user_settings").upsert({ user_id: userId, active_sheet: sheetId }, { onConflict: "user_id" });
 const { data: current } = await supabase.from("user_settings").select("start_date").eq("user_id", userId).single();
 return seedPlan(userId, startDate || current?.start_date, settings.counts, sheetId);
}

// Aliases to avoid breaking existing imports
export const loadProblemCompletions = getCompletedProblems;
export const saveCodeSubmission = recordCodeSubmission;
export const saveDay = saveDayProgress;
export const loadCodeSubmissions = async (uid: string) => {
 // Backwards compatibility, map completedProblems to code submissions
 const problems = await getCompletedProblems(uid);
 return problems.filter(p => p.code).map(p => ({
 name: p.name,
 platform: p.platform,
 code: p.code,
 submittedAt: p.submittedAt || p.completedAt,
 submissionLink: p.submissionLink,
 keyPoints: p.keyPoints,
 }));
};
export type CodeSubmission = any;
export const deleteAccountData = clearAccountData;
export const logEvent = saveRevisionEvent;

export interface ScheduleEventRow {
 id: string;
 date: string;
 kind: string;
 detail: string;
 snapshot?: string;
 canRevert?: boolean;
 isWithinWeek?: boolean;
}

export function parseDaySnapshot(json?: string): Day[] | null {
 if (!json) return null;
 try {
 return JSON.parse(json) as Day[];
 } catch {
 return null;
 }
}

export async function hasExistingPlan(userId: string): Promise<boolean> {
 if (isGuestUser(userId)) return true;
 const { count } = await supabase.from("study_days").select("*", { count: "exact", head: true }).eq("user_id", userId);
 return (count || 0) > 0;
}

/**
 * Check if a user has completed onboarding by reading the persistent
 * `onboarding_completed` flag from user_settings in Supabase.
 * Falls back to checking whether study_days exist (for users who
 * onboarded before this column was added).
 */
export async function isOnboardingCompleted(userId: string): Promise<boolean> {
 if (isGuestUser(userId)) return true;

 // 1. Check the explicit flag in user_settings
 const { data, error } = await supabase
   .from("user_settings")
   .select("onboarding_completed")
   .eq("user_id", userId)
   .maybeSingle();

 if (!error && data) {
   if (data.onboarding_completed === true) return true;
 }

 // 2. Fallback: check if study_days rows exist (backwards compat)
 const hasPlan = await hasExistingPlan(userId);
 if (hasPlan) {
   // Backfill the flag so future checks are fast
   await supabase
     .from("user_settings")
     .upsert({ user_id: userId, onboarding_completed: true }, { onConflict: "user_id" });
 }
 return hasPlan;
}

/**
 * Mark onboarding as completed in Supabase. This is the source of truth
 * that works across all devices. localStorage is only a fast-path cache.
 */
export async function markOnboardingCompleted(userId: string): Promise<void> {
 if (isGuestUser(userId)) return;
 await supabase
   .from("user_settings")
   .upsert({ user_id: userId, onboarding_completed: true }, { onConflict: "user_id" });
}

export async function changeStartDate(userId: string, newStartDate: string) {
 if (!/^\d{4}-\d{2}-\d{2}$/.test(newStartDate)) {
  throw new Error("Invalid plan start date.");
 }
 if (isGuestUser(userId)) return seedPlan(userId, newStartDate);

 // Rebuild study_days as well as metadata; changing only start_date leaves the
 // existing schedule on its old dates.
 const settings = await loadSettings(userId);
 return seedPlan(userId, newStartDate, settings.counts, settings.activeSheet);
}

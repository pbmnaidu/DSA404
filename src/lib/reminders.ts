import { createClient } from "@/integrations/supabase/client";
import { isGuestUser } from "@/lib/guest-data";

export interface TopicReminder {
 id: string;
 topic: string;
 date: string; // YYYY-MM-DD
 time: string; // HH:MM
 note?: string;
 createdAt: number;
 triggered?: boolean;
}

const LOCAL_STORAGE_KEY = "dsa:topic_reminders";

// ─── Supabase helpers ─────────────────────────────────────────────────────────

async function getSupabaseUser() {
 if (typeof window === "undefined") return null;
 try {
 const supabase = createClient();
 const { data: { user } } = await supabase.auth.getUser();
 return user;
 } catch {
 return null;
 }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch all topic reminders for the current user.
 * Tries Supabase first (cross-device), falls back to localStorage.
 */
export async function fetchTopicReminders(uid?: string | null): Promise<TopicReminder[]> {
 // Guests / unauthenticated: use localStorage only
 if (!uid || isGuestUser(uid)) {
 return _getLocal();
 }

 try {
 const supabase = createClient();
 const { data, error } = await supabase
 .from("user_reminders")
 .select("*")
 .eq("user_id", uid)
 .order("created_at", { ascending: true });

 if (error) throw error;

 const reminders: TopicReminder[] = (data || []).map((row: any) => ({
 id: row.id,
 topic: row.topic,
 date: row.date,
 time: row.time,
 note: row.note || undefined,
 createdAt: new Date(row.created_at).getTime(),
 triggered: row.triggered ?? false,
 }));

 // Keep localStorage in sync for offline fallback
 _saveLocal(reminders);
 return reminders;
 } catch {
 // Supabase unavailable — fall back to localStorage
 return _getLocal();
 }
}

/**
 * Add a new topic reminder for the current user.
 * Persists to Supabase (cross-device) and localStorage.
 */
export async function addTopicReminder(
 uid: string | undefined | null,
 reminder: Omit<TopicReminder, "id" | "createdAt" | "triggered">
): Promise<TopicReminder> {
 const newId = `rem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
 const item: TopicReminder = {
 ...reminder,
 id: newId,
 createdAt: Date.now(),
 triggered: false,
 };

 if (uid && !isGuestUser(uid)) {
 try {
 const supabase = createClient();
 const { error } = await supabase.from("user_reminders").insert({
 id: newId,
 user_id: uid,
 topic: reminder.topic,
 date: reminder.date,
 time: reminder.time,
 note: reminder.note || null,
 triggered: false,
 });
 if (error) throw error;
 } catch (e) {
 console.warn("[reminders] Failed to save to Supabase, using localStorage only:", e);
 }
 }

 // Always mirror to localStorage for offline/fast access
 if (typeof window !== "undefined") {
 const list = _getLocal();
 _saveLocal([...list, item]);
 }

 return item;
}

/**
 * Remove a topic reminder by id.
 */
export async function removeTopicReminder(uid: string | undefined | null, id: string): Promise<void> {
 if (uid && !isGuestUser(uid)) {
 try {
 const supabase = createClient();
 await supabase.from("user_reminders").delete().eq("id", id).eq("user_id", uid);
 } catch (e) {
 console.warn("[reminders] Failed to delete from Supabase:", e);
 }
 }

 if (typeof window !== "undefined") {
 const list = _getLocal();
 _saveLocal(list.filter((r) => r.id !== id));
 }
}

/**
 * Mark a reminder as triggered (sent) so it won't fire again.
 */
export async function markTopicReminderTriggered(uid: string | undefined | null, id: string): Promise<void> {
 if (uid && !isGuestUser(uid)) {
 try {
 const supabase = createClient();
 await supabase.from("user_reminders").update({ triggered: true }).eq("id", id).eq("user_id", uid);
 } catch (e) {
 console.warn("[reminders] Failed to mark triggered in Supabase:", e);
 }
 }

 if (typeof window !== "undefined") {
 const list = _getLocal();
 _saveLocal(list.map((r) => (r.id === id ? { ...r, triggered: true } : r)));
 }
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

function _getLocal(): TopicReminder[] {
 if (typeof window === "undefined") return [];
 try {
 const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
 return raw ? JSON.parse(raw) : [];
 } catch {
 return [];
 }
}

function _saveLocal(items: TopicReminder[]): void {
 if (typeof window === "undefined") return;
 try {
 localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
 } catch {}
}

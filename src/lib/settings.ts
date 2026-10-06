import { createClient } from "@/integrations/supabase/client";
import { DEFAULT_DAILY_COUNTS, type DailyCounts, normalizeDailyCounts } from "./plan";
import { isGuestUser, getGuestSettings, saveGuestSettings } from "./guest-data";

export type ThemeMode = "light" | "dark" | "system";

export interface ThemeColors {
 background: string;
 foreground: string;
 primary: string;
 card: string;
 muted: string;
 border: string;
}

export interface ThemeCustom {
 light: ThemeColors;
 dark: ThemeColors;
}

export interface ThemeCustomizerData {
 colors: ThemeCustom;
 preset: string | null;
}

export interface UserSettings {
 theme: ThemeMode;
 themeCustom?: ThemeCustomizerData | null;
 themeFont?: string;
 themeFontSize?: string;
 themeForceView?: string;
 counts: DailyCounts;
 pushEnabled: boolean;
 emailEnabled: boolean;
 reminderTime: string; // HH:MM (Evening)
 morningReminderEnabled: boolean;
 morningReminderTime: string; // HH:MM
 contestReminderEnabled: boolean;
 timezone: string;
 paused: boolean;
 pausedFrom: string | null;
 pausedDays: number;
 resumeDate: string | null;
 activeSheet: string;
}

export const DEFAULT_SETTINGS: UserSettings = {
 theme: "light",
 themeCustom: null,
 themeFont: "'Inter', sans-serif",
 themeFontSize: "auto",
 themeForceView: "auto",
 counts: DEFAULT_DAILY_COUNTS,
 pushEnabled: false,
 emailEnabled: false,
 reminderTime: "19:00",
 morningReminderEnabled: false,
 morningReminderTime: "08:00",
 contestReminderEnabled: false,
 timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC",
 paused: false,
 pausedFrom: null,
 pausedDays: 0,
 resumeDate: null,
 activeSheet: "core404",
};

export type Fields = {
 theme?: string;
 themeCustom?: ThemeCustomizerData | string | null;
 themeFont?: string;
 themeFontSize?: string;
 themeForceView?: string;
 dailyTarget?: number;
 paceTier?: string;
 easyPerDay?: number;
 mediumPerDay?: number;
 hardPerDay?: number;
 pushEnabled?: boolean;
 emailEnabled?: boolean;
 reminderTime?: string;
 morningReminderEnabled?: boolean;
 morningReminderTime?: string;
 contestReminderEnabled?: boolean;
 timezone?: string;
 paused?: boolean;
 pausedFrom?: string | null;
 pausedDays?: number;
 resumeDate?: string | null;
 activeSheet?: string;
};

export const fieldsToSettings = (f: Fields): UserSettings => {
 const normCounts = normalizeDailyCounts({
 target: f.dailyTarget,
 tier: f.paceTier as any,
 easy: f.easyPerDay,
 medium: f.mediumPerDay,
 hard: f.hardPerDay,
 });

 let parsedThemeCustom: ThemeCustomizerData | null = null;
 if (f.themeCustom) {
 if (typeof f.themeCustom === "string") {
 try {
 parsedThemeCustom = JSON.parse(f.themeCustom);
 } catch {}
 } else if (typeof f.themeCustom === "object") {
 parsedThemeCustom = f.themeCustom as ThemeCustomizerData;
 }
 }

 return {
 theme: (f.theme as ThemeMode) ?? "light",
 themeCustom: parsedThemeCustom,
 themeFont: f.themeFont || undefined,
 themeFontSize: f.themeFontSize || undefined,
 themeForceView: f.themeForceView || undefined,
 counts: normCounts,
 pushEnabled: Boolean(f.pushEnabled),
 emailEnabled: Boolean(f.emailEnabled),
 reminderTime: (f.reminderTime ?? "19:00").slice(0, 5),
 morningReminderEnabled: Boolean(f.morningReminderEnabled),
 morningReminderTime: (f.morningReminderTime ?? "08:00").slice(0, 5),
 contestReminderEnabled: Boolean(f.contestReminderEnabled),
 timezone: f.timezone || DEFAULT_SETTINGS.timezone,
 paused: Boolean(f.paused),
 pausedFrom: f.pausedFrom ?? null,
 pausedDays: f.pausedDays ?? 0,
 resumeDate: f.resumeDate ?? null,
 activeSheet: f.activeSheet || "core404",
 };
};

export const settingsToFields = (s: Partial<UserSettings>): Fields => {
 const fields: Fields = {};
 if (s.theme !== undefined) fields.theme = s.theme;
 if (s.themeCustom !== undefined) fields.themeCustom = s.themeCustom;
 if (s.themeFont !== undefined) fields.themeFont = s.themeFont;
 if (s.themeFontSize !== undefined) fields.themeFontSize = s.themeFontSize;
 if (s.themeForceView !== undefined) fields.themeForceView = s.themeForceView;
 if (s.counts !== undefined) {
 const norm = normalizeDailyCounts(s.counts);
 fields.dailyTarget = norm.target;
 fields.paceTier = norm.tier;
 fields.easyPerDay = norm.easy;
 fields.mediumPerDay = norm.medium;
 fields.hardPerDay = norm.hard;
 }
 if (s.pushEnabled !== undefined) fields.pushEnabled = s.pushEnabled;
 if (s.emailEnabled !== undefined) fields.emailEnabled = s.emailEnabled;
 if (s.reminderTime !== undefined) fields.reminderTime = s.reminderTime || "19:00";
 if (s.morningReminderEnabled !== undefined) fields.morningReminderEnabled = s.morningReminderEnabled;
 if (s.morningReminderTime !== undefined) fields.morningReminderTime = s.morningReminderTime || "08:00";
 if (s.contestReminderEnabled !== undefined) fields.contestReminderEnabled = s.contestReminderEnabled;
 if (s.timezone !== undefined) fields.timezone = s.timezone;
 if (s.paused !== undefined) fields.paused = s.paused;
 if (s.pausedFrom !== undefined) fields.pausedFrom = s.pausedFrom;
 if (s.pausedDays !== undefined) fields.pausedDays = s.pausedDays;
 if (s.resumeDate !== undefined) fields.resumeDate = s.resumeDate;
 if (s.activeSheet !== undefined) fields.activeSheet = s.activeSheet;
 return fields;
};

export async function loadSettings(userId: string): Promise<UserSettings> {
 if (isGuestUser(userId)) {
 return getGuestSettings();
 }
 const supabase = createClient();
 const { data } = await supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle();
 
 if (!data) {
 const seeded = { ...DEFAULT_SETTINGS };
 const { error } = await supabase.from("user_settings").upsert({
 user_id: userId,
 theme: seeded.theme,
 counts: seeded.counts,
 push_enabled: seeded.pushEnabled,
 email_enabled: seeded.emailEnabled,
 reminder_time: seeded.reminderTime,
 timezone: seeded.timezone,
 paused: seeded.paused,
 active_sheet: seeded.activeSheet,
 }, { onConflict: "user_id" });
 if (error) {
   console.warn("[settings] Could not seed default settings:", error);
 }
 return seeded;
 }

 // Map Supabase snake_case columns to our Fields structure.
 // Spread data last so any direct column names (morningReminderEnabled etc.) win.
 const raw: Fields = {
 theme: data.theme,
 themeCustom: data.theme_custom,
 themeFont: data.theme_font,
 themeFontSize: data.theme_font_size,
 themeForceView: data.theme_force_view,
 pushEnabled: data.push_enabled,
 emailEnabled: data.email_enabled,
 reminderTime: data.reminder_time,
 morningReminderEnabled: data.morning_reminder_enabled ?? false,
 morningReminderTime: data.morning_reminder_time ?? "08:00",
 contestReminderEnabled: data.contest_reminder_enabled ?? false,
 timezone: data.timezone,
 paused: data.paused,
 activeSheet: data.active_sheet,
  };
  if (data.counts) {
    const c = typeof data.counts === "string" ? JSON.parse(data.counts) : data.counts;
    raw.dailyTarget = c.target ?? c.dailyTarget;
    raw.paceTier = c.tier ?? c.paceTier;
    raw.easyPerDay = c.easy ?? c.easyPerDay;
    raw.mediumPerDay = c.medium ?? c.mediumPerDay;
    raw.hardPerDay = c.hard ?? c.hardPerDay;
  }

 if (!raw.timezone) {
 const detectedTz =
 typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";
 await supabase.from("user_settings").update({ timezone: detectedTz }).eq("user_id", userId);
 raw.timezone = detectedTz;
 }

 return fieldsToSettings(raw);
}

export async function saveSettings(userId: string, patch: Partial<UserSettings>) {
 if (isGuestUser(userId)) {
 saveGuestSettings(patch);
 return;
 }
 const supabase = createClient();
 const fields = settingsToFields(patch);
 
 const updatePayload: any = {};
 if (fields.theme !== undefined) updatePayload.theme = fields.theme;
 if (fields.themeCustom !== undefined) updatePayload.theme_custom = fields.themeCustom;
 if (fields.themeFont !== undefined) updatePayload.theme_font = fields.themeFont;
 if (fields.themeFontSize !== undefined) updatePayload.theme_font_size = fields.themeFontSize;
 if (fields.themeForceView !== undefined) updatePayload.theme_force_view = fields.themeForceView;
 if (fields.pushEnabled !== undefined) updatePayload.push_enabled = fields.pushEnabled;
 if (fields.emailEnabled !== undefined) updatePayload.email_enabled = fields.emailEnabled;
 if (fields.reminderTime !== undefined) updatePayload.reminder_time = fields.reminderTime;
 // Morning & contest reminders — persist to DB so cron job can read them
 if (fields.morningReminderEnabled !== undefined) updatePayload.morning_reminder_enabled = fields.morningReminderEnabled;
 if (fields.morningReminderTime !== undefined) updatePayload.morning_reminder_time = fields.morningReminderTime;
 if (fields.contestReminderEnabled !== undefined) updatePayload.contest_reminder_enabled = fields.contestReminderEnabled;
 if (fields.timezone !== undefined) updatePayload.timezone = fields.timezone;
 if (fields.paused !== undefined) updatePayload.paused = fields.paused;
 if (fields.activeSheet !== undefined) updatePayload.active_sheet = fields.activeSheet;
 if (patch.counts !== undefined) updatePayload.counts = patch.counts;

 if (Object.keys(updatePayload).length > 0) {
 updatePayload.user_id = userId;
 const { error } = await supabase.from("user_settings").upsert(updatePayload, { onConflict: "user_id" });
 if (error) throw error;
 }
}

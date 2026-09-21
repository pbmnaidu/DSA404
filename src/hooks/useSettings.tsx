"use client";

/** NEW FILE — Upgrade 2/5: settings context (theme, pace, reminders, pause). */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { onSnapshot } from "firebase/firestore";
import { settingsDoc } from "@/lib/db";
import {
  DEFAULT_SETTINGS,
  fieldsToSettings,
  loadSettings,
  saveSettings,
  type Fields,
  type ThemeMode,
  type UserSettings,
} from "@/lib/settings";

export const THEME_MODE_STORAGE_KEY = "dsa-theme-mode";

interface SettingsCtx {
  settings: UserSettings;
  loading: boolean;
  update: (patch: Partial<UserSettings>) => Promise<void>;
  userId: string;
}

const Ctx = createContext<SettingsCtx | null>(null);

export function SettingsProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(THEME_MODE_STORAGE_KEY) as ThemeMode | null;
        if (cached && ["light", "dark", "system"].includes(cached)) {
          return { ...DEFAULT_SETTINGS, theme: cached };
        }
      } catch {}
    }
    return DEFAULT_SETTINGS;
  });
  const [loading, setLoading] = useState(true);

  // Subscribe to real-time Firestore updates on user settings
  useEffect(() => {
    if (!userId) return;
    let alive = true;

    const ref = settingsDoc(userId);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (!alive) return;
        if (snap.exists()) {
          const raw = snap.data() as Fields;
          const s = fieldsToSettings(raw);
          setSettings(s);
          setLoading(false);
          if (s.theme) {
            try {
              localStorage.setItem(THEME_MODE_STORAGE_KEY, s.theme);
            } catch {}
          }
        } else {
          void loadSettings(userId)
            .then((s) => {
              if (alive) {
                setSettings(s);
                setLoading(false);
              }
            })
            .catch(() => {
              if (alive) setLoading(false);
            });
        }
      },
      (error) => {
        console.warn("[useSettings] onSnapshot error, falling back to loadSettings:", error);
        void loadSettings(userId)
          .then((s) => {
            if (alive) {
              setSettings(s);
              setLoading(false);
            }
          })
          .catch(() => {
            if (alive) setLoading(false);
          });
      }
    );

    // Also sync across tabs via local storage event
    const handleStorage = (e: StorageEvent) => {
      if (e.key === THEME_MODE_STORAGE_KEY && e.newValue) {
        const val = e.newValue as ThemeMode;
        if (["light", "dark", "system"].includes(val)) {
          setSettings((prev) => (prev.theme === val ? prev : { ...prev, theme: val }));
        }
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      alive = false;
      unsubscribe();
      window.removeEventListener("storage", handleStorage);
    };
  }, [userId]);

  const update = useCallback(
    async (patch: Partial<UserSettings>) => {
      if (patch.theme) {
        try {
          localStorage.setItem(THEME_MODE_STORAGE_KEY, patch.theme);
        } catch {}
      }
      setSettings((prev) => ({ ...prev, ...patch }));
      try {
        await saveSettings(userId, patch);
      } catch (e) {
        toast.error("Could not save your settings", {
          description: e instanceof Error ? e.message : "Please try again.",
        });
      }
    },
    [userId],
  );

  // Apply the theme to <html> as soon as it is known (and on every change).
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const media =
      typeof window !== "undefined" && window.matchMedia
        ? window.matchMedia("(prefers-color-scheme: light)")
        : null;

    const apply = () => {
      const prefersLight = media ? media.matches : false;
      const light = settings.theme === "light" || (settings.theme === "system" && prefersLight);
      root.classList.toggle("light", light);
      root.classList.toggle("dark", !light);
      root.style.colorScheme = light ? "light" : "dark";
    };

    apply();

    if (media && settings.theme === "system") {
      media.addEventListener("change", apply);
      return () => media.removeEventListener("change", apply);
    }
  }, [settings.theme]);

  const value = useMemo(
    () => ({ settings, loading, update, userId }),
    [settings, loading, update, userId],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSettings = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
};

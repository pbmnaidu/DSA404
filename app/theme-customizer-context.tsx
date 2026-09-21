"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { auth, db } from "@/integrations/firebase/client";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot, setDoc, type DocumentSnapshot } from "firebase/firestore";

// ─── Types ──────────────────────────────────────────────────────────────────

export type ColorMode = "light" | "dark";

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

// ─── Presets ─────────────────────────────────────────────────────────────────

export const PRESETS: Record<string, { label: string; emoji: string; colors: ThemeCustom }> = {
  gold: {
    label: "Parchment & Gold",
    emoji: "🏆",
    colors: {
      light: {
        background: "#f5ede0",
        foreground: "#2d1e10",
        primary: "#c48a2f",
        card: "#fdf7f0",
        muted: "#e8d9c5",
        border: "#c9ae8a",
      },
      dark: {
        background: "#16110c",
        foreground: "#f0e6d3",
        primary: "#e8a832",
        card: "#241a10",
        muted: "#3a2a18",
        border: "#4a3520",
      },
    },
  },
  default: {
    label: "Ocean Blue",
    emoji: "🌊",
    colors: {
      light: {
        background: "#e8f4fd",
        foreground: "#0d2d4a",
        primary: "#0077cc",
        card: "#f5faff",
        muted: "#cce5f6",
        border: "#90c8ee",
      },
      dark: {
        background: "#060f1a",
        foreground: "#c8e8ff",
        primary: "#38a8f5",
        card: "#0c1e30",
        muted: "#122b40",
        border: "#1a3d58",
      },
    },
  },
  forest: {
    label: "Forest Green",
    emoji: "🌿",
    colors: {
      light: {
        background: "#e8f5e9",
        foreground: "#1a3320",
        primary: "#2e7d32",
        card: "#f4fbf4",
        muted: "#c8e6c9",
        border: "#88c98c",
      },
      dark: {
        background: "#060f08",
        foreground: "#c8f0cc",
        primary: "#4caf50",
        card: "#0c1e0e",
        muted: "#122814",
        border: "#1a3a1e",
      },
    },
  },
  rose: {
    label: "Rose Pink",
    emoji: "🌸",
    colors: {
      light: {
        background: "#fde8f0",
        foreground: "#4a0d25",
        primary: "#cc2255",
        card: "#fff5f8",
        muted: "#f5c8d8",
        border: "#e890aa",
      },
      dark: {
        background: "#180608",
        foreground: "#ffd0e0",
        primary: "#f05080",
        card: "#2a0c12",
        muted: "#3a1018",
        border: "#4a1822",
      },
    },
  },
  slate: {
    label: "Slate Minimal",
    emoji: "🪨",
    colors: {
      light: {
        background: "#f1f5f9",
        foreground: "#0f172a",
        primary: "#3b82f6",
        card: "#ffffff",
        muted: "#e2e8f0",
        border: "#cbd5e1",
      },
      dark: {
        background: "#0f172a",
        foreground: "#f1f5f9",
        primary: "#60a5fa",
        card: "#1e293b",
        muted: "#334155",
        border: "#475569",
      },
    },
  },
  violet: {
    label: "Violet Night",
    emoji: "🔮",
    colors: {
      light: {
        background: "#f0ebff",
        foreground: "#1e0a3c",
        primary: "#7c3aed",
        card: "#faf8ff",
        muted: "#ddd6fe",
        border: "#b9a8f5",
      },
      dark: {
        background: "#0a0614",
        foreground: "#e8d8ff",
        primary: "#a855f7",
        card: "#16082a",
        muted: "#220d38",
        border: "#2e1248",
      },
    },
  },
};

// ─── Hex → oklch helpers (approximation via RGB) ─────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToOklch(r: number, g: number, b: number): string {
  // Linearize
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const lr = lin(r), lg = lin(g), lb = lin(b);

  // D65 to XYZ
  const x = 0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb;
  const y = 0.2126729 * lr + 0.7151522 * lg + 0.0721750 * lb;
  const z = 0.0193339 * lr + 0.1191920 * lg + 0.9503041 * lb;

  // XYZ to OKLab (via LMS)
  const lc = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z);
  const mc = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z);
  const sc = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.6338517070 * z);

  const L = 0.2104542553 * lc + 0.7936177850 * mc - 0.0040720468 * sc;
  const a = 1.9779984951 * lc - 2.4285922050 * mc + 0.4505937099 * sc;
  const bk = 0.0259040371 * lc + 0.7827717662 * mc - 0.8086757660 * sc;

  const C = Math.sqrt(a * a + bk * bk);
  const H = Math.atan2(bk, a) * (180 / Math.PI);
  const hue = H < 0 ? H + 360 : H;

  return `oklch(${L.toFixed(3)} ${C.toFixed(4)} ${hue.toFixed(1)})`;
}

function hexToOklch(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToOklch(r, g, b);
}

// ─── Derive full CSS vars from 6 key colors ──────────────────────────────────

function buildCssVars(colors: ThemeColors, mode: ColorMode): Record<string, string> {
  const bg = hexToOklch(colors.background);
  const fg = hexToOklch(colors.foreground);
  const pr = hexToOklch(colors.primary);
  const cd = hexToOklch(colors.card);
  const mt = hexToOklch(colors.muted);
  const bd = hexToOklch(colors.border);

  const prFg = mode === "dark"
    ? hexToOklch(colors.foreground)    // on dark, primary text is dark bg
    : "oklch(0.98 0.008 85)";

  return {
    "--background": bg,
    "--foreground": fg,
    "--card": cd,
    "--card-foreground": fg,
    "--popover": cd,
    "--popover-foreground": fg,
    "--primary": pr,
    "--primary-foreground": prFg,
    "--secondary": mt,
    "--secondary-foreground": fg,
    "--muted": mt,
    "--muted-foreground": mode === "dark"
      ? `oklch(from ${fg} calc(l * 0.7) c h)`
      : `oklch(from ${fg} calc(l * 1.6) c h)`,
    "--accent": mt,
    "--accent-foreground": fg,
    "--border": bd,
    "--input": bd,
    "--ring": pr,
    "--sidebar": cd,
    "--sidebar-foreground": fg,
    "--sidebar-primary": pr,
    "--sidebar-primary-foreground": prFg,
    "--sidebar-accent": mt,
    "--sidebar-accent-foreground": fg,
    "--sidebar-border": bd,
    "--sidebar-ring": pr,
  };
}

export { buildCssVars, hexToOklch };

// ─── Storage Keys & Types ───────────────────────────────────────────────────

export const THEME_CUSTOM_STORAGE_KEY = "dsa-tracker-theme-custom";
export const FONT_STORAGE_KEY = "dsa-tracker-font";
export const SIZE_STORAGE_KEY = "dsa-tracker-font-size";
export const VIEW_STORAGE_KEY = "dsa-tracker-force-view";
const STORAGE_KEY = THEME_CUSTOM_STORAGE_KEY;

export type ForceView = "auto" | "desktop" | "mobile";

export function applyFontToDocument(font: string) {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty("--font-sans", font);
  const name = font.split("'")[1];
  if (name && name !== "Inter" && name !== "Geist") {
    const id = `gf-${name.replace(/\s/g, "")}`;
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}:wght@400;500;600;700;900&display=swap`;
      document.head.appendChild(link);
    }
  }
  document.documentElement.style.fontFamily = font;
}

export function applySizeToDocument(size: string) {
  if (typeof document === "undefined") return;
  if (!size || size === "auto") {
    document.documentElement.style.fontSize = "";
  } else {
    document.documentElement.style.fontSize = size;
  }
}

export function applyViewModeToDocument(mode: ForceView) {
  if (typeof document === "undefined") return;
  const meta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
  if (!meta) return;
  if (mode === "desktop") {
    meta.content = "width=1280";
  } else if (mode === "mobile") {
    meta.content = "width=device-width, initial-scale=1, maximum-scale=1";
  } else {
    meta.content = "width=device-width, initial-scale=1";
  }
}

export type ThemeMode = "light" | "dark" | "system";

export function applyThemeModeToDocument(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const media =
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: light)")
      : null;
  const prefersLight = media ? media.matches : false;
  const isLight = mode === "light" || (mode === "system" && prefersLight);
  root.classList.toggle("light", isLight);
  root.classList.toggle("dark", !isLight);
  root.style.colorScheme = isLight ? "light" : "dark";
}

export interface ThemeCustomizerCtx {
  themeMode: ThemeMode;
  colors: ThemeCustom;
  activePreset: string | null;
  font: string;
  fontSize: string;
  forceView: ForceView;
  applyThemeMode: (mode: ThemeMode) => void;
  applyPreset: (key: string) => void;
  updateColor: (mode: ColorMode, key: keyof ThemeColors, value: string) => void;
  applyFont: (font: string) => void;
  applySize: (size: string) => void;
  applyView: (mode: ForceView) => void;
  resetToDefault: () => void;
  panelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
}

const Ctx = createContext<ThemeCustomizerCtx | null>(null);

export function ThemeCustomizerProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("dsa-theme-mode") as ThemeMode | null;
        if (saved && ["light", "dark", "system"].includes(saved)) return saved;
      } catch {}
    }
    return "light";
  });
  const [colors, setColors] = useState<ThemeCustom>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(THEME_CUSTOM_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as { colors: ThemeCustom; preset: string | null };
          if (parsed?.colors) return parsed.colors;
        }
      } catch {}
    }
    return PRESETS.default.colors;
  });

  const [activePreset, setActivePreset] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(THEME_CUSTOM_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as { colors: ThemeCustom; preset: string | null };
          if (parsed?.preset !== undefined) return parsed.preset;
        }
      } catch {}
    }
    return "default";
  });

  const [font, setFont] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(FONT_STORAGE_KEY);
        if (saved) return saved;
      } catch {}
    }
    return "'Inter', sans-serif";
  });

  const [fontSize, setFontSize] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(SIZE_STORAGE_KEY);
        if (saved) return saved;
      } catch {}
    }
    return "auto";
  });

  const [forceView, setForceView] = useState<ForceView>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(VIEW_STORAGE_KEY) as ForceView | null;
        if (saved) return saved;
      } catch {}
    }
    return "auto";
  });

  const [userId, setUserId] = useState<string | null>(() => auth?.currentUser?.uid ?? null);
  const [panelOpen, setPanelOpen] = useState(false);
  const openPanel = useCallback(() => setPanelOpen(true), []);
  const closePanel = useCallback(() => setPanelOpen(false), []);

  // Track authenticated user for Firestore sync
  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u: User | null) => {
      setUserId(u?.uid ?? null);
    });
    return () => unsub();
  }, []);

  // Apply initial theme, font, size, view to document
  useEffect(() => {
    applyThemeModeToDocument(themeMode);
    applyFontToDocument(font);
    applySizeToDocument(fontSize);
    applyViewModeToDocument(forceView);
  }, []);

  // Subscribe to real-time Firestore updates on user's theme settings
  useEffect(() => {
    if (!userId || !db) return;
    let alive = true;

    const ref = doc(db, "users", userId, "settings", "prefs");
    const unsub = onSnapshot(
      ref,
      (snap: DocumentSnapshot) => {
        if (!alive || !snap.exists()) return;
        const data = snap.data();

        // 1. Theme Mode (Light / Dark / System)
        if (data.theme && typeof data.theme === "string") {
          const m = data.theme as ThemeMode;
          if (["light", "dark", "system"].includes(m)) {
            setThemeMode(m);
            applyThemeModeToDocument(m);
            try {
              localStorage.setItem("dsa-theme-mode", m);
            } catch {}
          }
        }

        // 2. Theme Custom (Preset & fine-tuned colors)
        if (data.themeCustom) {
          try {
            const rawCustom =
              typeof data.themeCustom === "string"
                ? JSON.parse(data.themeCustom)
                : data.themeCustom;
            if (rawCustom?.colors) {
              setColors(rawCustom.colors);
              setActivePreset(rawCustom.preset ?? null);
              localStorage.setItem(
                THEME_CUSTOM_STORAGE_KEY,
                JSON.stringify({ colors: rawCustom.colors, preset: rawCustom.preset ?? null })
              );
            }
          } catch {}
        }

        // 3. Font
        if (data.themeFont && typeof data.themeFont === "string") {
          setFont(data.themeFont);
          applyFontToDocument(data.themeFont);
          try {
            localStorage.setItem(FONT_STORAGE_KEY, data.themeFont);
          } catch {}
        }

        // 4. Display Size
        if (data.themeFontSize && typeof data.themeFontSize === "string") {
          setFontSize(data.themeFontSize);
          applySizeToDocument(data.themeFontSize);
          try {
            localStorage.setItem(SIZE_STORAGE_KEY, data.themeFontSize);
          } catch {}
        }

        // 5. Force View Mode
        if (data.themeForceView && typeof data.themeForceView === "string") {
          const v = data.themeForceView as ForceView;
          setForceView(v);
          applyViewModeToDocument(v);
          try {
            localStorage.setItem(VIEW_STORAGE_KEY, v);
          } catch {}
        }
      },
      (err: unknown) => {
        console.warn("[ThemeCustomizer] onSnapshot error:", err);
      }
    );

    return () => {
      alive = false;
      unsub();
    };
  }, [userId]);

  // Inject CSS vars on every color change or themeMode change
  useEffect(() => {
    const root = document.documentElement;
    const isDark = root.classList.contains("dark");
    const mode: ColorMode = isDark ? "dark" : "light";
    const vars = buildCssVars(isDark ? colors.dark : colors.light, mode);
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
  }, [colors, themeMode]);

  // Also react to dark/light mode toggle
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark");
      const mode: ColorMode = isDark ? "dark" : "light";
      const vars = buildCssVars(isDark ? colors.dark : colors.light, mode);
      const root = document.documentElement;
      Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [colors]);

  // Listen to cross-tab storage changes
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "dsa-theme-mode" && e.newValue) {
        const m = e.newValue as ThemeMode;
        if (["light", "dark", "system"].includes(m)) {
          setThemeMode(m);
          applyThemeModeToDocument(m);
        }
      } else if (e.key === THEME_CUSTOM_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed?.colors) setColors(parsed.colors);
          if (parsed?.preset !== undefined) setActivePreset(parsed.preset);
        } catch {}
      } else if (e.key === FONT_STORAGE_KEY && e.newValue) {
        setFont(e.newValue);
        applyFontToDocument(e.newValue);
      } else if (e.key === SIZE_STORAGE_KEY && e.newValue) {
        setFontSize(e.newValue);
        applySizeToDocument(e.newValue);
      } else if (e.key === VIEW_STORAGE_KEY && e.newValue) {
        const v = e.newValue as ForceView;
        setForceView(v);
        applyViewModeToDocument(v);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const persistToFirestore = useCallback(
    (patch: Record<string, any>) => {
      if (!userId || !db) return;
      void setDoc(
        doc(db, "users", userId, "settings", "prefs"),
        { ...patch, updatedAt: new Date().toISOString() },
        { merge: true }
      ).catch((err: unknown) => {
        console.warn("[ThemeCustomizer] Failed to sync to Firestore:", err);
      });
    },
    [userId]
  );

  const applyThemeMode = useCallback(
    (mode: ThemeMode) => {
      setThemeMode(mode);
      applyThemeModeToDocument(mode);
      try {
        localStorage.setItem("dsa-theme-mode", mode);
      } catch {}
      persistToFirestore({ theme: mode });
    },
    [persistToFirestore]
  );

  const applyPreset = useCallback(
    (key: string) => {
      const preset = PRESETS[key];
      if (!preset) return;
      setColors(preset.colors);
      setActivePreset(key);
      try {
        localStorage.setItem(
          THEME_CUSTOM_STORAGE_KEY,
          JSON.stringify({ colors: preset.colors, preset: key })
        );
      } catch {}
      persistToFirestore({
        themeCustom: { colors: preset.colors, preset: key },
      });
    },
    [persistToFirestore]
  );

  const updateColor = useCallback(
    (mode: ColorMode, key: keyof ThemeColors, value: string) => {
      setColors((prev) => {
        const next: ThemeCustom = {
          ...prev,
          [mode]: { ...prev[mode], [key]: value },
        };
        try {
          localStorage.setItem(
            THEME_CUSTOM_STORAGE_KEY,
            JSON.stringify({ colors: next, preset: null })
          );
        } catch {}
        persistToFirestore({
          themeCustom: { colors: next, preset: null },
        });
        return next;
      });
      setActivePreset(null);
    },
    [persistToFirestore]
  );

  const applyFont = useCallback(
    (newFont: string) => {
      setFont(newFont);
      applyFontToDocument(newFont);
      try {
        localStorage.setItem(FONT_STORAGE_KEY, newFont);
      } catch {}
      persistToFirestore({ themeFont: newFont });
    },
    [persistToFirestore]
  );

  const applySize = useCallback(
    (newSize: string) => {
      setFontSize(newSize);
      applySizeToDocument(newSize);
      try {
        if (!newSize || newSize === "auto") {
          localStorage.removeItem(SIZE_STORAGE_KEY);
        } else {
          localStorage.setItem(SIZE_STORAGE_KEY, newSize);
        }
      } catch {}
      persistToFirestore({ themeFontSize: newSize });
    },
    [persistToFirestore]
  );

  const applyView = useCallback(
    (mode: ForceView) => {
      setForceView(mode);
      applyViewModeToDocument(mode);
      try {
        localStorage.setItem(VIEW_STORAGE_KEY, mode);
      } catch {}
      persistToFirestore({ themeForceView: mode });
    },
    [persistToFirestore]
  );

  const resetToDefault = useCallback(() => {
    applyThemeMode("light");
    applyPreset("default");
    applyFont("'Inter', sans-serif");
    applySize("auto");
    applyView("auto");
  }, [applyThemeMode, applyPreset, applyFont, applySize, applyView]);

  return (
    <Ctx.Provider
      value={{
        themeMode,
        colors,
        activePreset,
        font,
        fontSize,
        forceView,
        applyThemeMode,
        applyPreset,
        updateColor,
        applyFont,
        applySize,
        applyView,
        resetToDefault,
        panelOpen,
        openPanel,
        closePanel,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useThemeCustomizer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useThemeCustomizer must be used inside ThemeCustomizerProvider");
  return ctx;
}

"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/integrations/supabase/client";
import { loadSettings, saveSettings } from "@/lib/settings";
import { isGuestMode } from "@/lib/guest-data";

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

export interface ThemePreset {
  label: string;
  group: string;
  colors: ThemeCustom;
}

export const PRESETS: Record<string, ThemePreset> = {
  // Premium Dark
  "midnight-electric": {
    label: "Midnight & Electric",
    group: "Premium Dark",
    colors: {
      light: { background: "#f8fafc", foreground: "#0f172a", primary: "#0ea5e9", card: "#ffffff", muted: "#f1f5f9", border: "#e2e8f0" },
      dark: { background: "#060913", foreground: "#f8fafc", primary: "#0ea5e9", card: "#0b1121", muted: "#141c2f", border: "#1e293b" }
    }
  },
  "graphite-cobalt": {
    label: "Graphite & Cobalt",
    group: "Premium Dark",
    colors: {
      light: { background: "#f9fafb", foreground: "#111827", primary: "#2563eb", card: "#ffffff", muted: "#f3f4f6", border: "#e5e7eb" },
      dark: { background: "#111827", foreground: "#f9fafb", primary: "#3b82f6", card: "#1f2937", muted: "#374151", border: "#4b5563" }
    }
  },
  "obsidian-violet": {
    label: "Obsidian & Violet",
    group: "Premium Dark",
    colors: {
      light: { background: "#faf5ff", foreground: "#1e1b4b", primary: "#8b5cf6", card: "#ffffff", muted: "#f3e8ff", border: "#e9d5ff" },
      dark: { background: "#0b0314", foreground: "#f3e8ff", primary: "#a855f7", card: "#150a24", muted: "#24143a", border: "#341a54" }
    }
  },
  "black-champagne": {
    label: "Black & Champagne",
    group: "Premium Dark",
    colors: {
      light: { background: "#faf9f6", foreground: "#1a1a1a", primary: "#d4af37", card: "#ffffff", muted: "#f0efe9", border: "#e3dfd3" },
      dark: { background: "#000000", foreground: "#f5f5f5", primary: "#d4af37", card: "#0f0f0f", muted: "#1f1f1f", border: "#2e2e2e" }
    }
  },
  
  // Premium Light
  "pearl-royal": {
    label: "Pearl & Royal (Default)",
    group: "Premium Light",
    colors: {
      light: { background: "#fdfdfc", foreground: "#172033", primary: "#1d4ed8", card: "#ffffff", muted: "#f3f4f6", border: "#e5e7eb" },
      dark: { background: "#101623", foreground: "#fdfdfc", primary: "#3b82f6", card: "#161e2e", muted: "#1f2937", border: "#374151" }
    }
  },
  "ivory-navy": {
    label: "Ivory & Deep Navy",
    group: "Premium Light",
    colors: {
      light: { background: "#fffff8", foreground: "#0a192f", primary: "#112240", card: "#ffffff", muted: "#f2f2eb", border: "#e6e6dc" },
      dark: { background: "#050d1a", foreground: "#fffff8", primary: "#64ffda", card: "#0a192f", muted: "#112240", border: "#233554" }
    }
  },
  "cloud-indigo": {
    label: "Cloud & Indigo",
    group: "Premium Light",
    colors: {
      light: { background: "#f8fafc", foreground: "#1e1b4b", primary: "#4f46e5", card: "#ffffff", muted: "#e0e7ff", border: "#c7d2fe" },
      dark: { background: "#0f172a", foreground: "#f8fafc", primary: "#6366f1", card: "#1e293b", muted: "#312e81", border: "#4338ca" }
    }
  },
  "warm-copper": {
    label: "Warm White & Copper",
    group: "Premium Light",
    colors: {
      light: { background: "#fffbf7", foreground: "#2d1606", primary: "#b76e22", card: "#ffffff", muted: "#f5eadc", border: "#e8d5c4" },
      dark: { background: "#1a1005", foreground: "#fffbf7", primary: "#d97706", card: "#2b1a08", muted: "#452a0d", border: "#5c3811" }
    }
  },

  // AI Neon
  "indigo-cyan": {
    label: "Deep Indigo & Cyan",
    group: "AI Neon",
    colors: {
      light: { background: "#f0fdfa", foreground: "#042f2e", primary: "#06b6d4", card: "#ffffff", muted: "#ccfbf1", border: "#99f6e4" },
      dark: { background: "#070c27", foreground: "#ecfeff", primary: "#06b6d4", card: "#101538", muted: "#1e2454", border: "#2c3370" }
    }
  },
  "charcoal-lavender": {
    label: "Charcoal & Lavender",
    group: "AI Neon",
    colors: {
      light: { background: "#fdfcff", foreground: "#1c192b", primary: "#8b5cf6", card: "#ffffff", muted: "#f5f3ff", border: "#ede9fe" },
      dark: { background: "#121214", foreground: "#f9f8fc", primary: "#a78bfa", card: "#1c1c1f", muted: "#27272a", border: "#3f3f46" }
    }
  },

  // Calm Learning
  "arctic-teal": {
    label: "Arctic & Teal",
    group: "Calm Learning",
    colors: {
      light: { background: "#f4fcfc", foreground: "#0f3a40", primary: "#0d9488", card: "#ffffff", muted: "#e6f6f5", border: "#b2e3e0" },
      dark: { background: "#041517", foreground: "#f4fcfc", primary: "#14b8a6", card: "#0a272b", muted: "#134249", border: "#1f5e67" }
    }
  },
  "forest-mint": {
    label: "Forest & Mint",
    group: "Calm Learning",
    colors: {
      light: { background: "#f2fbf5", foreground: "#143a21", primary: "#10b981", card: "#ffffff", muted: "#d1fae5", border: "#a7f3d0" },
      dark: { background: "#021209", foreground: "#f0fdf4", primary: "#10b981", card: "#062413", muted: "#0f3d24", border: "#175936" }
    }
  },
  
  // Creative
  "sand-burgundy": {
    label: "Sand & Burgundy",
    group: "Creative",
    colors: {
      light: { background: "#fdf8f5", foreground: "#4a1220", primary: "#9f1239", card: "#ffffff", muted: "#f5e6e1", border: "#ebd0c8" },
      dark: { background: "#1a080d", foreground: "#fdf8f5", primary: "#e11d48", card: "#2a1017", muted: "#4a1c29", border: "#6b273b" }
    }
  },
  "rose-plum": {
    label: "Rose Quartz & Plum",
    group: "Creative",
    colors: {
      light: { background: "#fff5f7", foreground: "#4c0519", primary: "#be123c", card: "#ffffff", muted: "#ffe4e6", border: "#fecdd3" },
      dark: { background: "#200612", foreground: "#fff1f2", primary: "#f43f5e", card: "#330a1c", muted: "#4f102b", border: "#73173e" }
    }
  },
  

  "slate-sapphire": {
    label: "Slate & Sapphire",
    group: "Monochrome",
    colors: {
      light: { background: "#f8fafc", foreground: "#0f172a", primary: "#334155", card: "#ffffff", muted: "#f1f5f9", border: "#e2e8f0" },
      dark: { background: "#0f172a", foreground: "#f8fafc", primary: "#94a3b8", card: "#1e293b", muted: "#334155", border: "#475569" }
    }
  }
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

  // Keep CTA labels readable even when the user chooses a very light accent.
  const primaryLuminance = parseFloat(pr.match(/oklch\(([^ ]+)/)?.[1] ?? "0.5");
  const prFg = primaryLuminance > 0.72 ? "oklch(0.16 0.02 250)" : "oklch(0.99 0.01 90)";

  const bgGlow = mode === "dark" 
    ? `color-mix(in oklab, ${pr} 12%, ${bg})`
    : `color-mix(in oklab, ${pr} 6%, ${bg})`;
    
  const bgEdge = mode === "dark"
    ? `color-mix(in oklab, #000 45%, ${bg})`
    : `color-mix(in oklab, ${mt} 35%, ${bg})`;

  return {
    "--background": bg,
    "--bg-glow": bgGlow,
    "--bg-edge": bgEdge,
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
    "--destructive": mode === "dark" ? "oklch(0.65 0.15 25)" : "oklch(0.6 0.18 25)",
    "--destructive-foreground": mode === "dark" ? "oklch(0.2 0.05 25)" : "oklch(0.98 0 0)",
    "--success": mode === "dark" ? "oklch(0.7 0.15 140)" : "oklch(0.65 0.15 140)",
    "--success-foreground": mode === "dark" ? "oklch(0.2 0.05 140)" : "oklch(0.98 0 0)",
    "--warning": mode === "dark" ? "oklch(0.8 0.15 80)" : "oklch(0.7 0.15 80)",
    "--warning-foreground": mode === "dark" ? "oklch(0.2 0.05 80)" : "oklch(0.98 0 0)",
    "--info": mode === "dark" ? "oklch(0.7 0.15 250)" : "oklch(0.6 0.15 250)",
    "--info-foreground": mode === "dark" ? "oklch(0.2 0.05 250)" : "oklch(0.98 0 0)",

    // Dynamic Theme Tokens for Animated Hero
    "--primary-hover": mode === "dark" ? `color-mix(in oklab, ${pr} 82%, white)` : `color-mix(in oklab, ${pr} 82%, black)`,
    "--primary-active": mode === "dark" ? `color-mix(in oklab, ${pr} 68%, white)` : `color-mix(in oklab, ${pr} 68%, black)`,
    "--primary-light": `color-mix(in oklab, ${pr} 15%, ${bg})`,
    "--primary-lighter": `color-mix(in oklab, ${pr} 8%, ${bg})`,
    "--primary-dark": `color-mix(in oklab, ${pr} 85%, black)`,
    
    "--accent-dynamic": `oklch(from ${pr} l c calc(h + 32))`,
    "--accent-dynamic-light": `color-mix(in oklab, oklch(from ${pr} l c calc(h + 32)) 15%, ${bg})`,
    
    "--gradient-start": pr,
    "--gradient-mid": `color-mix(in oklab, ${pr} 50%, oklch(from ${pr} l c calc(h + 32)))`,
    "--gradient-end": `oklch(from ${pr} l c calc(h + 32))`,
    
    "--glow": `color-mix(in oklab, ${pr} 30%, transparent)`,
    "--glow-soft": `color-mix(in oklab, ${pr} 15%, transparent)`,
    "--glow-strong": `color-mix(in oklab, ${pr} 50%, transparent)`,
    
    "--wave-primary": mode === "dark" ? `color-mix(in oklab, ${pr} 12%, ${bg})` : `color-mix(in oklab, ${pr} 10%, ${bg})`,
    "--wave-secondary": mode === "dark" ? `color-mix(in oklab, ${pr} 8%, ${bg})` : `color-mix(in oklab, ${pr} 5%, ${bg})`,
    "--wave-highlight": mode === "dark" ? `color-mix(in oklab, oklch(from ${pr} l c calc(h + 32)) 9%, ${bg})` : `color-mix(in oklab, oklch(from ${pr} l c calc(h + 32)) 7%, ${bg})`,
    
    "--glass-border": `color-mix(in oklab, ${pr} 15%, transparent)`,
    "--glass-background": `color-mix(in oklab, ${pr} 4%, transparent)`,

    // Logo treatment: mode controls the neutral mark/background, while the
    // center glyph and underline accents inherit the selected brand color.
    "--logo-bg": mode === "dark" ? "#ffffff" : "#000000",
    "--logo-ink": mode === "dark" ? "#000000" : "#ffffff",
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
        if (localStorage.getItem("dsa-theme-version") !== "7") {
          return PRESETS["pearl-royal"].colors;
        }
        const saved = localStorage.getItem(THEME_CUSTOM_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as { colors: ThemeCustom; preset: string | null };
          if (parsed?.preset === "default") return PRESETS["pearl-royal"].colors;
          if (parsed?.colors) return parsed.colors;
        }
      } catch {}
    }
    return PRESETS["pearl-royal"].colors;
  });

  const [activePreset, setActivePreset] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      try {
        if (localStorage.getItem("dsa-theme-version") !== "7") {
          return "pearl-royal";
        }
        const saved = localStorage.getItem(THEME_CUSTOM_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as { colors: ThemeCustom; preset: string | null };
          if (parsed?.preset !== undefined) return parsed.preset;
        }
      } catch {}
    }
    return "pearl-royal";
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
    return "desktop";
  });

  const [userId, setUserId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const openPanel = useCallback(() => setPanelOpen(true), []);
  const closePanel = useCallback(() => setPanelOpen(false), []);

  // Track authenticated user for Supabase sync
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserId(session?.user?.id ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Apply initial theme, font, size, view to document
  useEffect(() => {
    applyThemeModeToDocument(themeMode);
    applyFontToDocument(font);
    applySizeToDocument(fontSize);
    applyViewModeToDocument(forceView);
  }, []);

  // Fetch initial user settings from Supabase
  useEffect(() => {
    if (!userId || isGuestMode()) return;
    let alive = true;

    loadSettings(userId).then(data => {
      if (!alive) return;

      // 1. Theme Mode
      if (data.theme) {
        setThemeMode(data.theme);
        applyThemeModeToDocument(data.theme);
        try {
          localStorage.setItem("dsa-theme-mode", data.theme);
        } catch {}
      }

      // 2. Theme Custom
      if (data.themeCustom) {
        try {
          const rawCustom = data.themeCustom;
          if (rawCustom?.preset === "default") {
            setColors(PRESETS["pearl-royal"].colors);
            setActivePreset("pearl-royal");
            localStorage.setItem(THEME_CUSTOM_STORAGE_KEY, JSON.stringify({ colors: PRESETS["pearl-royal"].colors, preset: "pearl-royal" }));
          } else if (rawCustom?.colors) {
            setColors(rawCustom.colors);
            setActivePreset(rawCustom.preset ?? null);
            localStorage.setItem(THEME_CUSTOM_STORAGE_KEY, JSON.stringify({ colors: rawCustom.colors, preset: rawCustom.preset ?? null }));
          }
        } catch {}
      }

      // 3. Font
      if (data.themeFont) {
        setFont(data.themeFont);
        applyFontToDocument(data.themeFont);
        try {
          localStorage.setItem(FONT_STORAGE_KEY, data.themeFont);
        } catch {}
      }

      // 4. Display Size
      if (data.themeFontSize) {
        setFontSize(data.themeFontSize);
        applySizeToDocument(data.themeFontSize);
        try {
          localStorage.setItem(SIZE_STORAGE_KEY, data.themeFontSize);
        } catch {}
      }

      // 5. Force View Mode
      if (data.themeForceView) {
        const v = data.themeForceView as ForceView;
        setForceView(v);
        applyViewModeToDocument(v);
        try {
          localStorage.setItem(VIEW_STORAGE_KEY, v);
        } catch {}
      }
    }).catch(err => console.warn("Failed to load settings:", err));

    return () => {
      alive = false;
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

  // Re-apply viewport on route changes so Next.js doesn't overwrite it
  const pathname = usePathname();
  useEffect(() => {
    applyViewModeToDocument(forceView);
  }, [pathname, forceView]);

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
      if (!userId || isGuestMode()) return;
      saveSettings(userId, patch).catch(err => {
        console.warn("[ThemeCustomizer] Failed to sync to Supabase:", err);
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
    applyPreset("pearl-royal");
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

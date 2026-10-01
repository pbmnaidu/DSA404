"use client";

import React, { useState, useEffect } from "react";
import {
  Palette, X, RotateCcw, ChevronDown, ChevronUp,
  Sun, Moon, Type, Monitor, Smartphone,
} from "lucide-react";
import {
  useThemeCustomizer, PRESETS,
  type ColorMode, type ThemeColors,
} from "./theme-customizer-context";

// ─── Font options ──────────────────────────────────────────────────────────────

const FONT_OPTIONS = [
  { label: "Inter (Default)", value: "'Inter', sans-serif" },
  { label: "Roboto", value: "'Roboto', sans-serif" },
  { label: "Outfit", value: "'Outfit', sans-serif" },
  { label: "DM Sans", value: "'DM Sans', sans-serif" },
  { label: "Geist", value: "'Geist', sans-serif" },
  { label: "Space Grotesk", value: "'Space Grotesk', sans-serif" },
  { label: "Poppins", value: "'Poppins', sans-serif" },
  { label: "Fira Code (Mono)", value: "'Fira Code', monospace" },
  { label: "JetBrains Mono", value: "'JetBrains Mono', monospace" },
];

export const SIZE_OPTIONS = [
  { label: "Auto (12px Mobile / 15px Laptop)", value: "auto" },
  { label: "XS (12px)", value: "12px" },
  { label: "SM (13px)", value: "13px" },
  { label: "MD (14px)", value: "14px" },
  { label: "LG (15px)", value: "15px" },
  { label: "XL (16px)", value: "16px" },
  { label: "2XL (18px)", value: "18px" },
];

const FONT_STORAGE_KEY = "dsa-tracker-font";
const SIZE_STORAGE_KEY = "dsa-tracker-font-size";
const VIEW_STORAGE_KEY = "dsa-tracker-force-view";

type ForceView = "auto" | "desktop" | "mobile";

// ─── Color labels ──────────────────────────────────────────────────────────────

const COLOR_LABELS: Record<keyof ThemeColors, string> = {
  background: "Background",
  foreground: "Text",
  primary: "Accent / Brand",
  card: "Card Surface",
  muted: "Muted / Hover",
  border: "Border",
};
const COLOR_KEYS = Object.keys(COLOR_LABELS) as (keyof ThemeColors)[];

// ─── Components ────────────────────────────────────────────────────────────────

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2.5">
      <label className="relative cursor-pointer shrink-0">
        <span className="block w-7 h-7 rounded-md border border-border shadow-sm" style={{ background: value }} />
        <input type="color" value={value} aria-label={`${label} color picker`}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
      </label>
      <span className="text-sm text-foreground flex-1 truncate">{label}</span>
      <span className="text-xs font-mono text-foreground">{value}</span>
    </div>
  );
}

function SectionHeader({
  label, expanded, onToggle, icon,
}: { label: string; expanded: boolean; onToggle: () => void; icon: React.ReactNode }) {
  return (
    <button
      className="w-full flex items-center justify-between px-3 py-2.5 bg-muted text-sm font-medium hover:bg-muted transition-colors"
      onClick={onToggle}
    >
      <span className="flex items-center gap-2">{icon}{label}</span>
      {expanded ? <ChevronUp className="size-3.5 text-foreground" /> : <ChevronDown className="size-3.5 text-foreground" />}
    </button>
  );
}

// ─── Main Panel ────────────────────────────────────────────────────────────────

export function ThemeCustomizerPanel() {
  const {
    themeMode,
    applyThemeMode,
    colors,
    activePreset,
    applyPreset,
    updateColor,
    resetToDefault,
    panelOpen,
    closePanel,
    font,
    fontSize,
    forceView,
    applyFont,
    applySize,
    applyView,
  } = useThemeCustomizer();

  const [advancedMode, setAdvancedMode] = useState<ColorMode | null>(null);
  const [fontOpen, setFontOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);

  return (
    <>
      {/* Backdrop */}
      {panelOpen && <div className="fixed inset-0 z-50 bg-black/80 " onClick={closePanel} />}

      {/* Panel */}
      <div
        className={`fixed bottom-0 right-0 z-50 w-full sm:w-[360px] max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-lg sm:bottom-6 sm:right-6 bg-card border border-border shadow-sm transition-all duration-300 ease-out ${
          panelOpen
            ? "opacity-100 translate-y-0 sm:scale-100"
            : "opacity-0 translate-y-full sm:translate-y-0 sm:scale-95 pointer-events-none"
        }`}
        style={{ boxShadow: "0 8px 48px oklch(0 0 0 / 0.22)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-2">
            <Palette className="size-4 text-primary" />
            <span className="font-semibold text-sm">Theme & Display</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={resetToDefault} title="Reset all" aria-label="Reset all"
              className="p-1.5 rounded-md text-foreground hover:text-foreground hover:bg-muted transition-colors">
              <RotateCcw className="size-3.5" />
            </button>
            <button onClick={closePanel} title="Close" aria-label="Close panel"
              className="p-1.5 rounded-md text-foreground hover:text-foreground hover:bg-muted transition-colors">
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-5">

          {/* ── Mode (Light / Dark / System) ── */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground mb-2.5">Theme Mode</p>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { mode: "light" as const, label: "Light", icon: <Sun className="size-3.5" /> },
                  { mode: "dark" as const, label: "Dark", icon: <Moon className="size-3.5" /> },
                  { mode: "system" as const, label: "System", icon: <Monitor className="size-3.5" /> },
                ] as const
              ).map(({ mode, label, icon }) => (
                <button
                  key={mode}
                  onClick={() => applyThemeMode(mode)}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-medium transition-all hover:scale-105 active:scale-95 ${
                    themeMode === mode
                      ? "border-primary bg-muted text-primary font-semibold shadow-sm"
                      : "border-border bg-muted text-foreground hover:border-border"
                  }`}
                >
                  {icon}
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-border" />

          {/* ── Color Presets ── */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">Premium Themes</p>
            <div className="space-y-6">
              {Object.entries(
                Object.entries(PRESETS).reduce((acc, [key, preset]) => {
                  const group = preset.group || "Custom";
                  if (!acc[group]) acc[group] = [];
                  acc[group].push({ key, preset });
                  return acc;
                }, {} as Record<string, { key: string; preset: typeof PRESETS[keyof typeof PRESETS] }[]>)
              ).map(([groupName, groupPresets]) => (
                <div key={groupName} className="space-y-3">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{groupName}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {groupPresets.map(({ key, preset }) => (
                      <button
                        key={key}
                        onClick={() => applyPreset(key)}
                        className={`group relative flex flex-col gap-2.5 rounded-xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] ${
                          activePreset === key
                            ? "border-primary bg-primary/[0.03] shadow-sm ring-1 ring-primary/20"
                            : "border-border bg-card hover:border-primary/30"
                        }`}
                      >
                        <div className="flex w-full items-center justify-between">
                          <div className="flex -space-x-1.5">
                            {/* Light Mode Preview */}
                            <div className="relative size-6 overflow-hidden rounded-full border border-border shadow-sm transition-transform group-hover:scale-110 group-hover:z-10">
                              <div className="absolute inset-0" style={{ backgroundColor: preset.colors.light.background }}></div>
                              <div className="absolute inset-x-0 bottom-0 h-1/2" style={{ backgroundColor: preset.colors.light.card }}></div>
                              <div className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border shadow-sm" style={{ backgroundColor: preset.colors.light.primary }}></div>
                            </div>
                            {/* Dark Mode Preview */}
                            <div className="relative size-6 overflow-hidden rounded-full border border-border shadow-sm transition-transform group-hover:scale-110 group-hover:z-10">
                              <div className="absolute inset-0" style={{ backgroundColor: preset.colors.dark.background }}></div>
                              <div className="absolute inset-x-0 bottom-0 h-1/2" style={{ backgroundColor: preset.colors.dark.card }}></div>
                              <div className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border shadow-sm" style={{ backgroundColor: preset.colors.dark.primary }}></div>
                            </div>
                          </div>
                          {activePreset === key && (
                            <div className="flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm animate-in zoom-in duration-200">
                              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </div>
                          )}
                        </div>
                        
                        <span className={`text-xs font-semibold tracking-tight truncate w-full ${activePreset === key ? "text-primary" : "text-foreground"}`}>
                          {preset.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border" />

          {/* ── Fine-tune colors ── */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground mb-2.5">Fine-tune Colors</p>
            <div className="rounded-lg border border-border overflow-hidden mb-2">
              <SectionHeader
                label="Light Mode Colors" expanded={advancedMode === "light"}
                onToggle={() => setAdvancedMode(advancedMode === "light" ? null : "light")}
                icon={<Sun className="size-3.5 text-warning" />}
              />
              {advancedMode === "light" && (
                <div className="px-3 py-3 space-y-3">
                  {COLOR_KEYS.map((key) => (
                    <ColorRow key={key} label={COLOR_LABELS[key]} value={colors.light[key]}
                      onChange={(v) => updateColor("light", key, v)} />
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-lg border border-border overflow-hidden">
              <SectionHeader
                label="Dark Mode Colors" expanded={advancedMode === "dark"}
                onToggle={() => setAdvancedMode(advancedMode === "dark" ? null : "dark")}
                icon={<Moon className="size-3.5 text-primary" />}
              />
              {advancedMode === "dark" && (
                <div className="px-3 py-3 space-y-3">
                  {COLOR_KEYS.map((key) => (
                    <ColorRow key={key} label={COLOR_LABELS[key]} value={colors.dark[key]}
                      onChange={(v) => updateColor("dark", key, v)} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-border" />

          {/* ── Font & Size ── */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground mb-2.5">Typography</p>
            <div className="rounded-lg border border-border overflow-hidden mb-2">
              <SectionHeader
                label="Font Family" expanded={fontOpen}
                onToggle={() => setFontOpen((v) => !v)}
                icon={<Type className="size-3.5 text-primary" />}
              />
              {fontOpen && (
                <div className="px-3 py-3 space-y-1.5">
                  {FONT_OPTIONS.map((f) => (
                    <button key={f.value} onClick={() => applyFont(f.value)}
                      className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all ${
                        font === f.value
                          ? "bg-muted text-primary font-semibold"
                          : "text-foreground hover:bg-muted"
                      }`}
                      style={{ fontFamily: f.value }}
                    >
                      <span>{f.label}</span>
                      {font === f.value && <span className="size-2 rounded-full bg-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Font Size */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="px-3 py-2.5 bg-muted flex items-center gap-2 text-sm font-medium">
                <Type className="size-3.5 text-primary" />
                <span>Display Size</span>
              </div>
              <div className="px-3 py-3 grid grid-cols-2 gap-2">
                {SIZE_OPTIONS.map((s) => (
                  <button key={s.value} onClick={() => applySize(s.value)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all hover:scale-105 active:scale-95 ${
                      fontSize === s.value
                        ? "border-primary bg-muted text-primary"
                        : "border-border text-foreground hover:border-border"
                    }`}
                    style={{ fontSize: s.value }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* ── View Mode ── */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground mb-2.5">View Mode</p>
            <div className="rounded-lg border border-border overflow-hidden">
              <SectionHeader
                label="Force Layout" expanded={viewOpen}
                onToggle={() => setViewOpen((v) => !v)}
                icon={<Monitor className="size-3.5 text-primary" />}
              />
              {viewOpen && (
                <div className="px-3 py-3 grid grid-cols-3 gap-2">
                  {(
                    [
                      { mode: "auto" as ForceView, label: "Auto", icon: <Monitor className="size-4" /> },
                      { mode: "desktop" as ForceView, label: "Desktop", icon: <Monitor className="size-4" /> },
                      { mode: "mobile" as ForceView, label: "Mobile", icon: <Smartphone className="size-4" /> },
                    ] as const
                  ).map(({ mode, label, icon }) => (
                    <button key={mode} onClick={() => applyView(mode)}
                      className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-all hover:scale-105 active:scale-95 ${
                        forceView === mode
                          ? "border-primary bg-muted text-primary"
                          : "border-border text-foreground hover:border-border"
                      }`}
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="mt-2 text-[11px] text-foreground text-center">
              "Desktop" forces a 1280px viewport width on mobile browsers.
            </p>
          </div>

          {/* Footer note */}
          <p className="text-[11px] text-foreground text-center leading-relaxed">
            All settings are synced automatically across your devices.
          </p>
        </div>
      </div>
    </>
  );
}

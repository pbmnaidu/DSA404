"use client";
import { useEffect, useState } from "react";
import { useThemeCustomizer } from "../../app/theme-customizer-context";

export function ThemedLogo({ className = "" }: { className?: string }) {
  const { themeMode } = useThemeCustomizer();
  // Default to dark (app defaults to dark mode per layout.tsx)
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const update = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [themeMode]);

  const src = isDark ? "/logo/dsa404-logo-dark.png" : "/logo/dsa404-logo-light.png";

  // Also update favicon
  useEffect(() => {
    document.querySelectorAll<HTMLLinkElement>('link[rel*="icon"]').forEach((link) => {
      link.href = src;
    });
  }, [src]);

  return (
    <img
      src={src}
      alt="DSA404 logo"
      data-ready="true"
      className={`themed-logo ${className}`}
      style={{ width: "100%", height: "100%", objectFit: "contain" }}
    />
  );
}

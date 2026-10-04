"use client";

import { useEffect, useRef } from "react";

export function ThemedLogo({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const image = new Image();
    image.src = "/logo.jpg";

    const render = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx || !image.naturalWidth) return;
      const size = 256;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(image, 0, 0, size, size);
      const pixels = ctx.getImageData(0, 0, size, size);
      const root = document.documentElement;
      const styles = getComputedStyle(root);
      const dark = root.classList.contains("dark");
      const primaryToken = styles.getPropertyValue("--primary").trim();
      if (!primaryToken) return;
      const swatch = document.createElement("canvas");
      swatch.width = swatch.height = 1;
      const swatchCtx = swatch.getContext("2d");
      if (!swatchCtx) return;
      swatchCtx.fillStyle = styles.getPropertyValue("--primary").trim();
      swatchCtx.fillRect(0, 0, 1, 1);
      const theme = swatchCtx.getImageData(0, 0, 1, 1).data;

      for (let i = 0; i < pixels.data.length; i += 4) {
        const r = pixels.data[i], g = pixels.data[i + 1], b = pixels.data[i + 2];
        const yellow = r > 90 && g > 55 && b < Math.min(r, g) * 0.72;
        if (yellow) {
          pixels.data[i] = theme[0]; pixels.data[i + 1] = theme[1]; pixels.data[i + 2] = theme[2];
        } else if (dark) {
          pixels.data[i] = 255 - r; pixels.data[i + 1] = 255 - g; pixels.data[i + 2] = 255 - b;
        }
      }
      ctx.putImageData(pixels, 0, 0);
      canvas.dataset.ready = "true";
      // Keep the browser tab/app icon in sync with the same processed logo.
      document.querySelectorAll<HTMLLinkElement>('link[rel*="icon"]').forEach((link) => {
        link.href = canvas.toDataURL("image/png");
      });
    };

    image.onload = render;
    const observer = new MutationObserver(render);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
    const timer = window.setInterval(render, 500);
    return () => { observer.disconnect(); window.clearInterval(timer); };
  }, []);

  return <canvas ref={canvasRef} className={`themed-logo ${className}`} role="img" aria-label="DSA404 logo" />;
}

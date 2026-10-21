"use client";

import { useEffect } from "react";
import Script from "next/script";

const STORAGE_KEY = "dsa404_conferbot_position";
const BUTTON_SIZE = 68; // Increased from default 55px
const PADDING = 14;

export function ConferbotDraggableWidget() {
  useEffect(() => {
    let cleanupListeners: (() => void) | null = null;
    let isAttached = false;

    const clamp = (val: number, min: number, max: number) =>
      Math.max(min, Math.min(max, val));

    function setupDraggable(): boolean {
      if (isAttached) return true;

      const widgetHost = document.querySelector("conferbot-widget") as HTMLElement | null;
      if (!widgetHost || !widgetHost.shadowRoot) return false;

      const shadow = widgetHost.shadowRoot;
      const button = shadow.querySelector<HTMLElement>("#open-chatbot");
      if (!button) return false;

      if (button.dataset.dsaDraggableReady === "true") return true;
      button.dataset.dsaDraggableReady = "true";
      isAttached = true;

      // ── 1. Inject Enhanced Styles for Larger Icon & Draggable Physics ──
      let styleTag = shadow.querySelector<HTMLStyleElement>("#conferbot-draggable-styles");
      if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = "conferbot-draggable-styles";
        styleTag.textContent = `
          /* Enhanced Larger Size & High-Definition Presence */
          #open-chatbot.chatbot__icon {
            width: ${BUTTON_SIZE}px !important;
            height: ${BUTTON_SIZE}px !important;
            min-width: ${BUTTON_SIZE}px !important;
            min-height: ${BUTTON_SIZE}px !important;
            border-radius: 50% !important;
            cursor: grab !important;
            user-select: none !important;
            -webkit-user-select: none !important;
            touch-action: none !important;
            z-index: 99999999 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            box-shadow: 0 12px 30px -4px rgba(0, 0, 0, 0.38), 0 4px 12px -2px rgba(0, 0, 0, 0.22), 0 0 0 2px rgba(255, 255, 255, 0.22) !important;
            transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.18s ease !important;
          }

          /* Hover Elevation */
          #open-chatbot.chatbot__icon:hover {
            transform: scale(1.08) !important;
            box-shadow: 0 18px 38px -4px rgba(0, 0, 0, 0.48), 0 6px 16px -2px rgba(0, 0, 0, 0.28), 0 0 0 3px rgba(255, 255, 255, 0.35) !important;
          }

          /* Active Dragging State */
          #open-chatbot.chatbot__icon.is-dragging {
            cursor: grabbing !important;
            transform: scale(1.12) !important;
            box-shadow: 0 24px 48px -4px rgba(0, 0, 0, 0.6), 0 0 0 4px rgba(99, 102, 241, 0.65) !important;
            transition: none !important;
          }

          /* Scale Up Inner Icon Graphics */
          #open-chatbot svg, 
          #open-chatbot img, 
          #open-chatbot .cb-launcher__mascot,
          #open-chatbot .cb-launcher__avatar,
          #open-chatbot .open-svg,
          #open-chatbot [id*="_open-icon"],
          #open-chatbot [id*="_close-icon"] {
            width: 36px !important;
            height: 36px !important;
            min-width: 36px !important;
            min-height: 36px !important;
            max-width: 38px !important;
            max-height: 38px !important;
            pointer-events: none !important;
          }

          /* Responsive Chat Window Alignment based on Button Dock Position */
          :host([data-cb-dock="left"]) .live_chat__chat__screen {
            left: 20px !important;
            right: auto !important;
          }
          :host([data-cb-dock="right"]) .live_chat__chat__screen {
            right: 20px !important;
            left: auto !important;
          }
        `;
        shadow.appendChild(styleTag);
      }

      // ── 2. Position Application Function ──
      const applyPosition = (x: number, y: number) => {
        const maxX = Math.max(PADDING, window.innerWidth - BUTTON_SIZE - PADDING);
        const maxY = Math.max(PADDING, window.innerHeight - BUTTON_SIZE - PADDING);
        const safeX = clamp(x, PADDING, maxX);
        const safeY = clamp(y, PADDING, maxY);

        button.style.setProperty("left", `${safeX}px`, "important");
        button.style.setProperty("top", `${safeY}px`, "important");
        button.style.setProperty("right", "auto", "important");
        button.style.setProperty("bottom", "auto", "important");
        button.style.setProperty("margin", "0", "important");

        // Align chat screen dock based on screen half
        const dock = safeX < window.innerWidth / 2 ? "left" : "right";
        widgetHost.setAttribute("data-cb-dock", dock);

        return { x: safeX, y: safeY };
      };

      // ── 3. Restore Persisted Position ──
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.x === "number" && typeof parsed.y === "number") {
            applyPosition(parsed.x, parsed.y);
          }
        }
      } catch (_) {}

      // ── 4. Pointer Drag Handling ──
      let isPointerDown = false;
      let hasDragged = false;
      let pointerStartX = 0;
      let pointerStartY = 0;
      let initialLeft = 0;
      let initialTop = 0;

      const onPointerDown = (e: PointerEvent) => {
        // Only accept primary button (left mouse click) or touch
        if (e.button !== 0) return;
        isPointerDown = true;
        hasDragged = false;
        pointerStartX = e.clientX;
        pointerStartY = e.clientY;

        const rect = button.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        try {
          button.setPointerCapture(e.pointerId);
        } catch (_) {}
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!isPointerDown) return;
        const dx = e.clientX - pointerStartX;
        const dy = e.clientY - pointerStartY;

        // Threshold check: only enter drag mode if moved more than 5px
        if (!hasDragged && Math.hypot(dx, dy) > 5) {
          hasDragged = true;
          button.classList.add("is-dragging");
        }

        if (hasDragged) {
          applyPosition(initialLeft + dx, initialTop + dy);
        }
      };

      const onPointerUp = (e: PointerEvent) => {
        if (!isPointerDown) return;
        isPointerDown = false;
        button.classList.remove("is-dragging");

        try {
          button.releasePointerCapture(e.pointerId);
        } catch (_) {}

        if (hasDragged) {
          const rect = button.getBoundingClientRect();
          try {
            localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify({ x: rect.left, y: rect.top })
            );
          } catch (_) {}

          // Suppress any follow-up click event caused by dragging
          setTimeout(() => {
            hasDragged = false;
          }, 100);
        }
      };

      // Intercept click in capture phase to prevent opening chat if it was a drag
      const onClickCapture = (e: MouseEvent) => {
        if (hasDragged) {
          e.stopImmediatePropagation();
          e.preventDefault();
        }
      };

      button.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
      button.addEventListener("click", onClickCapture, true);

      // Re-clamp on window resize
      const onResize = () => {
        const rect = button.getBoundingClientRect();
        applyPosition(rect.left, rect.top);
      };
      window.addEventListener("resize", onResize, { passive: true });

      cleanupListeners = () => {
        button.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);
        button.removeEventListener("click", onClickCapture, true);
        window.removeEventListener("resize", onResize);
      };

      return true;
    }

    // Attempt immediate attachment
    if (!setupDraggable()) {
      // Observe DOM mutations to hook as soon as Conferbot creates its host & shadow root
      const observer = new MutationObserver(() => {
        if (setupDraggable()) {
          observer.disconnect();
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      // Fallback periodic poll for 10 seconds
      const interval = setInterval(() => {
        if (setupDraggable()) {
          clearInterval(interval);
          observer.disconnect();
        }
      }, 250);

      const timeout = setTimeout(() => {
        clearInterval(interval);
        observer.disconnect();
      }, 12000);

      return () => {
        observer.disconnect();
        clearInterval(interval);
        clearTimeout(timeout);
        if (cleanupListeners) cleanupListeners();
      };
    }

    return () => {
      if (cleanupListeners) cleanupListeners();
    };
  }, []);

  return (
    <Script
      id="conferbot-js-loader"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `(function (d, s, id) {
          var js, el = d.getElementsByTagName(s)[0];
          if (d.getElementById(id)) return;
          js = d.createElement(s);
          js.async = true;
          js.src = 'https://cdn.conferbot.com/dist/v1/widget.min.js';
          js.id = id;
          js.charset = 'UTF-8';
          el.parentNode.insertBefore(js, el);
          js.onload = function () {
            try {
              if (window.ConferbotWidget) {
                window.ConferbotWidget("6ad3484595ebb65f7c274902", "live_chat");
              }
            } catch(e) {
              console.warn("[Conferbot] init warning:", e);
            }
          };
        })(document, 'script', 'conferbot-js');`,
      }}
    />
  );
}

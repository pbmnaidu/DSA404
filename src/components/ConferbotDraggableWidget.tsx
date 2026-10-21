"use client";

import { useEffect, useState, useRef, useCallback } from "react";

const STORAGE_KEY = "dsa404_conferbot_position";
const BUTTON_SIZE = 68; // Increased high-definition launcher size
const PADDING = 14;

export function ConferbotDraggableWidget() {
  const [isConferbotReady, setIsConferbotReady] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Interaction tracking refs
  const currentPosRef = useRef<{ x: number; y: number } | null>(null);
  const isPointerDownRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const startPointerRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });
  const pendingOpenRef = useRef(false);
  const placeholderRef = useRef<HTMLDivElement | null>(null);

  const clamp = (val: number, min: number, max: number) =>
    Math.max(min, Math.min(max, val));

  // ── Sync Position to state, storage, and real Conferbot if mounted ──
  const applyCoordinates = useCallback((rawX: number, rawY: number) => {
    if (typeof window === "undefined") return;

    const maxX = Math.max(PADDING, window.innerWidth - BUTTON_SIZE - PADDING);
    const maxY = Math.max(PADDING, window.innerHeight - BUTTON_SIZE - PADDING);
    const safeX = clamp(rawX, PADDING, maxX);
    const safeY = clamp(rawY, PADDING, maxY);

    const pos = { x: safeX, y: safeY };
    currentPosRef.current = pos;
    setPosition(pos);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
    } catch (_) {}

    // Apply directly to real Conferbot button if mounted inside shadowRoot
    const widgetHost = document.querySelector("conferbot-widget") as HTMLElement | null;
    if (widgetHost?.shadowRoot) {
      const realBtn = widgetHost.shadowRoot.querySelector<HTMLElement>("#open-chatbot");
      if (realBtn) {
        realBtn.style.setProperty("left", `${safeX}px`, "important");
        realBtn.style.setProperty("top", `${safeY}px`, "important");
        realBtn.style.setProperty("right", "auto", "important");
        realBtn.style.setProperty("bottom", "auto", "important");
        realBtn.style.setProperty("margin", "0", "important");
      }
      // Set dock attribute for chat screen positioning
      const dock = safeX < window.innerWidth / 2 ? "left" : "right";
      widgetHost.setAttribute("data-cb-dock", dock);
    }
  }, []);

  // ── Initialize Position on Mount ──
  useEffect(() => {
    if (typeof window === "undefined") return;

    let initX = window.innerWidth - BUTTON_SIZE - 26;
    let initY = window.innerHeight - BUTTON_SIZE - 20;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          initX = parsed.x;
          initY = parsed.y;
        }
      }
    } catch (_) {}

    applyCoordinates(initX, initY);

    const handleResize = () => {
      if (currentPosRef.current) {
        applyCoordinates(currentPosRef.current.x, currentPosRef.current.y);
      }
    };

    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, [applyCoordinates]);

  // ── Drag Logic for the Immediate Placeholder ──
  const handlePlaceholderPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    isPointerDownRef.current = true;
    hasDraggedRef.current = false;
    startPointerRef.current = { x: e.clientX, y: e.clientY };

    const currentX = currentPosRef.current?.x ?? (window.innerWidth - BUTTON_SIZE - 26);
    const currentY = currentPosRef.current?.y ?? (window.innerHeight - BUTTON_SIZE - 20);
    startPosRef.current = { x: currentX, y: currentY };

    if (placeholderRef.current) {
      try {
        placeholderRef.current.setPointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  const handlePlaceholderPointerMove = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;
    const dx = e.clientX - startPointerRef.current.x;
    const dy = e.clientY - startPointerRef.current.y;

    if (!hasDraggedRef.current && Math.hypot(dx, dy) > 5) {
      hasDraggedRef.current = true;
      setIsDragging(true);
    }

    if (hasDraggedRef.current) {
      applyCoordinates(startPosRef.current.x + dx, startPosRef.current.y + dy);
    }
  };

  const handlePlaceholderPointerUp = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    setIsDragging(false);

    if (placeholderRef.current) {
      try {
        placeholderRef.current.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }

    if (hasDraggedRef.current) {
      setTimeout(() => {
        hasDraggedRef.current = false;
      }, 80);
    }
  };

  const handlePlaceholderClick = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }

    // User clicked while still connecting
    pendingOpenRef.current = true;
    setIsLoadingChat(true);

    const widgetHost = document.querySelector("conferbot-widget") as HTMLElement | null;
    const realBtn = widgetHost?.shadowRoot?.querySelector<HTMLElement>("#open-chatbot");
    if (realBtn) {
      realBtn.click();
      setIsLoadingChat(false);
      pendingOpenRef.current = false;
    }
  };

  // ── Hook Real Conferbot When It Mounts ──
  useEffect(() => {
    let cleanupListeners: (() => void) | null = null;
    let isAttached = false;

    function attachToConferbot(): boolean {
      if (isAttached) return true;

      const widgetHost = document.querySelector("conferbot-widget") as HTMLElement | null;
      if (!widgetHost || !widgetHost.shadowRoot) return false;

      const shadow = widgetHost.shadowRoot;
      const button = shadow.querySelector<HTMLElement>("#open-chatbot");
      if (!button) return false;

      if (button.dataset.dsaDraggableReady === "true") return true;
      button.dataset.dsaDraggableReady = "true";
      isAttached = true;

      // ── 1. Inject Enhanced Larger Styling into Shadow DOM ──
      let styleTag = shadow.querySelector<HTMLStyleElement>("#conferbot-draggable-styles");
      if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = "conferbot-draggable-styles";
        styleTag.textContent = `
          /* High-Definition 68px Dimensions */
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
            box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.42), 0 4px 12px -2px rgba(0, 0, 0, 0.25), 0 0 0 2px rgba(255, 255, 255, 0.25) !important;
            transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.18s ease !important;
          }

          /* Hover Scale */
          #open-chatbot.chatbot__icon:hover {
            transform: scale(1.08) !important;
            box-shadow: 0 18px 40px -4px rgba(0, 0, 0, 0.52), 0 6px 16px -2px rgba(0, 0, 0, 0.3), 0 0 0 3px rgba(255, 255, 255, 0.35) !important;
          }

          /* Active Dragging */
          #open-chatbot.chatbot__icon.is-dragging {
            cursor: grabbing !important;
            transform: scale(1.12) !important;
            box-shadow: 0 24px 48px -4px rgba(0, 0, 0, 0.65), 0 0 0 4px rgba(99, 102, 241, 0.7) !important;
            transition: none !important;
          }

          /* Scaled Inner Graphics */
          #open-chatbot svg, 
          #open-chatbot img, 
          #open-chatbot .cb-launcher__mascot,
          #open-chatbot .cb-launcher__avatar,
          #open-chatbot .open-svg,
          #open-chatbot [id*="_open-icon"],
          #open-chatbot [id*="_close-icon"] {
            width: 38px !important;
            height: 38px !important;
            min-width: 38px !important;
            min-height: 38px !important;
            max-width: 40px !important;
            max-height: 40px !important;
            pointer-events: none !important;
          }

          /* Dynamic Chat Window Alignment */
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

      // ── 2. Sync Coordinates to real button ──
      const initialCoords = currentPosRef.current ?? {
        x: window.innerWidth - BUTTON_SIZE - 26,
        y: window.innerHeight - BUTTON_SIZE - 20,
      };

      button.style.setProperty("left", `${initialCoords.x}px`, "important");
      button.style.setProperty("top", `${initialCoords.y}px`, "important");
      button.style.setProperty("right", "auto", "important");
      button.style.setProperty("bottom", "auto", "important");
      button.style.setProperty("margin", "0", "important");

      const dock = initialCoords.x < window.innerWidth / 2 ? "left" : "right";
      widgetHost.setAttribute("data-cb-dock", dock);

      // ── 3. Real Button Drag Listeners ──
      let realPointerDown = false;
      let realHasDragged = false;
      let realStartX = 0;
      let realStartY = 0;
      let realBtnLeft = 0;
      let realBtnTop = 0;

      const onRealPointerDown = (e: PointerEvent) => {
        if (e.button !== 0) return;
        realPointerDown = true;
        realHasDragged = false;
        realStartX = e.clientX;
        realStartY = e.clientY;

        const rect = button.getBoundingClientRect();
        realBtnLeft = rect.left;
        realBtnTop = rect.top;

        try {
          button.setPointerCapture(e.pointerId);
        } catch (_) {}
      };

      const onRealPointerMove = (e: PointerEvent) => {
        if (!realPointerDown) return;
        const dx = e.clientX - realStartX;
        const dy = e.clientY - realStartY;

        if (!realHasDragged && Math.hypot(dx, dy) > 5) {
          realHasDragged = true;
          button.classList.add("is-dragging");
        }

        if (realHasDragged) {
          applyCoordinates(realBtnLeft + dx, realBtnTop + dy);
        }
      };

      const onRealPointerUp = (e: PointerEvent) => {
        if (!realPointerDown) return;
        realPointerDown = false;
        button.classList.remove("is-dragging");

        try {
          button.releasePointerCapture(e.pointerId);
        } catch (_) {}

        if (realHasDragged) {
          setTimeout(() => {
            realHasDragged = false;
          }, 80);
        }
      };

      const onRealClickCapture = (e: MouseEvent) => {
        if (realHasDragged) {
          e.stopImmediatePropagation();
          e.preventDefault();
        }
      };

      button.addEventListener("pointerdown", onRealPointerDown);
      window.addEventListener("pointermove", onRealPointerMove);
      window.addEventListener("pointerup", onRealPointerUp);
      window.addEventListener("pointercancel", onRealPointerUp);
      button.addEventListener("click", onRealClickCapture, true);

      cleanupListeners = () => {
        button.removeEventListener("pointerdown", onRealPointerDown);
        window.removeEventListener("pointermove", onRealPointerMove);
        window.removeEventListener("pointerup", onRealPointerUp);
        window.removeEventListener("pointercancel", onRealPointerUp);
        button.removeEventListener("click", onRealClickCapture, true);
      };

      // ── 4. Conferbot is fully active ──
      setIsConferbotReady(true);

      // If user clicked placeholder during loading, open chat now!
      if (pendingOpenRef.current) {
        pendingOpenRef.current = false;
        setIsLoadingChat(false);
        setTimeout(() => {
          button.click();
        }, 120);
      }

      return true;
    }

    if (!attachToConferbot()) {
      const observer = new MutationObserver(() => {
        if (attachToConferbot()) {
          observer.disconnect();
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      const poll = setInterval(() => {
        if (attachToConferbot()) {
          clearInterval(poll);
          observer.disconnect();
        }
      }, 150);

      const killTimer = setTimeout(() => {
        clearInterval(poll);
        observer.disconnect();
      }, 15000);

      return () => {
        observer.disconnect();
        clearInterval(poll);
        clearTimeout(killTimer);
        if (cleanupListeners) cleanupListeners();
      };
    }

    return () => {
      if (cleanupListeners) cleanupListeners();
    };
  }, [applyCoordinates]);

  // Compute position coordinates for immediate placeholder
  const currentLeft = position?.x ?? (typeof window !== "undefined" ? window.innerWidth - BUTTON_SIZE - 26 : 0);
  const currentTop = position?.y ?? (typeof window !== "undefined" ? window.innerHeight - BUTTON_SIZE - 20 : 0);

  return (
    <>
      {/* ── Instant Pre-Rendered Launcher (Zero-Millisecond Loading Delay) ── */}
      {!isConferbotReady && (
        <div
          ref={placeholderRef}
          role="button"
          tabIndex={0}
          aria-label="Open DSA404 AI Assistant"
          onClick={handlePlaceholderClick}
          onPointerDown={handlePlaceholderPointerDown}
          onPointerMove={handlePlaceholderPointerMove}
          onPointerUp={handlePlaceholderPointerUp}
          onPointerCancel={handlePlaceholderPointerUp}
          style={{
            position: "fixed",
            left: `${currentLeft}px`,
            top: `${currentTop}px`,
            width: `${BUTTON_SIZE}px`,
            height: `${BUTTON_SIZE}px`,
            zIndex: 99999998,
            cursor: isDragging ? "grabbing" : "grab",
            touchAction: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
          className={`flex items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 via-blue-600 to-indigo-500 text-white shadow-[0_12px_32px_-4px_rgba(79,70,229,0.55),0_0_0_2px_rgba(255,255,255,0.3)] transition-transform duration-200 active:scale-105 hover:scale-105 ${
            isDragging ? "scale-110 shadow-2xl" : ""
          }`}
        >
          {/* Subtle Online Pulse Beacon */}
          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-3 rounded-full border-2 border-white bg-emerald-500 shadow-xs" />
          </span>

          {isLoadingChat ? (
            /* Micro Spinning Ring when user clicked while script connects */
            <div className="relative flex flex-col items-center justify-center gap-1">
              <svg className="size-8 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : (
            /* High-Definition AI Assistant Chat Bubble */
            <svg
              className="size-9 drop-shadow-md transition-transform duration-150"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"
                fill="currentColor"
                fillOpacity="0.2"
              />
              <circle cx="8" cy="12" r="1.2" fill="currentColor" />
              <circle cx="12" cy="12" r="1.2" fill="currentColor" />
              <circle cx="16" cy="12" r="1.2" fill="currentColor" />
            </svg>
          )}
        </div>
      )}
    </>
  );
}

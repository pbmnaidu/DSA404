"use client";

import { useEffect } from "react";
import { createClient } from "@/integrations/supabase/client";

const LAST_ACTIVE_KEY = "dsa404-last-active-at";
const MAX_INACTIVITY_MS = 4 * 24 * 60 * 60 * 1000; // 4 days

/**
 * Keeps a "last active" timestamp in localStorage. Firebase Auth already
 * persists the session indefinitely (no logout on tab close / refresh) —
 * this hook adds the one extra rule that was requested: if the user hasn't
 * opened the app for 4+ days, sign them out automatically. Any active visit
 * refreshes the timestamp, so normal usage never triggers it.
 */
export function useInactivityLogout(enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const lastActive = Number(window.localStorage.getItem(LAST_ACTIVE_KEY) || 0);
    const now = Date.now();

    if (lastActive && now - lastActive > MAX_INACTIVITY_MS) {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          const token = window.localStorage.getItem(`dsa:fcm-token-uid:${user.id}`);
          if (token) {
            import("@/lib/db").then(({ removePushSubscription }) => {
              removePushSubscription(user.id, token).catch(() => {});
            });
            window.localStorage.removeItem(`dsa:fcm-token-uid:${user.id}`);
          }
        }
        supabase.auth.signOut().catch(() => {});
      });
      window.localStorage.removeItem(LAST_ACTIVE_KEY);
      return;
    }

    window.localStorage.setItem(LAST_ACTIVE_KEY, String(now));

    const refresh = () => window.localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [enabled]);
}

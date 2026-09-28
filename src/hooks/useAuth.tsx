"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/integrations/firebase/client";
import { isGuestMode, getGuestUser, disableGuestMode } from "@/lib/guest-data";

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined" && isGuestMode()) {
      return getGuestUser() as unknown as User;
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
      } else if (isGuestMode()) {
        setUser(getGuestUser() as unknown as User);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signOut = async () => {
    if (isGuestMode()) {
      disableGuestMode();
      setUser(null);
    }
    try {
      const { signOut: firebaseSignOut } = await import("firebase/auth");
      await firebaseSignOut(auth);
    } catch {}
  };

  return { user, loading, signOut };
}

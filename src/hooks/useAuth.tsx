"use client";

import { useEffect, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "@/integrations/supabase/client";
import { isGuestMode, getGuestUser, disableGuestMode } from "@/lib/guest-data";

export type CustomUser = SupabaseUser & {
 uid: string;
 displayName: string | null;
 photoURL: string | null;
};

function mapUser(su: SupabaseUser | null): CustomUser | null {
 if (!su) return null;
 return {
 ...su,
 uid: su.id,
 displayName: su.user_metadata?.full_name || su.user_metadata?.displayName || null,
 photoURL: su.user_metadata?.avatar_url || su.user_metadata?.photoURL || null,
 };
}

export function useAuth() {
 const [user, setUser] = useState<CustomUser | null>(() => {
 if (typeof window !== "undefined" && isGuestMode()) {
 return getGuestUser() as unknown as CustomUser;
 }
 return null;
 });
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 const supabase = createClient();
 
 // Initial fetch
 supabase.auth.getSession().then(({ data: { session } }) => {
 if (session?.user) {
 setUser(mapUser(session.user));
 } else if (isGuestMode()) {
 setUser(getGuestUser() as unknown as CustomUser);
 } else {
 setUser(null);
 }
 setLoading(false);
 });

 // Listen for auth changes
 const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
 if (session?.user) {
 setUser(mapUser(session.user));
 } else if (isGuestMode()) {
 setUser(getGuestUser() as unknown as CustomUser);
 } else {
 setUser(null);
 }
 setLoading(false);
 });

 return () => subscription.unsubscribe();
 }, []);

 const signOut = async () => {
 if (isGuestMode()) {
 disableGuestMode();
 setUser(null);
 }
 try {
 const supabase = createClient();
 const { data: { user: currentUser } } = await supabase.auth.getUser();
 if (currentUser) {
   const token = typeof window !== "undefined" ? window.localStorage.getItem(`dsa:fcm-token-uid:${currentUser.id}`) : null;
   if (token) {
     const { removePushSubscription } = await import("@/lib/db");
     await removePushSubscription(currentUser.id, token);
     window.localStorage.removeItem(`dsa:fcm-token-uid:${currentUser.id}`);
   }
 }
 await supabase.auth.signOut();
 } catch {}
 };

 return { user, loading, signOut };
}

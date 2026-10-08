'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlanProvider } from '@/hooks/usePlan'
import { SettingsProvider, useSettings } from '@/hooks/useSettings'
import { ReminderRunner } from '@/components/ReminderRunner'
import { AppShell } from '@/components/AppShell'
import { hasExistingPlan, seedPlan, ensureProfileExists } from '@/lib/db'
import { saveSettings } from '@/lib/settings'
import { QuoteLoader } from '@/components/QuoteLoader'
import { OnboardingModal } from '@/components/OnboardingModal'
import { useInactivityLogout } from '@/hooks/useInactivityLogout'
import type { DailyCounts } from '@/lib/plan'
import { isGuestUser } from '@/lib/guest-data'

import { useAuth } from '@/hooks/useAuth'

function isAlreadyOnboarded(userId: string, user: any) {
  if (user?.user_metadata?.onboarding_completed === true) return true;
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(`dsa404_onboarded_${userId}`) === 'true';
}

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)

  useInactivityLogout(!!user)

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        // If Supabase user (has .id) or Guest user (has .uid)
        setLoading(false)
        // Ensure a profiles row exists (covers users before the DB trigger was added)
        const uid = user.id || (user as any).uid;
        if (uid && !isGuestUser(uid)) {
          void ensureProfileExists(uid, {
            email: user.email ?? undefined,
            displayName: user.user_metadata?.full_name || user.user_metadata?.name || undefined,
            photoURL: user.user_metadata?.avatar_url || user.user_metadata?.picture || undefined,
          }).catch((err) => console.warn("Could not ensure profile exists:", err));
        }
      } else {
        router.push('/auth?next=/today')
      }
    }
  }, [user, authLoading, router])

  if (loading) {
    return <QuoteLoader fullScreen />
  }

  if (!user) {
    return null
  }

  const activeUserId = user.id || (user as any).uid;

  return (
    <SettingsProvider userId={activeUserId}>
      <PlanBoundary email={user.email ?? ''} userId={activeUserId} user={user}>
        {children}
      </PlanBoundary>
    </SettingsProvider>
  )
}

const ADMIN_EMAILS = ["404dsatracker@gmail.com"];

function PlanBoundary({
  email,
  userId,
  user,
  children,
}: {
  email: string
  userId: string
  user: any
  children: React.ReactNode
}) {
  const router = useRouter()
  const { settings, update: updateSettings, loading: settingsLoading } = useSettings()
  const [checkingPlan, setCheckingPlan] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [planReady, setPlanReady] = useState(false)

  const isAdmin = Boolean(email && ADMIN_EMAILS.includes(email.toLowerCase()));

  useEffect(() => {
    if (!userId) return;

    // Admin users skip onboarding entirely
    if (isAdmin) {
      setPlanReady(true);
      setCheckingPlan(false);
      return;
    }

    // 1. Fast path: if this browser or the auth session already knows onboarding is complete.
    if (isAlreadyOnboarded(userId, user)) {
      if (user?.user_metadata?.onboarding_completed === true && typeof window !== 'undefined') {
        localStorage.setItem(`dsa404_onboarded_${userId}`, 'true');
      }
      setPlanReady(true);
      setCheckingPlan(false);
      return;
    }

    // The remaining checks depend on loaded settings. Keep the current shell
    // responsive for known users, but avoid flashing onboarding before settings arrive.
    if (settingsLoading) return;

    // 2. Database check & returning user detection
    import('@/lib/db').then(({ isOnboardingCompleted }) => {
      isOnboardingCompleted(userId).then((isCompleted) => {
        if (isCompleted) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(`dsa404_onboarded_${userId}`, 'true');
          }
          setPlanReady(true);
          setCheckingPlan(false);
        } else {
          setShowOnboarding(true);
          setCheckingPlan(false);
        }
      }).catch((err) => {
        console.warn("Error checking onboarding status:", err);
        setPlanReady(true);
        setCheckingPlan(false);
      });
    });
  }, [userId, isAdmin, user, settings, settingsLoading]);

  const handleOnboardingComplete = async (payload: { 
    startDate: string; 
    counts: any; 
    username: string; 
    displayName: string; 
    password?: string; 
    sheetId: string; 
    theme: string;
    notifications: any;
  }) => {
    try {
      if (payload.password) {
        const { createClient } = await import('@/integrations/supabase/client');
        const supabase = createClient();
        await supabase.auth.updateUser({ password: payload.password });
      }
      
      const { saveSettings } = await import('@/lib/settings');
      await saveSettings(userId, { counts: payload.counts, theme: payload.theme as any, ...payload.notifications });
      
      const { createClient } = await import('@/integrations/supabase/client');
      const supabase = createClient();
      await supabase.from("user_settings").upsert({ 
        user_id: userId, 
        active_sheet: payload.sheetId,
      }, { onConflict: "user_id" });

      const { seedPlan } = await import('@/lib/db');
      await seedPlan(userId, payload.startDate, payload.counts, payload.sheetId);
      
      const { markOnboardingCompleted, updateUserProfile } = await import('@/lib/db');
      await markOnboardingCompleted(userId, payload.username);
      if (payload.displayName) {
        await updateUserProfile(userId, { displayName: payload.displayName });
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(`dsa404_onboarded_${userId}`, 'true');
        sessionStorage.removeItem(`dsa404_just_registered_${userId}`);
        window.location.href = '/guide';
      } else {
        setShowOnboarding(false);
        setPlanReady(true);
      }
    } catch (err) {
      console.error("Onboarding completion failed:", err);
      // Even if it fails, try to let them through
      if (typeof window !== 'undefined') {
        window.location.href = '/guide';
      }
    }
  }

  if (checkingPlan) {
    return <QuoteLoader fullScreen />
  }

  // Show onboarding modal — render a minimal shell behind it so app is ready
  if (showOnboarding) {
    const isGoogleAuth = user?.app_metadata?.provider === "google";
    const initialUsername = isGoogleAuth ? "" : (user?.user_metadata?.username || "");
    const initialDisplayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.user_metadata?.display_name || "";

    return (
      <>
        <OnboardingModal
          open={true}
          onComplete={handleOnboardingComplete}
          initialUsername={initialUsername}
          initialDisplayName={initialDisplayName}
        />
        {/* Faded background while onboarding */}
        <div className="fixed inset-0 bg-background z-40" />
      </>
    )
  }

  if (!planReady) {
    return <QuoteLoader fullScreen />
  }

  return (
    <PlanProvider userId={userId} paused={settings.paused}>
      <AppShell email={email}>
        <ReminderRunner />
        {children}
      </AppShell>
    </PlanProvider>
  )
}

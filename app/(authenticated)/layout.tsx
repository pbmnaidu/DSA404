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

import { useAuth } from '@/hooks/useAuth'

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
        if (uid && !(uid as string).startsWith('guest-')) {
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

    const localKey = `dsa404_onboarded_${userId}`;

    // 1. Fast path: if already marked in localStorage, skip onboarding
    if (typeof window !== 'undefined' && localStorage.getItem(localKey) === 'true') {
      setPlanReady(true);
      setCheckingPlan(false);
      return;
    }

    // 2. Fast path: if already marked in Auth user_metadata, skip onboarding (works across devices)
    if (user?.user_metadata?.onboarding_completed === true) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(localKey, 'true');
      }
      setPlanReady(true);
      setCheckingPlan(false);
      return;
    }

    // 3. Database check & returning user detection
    import('@/lib/db').then(({ isOnboardingCompleted, markOnboardingCompleted }) => {
      isOnboardingCompleted(userId).then((isCompleted) => {
        if (isCompleted) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(localKey, 'true');
          }
          setPlanReady(true);
          setCheckingPlan(false);
          return;
        }

        // Only show onboarding if user has just registered
        const isFreshRegistration = typeof window !== 'undefined' && (
          sessionStorage.getItem(`dsa404_just_registered_${userId}`) === 'true' ||
          new URLSearchParams(window.location.search).get('new_registration') === 'true'
        );

        const hasExistingPlanOrSettings = Boolean(
          (settings as any)?.start_date ||
          settings?.counts?.target ||
          (settings?.counts as any)?.onboarding_completed
        );

        // If returning user logging in on new browser/device -> do NOT show onboarding
        if (!isFreshRegistration && hasExistingPlanOrSettings) {
          void markOnboardingCompleted(userId);
          if (typeof window !== 'undefined') {
            localStorage.setItem(localKey, 'true');
          }
          setPlanReady(true);
          setCheckingPlan(false);
        } else {
          // Brand new user registration -> show onboarding once
          setShowOnboarding(true);
          setCheckingPlan(false);
        }
      }).catch((err) => {
        console.warn("Error checking onboarding status:", err);
        setPlanReady(true);
        setCheckingPlan(false);
      });
    });
  }, [userId, isAdmin, user, settings]);

  const handleOnboardingComplete = async (startDate: string, counts: DailyCounts) => {
    // Save their chosen settings
    await updateSettings({ counts });
    await saveSettings(userId, { counts });
    // Seed the plan with their chosen start date and pace counts
    await seedPlan(userId, startDate, counts);
    
    // Mark onboarding as complete across all layers (DB, Auth metadata, localStorage)
    const { markOnboardingCompleted } = await import('@/lib/db');
    await markOnboardingCompleted(userId);

    // Persist flag so refresh and new browsers won't show onboarding again
    if (typeof window !== 'undefined') {
      localStorage.setItem(`dsa404_onboarded_${userId}`, 'true');
      sessionStorage.removeItem(`dsa404_just_registered_${userId}`);
    }
    // Show the app — land on User Guide
    setShowOnboarding(false);
    setPlanReady(true);
    router.push('/guide');
  }

  if (checkingPlan || settingsLoading) {
    return <QuoteLoader fullScreen />
  }

  // Show onboarding modal — render a minimal shell behind it so app is ready
  if (showOnboarding) {
    return (
      <>
        <OnboardingModal
          open={true}
          onClose={async () => {
            const { DEFAULT_DAILY_COUNTS, todayIso } = await import('@/lib/plan');
            await handleOnboardingComplete(todayIso(), DEFAULT_DAILY_COUNTS);
          }}
          onComplete={handleOnboardingComplete}
        />
        {/* Faded background while onboarding */}
        <div className="fixed inset-0 bg-background  z-40" />
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

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
          });
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
      <PlanBoundary email={user.email ?? ''} userId={activeUserId}>
        {children}
      </PlanBoundary>
    </SettingsProvider>
  )
}

function PlanBoundary({
  email,
  userId,
  children,
}: {
  email: string
  userId: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const { settings, update: updateSettings, loading: settingsLoading } = useSettings()
  const [checkingPlan, setCheckingPlan] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [planReady, setPlanReady] = useState(false)

  useEffect(() => {
    if (!userId) return;

    // Fast path: if we already know this user finished onboarding, skip the DB query
    const localKey = `dsa404_onboarded_${userId}`;
    if (typeof window !== 'undefined' && localStorage.getItem(localKey) === 'true') {
      setPlanReady(true);
      setCheckingPlan(false);
      return;
    }

    hasExistingPlan(userId).then((exists) => {
      if (!exists) {
        // New user — show onboarding modal instead of redirecting to settings
        setShowOnboarding(true);
        setCheckingPlan(false);
      } else {
        // Mark as onboarded in localStorage so refresh never re-triggers modal
        if (typeof window !== 'undefined') {
          localStorage.setItem(localKey, 'true');
        }
        setPlanReady(true);
        setCheckingPlan(false);
      }
    });
  }, [userId]);

  const handleOnboardingComplete = async (startDate: string, counts: DailyCounts) => {
    // Save their chosen settings
    await updateSettings({ counts });
    await saveSettings(userId, { counts });
    // Seed the plan with their chosen start date and pace counts
    await seedPlan(userId, startDate, counts);
    // Persist flag so refresh won't show onboarding again
    if (typeof window !== 'undefined') {
      localStorage.setItem(`dsa404_onboarded_${userId}`, 'true');
    }
    // Show the app — land on Today's Workspace
    setShowOnboarding(false);
    setPlanReady(true);
    router.push('/today');
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
          onClose={() => {
            window.location.href = '/?onboarding=closed';
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
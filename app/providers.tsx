'use client'

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { ThemeCustomizerProvider } from './theme-customizer-context'
import { InAppBrowserProvider } from '@/components/in-app-browser/InAppBrowserContext'
import dynamic from 'next/dynamic'

// Dynamically import the modal so it doesn't block initial page load
const InAppBrowserModal = dynamic(
  () => import('@/components/in-app-browser/InAppBrowserModal').then(mod => mod.InAppBrowserModal),
  { ssr: false }
)

// Create a client for the entire app
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    },
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeCustomizerProvider>
        <InAppBrowserProvider>
          {children}
          <InAppBrowserModal />
          <Toaster />
        </InAppBrowserProvider>
      </ThemeCustomizerProvider>
    </QueryClientProvider>
  )
}

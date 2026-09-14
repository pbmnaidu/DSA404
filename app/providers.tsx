'use client'

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { ThemeCustomizerProvider } from './theme-customizer-context'
import { InAppBrowserProvider } from '@/components/in-app-browser/InAppBrowserContext'
import { InAppBrowserModal } from '@/components/in-app-browser/InAppBrowserModal'

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

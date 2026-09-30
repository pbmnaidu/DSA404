'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useInAppBrowser, isFrameRestrictedUrl } from './InAppBrowserContext';
import {
  X,
  Maximize2,
  Minimize2,
  RotateCw,
  ExternalLink,
  Copy,
  Check,
  Globe,
  Lock,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
  Info,
  SlidersHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';

function ChromeIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="4.2" fill="#4285F4" />
      <path d="M12 2C15.8 2 19 4.3 20.4 7.6L12 12V2Z" fill="#EA4335" />
      <path d="M20.4 7.6C21.4 9.4 22 11.4 22 13.5C22 17.8 19.1 21.4 15.1 22.4L12 12L20.4 7.6Z" fill="#FBBC05" />
      <path d="M15.1 22.4C14.1 22.8 13.1 23 12 23C5.9 23 1 18.1 1 12C1 9.5 1.8 7.2 3.2 5.3L12 12L15.1 22.4Z" fill="#34A853" />
      <circle cx="12" cy="12" r="4.6" fill="white" />
      <circle cx="12" cy="12" r="3.2" fill="#4285F4" />
    </svg>
  );
}

function getPlatformInfo(url: string) {
  try {
    const lower = url.toLowerCase();
    if (lower.includes('leetcode.com')) {
      return { name: 'LeetCode', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', icon: '⚡' };
    }
    if (lower.includes('geeksforgeeks.org')) {
      return { name: 'GeeksforGeeks', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', icon: '💚' };
    }
    if (lower.includes('codeforces.com')) {
      return { name: 'Codeforces', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', icon: '🔵' };
    }
    if (lower.includes('codechef.com')) {
      return { name: 'CodeChef', color: 'text-orange-500 bg-orange-500/10 border-orange-500/20', icon: '👨‍🍳' };
    }
    if (lower.includes('hackerrank.com')) {
      return { name: 'HackerRank', color: 'text-emerald-600 bg-emerald-600/10 border-emerald-600/20', icon: '🏆' };
    }
    if (lower.includes('hackerearth.com')) {
      return { name: 'HackerEarth', color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20', icon: '🌐' };
    }
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
      return { name: 'YouTube', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20', icon: '▶️' };
    }
    if (lower.includes('google.com')) {
      return { name: 'Google', color: 'text-sky-500 bg-sky-500/10 border-sky-500/20', icon: '🔍' };
    }
    if (lower.includes('github.com')) {
      return { name: 'GitHub', color: 'text-violet-500 bg-violet-500/10 border-violet-500/20', icon: '🐙' };
    }
    if (lower.includes('linkedin.com')) {
      return { name: 'LinkedIn', color: 'text-[#0077b5] bg-[#0077b5]/10 border-[#0077b5]/20', icon: '💼' };
    }
    const host = new URL(url).hostname.replace(/^www\./, '');
    return { name: host, color: 'text-primary bg-primary/10 border-primary/20', icon: '🌐' };
  } catch {
    return { name: 'External Link', color: 'text-muted-foreground bg-muted border-border', icon: '🔗' };
  }
}

export function InAppBrowserModal() {
  const {
    isOpen,
    url,
    title,
    isMaximized,
    iframeKey,
    closeInApp,
    reload,
    toggleMaximize,
  } = useInAppBrowser();

  const [isLoading, setIsLoading] = useState(true);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const [copied, setCopied] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [showPermissionsMenu, setShowPermissionsMenu] = useState(false);
  const [showHelperBanner, setShowHelperBanner] = useState(true);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Reset loading state whenever URL or reload key changes
  useEffect(() => {
    if (isOpen && url) {
      setIsLoading(true);
      setLoadTimedOut(false);
      setShowHelperBanner(true);

      // Timer to detect if iframe might be blocked by X-Frame-Options / CSP
      const timer = setTimeout(() => {
        setIsLoading(false);
        setLoadTimedOut(true);
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [isOpen, url, iframeKey]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeInApp();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeInApp]);

  // Prevent background body scroll when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !url) return null;

  const platform = getPlatformInfo(url);
  const displayTitle = title || platform.name;
  const frameCheck = isFrameRestrictedUrl(url);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleOpenExternal = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleRequestChromePermissions = async () => {
    let grantedItems = [];

    // 1. Notifications permission
    try {
      if ('Notification' in window) {
        const notifStatus = await Notification.requestPermission();
        if (notifStatus === 'granted') {
          grantedItems.push('Notifications');
        }
      }
    } catch {
      // ignore
    }

    // 2. Clipboard permission test
    try {
      if (navigator.clipboard) {
        grantedItems.push('Clipboard (Read/Write)');
      }
    } catch {
      // ignore
    }

    // 3. Media permissions query
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const pCam = await navigator.permissions.query({ name: 'camera' as any }).catch(() => null);
        if (pCam && pCam.state === 'granted') grantedItems.push('Camera');
      }
    } catch {
      // ignore
    }

    setPermissionsGranted(true);
    setShowPermissionsMenu(false);
    toast.success('Chrome permissions active for in-app browser! 🚀', {
      description: `Allowed: ${grantedItems.join(', ') || 'Full sandbox capabilities & clipboard access'}. For third-party cookies or logins, click "Try in Chrome".`,
      duration: 3500,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={displayTitle}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200 p-0 sm:p-3 md:p-5"
    >
      <div
        className={`bg-background border border-border/80 shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isMaximized
            ? 'fixed inset-0 w-screen h-screen rounded-none'
            : 'w-full max-w-6xl h-[98vh] sm:h-[92vh] rounded-none sm:rounded-2xl'
        }`}
      >
        {/* Browser Top Navigation Bar */}
        <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 bg-card border-b border-border/80 select-none shrink-0">
          {/* Left: Platform badge and Title */}
          <div className="flex items-center gap-2 min-w-0 max-w-[35%] sm:max-w-[30%]">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-lg border shrink-0 ${platform.color}`}
            >
              <span>{platform.icon}</span>
              <span className="truncate">{platform.name}</span>
            </span>
            <span
              className="text-xs font-semibold text-foreground truncate hidden sm:inline"
              title={displayTitle}
            >
              {displayTitle}
            </span>
          </div>

          {/* Center: Address Bar */}
          <div className="flex-1 min-w-[160px] max-w-lg mx-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/50 border border-border/70 text-xs">
            <Lock className="size-3 text-emerald-500 shrink-0" />
            <span className="truncate text-muted-foreground font-mono text-[11px] flex-1 select-all">
              {url}
            </span>

            <button
              type="button"
              onClick={handleCopyUrl}
              className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors shrink-0 cursor-pointer"
              title="Copy URL"
            >
              {copied ? (
                <Check className="size-3 text-emerald-500" />
              ) : (
                <Copy className="size-3" />
              )}
            </button>

            <button
              type="button"
              onClick={reload}
              className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors shrink-0 cursor-pointer"
              title="Reload page"
            >
              <RotateCw className={`size-3 ${isLoading ? 'animate-spin text-primary' : ''}`} />
            </button>
          </div>

          {/* Right: Actions (Try in Chrome, Permissions, Maximize, Close) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* "Try in Chrome" Button - Prominently featured */}
            <button
              type="button"
              onClick={handleOpenExternal}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              title="Open this link directly in Google Chrome"
            >
              <ChromeIcon className="size-3.5 shrink-0" />
              <span>Try in Chrome</span>
              <ArrowUpRight className="size-3 shrink-0 opacity-80" />
            </button>

            {/* Permissions Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPermissionsMenu((prev) => !prev)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                  permissionsGranted
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-border/70 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
                title="Manage or take permissions from Chrome"
              >
                <ShieldCheck className="size-3.5" />
                <span className="hidden md:inline">{permissionsGranted ? 'Permissions Active' : 'Permissions'}</span>
              </button>

              {showPermissionsMenu && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-border/80 bg-card p-3.5 shadow-2xl z-50 text-xs space-y-2.5 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="size-4 text-primary" /> Chrome Permissions
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPermissionsMenu(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Grant Chrome permissions to allow clipboard copy, notifications, and sandbox media for in-app browsing.
                  </p>
                  <div className="space-y-1 text-[11px] font-mono text-muted-foreground bg-muted/40 p-2 rounded-xl border border-border/50">
                    <div className="flex items-center justify-between">
                      <span>• Clipboard Access:</span>
                      <span className="text-emerald-500 font-bold">Enabled</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>• Sandbox Execution:</span>
                      <span className="text-emerald-500 font-bold">Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>• Popups &amp; Modals:</span>
                      <span className="text-emerald-500 font-bold">Allowed</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRequestChromePermissions}
                    className="w-full py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="size-3.5" />
                    <span>Request Full Permissions</span>
                  </button>
                </div>
              )}
            </div>

            {/* Maximize */}
            <button
              type="button"
              onClick={toggleMaximize}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition-colors hidden sm:inline-flex cursor-pointer"
              title={isMaximized ? 'Restore size' : 'Maximize'}
            >
              {isMaximized ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={closeInApp}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors ml-0.5 cursor-pointer"
              title="Close viewer (Esc)"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Security / Framing Info Banner */}
        {showHelperBanner && (
          <div className="px-3 sm:px-4 py-1.5 bg-primary/5 dark:bg-primary/10 border-b border-primary/20 flex items-center justify-between text-xs text-foreground/80 shrink-0">
            <div className="flex items-center gap-2 overflow-hidden">
              <Info className="size-3.5 text-primary shrink-0" />
              <span className="truncate text-[11.5px]">
                Showing link in-app. If {platform.name} restricts embedded framing (<code className="font-mono text-[10px] bg-muted/60 px-1 py-0.5 rounded">X-Frame-Options</code>), click <strong className="text-primary font-semibold">&quot;Try in Chrome&quot;</strong>.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <button
                type="button"
                onClick={handleOpenExternal}
                className="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Try in Chrome</span>
                <ArrowUpRight className="size-3" />
              </button>
              <button
                type="button"
                onClick={() => setShowHelperBanner(false)}
                className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                title="Dismiss"
              >
                <X className="size-3" />
              </button>
            </div>
          </div>
        )}

        {/* Browser Body with Embedded Iframe */}
        <div className="relative flex-1 w-full h-full bg-white dark:bg-zinc-950 overflow-hidden flex flex-col">
          {isLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-background/85 backdrop-blur-xs">
              <Loader2 className="size-8 text-primary animate-spin" />
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-foreground">Loading in DSA⁴⁰⁴...</p>
                <p className="text-xs text-muted-foreground font-mono truncate max-w-sm">{url}</p>
              </div>
            </div>
          )}

          {/* Embedded Iframe */}
          <iframe
            ref={iframeRef}
            key={iframeKey}
            src={url}
            title={displayTitle}
            onLoad={() => {
              setIsLoading(false);
              setLoadTimedOut(false);
            }}
            onError={() => {
              setIsLoading(false);
              setLoadTimedOut(true);
            }}
            className="w-full h-full border-0 bg-white"
            sandbox="allow-downloads allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
            allow="accelerometer; autoplay; camera; clipboard-read; clipboard-write; encrypted-media; fullscreen; geolocation; gyroscope; microphone; midi; payment; picture-in-picture; screen-wake-lock; usb; web-share"
          />

          {/* Floating Fallback Helper Card if Page may be blocked or timeout occurs */}
          {(loadTimedOut || frameCheck.isRestricted) && (
            <div className="absolute bottom-4 right-4 z-30 max-w-sm rounded-2xl border border-border/90 bg-card/95 backdrop-blur-xl p-3.5 shadow-2xl animate-in slide-in-from-bottom-3 duration-200">
              <div className="flex items-start gap-2.5">
                <div className="size-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                  <ChromeIcon className="size-4" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-xs font-bold text-foreground">Not displaying properly?</p>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {platform.name} may block embedding. Click below to continue in Google Chrome with full account login and permissions.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleOpenExternal}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-[11px] shadow-sm hover:bg-primary/90 transition-all cursor-pointer"
                    >
                      <ChromeIcon className="size-3" />
                      <span>Try in Chrome</span>
                      <ArrowUpRight className="size-3 opacity-80" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoadTimedOut(false)}
                      className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Status Bar */}
        <div className="px-3 sm:px-4 py-2 bg-card border-t border-border/80 flex items-center justify-between text-xs text-muted-foreground shrink-0 select-none">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-3.5 text-emerald-500" />
            <span className="font-semibold text-foreground/90">DSA⁴⁰⁴ In-App Browser</span>
            <span className="hidden sm:inline text-muted-foreground/60">·</span>
            <span className="hidden sm:inline text-[11px]">All links open in app</span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="hidden md:inline text-[11px] text-muted-foreground">
              Need full browser compiler, cookies or extensions?
            </span>
            <button
              type="button"
              onClick={handleOpenExternal}
              className="inline-flex items-center gap-1 font-bold text-primary hover:underline text-xs cursor-pointer"
            >
              <ChromeIcon className="size-3" />
              <span>Try in Chrome</span>
              <ArrowUpRight className="size-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';

function getPlatformInfo(url: string) {
  try {
    const lower = url.toLowerCase();
    if (lower.includes('leetcode.com')) {
      return { name: 'LeetCode', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
    }
    if (lower.includes('geeksforgeeks.org')) {
      return { name: 'GeeksforGeeks', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
    }
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
      return { name: 'YouTube', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' };
    }
    if (lower.includes('google.com')) {
      return { name: 'Google Search', color: 'text-sky-500 bg-sky-500/10 border-sky-500/20' };
    }
    if (lower.includes('codeforces.com')) {
      return { name: 'Codeforces', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' };
    }
    if (lower.includes('codechef.com')) {
      return { name: 'CodeChef', color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' };
    }
    if (lower.includes('hackerrank.com')) {
      return { name: 'HackerRank', color: 'text-emerald-600 bg-emerald-600/10 border-emerald-600/20' };
    }
    if (lower.includes('github.com')) {
      return { name: 'GitHub', color: 'text-violet-500 bg-violet-500/10 border-violet-500/20' };
    }
    const host = new URL(url).hostname.replace(/^www\./, '');
    return { name: host, color: 'text-primary bg-primary/10 border-primary/20' };
  } catch {
    return { name: 'External Link', color: 'text-muted-foreground bg-muted border-border' };
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
  const [copied, setCopied] = useState(false);

  // Reset loading state whenever URL or reload key changes
  useEffect(() => {
    if (isOpen && url) {
      setIsLoading(true);
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
    closeInApp();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={displayTitle}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 p-0 sm:p-4"
    >
      <div
        className={`bg-background border border-border/70 shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isMaximized
            ? 'fixed inset-0 w-screen h-screen rounded-none'
            : 'w-full max-w-6xl h-[95vh] sm:h-[88vh] rounded-none sm:rounded-2xl'
        }`}
      >
        {/* Browser Top Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2.5 bg-muted/40 border-b border-border select-none shrink-0">
          {/* Left: Platform badge and Title */}
          <div className="flex items-center gap-2 min-w-0 max-w-[40%] sm:max-w-[35%]">
            <span
              className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border shrink-0 ${platform.color}`}
            >
              {platform.name}
            </span>
            <span
              className="text-xs sm:text-sm font-medium text-foreground truncate"
              title={displayTitle}
            >
              {displayTitle}
            </span>
          </div>

          {/* Center: Address Bar */}
          <div className="flex-1 min-w-[200px] max-w-xl mx-auto flex items-center gap-1.5 px-3 py-1 rounded-lg bg-background border border-border/80 text-xs shadow-inner">
            <Lock className="size-3 text-emerald-500 shrink-0" />
            <span className="truncate text-muted-foreground font-mono text-[11px] flex-1 select-all">
              {url}
            </span>

            <button
              type="button"
              onClick={handleCopyUrl}
              className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors shrink-0"
              title="Copy URL"
            >
              {copied ? (
                <Check className="size-3 text-emerald-500" />
              ) : (
                <Copy className="size-3" />
              )}
            </button>

            {!frameCheck.isRestricted && (
              <button
                type="button"
                onClick={reload}
                className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors shrink-0"
                title="Reload page"
              >
                <RotateCw className={`size-3 ${isLoading ? 'animate-spin text-primary' : ''}`} />
              </button>
            )}
          </div>

          {/* Right: Actions (Open in Chrome, Maximize, Close) */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleOpenExternal}
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors shadow-xs"
              title="Open directly in Chrome / external browser"
            >
              <ExternalLink className="size-3" />
              <span className="hidden sm:inline">Open in Chrome</span>
            </button>

            <button
              type="button"
              onClick={toggleMaximize}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors hidden sm:inline-flex"
              title={isMaximized ? 'Restore size' : 'Maximize'}
            >
              {isMaximized ? (
                <Minimize2 className="size-4" />
              ) : (
                <Maximize2 className="size-4" />
              )}
            </button>

            <button
              type="button"
              onClick={closeInApp}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors ml-1"
              title="Close viewer (Esc)"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Browser Body */}
        <div className="relative flex-1 w-full h-full bg-white dark:bg-zinc-950 overflow-hidden flex flex-col">
          {frameCheck.isRestricted ? (
            /* Branded In-App Launch Hub for platforms that block iframe framing */
            <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-6 sm:p-10 text-center bg-radial from-muted/20 via-background to-background overflow-y-auto">
              <div className="max-w-md w-full rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                <div className="mx-auto size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                  <Globe className="size-7" />
                </div>

                <div className="space-y-2">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${platform.color}`}>
                    {platform.name}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground">
                    {displayTitle}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <strong className="text-foreground font-semibold">{platform.name}</strong> enforces strict browser security policies (<code className="text-[10.5px] bg-muted px-1.5 py-0.5 rounded border border-border/60 font-mono">frame-ancestors / X-Frame-Options</code>) that prevent rendering inside embedded iframes.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-muted/60 border border-border/70 text-xs text-foreground/80 text-left space-y-1 font-mono break-all select-all">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Target URL</span>
                  <span className="text-xs text-primary font-medium">{url}</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleOpenExternal}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Open on {platform.name}</span>
                    <ArrowUpRight className="size-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium transition-colors"
                  >
                    {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-muted-foreground/70">
                  Opening in full browser gives you access to the code compiler, your profile account, and solution submissions.
                </p>
              </div>
            </div>
          ) : (
            /* Normal Iframe for embeddable pages */
            <>
              {isLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/90 backdrop-blur-xs">
                  <Loader2 className="size-6 text-primary animate-spin" />
                  <span className="text-xs font-mono text-muted-foreground">
                    Loading in application...
                  </span>
                </div>
              )}

              <iframe
                key={iframeKey}
                src={url}
                title={displayTitle}
                onLoad={() => setIsLoading(false)}
                className="w-full h-full border-0 bg-white"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-presentation allow-downloads"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              />
            </>
          )}
        </div>

        {/* Bottom Status & Fallback Bar */}
        <div className="px-3 py-1.5 bg-muted/60 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground shrink-0 select-none">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-primary" />
            <span className="font-medium text-foreground/80">DSA⁴⁰⁴ In-App Viewer</span>
            <span className="hidden sm:inline text-muted-foreground/60">·</span>
            <span className="hidden sm:inline">Viewing inside your application</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden md:inline text-muted-foreground/75">
              For coding environments or interactive platforms:
            </span>
            <button
              type="button"
              onClick={handleOpenExternal}
              className="font-semibold text-primary hover:underline flex items-center gap-0.5"
            >
              <span>Open in Chrome</span>
              <ArrowUpRight className="size-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

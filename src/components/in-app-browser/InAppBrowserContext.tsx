'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface InAppBrowserContextType {
  isOpen: boolean;
  url: string;
  title: string;
  isMaximized: boolean;
  iframeKey: number;
  openInApp: (url: string, title?: string) => void;
  closeInApp: () => void;
  reload: () => void;
  toggleMaximize: () => void;
  openChatGPT: (url: string) => void;
}

const InAppBrowserContext = createContext<InAppBrowserContextType | null>(null);

/**
 * Checks if a URL targets ChatGPT
 */
export function isChatGPTUrl(url: string): boolean {
  if (!url) return false;
  return /chatgpt\.com/i.test(url) || /^chatgpt:\/\//i.test(url);
}

/**
 * Detects whether an external URL belongs to a platform that blocks 
 * third-party embedding via X-Frame-Options or Content-Security-Policy frame-ancestors.
 * Browser engines refuse to connect to these inside an iframe (ERR_BLOCKED_BY_RESPONSE).
 */
export function isFrameRestrictedUrl(url: string): { isRestricted: boolean; platformName: string } {
  if (!url) return { isRestricted: false, platformName: '' };
  try {
    const parsed = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');

    if (host.includes('geeksforgeeks.org')) {
      return { isRestricted: true, platformName: 'GeeksforGeeks' };
    }
    if (host.includes('leetcode.com')) {
      return { isRestricted: true, platformName: 'LeetCode' };
    }
    if (host.includes('codeforces.com')) {
      return { isRestricted: true, platformName: 'Codeforces' };
    }
    if (host.includes('codechef.com')) {
      return { isRestricted: true, platformName: 'CodeChef' };
    }
    if (host.includes('hackerrank.com')) {
      return { isRestricted: true, platformName: 'HackerRank' };
    }
    if (host.includes('hackerearth.com')) {
      return { isRestricted: true, platformName: 'HackerEarth' };
    }
    if (host.includes('github.com')) {
      return { isRestricted: true, platformName: 'GitHub' };
    }
    if (host.includes('takeuforward.org')) {
      return { isRestricted: true, platformName: 'TakeUForward' };
    }
    if (host.includes('interviewbit.com')) {
      return { isRestricted: true, platformName: 'InterviewBit' };
    }
    if (host.includes('google.com')) {
      return { isRestricted: true, platformName: 'Google Search' };
    }
    // YouTube search or watch pages block iframes (only /embed/ URLs allow frames)
    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      if (!parsed.pathname.startsWith('/embed/')) {
        return { isRestricted: true, platformName: 'YouTube' };
      }
    }
    return { isRestricted: false, platformName: host };
  } catch {
    return { isRestricted: false, platformName: '' };
  }
}

/**
 * Accurately detects whether the current environment is a mobile phone / tablet
 * (Android or iOS) vs a Laptop / Desktop (Windows, macOS, Linux, Chrome OS).
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isAndroid = /android/i.test(ua);
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isMobileUa = /Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  return isAndroid || isIOS || isMobileUa;
}

/**
 * Opens ChatGPT:
 * - On Mobile (Android / iOS): uses the native application or app intent if installed, with browser fallback.
 * - On Laptop / Desktop: OpenAI's desktop application protocol (chatgpt://) does not support pre-filling prompts
 *   via query parameters, leaving users with an empty chat box. Therefore on laptop/desktop,
 *   we redirect directly to the ChatGPT website (https://chatgpt.com/?q=...) where the prompt is automatically
 *   loaded into the input field, and also copy the prompt to the clipboard for instant access.
 */
export function openChatGPTUrl(url: string): void {
  if (typeof window === 'undefined') return;

  try {
    const isMobile = isMobileDevice();

    // ─── LAPTOP / DESKTOP FLOW ──────────────────────────────────────────────
    if (!isMobile) {
      let promptText = '';
      try {
        const parsed = new URL(url, window.location.origin);
        promptText = parsed.searchParams.get('q') || '';
      } catch {
        const match = url.match(/[?&]q=([^&]+)/);
        if (match) promptText = decodeURIComponent(match[1]);
      }

      // Automatically copy prompt to user's clipboard for instant convenience
      if (promptText && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(promptText).catch(() => {});
      }

      // Ensure URL is a web URL (https://)
      let webUrl = url;
      if (webUrl.startsWith('chatgpt://')) {
        webUrl = webUrl.replace(/^chatgpt:\/\//i, 'https://');
      }

      // Open directly in a new browser tab
      window.open(webUrl, '_blank', 'noopener,noreferrer');
      toast.success('Opening ChatGPT in browser (Prompt loaded & copied to clipboard!)', {
        duration: 3000,
      });
      return;
    }

    // ─── MOBILE FLOW (Android & iOS) ────────────────────────────────────────
    const isAndroid = /android/i.test(navigator.userAgent);

    let pathAndQuery = '';
    try {
      const parsed = new URL(url, window.location.origin);
      pathAndQuery = parsed.pathname + parsed.search + parsed.hash;
    } catch {
      pathAndQuery = url.replace(/^https?:\/\/[^/]+/i, '');
    }

    // Android Intent: Launches ChatGPT app package if installed,
    // otherwise Chrome automatically opens the S.browser_fallback_url!
    if (isAndroid) {
      toast.info('Opening ChatGPT...', { duration: 1500 });
      const intentUrl = `intent://chatgpt.com${pathAndQuery}#Intent;scheme=https;package=com.openai.chatgpt;S.browser_fallback_url=${encodeURIComponent(url)};end`;
      window.location.href = intentUrl;
      return;
    }

    // iOS: Try custom protocol chatgpt:// with blur/visibility fallback
    toast.info('Opening ChatGPT...', { duration: 1500 });
    const appSchemeUrl = `chatgpt://chatgpt.com${pathAndQuery}`;

    let appLaunched = false;
    const handleFocusLoss = () => {
      appLaunched = true;
    };

    window.addEventListener('blur', handleFocusLoss, { once: true });
    document.addEventListener('visibilitychange', handleFocusLoss, { once: true });

    // Attempt to launch via hidden anchor
    const hiddenLink = document.createElement('a');
    hiddenLink.href = appSchemeUrl;
    hiddenLink.setAttribute('data-in-app-ignore', 'true');
    hiddenLink.style.display = 'none';
    document.body.appendChild(hiddenLink);
    hiddenLink.click();

    setTimeout(() => {
      try {
        if (document.body.contains(hiddenLink)) {
          document.body.removeChild(hiddenLink);
        }
      } catch {}

      window.removeEventListener('blur', handleFocusLoss);
      document.removeEventListener('visibilitychange', handleFocusLoss);

      // If page is still visible and focused, ChatGPT app is not installed -> open in Chrome
      if (!appLaunched && !document.hidden) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }, 1200);
  } catch (err) {
    // Ultimate fallback: open directly in Chrome/browser
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export function InAppBrowserProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [isMaximized, setIsMaximized] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const openInApp = useCallback((targetUrl: string, targetTitle?: string) => {
    if (!targetUrl) return;
    setUrl(targetUrl);
    setTitle(targetTitle || '');
    setIsOpen(true);
  }, []);

  const closeInApp = useCallback(() => {
    setIsOpen(false);
    setUrl('');
    setTitle('');
  }, []);

  const reload = useCallback(() => {
    setIframeKey((prev) => prev + 1);
  }, []);

  const toggleMaximize = useCallback(() => {
    setIsMaximized((prev) => !prev);
  }, []);

  const openChatGPT = useCallback((targetUrl: string) => {
    openChatGPTUrl(targetUrl);
  }, []);

  // Global capture click listener to intercept external links anywhere in the application
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      // Only handle primary left clicks without modifier keys (let Ctrl/Cmd+click open in new tab if user wants)
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (!target) return;

      const anchor = target.closest('a');
      if (!anchor) return;

      // Check if specifically marked to be ignored by in-app browser
      if (anchor.getAttribute('data-in-app-ignore') === 'true') {
        return;
      }

      const rawHref = anchor.getAttribute('href');
      if (!rawHref) return;

      // Ignore hash links, javascript:, mailto:, tel:
      if (
        rawHref.startsWith('#') ||
        rawHref.startsWith('javascript:') ||
        rawHref.startsWith('mailto:') ||
        rawHref.startsWith('tel:')
      ) {
        return;
      }

      // Check if internal route
      const isInternal =
        (rawHref.startsWith('/') && !rawHref.startsWith('//')) ||
        rawHref.startsWith('./') ||
        rawHref.startsWith('../') ||
        rawHref.startsWith(window.location.origin) ||
        (!rawHref.startsWith('http://') && !rawHref.startsWith('https://') && !rawHref.startsWith('//'));

      if (isInternal) {
        // Internal navigation within the application, allow normal behavior
        return;
      }

      // At this point, it's an external link!
      event.preventDefault();
      event.stopPropagation();

      // Rule 1: ChatGPT links redirect to application (if on mobile), else to browser website
      if (isChatGPTUrl(rawHref)) {
        openChatGPTUrl(rawHref);
        return;
      }

      // Rule 2: Open all external links in the in-app browser viewer first.
      // Users can view inside the app or click "Try in Chrome" whenever preferred!
      const linkTitle =
        anchor.getAttribute('title') ||
        anchor.getAttribute('aria-label') ||
        anchor.innerText.trim() ||
        '';

      openInApp(rawHref, linkTitle);
    };

    // Attach in capture phase to reliably intercept before child component stopPropagation
    document.addEventListener('click', handleGlobalClick, { capture: true });

    return () => {
      document.removeEventListener('click', handleGlobalClick, { capture: true });
    };
  }, [openInApp]);

  return (
    <InAppBrowserContext.Provider
      value={{
        isOpen,
        url,
        title,
        isMaximized,
        iframeKey,
        openInApp,
        closeInApp,
        reload,
        toggleMaximize,
        openChatGPT,
      }}
    >
      {children}
    </InAppBrowserContext.Provider>
  );
}

export function useInAppBrowser() {
  const context = useContext(InAppBrowserContext);
  if (!context) {
    throw new Error('useInAppBrowser must be used within an InAppBrowserProvider');
  }
  return context;
}

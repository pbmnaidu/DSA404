import type { Metadata, Viewport } from 'next'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'DSA Preparation Tracker',
  description: 'Master DSA with a personalised comprehensive plan',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'DSA⁴⁰⁴',
  },
  icons: {
    icon: '/app-icon-circular.png',
    apple: '/app-icon-circular.png',
    shortcut: '/favicon.ico',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#4169E1',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
}

const antiFoucScript = `
(function() {
  try {
    if (localStorage.getItem('dsa-theme-version') !== '7') {
      localStorage.removeItem('dsa-tracker-theme-custom');
      localStorage.removeItem('dsa-theme-mode');
      localStorage.setItem('dsa-theme-version', '7');
    }
    if (typeof Element !== 'undefined' && Element.prototype.releasePointerCapture) {
      var origRelease = Element.prototype.releasePointerCapture;
      Element.prototype.releasePointerCapture = function(pointerId) {
        try {
          if (this.hasPointerCapture && this.hasPointerCapture(pointerId)) {
            origRelease.call(this, pointerId);
          }
        } catch (e) {}
      };
    }

    var doc = document.documentElement;
    doc.classList.add('disable-transitions');
    
    // Support dark mode if explicitly set, else Pearl & Royal (light)
    var savedMode = localStorage.getItem('dsa-theme-mode');
    var isDark = savedMode === 'dark';
    if (isDark) {
      doc.classList.add('dark');
      doc.classList.remove('light');
      doc.style.colorScheme = 'dark';
    } else {
      doc.classList.add('light');
      doc.classList.remove('dark');
      doc.style.colorScheme = 'light';
    }

    var savedFont = localStorage.getItem('dsa-tracker-font');
    if (savedFont) {
      doc.style.setProperty('--font-sans', savedFont);
      doc.style.fontFamily = savedFont;
      var match = savedFont.match(/'([^']+)'/);
      var fontName = match ? match[1] : null;
      if (fontName && fontName !== 'Inter' && fontName !== 'Geist') {
        var id = 'gf-' + fontName.replace(/\\s/g, '');
        if (!document.getElementById(id)) {
          var link = document.createElement('link');
          link.id = id;
          link.rel = 'stylesheet';
          link.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(fontName) + ':wght@400;500;600;700;900&display=swap';
          document.head.appendChild(link);
        }
      }
    }

    var savedSize = localStorage.getItem('dsa-tracker-font-size');
    if (savedSize && savedSize !== 'auto') {
      doc.style.fontSize = savedSize;
    } else {
      doc.style.fontSize = '';
    }

    var savedView = localStorage.getItem('dsa-tracker-force-view');
    if (savedView === 'desktop') {
      var meta = document.querySelector('meta[name="viewport"]');
      if (meta) meta.setAttribute('content', 'width=1280');
    }

    setTimeout(function() {
      doc.classList.remove('disable-transitions');
    }, 150);
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* PWA Title Bar & Auxiliary Wizard Window Colors */}
        <meta name="theme-color" content="#4169E1" />
        <meta name="msapplication-navbutton-color" content="#4169E1" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        {/* Synchronous anti-FOUC script — applies saved theme, custom colors, and typography before paint */}
        <script id="anti-fouc" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: antiFoucScript }} />
      </head>
      <body className="antialiased text-foreground min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

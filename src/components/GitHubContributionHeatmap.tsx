// src/components/GitHubContributionHeatmap.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { GitHubIcon } from "./SocialIcons";
import { ExternalLink, Flame, RefreshCw, AlertCircle } from "lucide-react";

export function extractGitHubUsername(raw?: string | null): string {
 if (!raw) return "";
 const cleaned = raw.trim();
 // Match https://github.com/username or github.com/username or /username
 const match = cleaned.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_\-]+)/i);
 if (match && match[1]) {
 return match[1];
 }
 // Strip leading @ and any trailing path/hash/query
 const handle = cleaned.replace(/^@/, "").replace(/[/?#].*$/, "").trim();
 if (/^[a-zA-Z0-9_\-]+$/.test(handle)) {
 return handle;
 }
 return "";
}

export function resolveGitHubUrl(raw?: string | null): string {
 if (!raw) return "";
 const cleaned = raw.trim();
 if (!cleaned) return "";
 // Check if it's already a full github.com url
 const match = cleaned.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_\-]+(?:\/[a-zA-Z0-9_\-]+)?)/i);
 if (match && match[1]) {
 return `https://github.com/${match[1]}`;
 }
 const extracted = extractGitHubUsername(cleaned);
 if (extracted) {
 return `https://github.com/${extracted}`;
 }
 if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
 return cleaned;
 }
 const handle = cleaned.replace(/^@+/, "").trim();
 if (handle) {
 return `https://github.com/${handle}`;
 }
 return "";
}

interface GitHubContributionHeatmapProps {
 username: string;
 className?: string;
 accentColor?: string; // hex without #, e.g. "22c55e" (emerald) or "f97316" (orange)
}

export function GitHubContributionHeatmap({
 username,
 className = "",
 accentColor = "22c55e",
}: GitHubContributionHeatmapProps) {
 const [imgError, setImgError] = useState(false);
 const [loading, setLoading] = useState(true);

 const cleanUser = extractGitHubUsername(username);
 if (!cleanUser) return null;

 const chartUrl = `https://ghchart.rshah.org/${accentColor}/${encodeURIComponent(cleanUser)}`;
 const profileUrl = `https://github.com/${encodeURIComponent(cleanUser)}`;

 const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [loading]);
  return (
 <section className={`rounded-lg border border-border bg-card p-5 sm:p-6 shadow-sm overflow-hidden ${className}`}>
 {/* Header */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4 mb-4">
 <div className="flex items-center gap-3">
 <div className="size-9 rounded-lg bg-muted text-white flex items-center justify-center shrink-0 border border-border shadow-sm">
 <GitHubIcon className="size-5" />
 </div>
 <div>
 <div className="flex items-center gap-2 flex-wrap">
 <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
 GitHub Contribution Activity
 </h2>
 <span className="inline-flex items-center gap-1 rounded-full bg-muted text-success border border-border px-2 py-0.5 text-[10px] font-mono font-bold">
 <Flame className="size-3" /> LIVE GITHUB HEATMAP
 </span>
 </div>
 <p className="text-xs text-foreground mt-0.5">
 52-week contribution chart auto-fetched from{" "}
 <span className="font-mono font-semibold text-primary">github.com/{cleanUser}</span>
 </p>
 </div>
 </div>

 <a
 href={profileUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-border bg-background hover:bg-muted px-3 py-1.5 text-xs font-semibold text-foreground transition-all hover:scale-105 shadow-xs"
 title={`Visit @${cleanUser} on GitHub`}
 >
 <GitHubIcon className="size-3.5" />
 <span>@{cleanUser}</span>
 <ExternalLink className="size-3 ml-0.5" />
 </a>
 </div>

 {/* Heatmap Area */}
 {imgError ? (
 <div className="rounded-lg border border-border bg-muted p-6 text-center space-y-2">
 <AlertCircle className="size-6 text-foreground mx-auto" />
 <p className="text-xs text-foreground">
 Could not render contribution chart for <strong className="text-foreground">@{cleanUser}</strong>.
 </p>
 <a
 href={profileUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline"
 >
 <span>View contributions directly on GitHub</span>
 <ExternalLink className="size-3" />
 </a>
 </div>
 ) : (
 <div className="space-y-3">
 {/* Scrollable container for full 52-week width on mobile */}
 <div className="w-full overflow-x-auto rounded-lg border border-border bg-background p-3 sm:p-4 shadow-sm relative" ref={scrollRef}>
 {loading && (
 <div className="h-28 flex items-center justify-center text-xs text-foreground gap-2">
 <RefreshCw className="size-4 animate-spin text-primary" />
 <span>Loading GitHub contribution heatmap...</span>
 </div>
 )}
 <img
 src={chartUrl}
 alt={`${cleanUser}'s GitHub contributions heatmap`}
 onLoad={() => setLoading(false)}
 onError={() => {
 setLoading(false);
 setImgError(true);
 }}
 className={`w-full min-w-[650px] max-w-full h-auto transition-opacity duration-300 ${
 loading ? "opacity-0 absolute" : "opacity-100"
 }`}
 style={{ filter: "brightness(0.95) contrast(1.05)" }}
 />
 </div>

 {/* Footer stats & legend */}
 <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-foreground pt-1">
 <div className="flex items-center gap-2">
 <span className="text-[11px]">Commit Frequency:</span>
 <div className="flex items-center gap-1">
 <span className="text-[10px] font-mono">Less</span>
 <span className="size-2.5 rounded-xs bg-muted" />
 <span className="size-2.5 rounded-xs bg-muted" />
 <span className="size-2.5 rounded-xs bg-muted" />
 <span className="size-2.5 rounded-xs bg-success" />
 <span className="text-[10px] font-mono">More</span>
 </div>
 </div>

 <div className="flex items-center gap-3 text-[11px]">
 <a
 href={`${profileUrl}?tab=repositories`}
 target="_blank"
 rel="noopener noreferrer"
 className="hover:text-primary transition-colors inline-flex items-center gap-1"
 >
 <span>Repositories</span>
 <ExternalLink className="size-2.5 " />
 </a>
 <span>•</span>
 <a
 href={`${profileUrl}?tab=stars`}
 target="_blank"
 rel="noopener noreferrer"
 className="hover:text-primary transition-colors inline-flex items-center gap-1"
 >
 <span>Stars</span>
 <ExternalLink className="size-2.5 " />
 </a>
 </div>
 </div>
 </div>
 )}
 </section>
 );
}

// src/components/GitHubContributionHeatmap.tsx
"use client";

import { useState } from "react";
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

  return (
    <section className={`rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-zinc-900 dark:bg-white/10 text-white flex items-center justify-center shrink-0 border border-white/15 shadow-sm">
            <GitHubIcon className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
                GitHub Contribution Activity
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-bold">
                <Flame className="size-3" /> LIVE GITHUB HEATMAP
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              52-week contribution chart auto-fetched from{" "}
              <span className="font-mono font-semibold text-primary">github.com/{cleanUser}</span>
            </p>
          </div>
        </div>

        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-border/80 bg-background/80 hover:bg-muted px-3 py-1.5 text-xs font-semibold text-foreground transition-all hover:scale-105 shadow-xs"
          title={`Visit @${cleanUser} on GitHub`}
        >
          <GitHubIcon className="size-3.5" />
          <span>@{cleanUser}</span>
          <ExternalLink className="size-3 opacity-60 ml-0.5" />
        </a>
      </div>

      {/* Heatmap Area */}
      {imgError ? (
        <div className="rounded-xl border border-border/60 bg-muted/20 p-6 text-center space-y-2">
          <AlertCircle className="size-6 text-muted-foreground mx-auto" />
          <p className="text-xs text-muted-foreground">
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
          <div className="w-full overflow-x-auto rounded-xl border border-border/50 bg-background/60 p-3 sm:p-4 shadow-inner relative">
            {loading && (
              <div className="h-28 flex items-center justify-center text-xs text-muted-foreground gap-2">
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
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px]">Commit Frequency:</span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-mono">Less</span>
                <span className="size-2.5 rounded-xs bg-zinc-700/30" />
                <span className="size-2.5 rounded-xs bg-emerald-500/40" />
                <span className="size-2.5 rounded-xs bg-emerald-500/70" />
                <span className="size-2.5 rounded-xs bg-emerald-500" />
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
                <ExternalLink className="size-2.5 opacity-60" />
              </a>
              <span>•</span>
              <a
                href={`${profileUrl}?tab=stars`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors inline-flex items-center gap-1"
              >
                <span>Stars</span>
                <ExternalLink className="size-2.5 opacity-60" />
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

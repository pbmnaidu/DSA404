"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ShieldCheck, ExternalLink, Info, HeartHandshake, Scale, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LegalDisclaimerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LegalDisclaimerModal({ open, onOpenChange }: LegalDisclaimerModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto p-6 sm:p-7 border border-border bg-card text-card-foreground">
        <DialogHeader className="space-y-2 border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Scale className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold font-display">
                Legal Disclaimer &amp; Content Attribution
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Educational Transparency, Trademark Notice &amp; Creator Acknowledgments
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 text-xs sm:text-sm leading-relaxed text-foreground/90 py-2">
          {/* Section 1: Non-Affiliation */}
          <div className="p-3.5 rounded-lg bg-secondary/60 border border-border space-y-2">
            <div className="flex items-center gap-2 font-semibold text-foreground text-xs sm:text-sm">
              <Info className="size-4 text-primary shrink-0" />
              <span>Independent Educational Tool (Non-Affiliation Notice)</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>DSA⁴⁰⁴</strong> is an independent, non-commercial educational progress tracking platform built solely for students, developers, and competitive programmers to organize their daily practice habits. 
              <strong> DSA⁴⁰⁴ is NOT affiliated with, sponsored by, authorized by, or endorsed by Raj Vikramaditya (Striver), takeUforward, NeetCode, Love Babbar (CodeHelp), LeetCode, or GeeksforGeeks.</strong>
            </p>
          </div>

          {/* Section 2: Creator Acknowledgments */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <HeartHandshake className="size-4 text-primary shrink-0" />
              <span>Curriculum &amp; Creator Attributions</span>
            </div>
            <p className="text-xs text-muted-foreground">
              We express immense gratitude to the educators and creators who build publicly accessible roadmaps for the community. All listed roadmaps are credited to their rightful creators:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="p-3 rounded-md border border-border bg-background space-y-1">
                <p className="font-semibold text-xs text-foreground">Striver’s A2Z &amp; SDE Sheets</p>
                <p className="text-[11px] text-muted-foreground">
                  Authored and curated by <strong>Raj Vikramaditya (Striver)</strong>.
                </p>
                <a
                  href="https://takeuforward.org"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-mono pt-1"
                >
                  takeuforward.org <ExternalLink className="size-2.5" />
                </a>
              </div>

              <div className="p-3 rounded-md border border-border bg-background space-y-1">
                <p className="font-semibold text-xs text-foreground">NeetCode 150 Roadmap</p>
                <p className="text-[11px] text-muted-foreground">
                  Curated and structured by <strong>NeetCode</strong>.
                </p>
                <a
                  href="https://neetcode.io"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-mono pt-1"
                >
                  neetcode.io <ExternalLink className="size-2.5" />
                </a>
              </div>

              <div className="p-3 rounded-md border border-border bg-background space-y-1">
                <p className="font-semibold text-xs text-foreground">Love Babbar 450 Sheet</p>
                <p className="text-[11px] text-muted-foreground">
                  Curated by <strong>Love Babbar</strong> (CodeHelp).
                </p>
                <a
                  href="https://www.youtube.com/@CodeHelp"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-mono pt-1"
                >
                  YouTube: @CodeHelp <ExternalLink className="size-2.5" />
                </a>
              </div>

              <div className="p-3 rounded-md border border-border bg-background space-y-1">
                <p className="font-semibold text-xs text-foreground">Coding Platforms</p>
                <p className="text-[11px] text-muted-foreground">
                  Problems hosted by <strong>LeetCode</strong>, <strong>GeeksforGeeks</strong>, etc.
                </p>
                <span className="text-[11px] text-muted-foreground font-mono pt-1 block">
                  All rights belong to respective platforms.
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Content Hosting & External Links */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <ShieldCheck className="size-4 text-primary shrink-0" />
              <span>Third-Party Links &amp; No Proprietary Content Hosted</span>
            </div>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
              <li>
                <strong>External Direct Links:</strong> All practice problem buttons open public URLs on canonical platforms (LeetCode.com, GeeksforGeeks.org, HackerRank). DSA⁴⁰⁴ does not host or duplicate question statements.
              </li>
              <li>
                <strong>Video Guidance:</strong> All video recommendations redirect to official creator channels and public YouTube search results, directly supporting original creators and channel traffic.
              </li>
              <li>
                <strong>No Paid Content:</strong> DSA⁴⁰⁴ does not mirror, reproduce, or resell any proprietary editorial articles, private courses, or copyrighted solution writeups.
              </li>
              <li>
                <strong>Tracking Worksheets:</strong> Provided Excel files are community tracking templates for offline personal progress logging.
              </li>
            </ul>
          </div>

          {/* Section 4: Nominative Fair Use & Trademarks */}
          <div className="p-3 rounded-lg border border-border bg-muted/40 text-xs text-muted-foreground space-y-1.5">
            <p className="font-semibold text-foreground">Trademark Notice &amp; Nominative Fair Use</p>
            <p className="text-[11px] leading-relaxed">
              Names such as “Striver”, “takeUforward”, “NeetCode”, “Love Babbar”, “LeetCode”, and “GeeksforGeeks” are trademarks of their respective owners. Their mention on this platform constitutes descriptive, nominative fair use strictly to identify the public curricula and help students track their study journey.
            </p>
          </div>

          {/* Section 5: DMCA / Content Removal Request */}
          <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Mail className="size-3.5 text-primary" />
              <span>Creator / Rights Holder Inquiries</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              If you are a copyright or trademark holder and have any concerns regarding how your curriculum is referenced, please reach out to us at{" "}
              <a href="mailto:pbmnaidu@gmail.com" className="text-primary font-mono font-medium hover:underline">
                pbmnaidu@gmail.com
              </a>{" "}
              or via GitHub. We will address, modify, or remove any references promptly and amicably.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-border">
          <Button onClick={() => onOpenChange(false)} size="sm" className="font-semibold">
            Understood &amp; Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

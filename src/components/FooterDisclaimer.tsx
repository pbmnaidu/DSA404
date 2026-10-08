"use client";

import React, { useState } from "react";
import { Scale, HeartHandshake, ShieldCheck } from "lucide-react";
import { LegalDisclaimerModal } from "@/components/LegalDisclaimerModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FooterDisclaimerProps {
  className?: string;
}

export function FooterDisclaimer({ className }: FooterDisclaimerProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <footer className={cn("mt-12 pt-6 border-t border-border text-center text-xs text-muted-foreground", className)}>
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-left">
            <span className="font-semibold text-foreground">DSA⁴⁰⁴</span>
            <span>•</span>
            <span className="text-[11px] text-muted-foreground">
              Independent study &amp; roadmap companion. Not affiliated with takeUforward, NeetCode, or LeetCode.
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-foreground hover:text-primary transition-colors cursor-pointer underline-offset-4 hover:underline"
            >
              <Scale className="size-3 text-primary" />
              <span>Legal &amp; Attribution</span>
            </button>
          </div>
        </div>
      </footer>

      <LegalDisclaimerModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}

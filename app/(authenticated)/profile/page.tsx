"use client";

import { CoderProfilePage } from "@/components/CoderProfilePage";
import { UserCircle2 } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm md:flex-row md:items-center md:p-8">
        <UserCircle2 className="pointer-events-none absolute right-8 size-48 text-primary opacity-[0.035]" aria-hidden="true" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <UserCircle2 className="size-5" aria-hidden="true" />
            </div>
            <h1 className="font-display text-2xl font-black tracking-tight text-foreground md:text-3xl">Profile</h1>
          </div>
          <p className="max-w-xl text-sm text-muted-foreground">
            Manage your identity, coding profiles, learning progress, and public portfolio.
          </p>
        </div>
      </div>
      <CoderProfilePage />
    </div>
  );
}

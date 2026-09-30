"use client";

import { CoderProfilePage } from "@/components/CoderProfilePage";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your identity, coding profiles, and public portfolio.</p>
      </div>
      <CoderProfilePage />
    </div>
  );
}

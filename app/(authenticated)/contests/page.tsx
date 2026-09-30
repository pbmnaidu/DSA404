"use client";



import { ContestsPageSection } from "@/components/ContestsSection";


export default function ContestsPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Contests</h1>
        <p className="text-sm text-muted-foreground mt-1">Live, upcoming, and past coding contests from multiple platforms.</p>
      </div>
      <ContestsPageSection />
    </>
  );
}

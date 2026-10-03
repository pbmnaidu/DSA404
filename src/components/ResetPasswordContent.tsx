"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/PasswordInput";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ResetPasswordContent() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [validSession, setValidSession] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setValidSession(!!session);
      setChecking(false);
    });
  }, []);

  async function submit() {
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      toast.success("Password updated");
      router.push("/auth?next=/today");
    } catch (e: any) {
      toast.error(e.message || "Could not reset your password.");
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Skeleton className="h-64 w-full max-w-md rounded-lg" />
      </main>
    );
  }

  if (!validSession) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-lg border border-border bg-muted p-8 text-center space-y-4">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-destructive">
            <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Invalid or Expired Link</h2>
          <p className="text-sm text-foreground">
            This reset link is no longer valid. Please request a new one from the sign-in page.
          </p>
          <Button variant="outline" className="w-full mt-4" onClick={() => router.push("/auth?next=/today")}>
            Return to Sign In
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-lg aspect-square bg-muted blur-[100px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto mb-6 flex size-12 items-center justify-center rounded-lg bg-muted border border-border text-primary">
            <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Set New Password</h1>
          <p className="text-sm text-foreground">
            Enter a new password for your account. Make sure it's at least 8 characters long.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 md:p-8 shadow-sm space-y-6">
          <div className="space-y-2">
            <Label htmlFor="np" className="text-sm font-semibold uppercase tracking-wider text-foreground">New password</Label>
            <PasswordInput
              id="np"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-secondary border-border h-12 rounded-lg"
            />
          </div>
          <Button 
            className="w-full h-12 rounded-lg font-bold text-sm bg-primary text-primary-foreground hover:bg-muted" 
            disabled={busy || password.length < 8} 
            onClick={() => submit()}
          >
            {busy ? "Updating..." : "Update password"}
          </Button>
        </div>
      </div>
    </main>
  );
}


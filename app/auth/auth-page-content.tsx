"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { DSA404Logo } from "@/components/DSA404Logo";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/PasswordInput";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, User as UserIcon, AtSign, Mail, Lock, Sparkles } from "lucide-react";
import { enableGuestMode } from "@/lib/guest-data";
import {
  claimUsername,
  getEmailByUsername,
  isUsernameAvailable,
  normalizeUsername,
  saveUserProfile,
  USERNAME_REGEX,
} from "@/lib/db";

const emailSchema = z.string().trim().email("Enter a valid email address").max(255);
const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(72);

function authErrorMessage(e: any): string {
  if (e?.message) {
    if (e.message.includes("Invalid login credentials")) return "Invalid email/username or password.";
    if (e.message.includes("already registered")) return "An account with this email already exists.";
    return e.message;
  }
  return String(e || "An error occurred");
}

function runAfterAuth(task: () => Promise<void>, label: string) {
  void task().catch((error) => {
    console.warn(`[auth] ${label} failed:`, error);
  });
}

export function AuthPageContent() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/today";

  const initialModeParam = searchParams.get("mode") || searchParams.get("tab") || searchParams.get("type");

  const [mode, setMode] = useState<"signin" | "signup">(() => {
    if (initialModeParam === "signup" || initialModeParam === "register") return "signup";
    return "signin";
  });

  useEffect(() => {
    const m = searchParams.get("mode") || searchParams.get("tab") || searchParams.get("type");
    if (m === "signup" || m === "register") {
      setMode("signup");
    } else if (m === "signin" || m === "login") {
      setMode("signin");
    }
  }, [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    router.prefetch(next);
    router.prefetch("/admin");
  }, [router, next]);

  function handleGuestLogin() {
    enableGuestMode();
    toast.success("Welcome to Demo Mode! 🎉", {
      description: "Logged in as Alex Rivera (3★ Coder Account).",
    });
    router.replace(next || "/today");
  }

  useEffect(() => {
    const raw = username.trim();
    if (!raw) {
      setUsernameStatus("idle");
      return;
    }
    const u = normalizeUsername(raw);
    if (!USERNAME_REGEX.test(u)) {
      setUsernameStatus("invalid");
      return;
    }
    setUsernameStatus("checking");
    const t = setTimeout(async () => {
      try {
        const available = await isUsernameAvailable(u);
        setUsernameStatus(available ? "available" : "taken");
      } catch {
        setUsernameStatus("idle");
      }
    }, 400);
    return () => clearTimeout(t);
  }, [username, mode]);

  async function proceedAfterAuth(user: User, successMessage?: { title: string; description?: string }) {
    if (successMessage) toast.success(successMessage.title, { description: successMessage.description });
    try {
      const isAdminEmail = user.email === "404dsatracker@gmail.com";
      if (isAdminEmail || user.app_metadata?.admin || user.user_metadata?.admin) {
        router.replace("/admin");
        return;
      }
    } catch {
      // Ignored
    }
    router.replace(next);
  }

  async function handleSignIn() {
    const identifier = email.trim();
    if (!identifier) {
      toast.error("Please enter your email or username.");
      return;
    }

    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        toast.error(e.issues[0]?.message ?? "Invalid password.");
      }
      return;
    }

    setBusy(true);
    try {
      let targetEmail = identifier;
      if (!identifier.includes("@")) {
        const resolved = await getEmailByUsername(identifier);
        if (!resolved) {
          toast.error("No account found with that username.");
          setBusy(false);
          return;
        }
        targetEmail = resolved;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error("No user returned");

      // Mark local storage immediately on sign in so onboarding never shows on returning logins
      if (typeof window !== "undefined") {
        localStorage.setItem(`dsa404_onboarded_${data.user.id}`, "true");
        sessionStorage.removeItem(`dsa404_just_registered_${data.user.id}`);
      }

      void proceedAfterAuth(data.user, {
        title: "Welcome back! Thanks for logging in to our website.",
        description: "Ready to solve today's DSA problems?",
      });
    } catch (e) {
      toast.error(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleSignUp() {
    const trimmedEmail = email.trim();
    const trimmedName = fullName.trim();
    const u = normalizeUsername(username);

    if (!trimmedName) {
      toast.error("Please enter your full name.");
      return;
    }

    if (!u) {
      toast.error("Please choose a username.");
      return;
    }
    if (!USERNAME_REGEX.test(u)) {
      toast.error("Username must be 3-20 characters: lowercase letters, numbers, - or _ only.");
      return;
    }

    try {
      emailSchema.parse(trimmedEmail);
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        toast.error(e.issues[0]?.message ?? "Invalid input.");
      }
      return;
    }

    setBusy(true);
    try {
      const available = await isUsernameAvailable(u);
      if (!available) {
        toast.error("That username is already taken. Please choose another.");
        setUsernameStatus("taken");
        setBusy(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: trimmedName,
            username: u,
          }
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error("Sign up failed");

      // Claim username in legacy DB
      await claimUsername(data.user.id, u, trimmedEmail);
      runAfterAuth(
        () => saveUserProfile(data.user!.id, { displayName: trimmedName }),
        "profile display name update",
      );

      // Mark session storage that this is a fresh registration for the onboarding wizard
      if (typeof window !== "undefined") {
        sessionStorage.setItem(`dsa404_just_registered_${data.user.id}`, "true");
      }

      runAfterAuth(async () => {
        const onboardingResponse = await fetch("/api/send-email/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmedEmail, name: trimmedName, username: u }),
        });
        if (!onboardingResponse.ok) {
          console.warn("Onboarding emails were not sent", await onboardingResponse.text());
        }
      }, "onboarding emails");

      void proceedAfterAuth(data.user, {
        title: "Account created successfully! 🎉",
        description: `Welcome @${u}! Let's set up your plan.`,
      });
    } catch (e) {
      toast.error(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleSignIn() {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (e: any) {
      toast.error(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotPassword() {
    const identifier = email.trim();
    if (!identifier) {
      toast.error("Enter your email or username above first, then click Forgot password.");
      return;
    }
    setBusy(true);
    try {
      let targetEmail = identifier;
      if (!identifier.includes("@")) {
        const resolved = await getEmailByUsername(identifier);
        if (!resolved) {
          toast.error("No account found with that username.");
          setBusy(false);
          return;
        }
        targetEmail = resolved;
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      
      if (error) throw error;
      
      setResetSent(true);
      toast.success(`Reset email sent to ${targetEmail} — check your inbox.`);
    } catch (e) {
      toast.error(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (alive && session?.user) {
        router.replace(next);
      }
    });
    return () => {
      alive = false;
    };
  }, [router, next, supabase]);

  const usernameIcon =
    usernameStatus === "checking" ? (
      <Loader2 className="size-4 animate-spin text-foreground" />
    ) : usernameStatus === "available" ? (
      <Check className="size-4 text-success" />
    ) : usernameStatus === "taken" || usernameStatus === "invalid" ? (
      <X className="size-4 text-destructive" />
    ) : null;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-foreground hover:text-primary transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to home
        </Link>
        <Card className="w-full max-w-md border-border bg-card shadow-sm">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="size-8 rounded-full overflow-hidden shrink-0">
                <DSA404Logo size={32} />
              </div>
              <span className="font-display font-black tracking-tight text-xl leading-none select-none text-foreground">
                DSA<span className="text-primary">⁴⁰⁴</span>
              </span>
            </div>
            <CardDescription className="text-sm">
              {mode === "signin" ? "Sign in to track your DSA roadmap" : "Create your account & personalised plan"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="email">Account</TabsTrigger>
                <TabsTrigger value="google">Google</TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="space-y-3.5">
                {mode === "signup" && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="full-name">Full Name</Label>
                      <Input
                        id="full-name"
                        type="text"
                        placeholder="e.g. Alex Turner"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={busy}
                        maxLength={60}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="signup-username">Username</Label>
                      <div className="relative">
                        <Input
                          id="signup-username"
                          type="text"
                          placeholder="e.g. alex_turner"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          disabled={busy}
                          className={
                            usernameStatus === "taken" || usernameStatus === "invalid"
                              ? "border-destructive focus-visible:ring-destructive pr-9"
                              : usernameStatus === "available"
                                ? "border-success focus-visible:ring-success pr-9"
                                : "pr-9"
                          }
                        />
                        {usernameIcon && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2">
                            {usernameIcon}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-[11px] ${
                          usernameStatus === "taken" || usernameStatus === "invalid"
                            ? "text-destructive"
                            : usernameStatus === "available"
                              ? "text-success dark:text-success"
                              : "text-foreground"
                        }`}
                      >
                        {usernameStatus === "taken"
                          ? "That username is already taken — choose another."
                          : usernameStatus === "invalid"
                            ? "3-20 characters: lowercase letters, numbers, - or _ only."
                            : usernameStatus === "available"
                              ? "Username is available!"
                              : "Your unique handle for login and public profile."}
                      </p>
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email">{mode === "signin" ? "Email or Username" : "Email"}</Label>
                  <Input
                    id="email"
                    type={mode === "signin" ? "text" : "email"}
                    placeholder={mode === "signin" ? "your@example.com or username" : "your@example.com"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={busy}
                  />
                  {mode === "signup" && (
                    <p className="text-[11px] text-warning dark:text-warning font-medium leading-tight mt-1 flex items-start gap-1">
                      <span className="shrink-0">💡</span>
                      <span>Please enter a valid email address for receiving your daily roadmap notifications, progress alerts, and password reset links.</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <PasswordInput
                    id="password"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={busy}
                  />
                </div>

                <Button
                  className="w-full mt-2 cursor-pointer"
                  disabled={busy || (mode === "signup" && usernameStatus === "taken")}
                  onClick={mode === "signin" ? handleSignIn : handleSignUp}
                >
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mode === "signin" ? "Sign In" : "Create Account"}
                </Button>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    className="w-full text-sm text-foreground hover:text-foreground transition-colors cursor-pointer"
                    onClick={() => {
                      setMode(mode === "signin" ? "signup" : "signin");
                      setUsernameStatus("idle");
                    }}
                  >
                    {mode === "signin"
                      ? "Don't have an account? Sign up"
                      : "Already have an account? Sign in"}
                  </button>

                  {mode === "signin" && (
                    resetSent ? (
                      <p className="text-center text-xs text-success">
                        ✓ Reset email sent — check your inbox.
                      </p>
                    ) : (
                      <button
                        type="button"
                        className="w-full text-xs text-primary hover:underline disabled: cursor-pointer"
                        disabled={busy}
                        onClick={handleForgotPassword}
                      >
                        Forgot password?
                      </button>
                    )
                  )}
                </div>
              </TabsContent>

              <TabsContent value="google" className="pt-2 space-y-4">
                <div className="rounded-lg border border-border bg-muted p-3.5 text-left space-y-1">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-primary" /> 1-Click Instant Sign In
                  </p>
                  <p className="text-[11px] text-foreground leading-relaxed">
                    Sign in or create your account directly with Google. Your unique handle will be automatically secured based on your account.
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="w-full cursor-pointer font-medium text-xs gap-2.5 py-3 h-11 border-border hover:bg-muted"
                  disabled={busy}
                  onClick={handleGoogleSignIn}
                >
                  {busy ? <Loader2 className="size-4 animate-spin" /> : (
                    <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                  )}
                  <span>Continue with Google</span>
                </Button>


              </TabsContent>
            </Tabs>

            <div className="pt-2 border-t border-border">
              <div className="relative my-2.5">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-wider">
                  <span className="bg-card px-2 text-foreground">Demo / Instant Guest Access</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-11 border-dashed border-border bg-muted hover:bg-muted text-foreground font-bold text-xs gap-2 cursor-pointer shadow-xs transition-all hover:scale-[1.01]"
                onClick={handleGuestLogin}
              >
                <Sparkles className="size-4 text-warning animate-pulse shrink-0" />
                <span className="truncate">Continue as Guest (3★ Coder Demo)</span>
                <Badge variant="secondary" className="ml-auto text-[10px] bg-muted text-warning dark:text-warning font-mono shrink-0">
                  Instant Demo
                </Badge>
              </Button>
              <p className="mt-1.5 text-center text-[11px] text-foreground leading-tight">
                Explore the workspace with an active 3★ coder profile, 348 solved questions, and live CP stats.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

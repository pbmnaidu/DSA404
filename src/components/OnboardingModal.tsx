"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { todayIso, DEFAULT_DAILY_COUNTS, type DailyCounts } from "@/lib/plan";
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2, Github, Bell, Palette, CalendarDays, UserCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface OnboardingPayload {
  startDate: string;
  counts: DailyCounts;
  username: string;
  displayName: string;
  password?: string;
  sheetId: string;
  theme: string;
}

interface OnboardingModalProps {
  open: boolean;
  onComplete: (payload: OnboardingPayload) => Promise<void>;
}

const STEPS = ["profile", "schedule", "notifications", "tips", "github"] as const;
type Step = typeof STEPS[number];

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const [busy, setBusy] = useState(false);

  // Form State
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [startDate, setStartDate] = useState(todayIso());
  const [sheetId, setSheetId] = useState("core404");
  const [target, setTarget] = useState(3);
  const [theme, setTheme] = useState("system");

  const step = STEPS[stepIdx];

  const handleNext = () => {
    if (stepIdx < STEPS.length - 1) {
      if (step === "profile") {
        if (!displayName.trim() || !username.trim()) {
          toast.error("Please enter a display name and username");
          return;
        }
        if (password && password.length < 6) {
          toast.error("Password must be at least 6 characters");
          return;
        }
      }
      setStepIdx((i) => i + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (stepIdx > 0) setStepIdx((i) => i - 1);
  };

  const testPushNotification = async () => {
    try {
      if (!("Notification" in window)) {
        toast.error("This browser does not support notifications");
        return;
      }
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        new Notification("Setup Complete!", {
          body: "Notifications are successfully enabled for your DSA sessions.",
          icon: "/icon-192.png",
        });
        toast.success("Notification sent!");
      } else {
        toast.error("Permission denied");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to trigger notification");
    }
  };

  const handleFinish = async () => {
    setBusy(true);
    try {
      const counts: DailyCounts = { ...DEFAULT_DAILY_COUNTS, target };
      await onComplete({
        startDate,
        counts,
        username,
        displayName,
        password: password || undefined,
        sheetId,
        theme
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to complete setup");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden" hideCloseButton>
        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              {step === "profile" && <UserCircle className="w-6 h-6 text-primary" />}
              {step === "schedule" && <CalendarDays className="w-6 h-6 text-primary" />}
              {step === "notifications" && <Bell className="w-6 h-6 text-primary" />}
              {step === "tips" && <Palette className="w-6 h-6 text-primary" />}
              {step === "github" && <Github className="w-6 h-6 text-primary" />}
              
              {step === "profile" && "Set Up Your Profile"}
              {step === "schedule" && "Choose Your Schedule"}
              {step === "notifications" && "Enable Notifications"}
              {step === "tips" && "Tips & Theme"}
              {step === "github" && "Connect GitHub"}
            </DialogTitle>
            <DialogDescription>
              Step {stepIdx + 1} of {STEPS.length}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-[280px]">
            {step === "profile" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input 
                    placeholder="E.g. Alex" 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Public Username</Label>
                  <Input 
                    placeholder="E.g. alex_codes" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Set/Change Password (Optional)</Label>
                  <div className="relative">
                    <Input 
                      type="password" 
                      placeholder="Min 6 characters (Secure)" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                    />
                    {password.length >= 6 && (
                      <ShieldCheck className="absolute right-3 top-2.5 w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Follow strict rules. We strongly recommend setting a secure password.
                  </p>
                </div>
              </div>
            )}

            {step === "schedule" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-2">
                  <Label>Select Sheet</Label>
                  <Select value={sheetId} onValueChange={setSheetId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a sheet..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="core404">DSA 404 (Core Sheet)</SelectItem>
                      <SelectItem value="neetcode150">Neetcode 150</SelectItem>
                      <SelectItem value="striverA2Z">Striver A2Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Starting Date</Label>
                  <Input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Problems per day</Label>
                    <span className="font-bold text-primary">{target} problems</span>
                  </div>
                  <Slider 
                    min={1} 
                    max={8} 
                    step={1} 
                    value={[target]} 
                    onValueChange={(v) => setTarget(v[0])} 
                  />
                  <p className="text-xs text-muted-foreground italic">
                    Don't worry, you can always change these later in settings.
                  </p>
                </div>
              </div>
            )}

            {step === "notifications" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Bell className="w-4 h-4" /> Push Notifications
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Enable notifications for all timings to ensure you never miss your daily problems and revisions.
                  </p>
                  <Button variant="secondary" onClick={testPushNotification} className="w-full">
                    Enable & Test Push Notifications
                  </Button>
                </div>

                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20 space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Gmail Notifications
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Get daily revision reminders directly to your inbox so you never forget to revise.
                  </p>
                  <Button variant="outline" className="w-full border-blue-500 text-blue-500 hover:bg-blue-500/10" onClick={() => toast.success("Gmail notifications enabled!")}>
                    Enable Gmail Notifications
                  </Button>
                </div>
              </div>
            )}

            {step === "tips" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-3">
                  <Label>How to Start?</Label>
                  <div className="p-3 bg-muted/50 rounded-md text-sm border border-border">
                    <ul className="space-y-2 list-disc list-inside">
                      <li><strong className="text-primary">If you're a beginner:</strong> Start from the very beginning of the sheet and follow the daily schedule.</li>
                      <li><strong className="text-primary">If you're intermediate:</strong> Go to the Topics tab, skip the topics you already know, and start directly from your preferred ones to kickstart your DSA journey.</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>App Theme</Label>
                  <RadioGroup value={theme} onValueChange={setTheme} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="light" id="light" />
                      <Label htmlFor="light" className="font-normal">Light</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="dark" id="dark" />
                      <Label htmlFor="dark" className="font-normal">Dark</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="system" id="system" />
                      <Label htmlFor="system" className="font-normal">System</Label>
                    </div>
                  </RadioGroup>
                  <p className="text-xs text-muted-foreground">
                    You can change the theme color of the website later in settings or from the sidebar.
                  </p>
                </div>
              </div>
            )}

            {step === "github" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <Github className="w-8 h-8 text-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Connect GitHub</h3>
                    <p className="text-sm text-muted-foreground">
                      Automatically sync your completed code directly to a GitHub repository to build your portfolio.
                    </p>
                  </div>
                  
                  <div className="w-full p-4 bg-muted/30 rounded-lg border border-border text-sm text-left">
                    <strong className="text-primary">Important Instruction:</strong>
                    <p className="mt-1">
                      After connecting your account, click on the <strong className="text-foreground">top right button</strong> and navigate to <strong>Git Sync</strong> to select the specific repository folders for automatic push.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={handleBack} 
            disabled={stepIdx === 0 || busy}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          
          <Button 
            onClick={handleNext} 
            disabled={busy}
          >
            {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {stepIdx === STEPS.length - 1 ? "Complete Setup" : "Next"}
            {stepIdx < STEPS.length - 1 && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
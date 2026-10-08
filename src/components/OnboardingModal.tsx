"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { todayIso, DEFAULT_DAILY_COUNTS, type DailyCounts } from "@/lib/plan";
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2, Bell, Palette, CalendarDays, UserCircle, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { CURATED_SHEETS } from "@/lib/sheets-data";
import { useThemeCustomizer } from "../../app/theme-customizer-context";
import { PasswordInput } from "@/components/PasswordInput";

interface OnboardingPayload {
  startDate: string;
  counts: DailyCounts;
  username: string;
  displayName: string;
  password?: string;
  sheetId: string;
  theme: string;
  notifications: any;
}

interface OnboardingModalProps {
  open: boolean;
  onComplete: (payload: OnboardingPayload) => Promise<void>;
  initialDisplayName?: string;
  initialUsername?: string;
}

const STEPS = ["profile", "schedule", "notifications", "tips", "summary"] as const;
type Step = typeof STEPS[number];

export function OnboardingModal({ open, onComplete, initialDisplayName = "", initialUsername = "" }: OnboardingModalProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const { themeMode, applyThemeMode, applyPreset } = useThemeCustomizer();

  // Form State
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [username, setUsername] = useState(initialUsername);
  
  useEffect(() => {
    if (initialDisplayName && !displayName) setDisplayName(initialDisplayName);
    if (initialUsername && !username) setUsername(initialUsername);
  }, [initialDisplayName, initialUsername]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [startDate, setStartDate] = useState(todayIso());
  const [sheetId, setSheetId] = useState("core404");
  const [target, setTarget] = useState(3);
  
  // Notification State
  const [pushEnabled, setPushEnabled] = useState(true);
  const [morningReminderEnabled, setMorningReminderEnabled] = useState(true);
  const [morningReminderTime, setMorningReminderTime] = useState("08:00");
  const [contestReminderEnabled, setContestReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState("19:00");
  const [emailEnabled, setEmailEnabled] = useState(true);

  // Theme State
  const [activePreset, setActivePreset] = useState("pearl-royal");

  const step = STEPS[stepIdx];

  const handleNext = () => {
    if (stepIdx < STEPS.length - 1) {
      if (step === "profile") {
        if (!displayName.trim() || !username.trim()) {
          toast.error("Please enter a display name and username");
          return;
        }
        if (password) {
          if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
          }
          if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
          }
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
        theme: themeMode,
        notifications: {
          pushEnabled,
          morningReminderEnabled,
          morningReminderTime,
          contestReminderEnabled,
          reminderTime,
          emailEnabled
        }
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
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden" hideCloseButton>
        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              {step === "profile" && <UserCircle className="w-6 h-6 text-primary" />}
              {step === "schedule" && <CalendarDays className="w-6 h-6 text-primary" />}
              {step === "notifications" && <Bell className="w-6 h-6 text-primary" />}
              {step === "tips" && <Palette className="w-6 h-6 text-primary" />}
              {step === "summary" && <Sparkles className="w-6 h-6 text-primary animate-pulse" />}
              
              {step === "profile" && "Set Up Your Profile"}
              {step === "schedule" && "Choose Your Schedule"}
              {step === "notifications" && "Reminders & Notifications"}
              {step === "tips" && "Themes & Tips"}
              {step === "summary" && "Ready to Start!"}
            </DialogTitle>
            <DialogDescription>
              Step {stepIdx + 1} of {STEPS.length}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-[340px]">
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
                <div className="space-y-2 pt-2">
                  <Label>Set/Change Password (Optional)</Label>
                  <PasswordInput 
                    placeholder="Min 6 characters (Secure)" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                  />
                  {password && password.length >= 6 && (
                    <p className="text-xs text-green-500 flex items-center gap-1 mt-1"><ShieldCheck className="w-3 h-3" /> Password secure</p>
                  )}
                </div>
                {password && (
                  <div className="space-y-2">
                    <Label>Confirm Password</Label>
                    <PasswordInput 
                      placeholder="Confirm your secure password" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                    />
                  </div>
                )}
              </div>
            )}

            {step === "schedule" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-2">
                  <Label>Select Curriculum Sheet</Label>
                  <Select value={sheetId} onValueChange={setSheetId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a sheet..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CURATED_SHEETS.map(sheet => (
                        <SelectItem key={sheet.id} value={sheet.id}>{sheet.name} ({sheet.problemCount} problems)</SelectItem>
                      ))}
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

                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <Label>Target Problems Per Day</Label>
                    <span className="font-bold text-primary">{target} problems / day</span>
                  </div>
                  <Slider 
                    min={1} 
                    max={8} 
                    step={1} 
                    value={[target]} 
                    onValueChange={(v) => setTarget(v[0])} 
                  />
                  <p className="text-[11px] text-muted-foreground italic">
                    Don't worry, you can always change the sheet and daily target later in Settings!
                  </p>
                </div>
              </div>
            )}

            {step === "notifications" && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 overflow-y-auto pr-2" style={{ maxHeight: "400px" }}>
                
                {/* Master Browser Notification Switch */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <Label className="font-semibold text-base">Browser notifications</Label>
                    <p className="text-xs text-foreground">
                      Master toggle for all local browser alerts.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={testPushNotification}
                      className="text-xs h-8"
                    >
                      Test Notification 🔔
                    </Button>
                    <Switch
                      checked={pushEnabled}
                      onCheckedChange={setPushEnabled}
                    />
                  </div>
                </div>

                {/* Sub-options for Browser Notifications */}
                {pushEnabled && (
                  <div className="ml-4 space-y-4 border-l-2 border-border pl-4 pt-1">
                    {/* Morning Topic Reminder */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <Label>Morning Topic Reminder</Label>
                        <p className="text-xs text-foreground">
                          Reminds you in the morning about today's scheduled DSA topic.
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Input
                          type="time"
                          value={morningReminderTime}
                          disabled={!morningReminderEnabled}
                          onChange={(e) => setMorningReminderTime(e.target.value || "08:00")}
                          className="h-8 w-32 text-xs"
                        />
                        <Switch
                          checked={morningReminderEnabled}
                          onCheckedChange={setMorningReminderEnabled}
                        />
                      </div>
                    </div>

                    {/* Contest 1-Hour Reminder */}
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <Label>Contest Alert (1 hour before)</Label>
                        <p className="text-xs text-foreground">
                          Alerts you 1 hour before any live coding contest starts.
                        </p>
                      </div>
                      <Switch
                        checked={contestReminderEnabled}
                        onCheckedChange={setContestReminderEnabled}
                      />
                    </div>

                    {/* Evening Backlog Reminder */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <Label>Evening Backlog Nudge</Label>
                        <p className="text-xs text-foreground">
                          Reminds you at evening time if you have unsolved problems today.
                        </p>
                      </div>
                      <Input
                        type="time"
                        value={reminderTime}
                        onChange={(e) => setReminderTime(e.target.value || "19:00")}
                        className="h-8 w-32 text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Email Notification Switch */}
                <div className="flex items-center justify-between gap-4 pt-3 border-t border-border">
                  <div>
                    <Label className="font-semibold text-base">Email notifications</Label>
                    <p className="text-xs text-foreground">
                      Sends email reminders exclusively for scheduled topics in your <strong>Revision tab</strong>.
                    </p>
                  </div>
                  <Switch
                    checked={emailEnabled}
                    onCheckedChange={setEmailEnabled}
                  />
                </div>
              </div>
            )}

            {step === "tips" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Select Theme Mode</Label>
                  <RadioGroup value={themeMode} onValueChange={applyThemeMode as any} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="light" id="light" />
                      <Label htmlFor="light" className="font-normal cursor-pointer">Light</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="dark" id="dark" />
                      <Label htmlFor="dark" className="font-normal cursor-pointer">Dark</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="system" id="system" />
                      <Label htmlFor="system" className="font-normal cursor-pointer">System</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Select Popular Color Preset</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "pearl-royal", label: "Pearl & Royal (Default)" },
                      { id: "black-champagne", label: "Black & Champagne" },
                      { id: "slate-sapphire", label: "Slate & Sapphire" },
                      { id: "forest-mint", label: "Forest & Mint" }
                    ].map(preset => (
                      <button 
                        key={preset.id}
                        onClick={() => {
                          setActivePreset(preset.id);
                          applyPreset(preset.id);
                        }}
                        className={`text-left text-sm p-3 border rounded-lg transition-all ${
                          activePreset === preset.id 
                            ? "border-primary bg-primary/10 text-primary font-bold shadow-sm" 
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 font-medium">
                    ✨ You can also completely customize colors, font, and layout later by clicking the Theme Panel button in the sidebar!
                  </p>
                </div>

                <div className="space-y-2 mt-4 pt-4 border-t border-border">
                  <Label className="text-base font-semibold text-primary">Pro Tips to Start 🚀</Label>
                  <ul className="space-y-2 text-sm text-foreground">
                    <li><strong className="text-primary">If you're a beginner:</strong> Start from the very beginning of the sheet and follow the daily schedule strictly.</li>
                    <li><strong className="text-primary">If you're intermediate:</strong> Go to the Topics tab, skip the topics you already know, and start directly from your preferred ones!</li>
                  </ul>
                </div>
              </div>
            )}

            {step === "summary" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-2">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Awesome, {displayName}! 🎉</h2>
                <p className="text-muted-foreground max-w-[400px]">
                  Your learning environment is fully customized and ready. Prepare to crush your coding goals!
                </p>
                
                <div className="w-full text-left bg-muted/30 border border-border rounded-lg p-4 mt-4 space-y-2 text-sm">
                  <h4 className="font-semibold text-primary mb-2 border-b border-border pb-1">Your Preferences</h4>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                    <span className="text-muted-foreground">Sheet:</span>
                    <span className="font-medium truncate">{CURATED_SHEETS.find(s => s.id === sheetId)?.name || sheetId}</span>
                    <span className="text-muted-foreground">Pace:</span>
                    <span className="font-medium">{target} problems / day</span>
                    <span className="text-muted-foreground">Notifications:</span>
                    <span className="font-medium text-success">{pushEnabled || emailEnabled ? "Enabled" : "Disabled"}</span>
                    <span className="text-muted-foreground">Theme:</span>
                    <span className="font-medium capitalize">{themeMode} ({activePreset})</span>
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
            className={stepIdx === STEPS.length - 1 ? "bg-primary text-primary-foreground font-bold shadow-md hover:bg-primary/90" : ""}
          >
            {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {stepIdx === STEPS.length - 1 ? "Start Learning!" : "Next"}
            {stepIdx < STEPS.length - 1 && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
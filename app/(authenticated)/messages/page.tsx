"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createClient } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Bell,
  Send,
  Sparkles,
  Link as LinkIcon,
  CheckCircle2,
  ShieldCheck,
  Megaphone,
  Radio,
  ExternalLink,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Skeleton } from "@/components/ui/skeleton";

interface BroadcastMessage {
  id: string;
  title: string;
  body: string;
  url?: string;
  createdAt: string;
  createdBy?: string;
  createdByName?: string;
  status: "sending" | "published" | "failed";
  sentAt?: string;
  tokensFound?: number;
  successCount?: number;
  failureCount?: number;
  invalidTokensRemoved?: number;
}

interface UserFeedback {
  id: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  adminReply?: string | null;
  createdAt: string;
}

const ADMIN_EMAILS = ["404dsatracker@gmail.com"];

export default function MessagesPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<BroadcastMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state for admin
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/today");
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastStats, setLastStats] = useState<{
    tokensFound: number;
    successCount: number;
    failureCount: number;
    invalidTokensRemoved: number;
  } | null>(null);
  const [feedbackCategory, setFeedbackCategory] = useState("feedback");
  const [feedbackSubject, setFeedbackSubject] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [myFeedback, setMyFeedback] = useState<UserFeedback[]>([]);

  const isAdmin = Boolean(
    user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())
  );

  async function loadMessages() {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("messages")
        .select("id, title, body, url, created_at, created_by, created_by_name, status, sent_at, tokens_found, success_count, failure_count, invalid_tokens_removed")
        .order("created_at", { ascending: false })
        .limit(50);
        
      if (data) {
        const list: BroadcastMessage[] = data.map((docSnap: any) => ({
          id: docSnap.id,
          title: docSnap.title,
          body: docSnap.body,
          url: docSnap.url,
          createdAt: docSnap.created_at,
          createdBy: docSnap.created_by,
          createdByName: docSnap.created_by_name,
          status: docSnap.status || "published",
          sentAt: docSnap.sent_at,
          tokensFound: docSnap.tokens_found,
          successCount: docSnap.success_count,
          failureCount: docSnap.failure_count,
          invalidTokensRemoved: docSnap.invalid_tokens_removed,
        }));
        setMessages(list);
      }
    } catch (err) {
      console.warn("[messages] Failed to load messages:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadMyFeedback() {
    try {
      if (!user) return;
      const supabase = createClient();
      const { data, error } = await supabase
        .from("user_feedback")
        .select("id, category, subject, message, status, admin_reply, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) {
        if (error.code !== "PGRST205") console.warn("[messages] Failed to load feedback:", error);
        return;
      }
      setMyFeedback((data || []).map((item: any) => ({
        id: item.id,
        category: item.category,
        subject: item.subject,
        message: item.message,
        status: item.status || "new",
        adminReply: item.admin_reply,
        createdAt: item.created_at,
      })));
    } catch (error) {
      console.warn("[messages] Failed to load feedback history:", error);
    }
  }

  useEffect(() => {
    void loadMessages();
    void loadMyFeedback();
  }, [user?.id]);

  async function handlePublish() {
    if (!title.trim() || !body.trim()) {
      toast.error("Please enter both a title and message body.");
      return;
    }

    setIsPublishing(true);
    setLastStats(null);

    try {
      if (!user) {
        toast.error("Not authenticated", { description: "Please log in first." });
        return;
      }

      const res = await fetch("/api/campaigns/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          url: url.trim() || "/messages",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error("Broadcast Failed", {
          description: data.message || "Could not publish campaign notification.",
        });
        return;
      }

      const stats = {
        tokensFound: data.tokensFound || 0,
        successCount: data.successCount || 0,
        failureCount: data.failureCount || 0,
        invalidTokensRemoved: data.invalidTokensRemoved || 0,
      };

      setLastStats(stats);
      toast.success("Broadcast Published! 🚀", {
        description: `Delivered to ${stats.successCount}/${stats.tokensFound} subscribed device(s).`,
      });

      // Clear form & reload list
      setTitle("");
      setBody("");
      setUrl("/today");
      await loadMessages();
    } catch (err: any) {
      console.error("Error publishing message:", err);
      toast.error("Network / Server Error", {
        description: err?.message || String(err),
      });
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleFeedbackSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!feedbackSubject.trim() || !feedbackMessage.trim()) {
      toast.error("Please add a subject and message.");
      return;
    }
    setFeedbackSending(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: feedbackCategory, subject: feedbackSubject, message: feedbackMessage }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to send feedback");
      toast.success(result.emailSent ? "Feedback sent to the DSA404 team." : "Feedback saved; email delivery is pending.");
      setFeedbackSubject("");
      setFeedbackMessage("");
      await loadMyFeedback();
    } catch (error: any) {
      toast.error(error?.message || "Unable to send feedback");
    } finally {
      setFeedbackSending(false);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Editorial Header */}
      <div className="rounded-lg border border-border bg-card p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8  pointer-events-none">
          <Bell className="size-48" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <Megaphone className="size-5" />
              </span>
              <h1 className="font-display text-2xl md:text-3xl font-black tracking-tight text-foreground">
                Messages & Alerts
              </h1>
            </div>
            <p className="text-sm text-foreground max-w-xl">
              Official platform announcements, features updates, and broadcast alerts from the DSA⁴⁰⁴ team.
            </p>
          </div>

          {isAdmin && (
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3.5 py-1.5 text-xs font-semibold text-success dark:text-success self-start md:self-auto">
              <ShieldCheck className="size-4" />
              <span>Admin Broadcast Mode Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Admin Broadcast Creator (Restricted to Authorized Admins) */}
      {isAdmin && (
        <section className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Radio className="size-5 text-primary animate-pulse" />
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                Create & Broadcast Announcement
              </h2>
            </div>
            <span className="text-xs text-foreground">Targeting: All Registered FCM Tokens</span>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="msg-title" className="text-sm font-semibold">
                Announcement Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="msg-title"
                placeholder="e.g. 🏆 Weekly Coding Contest starting in 1 hour!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                required
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="msg-body" className="text-sm font-semibold">
                Message Body <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="msg-body"
                rows={3}
                placeholder="Write your announcement details here. Keep it concise for push notifications..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={500}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="msg-url" className="text-sm font-semibold">
                Target Link (Optional)
              </Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-3 size-4 text-foreground" />
                <Input
                  id="msg-url"
                  placeholder="/contests or https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <p className="text-xs text-foreground">
                Sends an instant push alert to all devices (foreground, background, and closed-app Web Push).
              </p>
              <ConfirmDialog
                trigger={
                  <Button
                    type="button"
                    disabled={isPublishing || !title.trim() || !body.trim()}
                    className="gap-2 px-5 font-semibold"
                  >
                    {isPublishing ? (
                      <>
                        <Sparkles className="size-4 animate-spin" />
                        Broadcasting...
                      </>
                    ) : (
                      <>
                        <Send className="size-4" />
                        Publish & Notify 🔔
                      </>
                    )}
                  </Button>
                }
                title="Broadcast Notification Campaign?"
                description={`You are about to send this push notification to all subscribed devices:\n\nTitle: "${title}"\nBody: "${body}"\n\nAre you sure you want to broadcast now?`}
                confirmLabel="Yes, Broadcast Now 🚀"
                onConfirm={handlePublish}
              />
            </div>
          </div>

          {/* Last Broadcast Statistics Summary */}
          {lastStats && (
            <div className="mt-4 rounded-lg border border-border bg-muted p-4 text-xs space-y-2 animate-fade-in">
              <div className="font-bold text-success dark:text-success flex items-center gap-1.5">
                <CheckCircle2 className="size-4" /> Broadcast Delivered Successfully
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-foreground font-mono">
                <div>Tokens Found: <strong>{lastStats.tokensFound}</strong></div>
                <div>Notifications Sent: <strong className="text-success dark:text-success">{lastStats.successCount}</strong></div>
                <div>Failed Sends: <strong className="text-warning">{lastStats.failureCount}</strong></div>
                <div>Tokens Pruned: <strong>{lastStats.invalidTokensRemoved}</strong></div>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="rounded-lg border border-border bg-card p-5 sm:p-6 shadow-sm">
        <div className="flex items-start gap-3 border-b border-border pb-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Send className="size-4" /></span>
          <div><h2 className="text-lg font-bold tracking-tight">Feedback & Improvements</h2><p className="text-sm text-muted-foreground">Report an issue or share an idea with the official DSA404 team.</p></div>
        </div>
        <form onSubmit={handleFeedbackSubmit} className="mt-5 grid gap-4">
          <div className="grid gap-2 sm:grid-cols-[180px_1fr]"><Label htmlFor="feedback-category" className="self-center">Type</Label><select id="feedback-category" value={feedbackCategory} onChange={(event) => setFeedbackCategory(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="feedback">Usage issue / feedback</option><option value="improvement">Improvement idea</option></select></div>
          <div className="grid gap-2 sm:grid-cols-[180px_1fr] sm:items-center"><Label htmlFor="feedback-subject">Subject</Label><Input id="feedback-subject" value={feedbackSubject} onChange={(event) => setFeedbackSubject(event.target.value)} maxLength={120} placeholder="What should the team know?" /></div>
          <div className="grid gap-2 sm:grid-cols-[180px_1fr]"><Label htmlFor="feedback-message" className="sm:pt-2">Message</Label><textarea id="feedback-message" value={feedbackMessage} onChange={(event) => setFeedbackMessage(event.target.value)} maxLength={4000} rows={5} placeholder="Describe the issue or improvement clearly..." className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" /></div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end"><p className="text-xs text-muted-foreground sm:mr-auto">Saved for admins and emailed to the official team.</p><Button type="submit" disabled={feedbackSending} className="gap-2">{feedbackSending ? "Sending..." : "Send Feedback"}<Send className="size-4" /></Button></div>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold tracking-tight">Your Feedback</h2>
          <span className="text-xs text-muted-foreground">{myFeedback.length} submission{myFeedback.length === 1 ? "" : "s"}</span>
        </div>
        {myFeedback.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Your submitted feedback will appear here.</div>
        ) : (
          <div className="space-y-3">
            {myFeedback.map((item) => (
              <article key={item.id} className="rounded-lg border border-border bg-card p-4 sm:p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div><span className="text-[10px] font-bold uppercase tracking-wider text-primary">{item.category === "improvement" ? "Improvement idea" : "Usage feedback"}</span><h3 className="mt-1 font-semibold">{item.subject}</h3></div>
                  <time className="text-xs text-muted-foreground" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider"><span className="rounded-full bg-muted px-2 py-1 text-primary">{item.status === "in_review" ? "In Review" : item.status === "resolved" ? "Resolved" : "New"}</span></div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{item.message}</p>
                {item.adminReply && <div className="mt-3 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm"><strong>Team reply:</strong> {item.adminReply}</div>}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Announcements & Messages Feed */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <Bell className="size-5 text-primary" />
            Announcement History & Feed
          </h2>
          <span className="text-xs text-foreground">
            {messages.length} message{messages.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-5 space-y-3">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-12 text-center space-y-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
              <Megaphone className="size-6 text-foreground" />
            </div>
            <h3 className="font-bold text-foreground">No Announcements Yet</h3>
            <p className="text-sm text-foreground max-w-sm mx-auto">
              Platform news, updates, and contest reminders will appear here when published.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <article
                key={msg.id}
                className="group relative rounded-lg border border-border bg-card p-5 shadow-sm transition-all hover:border-border hover:shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                  <div className="space-y-1">
                    <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                      {msg.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-foreground">
                      <Clock className="size-3.5" />
                      <span>{new Date(msg.createdAt).toLocaleString()}</span>
                      {msg.createdByName && (
                        <>
                          <span>•</span>
                          <span>By {msg.createdByName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {isAdmin && msg.successCount !== undefined && (
                    <div className="shrink-0 rounded-lg border border-border bg-muted px-2.5 py-1 text-[11px] font-mono text-foreground">
                      Delivered: <span className="font-bold text-foreground">{msg.successCount}</span> / {msg.tokensFound ?? 0}
                    </div>
                  )}
                </div>

                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {msg.body}
                </p>

                {msg.url && (
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <a
                      href={msg.url}
                      target={msg.url.startsWith("http") ? "_blank" : "_self"}
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      View Details / Link
                      <ExternalLink className="size-3.5" />
                    </a>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// @ts-nocheck
/**
 * Background email/push reminder cron job — now fully migrated to Supabase.
 *
 * Call every 15 minutes via cron-job.org or GitHub Actions:
 *   GET https://yourapp.vercel.app/api/cron/send-reminders?secret=YOUR_CRON_SECRET
 *
 * Set CRON_SECRET in Vercel / hosting env vars.
 */
import { NextResponse } from "next/server";
import { createClient as createSupabaseServer } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { getMessaging } from "firebase-admin/messaging";
import { getAdminApp } from "@/integrations/firebase/admin.server";

const CRON_SECRET = process.env.CRON_SECRET;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Use service role key for server-side access (bypasses RLS for cron reads)
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function nowMinutesInTz(timeZone: string): number {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date());
    const h = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
    const m = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
    return h * 60 + m;
  } catch {
    const d = new Date();
    return d.getUTCHours() * 60 + d.getUTCMinutes();
  }
}

function todayIsoInTz(timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function timeToMinutes(t: string): number {
  const [h, m] = (t || "19:00").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export async function GET(req: Request) {
  // ── Security check ──
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  if (CRON_SECRET && secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseServer(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const errors: string[] = [];
  let eveningSent = 0;
  let morningSent = 0;
  let topicSent = 0;

  try {
    // ── Load all user settings that have email or push enabled ──
    const { data: allSettings, error: settingsErr } = await supabase
      .from("user_settings")
      .select("user_id, email_enabled, push_enabled, reminder_time, morning_reminder_enabled, morning_reminder_time, contest_reminder_enabled, timezone, paused, last_reminder_sent_on, last_morning_reminder_sent_on")
      .or("email_enabled.eq.true,push_enabled.eq.true");

    if (settingsErr) throw settingsErr;
    if (!allSettings || allSettings.length === 0) {
      return NextResponse.json({ ok: true, message: "No users with notifications enabled" });
    }

    // Load all profile emails at once (to avoid N+1 queries)
    const userIds = allSettings.map((s) => s.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", userIds);

    const emailByUid: Record<string, string> = {};
    for (const p of profiles || []) {
      if (p.email) emailByUid[p.id] = p.email;
    }

    // Load all push tokens at once
    const { data: pushSubs } = await supabase
      .from("push_subscriptions")
      .select("user_id, token")
      .in("user_id", userIds);

    const tokensByUid: Record<string, string[]> = {};
    for (const sub of pushSubs || []) {
      if (!tokensByUid[sub.user_id]) tokensByUid[sub.user_id] = [];
      if (sub.token) tokensByUid[sub.user_id].push(sub.token);
    }

    const nowMs = Date.now();
    const { data: upcomingContests } = await supabase
      .from("contests")
      .select("*")
      .gte("start_ms", nowMs - 24 * 3600 * 1000)
      .lt("start_ms", nowMs + 48 * 3600 * 1000);

    // ── Process each user ──
    for (const row of allSettings) {
      const uid = row.user_id;
      const tz = row.timezone || "Asia/Kolkata";
      const today = todayIsoInTz(tz);
      const nowMins = nowMinutesInTz(tz);
      const userEmail = emailByUid[uid];

      if (!userEmail) continue; // Skip users with no email in profile

      // ── 1. Evening Plan Reminder ──────────────────────────────────────────
      if (!row.paused && (row.email_enabled || row.push_enabled)) {
        const reminderMins = timeToMinutes(row.reminder_time || "19:00");
        
        // Fixed nag timings
        const fixedTimings = ["21:15", "21:30", "21:45", "22:00", "22:30", "23:00"];
        
        const triggers = [
          { id: "custom", mins: reminderMins },
          ...fixedTimings.map(t => ({ id: t, mins: timeToMinutes(t) }))
        ];

        let sentToday = [];
        if (row.last_reminder_sent_on && row.last_reminder_sent_on.startsWith(today)) {
           const parts = row.last_reminder_sent_on.split(":");
           if (parts.length > 1) {
             sentToday = parts[1].split(",");
           } else {
             // old format, treat as all sent
             sentToday = triggers.map(t => t.id);
           }
        } else if (row.last_reminder_sent_on === today) {
           sentToday = triggers.map(t => t.id);
        }

        const pendingTriggers = triggers.filter(t => nowMins >= t.mins && !sentToday.includes(t.id));

        if (pendingTriggers.length > 0) {
          // Check if user has pending problems today
          const { data: todayDay } = await supabase
            .from("study_days")
            .select("problems")
            .eq("user_id", uid)
            .eq("date", today)
            .eq("is_skipped", false)
            .maybeSingle();

          const problems = todayDay?.problems || [];
          const pendingCount = problems.filter((p: any) => !p.done).length;

          if (pendingCount > 0) {
            let sentAny = false;
            if (row.email_enabled && userEmail) {
              try {
                await sendEmail(
                  userEmail,
                  "📚 DSA⁴⁰⁴ Evening Reminder",
                  `Hello!\n\nYou have ${pendingCount} problem${pendingCount !== 1 ? "s" : ""} pending today in your DSA plan.\n\nLog in to DSA⁴⁰⁴ and complete them to maintain your streak!\n\nhttps://dsa404.vercel.app/today\n\n- DSA⁴⁰⁴ Team`,
                  `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0f172a;border-radius:12px;padding:28px;color:#f8fafc;border:1px solid #1e293b;">
    <div style="font-size:20px;font-weight:900;color:#38bdf8;margin-bottom:12px;">DSA<span style="color:#f97316;">⁴⁰⁴</span></div>
    <h2 style="margin-top:0;font-size:18px;">📚 ${pendingCount} Problem${pendingCount !== 1 ? "s" : ""} Waiting Today</h2>
    <p style="color:#94a3b8;line-height:1.6;">You still have <strong style="color:#f8fafc;">${pendingCount} problem${pendingCount !== 1 ? "s" : ""}</strong> left for today's session. Complete them to save your streak!</p>
    <a href="https://dsa404.vercel.app/today" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#0284c7;color:#fff;border-radius:8px;font-weight:700;text-decoration:none;">Continue Session →</a>
    <p style="margin-top:24px;font-size:12px;color:#475569;">You're receiving this because you enabled evening reminders in DSA⁴⁰⁴ Settings.</p>
  </div>`
                );
                eveningSent++;
                sentAny = true;
              } catch (e) {
                errors.push(`${uid} evening email: ${e instanceof Error ? e.message : String(e)}`);
              }
            }

            if (row.push_enabled && tokensByUid[uid]?.length > 0) {
              try {
                await getMessaging(getAdminApp()).sendEachForMulticast({
                  tokens: tokensByUid[uid],
                  notification: {
                    title: "📚 DSA⁴⁰⁴ Evening Reminder",
                    body: `You still have ${pendingCount} problem${pendingCount !== 1 ? "s" : ""} left today. Complete them to save your streak!`,
                  },
                  data: {
                    link: "/today",
                    tag: `evening-${today}`,
                  },
                  webpush: {
                    fcmOptions: { link: "/today" }
                  }
                });
                eveningSent++;
                sentAny = true;
              } catch (e) {
                errors.push(`${uid} evening push: ${e instanceof Error ? e.message : String(e)}`);
              }
            }

            if (sentAny) {
              const newlySent = pendingTriggers.map(t => t.id);
              const allSent = [...sentToday, ...newlySent].join(",");
              await supabase
                .from("user_settings")
                .update({ last_reminder_sent_on: `${today}:${allSent}` })
                .eq("user_id", uid);
            }
          } else {
            // Mark as fully sent if no pending problems, so we don't check again today
            const allTriggers = triggers.map(t => t.id).join(",");
            await supabase
              .from("user_settings")
              .update({ last_reminder_sent_on: `${today}:${allTriggers}` })
              .eq("user_id", uid);
          }
        }
      }

      // ── 2. Morning Reminder ──────────────────────────────────────────────
      if (!row.paused && row.morning_reminder_enabled && (row.email_enabled || row.push_enabled)) {
        const morningMins = timeToMinutes(row.morning_reminder_time || "08:00");
        const alreadySentMorning = row.last_morning_reminder_sent_on === today;
        const withinWindow = nowMins >= morningMins && nowMins <= morningMins + 240;

        if (!alreadySentMorning && withinWindow) {
          const { data: todayDay } = await supabase
            .from("study_days")
            .select("topic, problems")
            .eq("user_id", uid)
            .eq("date", today)
            .eq("is_skipped", false)
            .maybeSingle();

          const topic = todayDay?.topic || "Today's Topic";
          const pendingCount = (todayDay?.problems || []).filter((p: any) => !p.done).length;

          let sentAnyMorning = false;
          
          if (row.email_enabled && userEmail) {
            try {
              await sendEmail(
                userEmail,
                `☀️ Good morning! Today's DSA topic: ${topic}`,
                `Good morning!\n\nToday's topic is: ${topic}\nProblems scheduled: ${pendingCount}\n\nStart your session now: https://dsa404.vercel.app/today\n\n- DSA⁴⁰⁴ Team`,
                `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0f172a;border-radius:12px;padding:28px;color:#f8fafc;border:1px solid #1e293b;">
    <div style="font-size:20px;font-weight:900;color:#38bdf8;margin-bottom:12px;">DSA<span style="color:#f97316;">⁴⁰⁴</span></div>
    <h2 style="margin-top:0;font-size:18px;">☀️ Good Morning!</h2>
    <p style="color:#94a3b8;line-height:1.6;">Today's topic: <strong style="color:#f8fafc;">${topic}</strong><br>Problems scheduled: <strong style="color:#38bdf8;">${pendingCount}</strong></p>
    <a href="https://dsa404.vercel.app/today" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#0284c7;color:#fff;border-radius:8px;font-weight:700;text-decoration:none;">Start Session →</a>
    <p style="margin-top:24px;font-size:12px;color:#475569;">You're receiving this because you enabled morning reminders in DSA⁴⁰⁴ Settings.</p>
  </div>`
              );
              morningSent++;
              sentAnyMorning = true;
            } catch (e) {
              errors.push(`${uid} morning email: ${e instanceof Error ? e.message : String(e)}`);
            }
          }

          if (row.push_enabled && tokensByUid[uid]?.length > 0) {
            try {
              await getMessaging(getAdminApp()).sendEachForMulticast({
                tokens: tokensByUid[uid],
                notification: {
                  title: "☀️ Good Morning!",
                  body: `Today's topic: ${topic} (${pendingCount} problems)`,
                },
                data: {
                  link: "/today",
                  tag: `morning-${today}`,
                },
                webpush: {
                  fcmOptions: { link: "/today" }
                }
              });
              morningSent++;
              sentAnyMorning = true;
            } catch (e) {
              errors.push(`${uid} morning push: ${e instanceof Error ? e.message : String(e)}`);
            }
          }

          if (sentAnyMorning) {
            await supabase
              .from("user_settings")
              .update({ last_morning_reminder_sent_on: today })
              .eq("user_id", uid);
          }
        }
      }

      // ── 3. Topic Reminders (Revision tab) ─────────────────────────────────
      if (row.email_enabled || row.push_enabled) {
        try {
          const { data: dueReminders } = await supabase
            .from("user_reminders")
            .select("*")
            .eq("user_id", uid)
            .eq("triggered", false)
            .lte("date", today);

          for (const rem of dueReminders || []) {
            const remMins = timeToMinutes(rem.time || "09:00");
            // Only fire if today's time has passed (or if reminder date is in the past)
            if (rem.date < today || (rem.date === today && nowMins >= remMins)) {
              let sentAnyTopic = false;
              
              if (row.email_enabled && userEmail) {
                try {
                  await sendEmail(
                    userEmail,
                    `🔔 Revision Reminder: ${rem.topic}`,
                    `Hello!\n\nThis is your scheduled revision reminder for the topic: "${rem.topic}".\n${rem.note ? `Note: ${rem.note}\n\n` : "\n"}Log in to DSA⁴⁰⁴ to revise: https://dsa404.vercel.app/review\n\n- DSA⁴⁰⁴ Team`
                  );
                  topicSent++;
                  sentAnyTopic = true;
                } catch (e) {
                  errors.push(`${uid} topic email (${rem.topic}): ${e instanceof Error ? e.message : String(e)}`);
                }
              }

              if (row.push_enabled && tokensByUid[uid]?.length > 0) {
                try {
                  await getMessaging(getAdminApp()).sendEachForMulticast({
                    tokens: tokensByUid[uid],
                    notification: {
                      title: "🔔 Revision Reminder",
                      body: `${rem.topic}${rem.note ? ` - ${rem.note}` : ""}`,
                    },
                    data: {
                      link: "/review",
                      tag: `revision-${rem.id}`,
                    },
                    webpush: {
                      fcmOptions: { link: "/review" }
                    }
                  });
                  topicSent++;
                  sentAnyTopic = true;
                } catch (e) {
                  errors.push(`${uid} topic push (${rem.topic}): ${e instanceof Error ? e.message : String(e)}`);
                }
              }

              if (sentAnyTopic) {
                // Mark as triggered
                await supabase
                  .from("user_reminders")
                  .update({ triggered: true })
                  .eq("id", rem.id)
                  .eq("user_id", uid);
              }
            }
          }
        } catch (e) {
          errors.push(`${uid} topic reminders: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
      // ── 4. Weekend Afternoon Reminder ──
      const dayOfWeek = new Date(new Date().toLocaleString("en-US", { timeZone: tz })).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      if (!row.paused && isWeekend && (row.email_enabled || row.push_enabled)) {
        // We'll use "14:00" as afternoon reminder
        if (nowMins >= 14 * 60) {
          const sentWeekendToday = row.last_reminder_sent_on && row.last_reminder_sent_on.includes(`${today}:weekend`);
          if (!sentWeekendToday) {
             const { data: todayDay } = await supabase.from("study_days").select("problems").eq("user_id", uid).eq("date", today).eq("is_skipped", false).maybeSingle();
             const pendingCount = (todayDay?.problems || []).filter(p => !p.done).length;
             if (pendingCount > 0) {
                if (row.email_enabled && userEmail) {
                   try {
                     await sendEmail(userEmail, "☕ Weekend Afternoon Check-in", "Have some free time this weekend? Don't forget your DSA practice!\n\nhttps://dsa404.vercel.app/today");
                   } catch(e) {}
                }
                if (row.push_enabled && tokensByUid[uid]?.length > 0) {
                   try {
                     await getMessaging(getAdminApp()).sendEachForMulticast({
                       tokens: tokensByUid[uid],
                       notification: { title: "☕ Weekend Practice", body: "Have some free time? Knock out those DSA problems today!" },
                       data: { link: "/today", tag: `weekend-${today}` },
                       webpush: { fcmOptions: { link: "/today" } }
                     });
                   } catch(e) {}
                }
             }
             // Mark weekend sent
             const updatedSentOn = row.last_reminder_sent_on ? `${row.last_reminder_sent_on},weekend` : `${today}:weekend`;
             await supabase.from("user_settings").update({ last_reminder_sent_on: updatedSentOn }).eq("user_id", uid);
             row.last_reminder_sent_on = updatedSentOn;
          }
        }
      }

      // ── 5. Contest Reminders (7 AM summary, 1h, 30m, 10m) ──
      if (row.contest_reminder_enabled && (row.email_enabled || row.push_enabled) && upcomingContests && upcomingContests.length > 0) {
        // Filter contests for today in user's timezone
        const userDateObj = new Date(new Date().toLocaleString("en-US", { timeZone: tz }));
        const userMidnightMs = new Date(userDateObj.getFullYear(), userDateObj.getMonth(), userDateObj.getDate()).getTime();
        
        const todaysContests = upcomingContests.filter(c => c.start_ms >= userMidnightMs && c.start_ms < userMidnightMs + 86400000);
        
        if (todaysContests.length > 0) {
           // a) 7 AM Morning Summary
           if (nowMins >= 420) {
              const sentContestMorning = row.last_reminder_sent_on && row.last_reminder_sent_on.includes(`${today}:contest_morning`);
              if (!sentContestMorning) {
                 if (row.push_enabled && tokensByUid[uid]?.length > 0) {
                    try {
                      await getMessaging(getAdminApp()).sendEachForMulticast({
                        tokens: tokensByUid[uid],
                        notification: { title: "🏆 Contests Today!", body: `You have ${todaysContests.length} contest(s) scheduled for today. Good luck!` },
                        data: { link: "/contests", tag: `contest_morning_${today}` },
                        webpush: { fcmOptions: { link: "/contests" } }
                      });
                    } catch(e) {}
                 }
                 const updatedSentOn = row.last_reminder_sent_on ? `${row.last_reminder_sent_on},contest_morning` : `${today}:contest_morning`;
                 await supabase.from("user_settings").update({ last_reminder_sent_on: updatedSentOn }).eq("user_id", uid);
                 row.last_reminder_sent_on = updatedSentOn;
              }
           }

           // b) Countdowns: 1h, 30m, 10m
           for (const c of todaysContests) {
              // start mins in local time
              const startTzDate = new Date(new Date(c.start_ms).toLocaleString("en-US", { timeZone: tz }));
              const cStartMins = startTzDate.getHours() * 60 + startTzDate.getMinutes();
              
              const countdowns = [
                { key: "60m", mins: 60, title: "1 Hour" },
                { key: "30m", mins: 30, title: "30 Minutes" },
                { key: "10m", mins: 10, title: "10 Minutes" }
              ];

              for (const cd of countdowns) {
                 if (nowMins >= cStartMins - cd.mins && nowMins < cStartMins + 15) {
                    const tag = `${today}:contest_${c.id}_${cd.key}`;
                    const alreadySent = row.last_reminder_sent_on && row.last_reminder_sent_on.includes(tag);
                    if (!alreadySent) {
                       if (row.push_enabled && tokensByUid[uid]?.length > 0) {
                          try {
                            await getMessaging(getAdminApp()).sendEachForMulticast({
                              tokens: tokensByUid[uid],
                              notification: { title: `⏱️ ${c.name} starts in ${cd.title}!`, body: `Platform: ${c.platform}. Get ready!` },
                              data: { link: "/contests", tag: tag },
                              webpush: { fcmOptions: { link: "/contests" } }
                            });
                          } catch(e) {}
                       }
                       const updatedSentOn = row.last_reminder_sent_on ? `${row.last_reminder_sent_on},${tag}` : tag;
                       await supabase.from("user_settings").update({ last_reminder_sent_on: updatedSentOn }).eq("user_id", uid);
                       row.last_reminder_sent_on = updatedSentOn;
                    }
                 }
              }
           }
        }
      }
    }

    return NextResponse.json({
      ok: true,
      usersProcessed: allSettings.length,
      eveningSent,
      morningSent,
      topicSent,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    console.error("[cron/send-reminders] Fatal error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error", errors },
      { status: 500 }
    );
  }
}
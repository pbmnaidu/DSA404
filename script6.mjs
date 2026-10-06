import fs from "fs";

let content = fs.readFileSync("app/api/cron/send-reminders/route.ts", "utf8");

// 1. Add contest_reminder_enabled to select
content = content.replace(
  `select("user_id, email_enabled, push_enabled, reminder_time, morning_reminder_enabled, morning_reminder_time, timezone, paused, last_reminder_sent_on, last_morning_reminder_sent_on")`,
  `select("user_id, email_enabled, push_enabled, reminder_time, morning_reminder_enabled, morning_reminder_time, contest_reminder_enabled, timezone, paused, last_reminder_sent_on, last_morning_reminder_sent_on")`
);

// 2. Add upcomingContests query before loop
const loopStartStr = `    // ── Process each user ──`;
const queryContests = `    const nowMs = Date.now();
    const { data: upcomingContests } = await supabase
      .from("contests")
      .select("*")
      .gte("start_ms", nowMs - 24 * 3600 * 1000)
      .lt("start_ms", nowMs + 48 * 3600 * 1000);

    // ── Process each user ──`;
content = content.replace(loopStartStr, queryContests);

// 3. Add Weekend & Contest Logic inside the loop at the end
const endOfLoopStr = `    }

    return NextResponse.json({`;

const newFeatures = `      // ── 4. Weekend Afternoon Reminder ──
      const dayOfWeek = new Date(new Date().toLocaleString("en-US", { timeZone: tz })).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      if (!row.paused && isWeekend && (row.email_enabled || row.push_enabled)) {
        // We'll use "14:00" as afternoon reminder
        if (nowMins >= 14 * 60) {
          const sentWeekendToday = row.last_reminder_sent_on && row.last_reminder_sent_on.includes(\`\${today}:weekend\`);
          if (!sentWeekendToday) {
             const { data: todayDay } = await supabase.from("study_days").select("problems").eq("user_id", uid).eq("date", today).eq("is_skipped", false).maybeSingle();
             const pendingCount = (todayDay?.problems || []).filter(p => !p.done).length;
             if (pendingCount > 0) {
                if (row.email_enabled && userEmail) {
                   try {
                     await sendEmail(userEmail, "☕ Weekend Afternoon Check-in", "Have some free time this weekend? Don't forget your DSA practice!\\n\\nhttps://dsa404.vercel.app/today");
                   } catch(e) {}
                }
                if (row.push_enabled && tokensByUid[uid]?.length > 0) {
                   try {
                     await getMessaging(getAdminApp()).sendEachForMulticast({
                       tokens: tokensByUid[uid],
                       notification: { title: "☕ Weekend Practice", body: "Have some free time? Knock out those DSA problems today!" },
                       data: { link: "/today", tag: \`weekend-\${today}\` },
                       webpush: { fcmOptions: { link: "/today" } }
                     });
                   } catch(e) {}
                }
             }
             // Mark weekend sent
             const updatedSentOn = row.last_reminder_sent_on ? \`\${row.last_reminder_sent_on},weekend\` : \`\${today}:weekend\`;
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
              const sentContestMorning = row.last_reminder_sent_on && row.last_reminder_sent_on.includes(\`\${today}:contest_morning\`);
              if (!sentContestMorning) {
                 if (row.push_enabled && tokensByUid[uid]?.length > 0) {
                    try {
                      await getMessaging(getAdminApp()).sendEachForMulticast({
                        tokens: tokensByUid[uid],
                        notification: { title: "🏆 Contests Today!", body: \`You have \${todaysContests.length} contest(s) scheduled for today. Good luck!\` },
                        data: { link: "/contests", tag: \`contest_morning_\${today}\` },
                        webpush: { fcmOptions: { link: "/contests" } }
                      });
                    } catch(e) {}
                 }
                 const updatedSentOn = row.last_reminder_sent_on ? \`\${row.last_reminder_sent_on},contest_morning\` : \`\${today}:contest_morning\`;
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
                    const tag = \`\${today}:contest_\${c.id}_\${cd.key}\`;
                    const alreadySent = row.last_reminder_sent_on && row.last_reminder_sent_on.includes(tag);
                    if (!alreadySent) {
                       if (row.push_enabled && tokensByUid[uid]?.length > 0) {
                          try {
                            await getMessaging(getAdminApp()).sendEachForMulticast({
                              tokens: tokensByUid[uid],
                              notification: { title: \`⏱️ \${c.name} starts in \${cd.title}!\`, body: \`Platform: \${c.platform}. Get ready!\` },
                              data: { link: "/contests", tag: tag },
                              webpush: { fcmOptions: { link: "/contests" } }
                            });
                          } catch(e) {}
                       }
                       const updatedSentOn = row.last_reminder_sent_on ? \`\${row.last_reminder_sent_on},\${tag}\` : tag;
                       await supabase.from("user_settings").update({ last_reminder_sent_on: updatedSentOn }).eq("user_id", uid);
                       row.last_reminder_sent_on = updatedSentOn;
                    }
                 }
              }
           }
        }
      }
    }

    return NextResponse.json({`;

content = content.replace(endOfLoopStr, newFeatures);

fs.writeFileSync("app/api/cron/send-reminders/route.ts", content);

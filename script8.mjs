import fs from "fs";

let content = fs.readFileSync("app/api/cron/send-reminders/route.ts", "utf8");

content = content.replace(
  /const sentContestMorning = row\.last_reminder_sent_on && row\.last_reminder_sent_on\.includes\(\`\$\{\w+\}:contest_morning\`\);/g,
  "const sentContestMorning = row.last_reminder_sent_on && row.last_reminder_sent_on.includes(`contest_morning`);"
);

content = content.replace(
  /const updatedSentOn = row\.last_reminder_sent_on \? \`\$\{\w+\},\w+\` : \`\$\{\w+\}:contest_morning\`;/g,
  "const updatedSentOn = row.last_reminder_sent_on && row.last_reminder_sent_on.startsWith(today) ? `${row.last_reminder_sent_on},contest_morning` : `${today}:contest_morning`;"
);

// We need to fix the update in 7 AM morning summary:
// const updatedSentOn = row.last_reminder_sent_on ? `${row.last_reminder_sent_on},contest_morning` : `${today}:contest_morning`;
content = content.replace(
  /const updatedSentOn = row\.last_reminder_sent_on \? \`\$\{row\.last_reminder_sent_on\},contest_morning\` : \`\$\{today\}:contest_morning\`;/g,
  "const updatedSentOn = row.last_reminder_sent_on && row.last_reminder_sent_on.startsWith(today) ? `${row.last_reminder_sent_on},contest_morning` : `${today}:contest_morning`;"
);

// We need to fix the countdown tags check
// const tag = `${today}:contest_${c.id}_${cd.key}`;
// const alreadySent = row.last_reminder_sent_on && row.last_reminder_sent_on.startsWith(today) && row.last_reminder_sent_on.includes(tag);
// Wait, if tag includes `${today}:`, then we append `${tag}` directly?
// In the current file:
// const tag = `${today}:contest_${c.id}_${cd.key}`;
// const updatedSentOn = row.last_reminder_sent_on ? `${row.last_reminder_sent_on},${tag}` : `${today}:contest_${c.id}_${cd.key}`;

// If tag already has `${today}:` in it, and we append it, the string becomes:
// `2026-10-05:custom,2026-10-05:contest_123_60m`
// This means `.includes(tag)` WILL STILL WORK! Because the exact string `2026-10-05:contest_123_60m` is in there!
// Why did the user get spammed for contests?
// Because `upcomingContests` query fetched ALL upcoming contests, including ones that ALREADY FINISHED!
// Wait! `upcomingContests` uses `nowMs - 24 * 3600 * 1000`. So it fetches contests from yesterday too!
// `todaysContests` filters `c.start_ms >= userMidnightMs && c.start_ms < userMidnightMs + 86400000`.
// If a contest was at 9 AM, and now it's 8 PM, it's still in `todaysContests`!
// So at 8 PM, `nowMins >= 420` is TRUE.
// Does it send morning summary again?
// NO, if `includes('contest_morning')` was true.
// BUT `includes(\`\${today}:contest_morning\`)` was FALSE because we appended `,contest_morning` without the date prefix!

content = content.replace(
  /const sentContestMorning = row\.last_reminder_sent_on && row\.last_reminder_sent_on\.includes\(\`\\\$\\\{today\\\}:contest_morning\`\);/g,
  "const sentContestMorning = row.last_reminder_sent_on && row.last_reminder_sent_on.includes(`contest_morning`) && row.last_reminder_sent_on.startsWith(today);"
);

// Let's just manually replace the entire block of code again since regex is error prone.
const targetStart = `      // ── 4. Weekend Afternoon Reminder ──`;
const targetEnd = `    }

    return NextResponse.json({`;

const idxStart = content.indexOf(targetStart);
const idxEnd = content.indexOf(targetEnd);

const newLogic = `      // ── 4. Weekend Afternoon Reminder ──
      const dayOfWeek = new Date(new Date().toLocaleString("en-US", { timeZone: tz })).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      if (!row.paused && isWeekend && (row.email_enabled || row.push_enabled)) {
        // We'll use "14:00" as afternoon reminder
        if (nowMins >= 14 * 60) {
          const sentWeekendToday = row.last_reminder_sent_on && row.last_reminder_sent_on.startsWith(today) && row.last_reminder_sent_on.includes(\`weekend\`);
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
             const updatedSentOn = row.last_reminder_sent_on && row.last_reminder_sent_on.startsWith(today) ? \`\${row.last_reminder_sent_on},weekend\` : \`\${today}:weekend\`;
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
              const sentContestMorning = row.last_reminder_sent_on && row.last_reminder_sent_on.startsWith(today) && row.last_reminder_sent_on.includes(\`contest_morning\`);
              if (!sentContestMorning) {
                 const formattedContests = todaysContests.map(c => {
                   const d = new Date(new Date(c.start_ms).toLocaleString("en-US", { timeZone: tz }));
                   let h = d.getHours();
                   const m = d.getMinutes().toString().padStart(2, "0");
                   const ampm = h >= 12 ? "PM" : "AM";
                   h = h % 12 || 12;
                   return \`\${c.name} at \${h}:\${m} \${ampm}\`;
                 }).join("\\n");
                 
                 if (row.push_enabled && tokensByUid[uid]?.length > 0) {
                    try {
                      await getMessaging(getAdminApp()).sendEachForMulticast({
                        tokens: tokensByUid[uid],
                        notification: { title: "🏆 Contests Today!", body: \`You have \${todaysContests.length} contest(s):\\n\${formattedContests}\` },
                        data: { link: "/contests", tag: \`contest_morning_\${today}\` },
                        webpush: { fcmOptions: { link: "/contests" } }
                      });
                    } catch(e) {}
                 }
                 const updatedSentOn = row.last_reminder_sent_on && row.last_reminder_sent_on.startsWith(today) ? \`\${row.last_reminder_sent_on},contest_morning\` : \`\${today}:contest_morning\`;
                 await supabase.from("user_settings").update({ last_reminder_sent_on: updatedSentOn }).eq("user_id", uid);
                 row.last_reminder_sent_on = updatedSentOn;
              }
           }
        }

        // b) Countdowns: 1h, 30m, 10m based on ABSOLUTE TIME (Date.now())
        for (const c of upcomingContests) {
           const timeDiffMs = c.start_ms - Date.now();
           const timeDiffMins = timeDiffMs / 60000;
           
           const countdowns = [
             { key: "60m", target: 60, title: "1 Hour" },
             { key: "30m", target: 30, title: "30 Minutes" },
             { key: "10m", target: 10, title: "10 Minutes" }
           ];

           for (const cd of countdowns) {
              // Trigger if we are within the target window (e.g. exactly 60 mins away, up to 45 mins away if cron was delayed)
              if (timeDiffMins <= cd.target && timeDiffMins > cd.target - 15) {
                 const tag = \`contest_\${c.id}_\${cd.key}\`;
                 const alreadySent = row.last_reminder_sent_on && row.last_reminder_sent_on.startsWith(today) && row.last_reminder_sent_on.includes(tag);
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
                    const updatedSentOn = row.last_reminder_sent_on && row.last_reminder_sent_on.startsWith(today) ? \`\${row.last_reminder_sent_on},\${tag}\` : \`\${today}:\${tag}\`;
                    await supabase.from("user_settings").update({ last_reminder_sent_on: updatedSentOn }).eq("user_id", uid);
                    row.last_reminder_sent_on = updatedSentOn;
                 }
              }
           }
        }
      }
`;

content = content.substring(0, idxStart) + newLogic + content.substring(idxEnd);
fs.writeFileSync("app/api/cron/send-reminders/route.ts", content);

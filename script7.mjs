import fs from "fs";

let content = fs.readFileSync("app/api/cron/send-reminders/route.ts", "utf8");

const targetStart = `      // ── 5. Contest Reminders (7 AM summary, 1h, 30m, 10m) ──`;
const targetEnd = `    }

    return NextResponse.json({`;

const idxStart = content.indexOf(targetStart);
const idxEnd = content.indexOf(targetEnd);

if (idxStart === -1 || idxEnd === -1) {
  console.error("Could not find boundaries");
  process.exit(1);
}

const newLogic = `      // ── 5. Contest Reminders (7 AM summary, 1h, 30m, 10m) ──
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
                 const updatedSentOn = row.last_reminder_sent_on ? \`\${row.last_reminder_sent_on},contest_morning\` : \`\${today}:contest_morning\`;
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
                    const updatedSentOn = row.last_reminder_sent_on ? \`\${row.last_reminder_sent_on},\${tag}\` : \`\${today}:contest_\${c.id}_\${cd.key}\`;
                    await supabase.from("user_settings").update({ last_reminder_sent_on: updatedSentOn }).eq("user_id", uid);
                    row.last_reminder_sent_on = updatedSentOn;
                 }
              }
           }
        }
      }
`;

const newContent = content.substring(0, idxStart) + newLogic + content.substring(idxEnd);
fs.writeFileSync("app/api/cron/send-reminders/route.ts", newContent);

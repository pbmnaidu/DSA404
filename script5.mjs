import fs from "fs";

let content = fs.readFileSync("app/api/cron/send-reminders/route.ts", "utf8");

const targetLogic = `        const reminderMins = timeToMinutes(row.reminder_time || "19:00");
        
        // Escalating nag logic: +0, +15, +30, +60 minutes
        const stages = [0, 15, 30, 60];
        let currentStage = 0;
        
        if (row.last_reminder_sent_on && row.last_reminder_sent_on.startsWith(today)) {
          const parts = row.last_reminder_sent_on.split("_");
          if (parts.length > 1) {
            currentStage = parseInt(parts[1], 10) + 1;
          } else {
            // Old format (just date), treat as fully sent to prevent spam
            currentStage = stages.length;
          }
        }

        if (currentStage < stages.length) {
          const targetMins = reminderMins + stages[currentStage];
          if (nowMins >= targetMins) {`;

const replacementLogic = `        const reminderMins = timeToMinutes(row.reminder_time || "19:00");
        
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

        if (pendingTriggers.length > 0) {`;

content = content.replace(targetLogic, replacementLogic);

const targetUpdate1 = `            if (sentAny) {
              // Update last_reminder_sent_on with the stage
              await supabase
                .from("user_settings")
                .update({ last_reminder_sent_on: \`\${today}_\${currentStage}\` })
                .eq("user_id", uid);
            }
          } else {
            // Mark as fully sent if no pending problems, so we don't check again today
            await supabase
              .from("user_settings")
              .update({ last_reminder_sent_on: \`\${today}_99\` })
              .eq("user_id", uid);
          }
        }
        }
      }`;

const replacementUpdate1 = `            if (sentAny) {
              const newlySent = pendingTriggers.map(t => t.id);
              const allSent = [...sentToday, ...newlySent].join(",");
              await supabase
                .from("user_settings")
                .update({ last_reminder_sent_on: \`\${today}:\${allSent}\` })
                .eq("user_id", uid);
            }
          } else {
            // Mark as fully sent if no pending problems, so we don't check again today
            const allTriggers = triggers.map(t => t.id).join(",");
            await supabase
              .from("user_settings")
              .update({ last_reminder_sent_on: \`\${today}:\${allTriggers}\` })
              .eq("user_id", uid);
          }
        }
      }`;

content = content.replace(targetUpdate1, replacementUpdate1);

fs.writeFileSync("app/api/cron/send-reminders/route.ts", content);

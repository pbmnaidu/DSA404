import fs from "fs";

let content = fs.readFileSync("app/api/cron/send-reminders/route.ts", "utf8");

const targetLogic = `        const reminderMins = timeToMinutes(row.reminder_time || "19:00");
        const alreadySent = row.last_reminder_sent_on === today;

        if (!alreadySent && nowMins >= reminderMins) {`;

const replacementLogic = `        const reminderMins = timeToMinutes(row.reminder_time || "19:00");
        
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

content = content.replace(targetLogic, replacementLogic);

const targetUpdate1 = `              // Update last_reminder_sent_on
              await supabase
                .from("user_settings")
                .update({ last_reminder_sent_on: today })
                .eq("user_id", uid);`;

const replacementUpdate1 = `              // Update last_reminder_sent_on with the stage
              await supabase
                .from("user_settings")
                .update({ last_reminder_sent_on: \`\${today}_\${currentStage}\` })
                .eq("user_id", uid);`;

content = content.replace(targetUpdate1, replacementUpdate1);

const targetUpdate2 = `            // Mark as sent even if no pending problems, so we don't check again today
            await supabase
              .from("user_settings")
              .update({ last_reminder_sent_on: today })
              .eq("user_id", uid);`;

const replacementUpdate2 = `            // Mark as fully sent if no pending problems, so we don't check again today
            await supabase
              .from("user_settings")
              .update({ last_reminder_sent_on: \`\${today}_99\` })
              .eq("user_id", uid);`;

content = content.replace(targetUpdate2, replacementUpdate2);

fs.writeFileSync("app/api/cron/send-reminders/route.ts", content);

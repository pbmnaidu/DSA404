import fs from "fs";

let content = fs.readFileSync("app/auth/callback/route.ts", "utf8");

const target = "const isBrandNew = Math.abs(createdAt - lastSignIn) < 10_000 && !user.user_metadata?.onboarding_completed;";
const replacement = `// Allow up to 1 hour difference for Magic Link logins, and ensure we only send it once
     const isBrandNew = Math.abs(createdAt - lastSignIn) < 60 * 60 * 1000 && !user.user_metadata?.welcome_email_sent;`;

content = content.replace(target, replacement);

const target2 = "void sendWelcomeEmails(user.email, displayName).catch((sendError) => console.error('OAuth welcome email failed:', sendError));";
const replacement2 = `void sendWelcomeEmails(user.email, displayName).catch((sendError) => console.error('OAuth welcome email failed:', sendError));
      
      // Mark as sent so we don't send again if they re-login within the hour
      await supabase.auth.updateUser({
        data: { welcome_email_sent: true }
      });`;

content = content.replace(target2, replacement2);

fs.writeFileSync("app/auth/callback/route.ts", content);

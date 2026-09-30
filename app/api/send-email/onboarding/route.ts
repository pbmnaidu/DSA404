import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email, name, username } = await req.json();
    const recipient = email?.trim();
    if (!recipient) {
      return NextResponse.json({ error: "Missing recipient email" }, { status: 400 });
    }

    const displayName = name || username || "Learner";
    const handle = username ? `@${username}` : "DSA Student";

    // ── EMAIL 1: Welcome & Greeting Email ──
    const subject1 = `Welcome to DSA⁴⁰⁴, ${displayName}! 🚀`;
    const text1 = `Hello ${displayName} (${handle}),

Welcome to the DSA⁴⁰⁴ community! We are thrilled to have you join us.

Core Motto:
"Set your pace. Stay consistent. Control the controllables."

Success in technical interviews is not about blindly solving 1000 problems—it is about mastering core patterns, building daily consistency, and tracking your growth.

You have taken the first step toward structured DSA mastery.

Happy Coding!
- The 404 DSA Team`;

    const html1 = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #090d16; color: #f8fafc; margin: 0; padding: 20px; }
    .card { max-width: 600px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .logo { font-size: 24px; font-weight: 900; color: #38bdf8; letter-spacing: -0.5px; }
    .logo-orange { color: #f97316; }
    .quote-box { background: linear-gradient(135deg, #0284c7 0%, #0f172a 100%); border: 1px solid #38bdf8; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .quote-text { margin: 0; font-size: 17px; color: #fbbf24; font-weight: 800; font-family: monospace; }
    .quote-sub { margin-top: 8px; font-size: 13px; color: #cbd5e1; font-style: italic; }
    .footer { margin-top: 32px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #1e293b; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">DSA<span class="logo-orange">⁴⁰⁴</span></div>
    <h2 style="margin-top: 16px; font-size: 22px; color: #f8fafc;">Welcome to DSA⁴⁰⁴, ${displayName}! 🚀</h2>
    <p style="color: #94a3b8; font-size: 15px; line-height: 1.6;">
      Hello <strong>${displayName}</strong> (<span style="color: #38bdf8;">${handle}</span>),
      <br/><br/>
      Welcome to the <strong>DSA⁴⁰⁴</strong> community! We are super excited to help you prepare systematically for your coding interviews and master Data Structures & Algorithms.
    </p>

    <div class="quote-box">
      <p class="quote-text">"Set your pace. Stay consistent. Control the controllables."</p>
      <p class="quote-sub">— The 404 DSA Team Core Principle</p>
    </div>

    <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
      Remember: The goal isn't just to solve 404 problems. The goal is to <strong>master the patterns</strong> behind them. Take it one day at a time, stick to your daily pace, and let the plan rebalance automatically when life happens.
    </p>

    <p style="color: #94a3b8; font-size: 14px; margin-top: 20px;">
      Warm regards,<br/>
      <strong style="color: #38bdf8;">The 404 DSA Team</strong>
    </p>

    <div class="footer">
      DSA⁴⁰⁴ · Built for structured, consistent DSA practice
    </div>
  </div>
</body>
</html>`;

    // ── EMAIL 2: Comprehensive Platform Features & Settings Guide ──
    const subject2 = `📖 Complete Guide: DSA⁴⁰⁴ Features, Curated Sheets, GitHub Sync & Coder Profiles`;
    const text2 = `Here is your complete guide to all features and settings in DSA⁴⁰⁴:

1. 📚 Curated & Custom DSA Sheets (Roadmap Selector):
   - Choose your preferred DSA sheet: Flagship Core 404 Roadmap, Striver's A2Z DSA Sheet, Striver's SDE Sheet, NeetCode 150, Love Babbar 450 Cracker, or RisingBrains Sheet.
   - Dynamic schedule generation tailored to your daily problem solving pace.
   - One-click Excel (.xlsx) sheet export & download for offline tracking anytime.

2. 🐙 GitHub Repository Auto-Sync (Link GitHub Repo):
   - Link your GitHub account and target repository directly from Settings or the Code Modal.
   - Auto-commits your solved code, key pattern insights, and submission links into your GitHub repository as structured .txt files whenever you save a solution!

3. 👤 Public Coder Profile & Shareable Portfolio:
   - Your personalized live shareable link: /profile/${username || "your_handle"}
   - Connect all your competitive coding handles: LeetCode, Codeforces, CodeChef, AtCoder, HackerRank, GeeksforGeeks (GFG), and GitHub.
   - Displays real-time submission heatmaps, LeetCode Widget, GitHub contribution heatmap, streaks, solved problem stats, and earned badges.
   - Customize your bio, profile picture, career goal, background banner, and direct email contact link.

4. 💡 Code Editor, Solution Vault & Built-in Integrations:
   - In-app solution editor to store your clean code, submission URLs, and key problem takeaways.
   - ⚡ Solve (AI Tutor): Interactive Socratic ChatGPT hints that guide your intuition step-by-step without spoiling full code.
   - ▶ YouTube: Direct 1-click video solution tutorials for every problem.
   - 🔍 Scoped Search: Instant scoped Google search across top programming platforms.

5. 📅 Today's Workspace & Smart Workload Management:
   - Topic and problem schedule for the day with daily heatmaps.
   - Postpone: Automatically shift unfinished daily targets forward without breaking schedule momentum.
   - Borrow: Pull future problems into today's workload when you want to solve extra.
   - Merge: Combine today's workload with tomorrow seamlessly.
   - Delete / Skip: Skip topics or problems you have already mastered.
   - Bookmark (Review Deck): Flag challenging problems for spaced repetition revision.
   - Daily Notes: Write daily takeaways and revise them on weekends.

6. 🏆 Automated Contest Attendance & Reminders:
   - Live contest calendar for upcoming contests across LeetCode, Codeforces, CodeChef, AtCoder, GFG, etc.
   - Automated contest alerts sent on contest day, 1 hour before, and 10 minutes before start time.
   - Direct links to practice missed contests on original platforms in virtual/practice mode.

7. 🔁 Review Deck, Backlog & Custom Revision Reminders:
   - Review Tab: Access all bookmarked problems to revise anytime.
   - Set custom email reminders for topic revision on any designated date with custom notes.
   - Backlog Tab: Track missed or unfinished days and clear them systematically.

8. ⚙️ Settings, PWA & Habit Reminders:
   - Install as a PWA (Progressive Web App) for native desktop & mobile experience.
   - Daily pace customizer (Easy, Medium, Hard limits per day).
   - Set Morning and Evening session reminders at specific times.
   - Pause & Resume study mode for exams, vacations, or busy work schedules.
   - Notification management with instant browser push test alerts.

Save/Print this guide as a PDF for offline reference anytime!

- The 404 DSA Team`;

    const html2 = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #090d16; color: #f8fafc; margin: 0; padding: 20px; }
    .card { max-width: 680px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .badge { display: inline-block; background: rgba(56,189,248,0.15); color: #38bdf8; border: 1px solid rgba(56,189,248,0.3); padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: bold; font-family: monospace; }
    h2 { font-size: 22px; color: #f8fafc; margin-top: 12px; }
    h3 { font-size: 16px; color: #38bdf8; margin-top: 24px; border-bottom: 1px solid #1e293b; padding-bottom: 6px; }
    .feature-item { background: #1e293b; border-radius: 10px; padding: 14px 18px; margin-bottom: 12px; border-left: 4px solid #38bdf8; }
    .feature-item-emerald { border-left-color: #10b981; }
    .feature-item-purple { border-left-color: #a855f7; }
    .feature-item-amber { border-left-color: #f59e0b; }
    .feature-title { font-weight: bold; font-size: 14px; color: #f8fafc; margin-bottom: 6px; }
    .feature-desc { font-size: 13px; color: #94a3b8; line-height: 1.6; margin: 0; }
    ul { margin: 6px 0 0 0; padding-left: 18px; color: #cbd5e1; font-size: 13px; line-height: 1.6; }
    li { margin-bottom: 4px; }
    .pdf-box { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); border-radius: 12px; padding: 16px; margin-top: 24px; text-align: center; }
    .pdf-text { font-size: 13px; color: #fbbf24; font-weight: bold; margin: 0; }
    .footer { margin-top: 32px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #1e293b; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">DSA⁴⁰⁴ PLATFORM GUIDE</div>
    <h2>Here is your complete guide to all features & settings in DSA⁴⁰⁴:</h2>

    <h3>1. 📚 Curated & Custom DSA Sheets (Roadmap Selector)</h3>
    <div class="feature-item feature-item-emerald">
      <ul>
        <li>Choose your target sheet: <strong>Core 404 Roadmap</strong>, <strong>Striver's A2Z DSA Sheet</strong>, <strong>Striver's SDE Sheet</strong>, <strong>NeetCode 150</strong>, <strong>Love Babbar 450 Cracker</strong>, or <strong>RisingBrains Sheet</strong>.</li>
        <li>Dynamic day-by-day schedule generation tailored to your daily problem-solving limits.</li>
        <li>One-click Excel (<strong style="color: #10b981;">.xlsx</strong>) export & download for offline reference anytime.</li>
      </ul>
    </div>

    <h3>2. 🐙 GitHub Repository Auto-Sync (Link GitHub Repo)</h3>
    <div class="feature-item feature-item-purple">
      <ul>
        <li>Connect your GitHub account and link/create a repository in Settings or Code Modal.</li>
        <li>Automatically commits solved code, key takeaway points, and submission URLs to your GitHub repo as formatted <strong style="color: #a855f7;">.txt</strong> files on every save!</li>
      </ul>
    </div>

    <h3>3. 👤 Public Coder Profile & Shareable Portfolio</h3>
    <div class="feature-item">
      <div class="feature-title">Live Portfolio & Multi-Platform Integration</div>
      <ul>
        <li>Your shareable live profile link: <strong style="color: #38bdf8;">/profile/${username || "your_handle"}</strong></li>
        <li>Connect handles for <strong>LeetCode</strong>, <strong>Codeforces</strong>, <strong>CodeChef</strong>, <strong>AtCoder</strong>, <strong>HackerRank</strong>, <strong>GeeksforGeeks (GFG)</strong>, and <strong>GitHub</strong>.</li>
        <li>Showcases live submission heatmaps, LeetCode widget, GitHub contribution heatmap, streaks, solved breakdown, and earned badges.</li>
        <li>Customize profile bio, avatar, background banner, career goal, and contact email link.</li>
      </ul>
    </div>

    <h3>4. 💡 Code Editor, Solution Vault & Learning Tools</h3>
    <div class="feature-item">
      <ul>
        <li>In-app code editor to save solution code, submission links, and key intuition points.</li>
        <li>⚡ <strong>Solve (AI Tutor)</strong>: Interactive Socratic ChatGPT hints to build intuition without giving away raw solution code upfront.</li>
        <li>▶ <strong>YouTube Solutions</strong>: One-click video solutions for related problems.</li>
        <li>🔍 <strong>Scoped Search</strong>: Quick Google search scoped across top competitive programming sites.</li>
      </ul>
    </div>

    <h3>5. 📅 Today's Workspace & Workload Rebalancing</h3>
    <div class="feature-item">
      <ul>
        <li>Daily assigned topics, problems, and progress heatmaps.</li>
        <li><strong>Postpone</strong>: Shift unfinished days forward automatically without stress.</li>
        <li><strong>Borrow</strong>: Pull future problems into today's goal if you are ahead.</li>
        <li><strong>Merge</strong>: Combine today's workload with tomorrow.</li>
        <li><strong>Delete / Skip</strong>: Skip or remove topics you already master.</li>
        <li><strong>Bookmark (Review Deck)</strong>: Flag problems for revision.</li>
        <li>Daily notes section to write key takeaways and review on weekends.</li>
      </ul>
    </div>

    <h3>6. 🏆 Automated Contest Attendance & Reminders</h3>
    <div class="feature-item feature-item-amber">
      <ul>
        <li>Live contest calendar featuring upcoming contests on LeetCode, Codeforces, CodeChef, AtCoder, GFG, etc.</li>
        <li>Automated reminders sent on contest day, 1 hour before, and 10 minutes before start time.</li>
        <li>Direct links to attempt missed contests on original platforms in virtual or practice mode.</li>
      </ul>
    </div>

    <h3>7. 🔁 Review Deck, Backlog & Custom Reminders</h3>
    <div class="feature-item">
      <ul>
        <li><strong>Review Tab</strong>: Access all bookmarked problems to revise anytime.</li>
        <li>Set custom email reminders for topic revision on specific dates with personal notes.</li>
        <li><strong>Backlog Tab</strong>: View missed or pending days and clear them systematically.</li>
      </ul>
    </div>

    <h3>8. ⚙️ Settings, PWA & Daily Habit Reminders</h3>
    <div class="feature-item">
      <ul>
        <li>Install PWA application on desktop or mobile for native offline experience.</li>
        <li>Daily pace customizer (Easy, Medium, Hard limits per day).</li>
        <li>Set Morning and Evening session reminders at your preferred times.</li>
        <li>Pause & Resume study mode for exams, vacations, or busy periods.</li>
        <li>Notification section to test and manage browser push notifications.</li>
      </ul>
    </div>

    <div class="pdf-box">
      <p class="pdf-text">💡 Save/Print this guide as a PDF for offline reference anytime!</p>
    </div>

    <div class="footer">
      DSA⁴⁰⁴ · Built for structured, consistent DSA practice
    </div>
  </div>
</body>
</html>`;

    // Send both emails automatically
    console.log(`Sending 2 onboarding emails to ${recipient}...`);
    await sendEmail(recipient, subject1, text1, html1);
    await sendEmail(recipient, subject2, text2, html2);

    return NextResponse.json({ success: true, sentTo: recipient });
  } catch (err: any) {
    console.error("Onboarding emails API error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

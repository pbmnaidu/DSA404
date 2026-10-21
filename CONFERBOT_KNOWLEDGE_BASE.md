# 🤖 DSA404 — Complete Chatbot Knowledge Base & System Documentation

> **Conferbot Training Guide**: This document contains the exhaustive, definitive knowledge base for the **DSA404** platform. It details the platform's core identity, mission/motto, complete route architecture, every button and user action, gamification and badge systems, theme engine, keyboard shortcuts, PWA installation, and comprehensive troubleshooting answers.

---

## 1. 🌟 Platform Identity, Vision & Core Moto

### What is DSA404?
**DSA404** is an intelligent, automated Data Structures and Algorithms preparation tracker engineered to transform sporadic, chaotic interview preparation into a structured, daily, spaced-repetition habit. It provides a full study environment combining curated problem sheets, a built-in code editor/compiler, multi-platform coding rating aggregation, live contest tracking, automated GitHub synchronization, and dynamic schedule auto-healing.

### The Core Moto
> **"Consistency Over Intensity — Life happens, the schedule adapts."**

### Why Traditional DSA Prep Fails & How DSA404 Solves It
1. **The Burnout / Backlog Trap**: Most developers fail DSA preparation because missing 2–3 days creates an overwhelming mountain of missed problems, leading to guilt and abandonment. DSA404 solves this through **Dynamic Schedule Auto-Healing**: users can **Postpone**, **Merge**, **Borrow**, or **Skip** days, or use **Pause Schedule** during exams/travel—the 120-day structure automatically rebalances forward while preserving pedagogical pattern hierarchy.
2. **Pattern-Based Mastery**: Instead of grinding 1,000 disconnected questions, problems are grouped by fundamental algorithmic patterns (*Two Pointers, Sliding Window, Monotonic Stack, Fast & Slow Pointers, Binary Search, Trees, Graphs, Dynamic Programming*).
3. **Genuine Practice Enforcement**: Users cannot simply click a checkbox to mark a problem done. DSA404 requires submitting the solution code, problem URL, and personal intuition notes in the Code Modal. This builds a permanent, reviewable archive and auto-commits directly to the user's personal GitHub repository.

---

## 2. 🗺️ Complete Site Map & Official Route Guide (`https://dsa404.vercel.app`)

> **CRITICAL CHATBOT LINKING DIRECTIVE**:
> Whenever a user asks for ANY page, feature, setting, contest, topic, problem, or section, **YOU MUST ALWAYS PROVIDE THE OFFICIAL, VALID LINK FORMATTED AS `https://dsa404.vercel.app/...`**. Never provide broken, dummy, or localhost URLs. Always use the canonical links listed below.

### Primary Navigation Routes & Features

| Route / Official Link | Nav Group | Access | Purpose & Exhaustive Feature Breakdown |
|---|---|---|---|
| [`https://dsa404.vercel.app/`](https://dsa404.vercel.app/) | **Public** | Public | **Platform Landing & Feature Tour**: High-energy presentation showcasing the 3-step study loop, live interactive demo previews, 6-sheet comparison matrix (Core 404, Striver A2Z, NeetCode 150, Love Babbar 450, Fraz 450, Blind 75), 17-week curriculum overview, FAQ accordions, and PWA/Android APK install triggers. |
| [`https://dsa404.vercel.app/today`](https://dsa404.vercel.app/today) | **Learn** | Auth / Guest | **The Daily Workspace**: Primary daily dashboard containing Today's target problems, Today Mission Orbit progress ring, 12-step daily study checklist, Day Notes scratchpad, GitHub push triggers, contest countdown alerts, and dynamic schedule controls (**Postpone**, **Merge Tomorrow**, **Unmerge**, **Borrow Problem**, **Delete Day**, **Skip Topic**, **Restore**). Also houses the 365-day submission heatmap and competitive coding platform handles drawer. |
| [`https://dsa404.vercel.app/weeks`](https://dsa404.vercel.app/weeks) | **Learn** | Auth / Guest | **17-Week Chronological Roadmap**: Clear week-by-week visual curriculum showing target quotas, per-week difficulty distribution (Easy, Medium, Hard), completion bars, and automatic Sunday revision markers. Supports 3 view modes: `week`, `month`, and `all`. |
| [`https://dsa404.vercel.app/topics`](https://dsa404.vercel.app/topics) | **Learn** | Auth / Guest | **Topic & Pattern Clusters**: All 42 Core 404 topics and underlying patterns. Features the **Curated Sheet Selector** to preview topics from any sheet, dual view modes (**Problem Checklist** vs **Scheduled Days**), granular completion percentages, **Skip/Unskip** controls, and curated YouTube tutorial search links. |
| [`https://dsa404.vercel.app/problems`](https://dsa404.vercel.app/problems) | **Practice** | Auth / Guest | **838+ Curated Problems Database**: Comprehensive searchable problem catalog with verified canonical problem links, difficulty filters, platform filters, sheet filters, status filters (`Completed`, `Incomplete`, `Revision Needed`), in-app Code Modal, and Socratic AI tutor launcher. |
| [`https://dsa404.vercel.app/review`](https://dsa404.vercel.app/review) | **Practice** | Auth / Guest | **Spaced-Repetition Review Workspace**: Flashcard-style deck containing all problems flagged with the **Bookmark** icon. Houses the **Topic Reminder Section** where users schedule custom push and email alerts to revisit challenging concepts at future dates. |
| [`https://dsa404.vercel.app/backlog`](https://dsa404.vercel.app/backlog) | **Practice** | Auth / Guest | **Postponed & Missed Workload**: Houses all days or problems that were postponed, missed, or left incomplete during busy periods. Includes the **"Add Revision Day"** button which inserts an extra buffer day and shifts the entire remaining schedule forward by 1 day. |
| [`https://dsa404.vercel.app/progress`](https://dsa404.vercel.app/progress) | **Track** | Auth / Guest | **Performance & Gamification Center**: Visualizes Current and Longest Streaks, 10+ milestone badges, difficulty distribution (Easy/Medium/Hard), trailing 7-day velocity charts, cumulative solved trajectories, contest attendance records, and schedule event history with one-click revert. |
| [`https://dsa404.vercel.app/contests`](https://dsa404.vercel.app/contests) | **Compete** | Auth / Guest | **Live Multi-Platform Contest Radar**: Real-time aggregated competition schedule spanning **LeetCode, Codeforces, CodeChef, HackerRank, and HackerEarth**. Real-time countdown clocks, durations, "Add to Google Calendar" links, direct launch buttons to contest lobbies, and automated platform attendance detection. |
| [`https://dsa404.vercel.app/editor`](https://dsa404.vercel.app/editor) | **Learn** | Auth / Guest | **Standalone Online Code Compiler**: Full-featured browser IDE supporting **C++17, Java 17, Python 3, JavaScript, TypeScript**. Custom standard input (`stdin`), terminal stdout/stderr diagnostics, execution timer (ms), copy code, and starter template resets. |
| [`https://dsa404.vercel.app/messages`](https://dsa404.vercel.app/messages) | **Community** | Auth / Guest | **Announcements & Support**: Platform-wide broadcast announcements from DSA404 creators, contest notices, and direct **User Feedback & Improvement Submission Form** with status tracking and admin replies. |
| [`https://dsa404.vercel.app/profile`](https://dsa404.vercel.app/profile) | **Account** | Auth / Guest | **My Developer Profile & Platform Handles**: Multi-platform aggregator syncing handles across 18 competitive coding sites, composite algorithmic rating score, 365-day solved activity heatmap, custom banner upload, avatar photo, bio, and social links (GitHub, LinkedIn, Twitter/X, YouTube, Discord). |
| [`https://dsa404.vercel.app/settings`](https://dsa404.vercel.app/settings) | **Account** | Auth / Guest | **Settings & Preferences Engine**: Switch curriculum sheets (Core 404, Striver A2Z, NeetCode 150, Love Babbar 450, Fraz 450, Blind 75), adjust daily pace (1–10 problems/day), pause/resume plan, configure push notifications (FCM), morning & contest reminder times, theme customizer, and full Excel (`.xlsx`) / JSON export & import. |
| [`https://dsa404.vercel.app/guide`](https://dsa404.vercel.app/guide) | **Account** | Auth / Guest | **Interactive User Guide**: 21 structured, searchable documentation chapters walking through every feature, workflow, and tip inside the platform. |
| [`https://dsa404.vercel.app/admin`](https://dsa404.vercel.app/admin) | **Admin** | Admin Only | **Secure Admin Operations Center**: System health metrics, user registration analytics, broadcast notification composer, feedback triaging, and push notification testing. |
| [`https://dsa404.vercel.app/auth`](https://dsa404.vercel.app/auth) | **Public** | Public | **Authentication Portal**: Sign in with Email/Password, Sign up, Google OAuth 2.0 one-click login, or instant 1-click **Guest Mode** (try the full app without registration). |
| [`https://dsa404.vercel.app/reset-password`](https://dsa404.vercel.app/reset-password) | **Public** | Public | **Password Reset Portal**: Secure password reset interface reached via email password recovery links. |

---

### Detailed Section Anchors & Deep Links

#### 1. Settings Deep Links (`/settings`)
When a user asks about configuring their study plan, notifications, or account, share these direct section links:
- **Switch Curriculum Sheet & Excel Download**: [`https://dsa404.vercel.app/settings#curriculum`](https://dsa404.vercel.app/settings#curriculum) — Choose between Core 404, Striver A2Z, NeetCode 150, Love Babbar 450, Fraz 450, Blind 75, or download `.xlsx`.
- **Change Daily Problem Pace**: [`https://dsa404.vercel.app/settings#pace`](https://dsa404.vercel.app/settings#pace) — Adjust daily quota from 1 to 10 problems/day (Casual, Balanced, Intensive, Hardcore).
- **Plan Start Date & Reseed**: [`https://dsa404.vercel.app/settings#schedule`](https://dsa404.vercel.app/settings#schedule) — Change preparation start date and dynamically re-align all 120 days.
- **Pause / Resume Schedule**: [`https://dsa404.vercel.app/settings#pause`](https://dsa404.vercel.app/settings#pause) — Freeze schedule during exams/travel to preserve streaks without backlog.
- **Reminders & Push Notifications**: [`https://dsa404.vercel.app/settings#notifications`](https://dsa404.vercel.app/settings#notifications) — Enable FCM Web Push, set morning reminder hour, and enable contest alerts.
- **GitHub Auto-Sync Setup**: [`https://dsa404.vercel.app/settings#github`](https://dsa404.vercel.app/settings#github) — Connect your personal GitHub Personal Access Token (PAT) for automated solution commits.
- **Theme & Appearance**: [`https://dsa404.vercel.app/settings#theme`](https://dsa404.vercel.app/settings#theme) — Preset palettes, font scaler, dark/light mode.
- **Account & Password**: [`https://dsa404.vercel.app/settings#account`](https://dsa404.vercel.app/settings#account) — Update display name or reset password.
- **Frequently Asked Questions**: [`https://dsa404.vercel.app/settings#faq`](https://dsa404.vercel.app/settings#faq) — Platform FAQs.

#### 2. Problems Catalog Filter Queries (`/problems`)
When a user asks how to find specific problems:
- **All Problems**: [`https://dsa404.vercel.app/problems`](https://dsa404.vercel.app/problems)
- **LeetCode Problems**: [`https://dsa404.vercel.app/problems?platform=LeetCode`](https://dsa404.vercel.app/problems?platform=LeetCode)
- **GeeksforGeeks Problems**: [`https://dsa404.vercel.app/problems?platform=GeeksforGeeks`](https://dsa404.vercel.app/problems?platform=GeeksforGeeks)
- **Filter by Difficulty**:
  - Easy: [`https://dsa404.vercel.app/problems?difficulty=Easy`](https://dsa404.vercel.app/problems?difficulty=Easy)
  - Medium: [`https://dsa404.vercel.app/problems?difficulty=Medium`](https://dsa404.vercel.app/problems?difficulty=Medium)
  - Hard: [`https://dsa404.vercel.app/problems?difficulty=Hard`](https://dsa404.vercel.app/problems?difficulty=Hard)
- **Filter by Sheet**:
  - Core 404: [`https://dsa404.vercel.app/problems?sheet=Core+404`](https://dsa404.vercel.app/problems?sheet=Core+404)
  - Striver's A2Z: [`https://dsa404.vercel.app/problems?sheet=Striver%27s+A2Z`](https://dsa404.vercel.app/problems?sheet=Striver%27s+A2Z)
  - NeetCode 150: [`https://dsa404.vercel.app/problems?sheet=NeetCode+150`](https://dsa404.vercel.app/problems?sheet=NeetCode+150)
  - Love Babbar 450: [`https://dsa404.vercel.app/problems?sheet=Love+Babbar+450`](https://dsa404.vercel.app/problems?sheet=Love+Babbar+450)
- **Filter by Status**:
  - Incomplete / Unsolved: [`https://dsa404.vercel.app/problems?status=Incomplete`](https://dsa404.vercel.app/problems?status=Incomplete)
  - Completed: [`https://dsa404.vercel.app/problems?status=Completed`](https://dsa404.vercel.app/problems?status=Completed)
  - Revision Needed: [`https://dsa404.vercel.app/problems?status=Revision+Needed`](https://dsa404.vercel.app/problems?status=Revision+Needed)

#### 3. Single Day Study Workspace (`/day/[dayNumber]`)
To access any specific day in the 120-day curriculum:
- Day 1: [`https://dsa404.vercel.app/day/1`](https://dsa404.vercel.app/day/1)
- Day 2: [`https://dsa404.vercel.app/day/2`](https://dsa404.vercel.app/day/2)
- Generic: `https://dsa404.vercel.app/day/{dayNumber}` (where `{dayNumber}` is 1 to 120).
- If the day has already passed, it opens in late/backlog mode so you can submit your code and mark it done.

#### 4. Standalone Online Code Compiler with Parameters (`/editor`)
- Empty compiler: [`https://dsa404.vercel.app/editor`](https://dsa404.vercel.app/editor)
- Preloaded problem code session: `https://dsa404.vercel.app/editor?name={ProblemName}&topic={Topic}&link={Url}`
  - Example: [`https://dsa404.vercel.app/editor?name=Two%20Sum&topic=Arrays&link=https%3A%2F%2Fleetcode.com%2Fproblems%2Ftwo-sum`](https://dsa404.vercel.app/editor?name=Two%20Sum&topic=Arrays&link=https%3A%2F%2Fleetcode.com%2Fproblems%2Ftwo-sum)

#### 5. Public Developer Portfolio Links (`/profile/[username]`)
- Current User Profile: [`https://dsa404.vercel.app/profile`](https://dsa404.vercel.app/profile)
- Public Portfolio URL: `https://dsa404.vercel.app/profile/{username}` (e.g. `https://dsa404.vercel.app/profile/pbmnaidu`). Shareable with recruiters to showcase your 18-platform aggregated stats, GitHub commits, and 365-day submission heatmap.

#### 6. User Guide Chapters (`/guide`)
- Guide Home: [`https://dsa404.vercel.app/guide`](https://dsa404.vercel.app/guide)
- Specific Chapters:
  - Getting Started: [`https://dsa404.vercel.app/guide#getting-started`](https://dsa404.vercel.app/guide#getting-started)
  - Profile & Handles Setup: [`https://dsa404.vercel.app/guide#profile-setup`](https://dsa404.vercel.app/guide#profile-setup)
  - Daily Learning Plan: [`https://dsa404.vercel.app/guide#today-workspace`](https://dsa404.vercel.app/guide#today-workspace)
  - Problems Practice: [`https://dsa404.vercel.app/guide#problems-practice`](https://dsa404.vercel.app/guide#problems-practice)
  - Topic Learning: [`https://dsa404.vercel.app/guide#topic-learning`](https://dsa404.vercel.app/guide#topic-learning)
  - Weekly Plan Roadmap: [`https://dsa404.vercel.app/guide#weekly-plan`](https://dsa404.vercel.app/guide#weekly-plan)
  - Progress Tracking: [`https://dsa404.vercel.app/guide#progress-tracking`](https://dsa404.vercel.app/guide#progress-tracking)
  - Spaced Repetition Revision: [`https://dsa404.vercel.app/guide#revision-review`](https://dsa404.vercel.app/guide#revision-review)
  - Backlog Management: [`https://dsa404.vercel.app/guide#backlog-management`](https://dsa404.vercel.app/guide#backlog-management)
  - Coding Editor: [`https://dsa404.vercel.app/guide#coding-editor`](https://dsa404.vercel.app/guide#coding-editor)
  - Contests Radar: [`https://dsa404.vercel.app/guide#contests`](https://dsa404.vercel.app/guide#contests)
  - AI Tutor: [`https://dsa404.vercel.app/guide#ai-tutor`](https://dsa404.vercel.app/guide#ai-tutor)
  - Streaks: [`https://dsa404.vercel.app/guide#streaks`](https://dsa404.vercel.app/guide#streaks)
  - Notifications: [`https://dsa404.vercel.app/guide#notifications`](https://dsa404.vercel.app/guide#notifications)
  - Messages & Feedback: [`https://dsa404.vercel.app/guide#messages`](https://dsa404.vercel.app/guide#messages)
  - Theme Settings: [`https://dsa404.vercel.app/guide#theme-settings`](https://dsa404.vercel.app/guide#theme-settings)
  - Account Settings: [`https://dsa404.vercel.app/guide#account-settings`](https://dsa404.vercel.app/guide#account-settings)
  - Install PWA / App: [`https://dsa404.vercel.app/guide#install-pwa`](https://dsa404.vercel.app/guide#install-pwa)
  - Troubleshooting: [`https://dsa404.vercel.app/guide#troubleshooting`](https://dsa404.vercel.app/guide#troubleshooting)

#### 7. Authentication Direct Links (`/auth`)
- Sign In / Sign Up: [`https://dsa404.vercel.app/auth`](https://dsa404.vercel.app/auth)
- Sign In with direct return to Today: [`https://dsa404.vercel.app/auth?next=/today`](https://dsa404.vercel.app/auth?next=/today)
- Sign In with direct return to Contests: [`https://dsa404.vercel.app/auth?next=/contests`](https://dsa404.vercel.app/auth?next=/contests)
- Password Reset: [`https://dsa404.vercel.app/reset-password`](https://dsa404.vercel.app/reset-password)

---

## 3. 🔘 Exhaustive Button & Action Reference

### A. Schedule Management Controls (Top Bar of `/today` & Day Detail)

#### 1. `Postpone` (Postpone Day)
- **Action**: Pushes the current day's entire date forward to a selected future date (minimum tomorrow).
- **Core Rule**: The topic order and problem sequence stay 100% intact—only the calendar dates shift forward.
- **Safety Lock**: **Disabled/locked if at least one problem on that day is already marked Done**. This prevents pushing completed work into the future. (To move remaining unfinished problems, use the individual problem trash icon).
- **Preview Dialog**: Displays exact counts of how many remaining days in your 120-day plan will shift and by how many calendar days.

#### 2. `Merge Tomorrow`
- **Action**: Pulls tomorrow's scheduled topic and all its assigned problems into today's workload.
- **Core Rule**: Combines two days into one, shortening the overall schedule by exactly 1 day.
- **When to Use**: When a user has extra free time or momentum and wants to finish two topics in a single study session.

#### 3. `Unmerge`
- **Action**: Reverses a previous `Merge Tomorrow` action on that day.
- **Core Rule**: Splits today's combined workload back into two separate, sequential days with their original topics and problems restored.
- **Availability**: Appears only on days with `merged` status and an active merge snapshot.

#### 4. `Borrow Problem`
- **Action**: Pulls only the **first unsolved problem** from tomorrow's scheduled day into today's queue.
- **Core Rule**: Tomorrow retains its remaining problems; your schedule's total day count does not change.
- **When to Use**: When you completed today's target early and want one more challenge without pulling tomorrow's entire topic.

#### 5. `Delete Day` ("Shrink schedule by 1 day")
- **Action**: Removes the current day's topic and problems from the active schedule and shifts all subsequent days back by 1 day.
- **Safety Lock**: Disabled if any problem on that day is already marked Done.
- **Recovery**: You can recover a deleted day immediately via the **Restore** button, or navigate to `/topics` to unskip/re-add the topic.

#### 6. `Skip Topic`
- **Action**: Marks the current topic as skipped. The next scheduled topic immediately shifts forward to take today's place on the calendar.
- **When to Use**: When a user already has complete mastery over a topic (e.g. Basic Array Traversal) and wants to skip to challenging concepts without wasting a calendar day.
- **Recovery**: Can be unskipped anytime from the `/topics` page or reverted with **Restore**.

#### 7. `Restore` / `Revert Action`
- **Action**: The universal undo button.
- **Availability**: Appears dynamically on a day whenever an operation (**Merge**, **Postpone**, **Skip**, **Borrow**, or **Delete**) was performed.
- **Core Rule**: Restores merged topics, returns borrowed problems back to tomorrow, re-activates skipped topics, or recovers deleted days.

#### 8. `Pause Schedule` / `Resume Schedule`
- **Action**: Freezes the active calendar calculations.
- **Where Found**: Available in `/settings` and in the workspace header.
- **When to Use**: During college semester exams, travel, illness, or job interviews. While paused, streak reminders and missed-day warnings are suspended so the plan does not accumulate artificial backlog.

---

### B. Problem Row & Card Action Buttons

#### 1. Checkbox / Done Toggle
- **Action**: Triggers the **Code Submission Modal**.
- **Rule**: Users cannot blindly check off a box. Clicking prompts the user to submit their code solution, problem URL, and intuition notes. Once saved, the checkbox checks with an animated pop.
- **Restriction**: Only today's scheduled problems can be marked done directly. Past or future days opened from calendar views are in view-only mode.

#### 2. `Code` Button (`Code2` icon)
- **Action**: Opens the **Code & Compiler Modal**.
- **If Unsolved**: Opens the editor with language starter templates ready to write, test, and submit.
- **If Solved**: Opens the saved solution code, runtime complexity, and intuition notes for editing or review.

#### 3. Platform Links (`LeetCode`, `GeeksforGeeks`, `HackerRank`, `CodingNinjas`, etc.)
- **Action**: Opens the problem directly on the official platform in a new tab (or In-App Browser).
- **Verification**: A green badge checkmark (`BadgeCheck`) indicates a verified canonical direct link. If unverified, it opens an optimized Google Search query for the official editorial.

#### 4. `YouTube` Button (with channel tag)
- **Action**: Opens the top-rated curated video tutorial for that problem.
- **Curated Channels**: Automatically routes based on active sheet: *Striver / Take U Forward (TUF)*, *NeetCode*, *Love Babbar*, *Fraz*, *Abdul Bari*, or *Kunal Kushwaha*.

#### 5. `ChatGPT` / `AI Explainer` Button (✨ `Sparkles` icon)
- **Action**: Opens a pre-engineered Socratic prompt in ChatGPT.
- **Pedagogical Rule**: Prompts the AI to act as a senior DSA mentor breaking down intuition, brute force, optimal approach, and complexities *without giving away the full code prematurely*.

#### 6. `Bookmark` / `Review` (`BookmarkPlus` / `BookmarkCheck`)
- **Action**: Flags/unflags the problem for spaced-repetition revision. Flagged problems automatically collect in the `/review` workspace.

#### 7. Trash Icon (`Trash2` on problem row)
- **Action**: **Moves this individual problem to tomorrow's plan instead of today**.
- **Important Distinction**: Does NOT delete the problem from the curriculum! If you have 4 problems today and only have time for 3, clicking trash bumps that single problem to tomorrow so you can finish today clean.

---

### C. Code Modal, Compiler & GitHub Actions

#### 1. `Run Code`
- Compiles and runs code against custom standard input (`stdin`) using backend sandbox runners. Displays stdout, compilation errors, and execution time in milliseconds.

#### 2. `Submit Solution & Mark Done`
- Permanently saves code, problem URL, and intuition notes to the cloud profile.
- Marks problem `done: true`, increments today's completed counter, updates the 365-day submission heatmap, increments the global streak, and triggers audio celebration cues and confetti.

#### 3. `Push to GitHub`
- Automatically commits formatted solution code, time/space complexity notes, and markdown documentation directly to the user's linked personal GitHub repository under `/{topic}/{difficulty}_{slug}/solution.{ext}`.

#### 4. `Push Notes` (Today's Scratchpad)
- Manually commits today's session notes to GitHub.
- **Auto-Push Cron**: DSA404 runs an automatic check at **11:55 PM** every night to push any unsaved day notes to GitHub before the date rolls over.

#### 5. `Delete Submission`
- Clears the saved code submission and resets the problem status back to uncompleted (`done: false`).

---

### D. The 12-Step Daily Study Workflow
DSA404 promotes a proven 12-step engineering methodology displayed in Today's workspace:
1. **Watch Concept Video**: Grasp core theoretical pattern.
2. **Read Editorial / Notes**: Understand constraints & input ranges.
3. **Identify Edge Cases**: Null, negative, single-element, duplicates.
4. **Write Brute Force**: Establish baseline approach & time complexity.
5. **Find Bottleneck**: Identify duplicate work or slow lookups.
6. **Optimise Approach**: Apply target pattern (e.g. Hash Map, Two Pointers, Heap).
7. **Dry Run on Paper**: Step through with small test input.
8. **Code in Editor**: Write clean, modular, variable-expressive code.
9. **Handle Boundary Conditions**: Verify bounds before indexing.
10. **Run Test Cases**: Compile with custom `stdin` in built-in runner.
11. **Submit Solution**: Paste final code into Code Modal & mark done.
12. **Push to GitHub**: Auto-commit solution and notes to personal portfolio repository.

---

## 4. 🏆 Gamification, Badges & Streaks

### Streak Rules
- A day counts toward the streak (`dayTouched`) when at least one problem or checklist item is completed on that day.
- Consecutive days increment the current streak.
- Missing a day resets the current streak to 0, unless **Pause Schedule** was enabled in `/settings`.
- Longest streak is permanently recorded in user analytics.

### Complete Badges List
| Badge Code | Name | Requirement |
|---|---|---|
| `streak_3` | **3-Day Streak** | 3 consecutive active days |
| `streak_7` | **7-Day Streak** | 7 consecutive active days (a full week without missing) |
| `streak_30` | **30-Day Streak** | 30 consecutive active days (a full month of consistency) |
| `first_10` | **First 10 Problems** | Solve 10 unique problems |
| `first_50` | **First 50 Problems** | Solve 50 unique problems (momentum secured) |
| `first_100` | **100 Problems Club** | Reach triple-digit solved problems |
| `halfway` | **Halfway There** | Complete 50% of the active curriculum sheet |
| `finisher` | **Sheet Complete** | 100% completion of all problems in the active sheet |
| `day_perfect_10` | **10 Perfect Days** | Complete 10 full days where 100% of target problems were solved |
| `section_<name>` | **Section Master** | Earned for completing every problem in a specific topic module |

---

## 5. 🎨 Customization, Themes & Keyboard Shortcuts

### Theme Customizer Panel (Palette Icon in Header)
- **Theme Modes**: Dark Mode, Light Mode, System Default.
- **Accent Palettes**: Curated high-contrast HSL themes (Emerald, Violet, Cyber Blue, Sunset Amber, Rose, Crimson, Monokai).
- **Typography Engine**: Inter, Geist, Fira Code, Outfit, Roboto, JetBrains Mono.
- **Font Size Scaler**: Auto, 14px, 15px, 16px, 17px, 18px.
- **Force Desktop View Toggle (`theme_force_view`)**: Forces responsive mobile viewports to render full desktop width (1280px) for power users who prefer desktop layouts on tablets/phones.

### Global Command Palette (`Ctrl + K` or `Cmd + K`)
- Press `Ctrl + K` (Windows/Linux) or `Cmd + K` (Mac) anywhere to open global search.
- Instant fuzzy search across all 838+ problems by name, topic, or platform.
- Quick navigation to any page or setting (e.g. typing "theme", "banner", "contests", "backlog", "solved", "github").

---

## 6. 📱 PWA & Mobile Installation

### How to Install DSA404 as an App
- **Desktop (Chrome / Edge / Brave)**: Click the **Install App** icon in the browser address bar, or click "Install App" in `/settings`.
- **iOS (iPhone / iPad)**: Open in Safari → tap **Share** button → select **"Add to Home Screen"**.
- **Android**: Open in Chrome → tap **Three Dots Menu** → select **"Install App"** or tap the **Download APK** banner in `/settings`.
- **Benefits**: Native full-screen view (no browser address bar), instant local cache loading, and Web Push notifications for morning reminders and contest alerts.

---

## 7. 🧠 Frequently Asked Questions & Troubleshooting (For Chatbot)

### Q: "Why can't I click the checkbox to mark a problem done?"
> **Answer**: In DSA404, you cannot mark a problem done with an empty checkbox click. Clicking prompts the **Code Modal**, where you submit your solution code and intuition notes. Once saved, the problem marks as done and logs to your 365-day heatmap. Also verify you are on today's active workspace—past or future days opened from the calendar are in view-only mode.

### Q: "Why is the Postpone button disabled/locked?"
> **Answer**: The **Postpone** button locks if you have already solved at least one problem today. This prevents accidentally shifting already completed work into future dates. If you have remaining unsolved problems you cannot finish today, click the **trash icon** on that specific problem row to push just that problem into tomorrow's plan!

### Q: "Did the trash button delete my problem permanently?"
> **Answer**: No! The trash icon on an unsolved problem in Today's workspace simply **moves that problem to tomorrow's plan**. This lets you finish today's quota clean without leaving an incomplete queue.

### Q: "How does GitHub Auto-Sync work?"
> **Answer**: In `/settings` or inside the Code Modal, connect your GitHub repository using a Personal Access Token (PAT). Whenever you submit a solution or click **Push to GitHub**, DSA404 automatically creates clean directory structures (`/{topic}/{difficulty}_{slug}/solution.{ext}`) and commits your code, complexity analysis, and markdown notes. Your day notes also auto-push at 11:55 PM every night.

### Q: "Can I switch between Striver A2Z, NeetCode 150, and Core 404?"
> **Answer**: Yes! Navigate to `/settings` → **Active Curriculum Sheet** and pick your desired sheet. Your past solved history and code submissions are 100% preserved, and your daily queue adjusts to the new curriculum immediately.

### Q: "What platforms can I connect to my profile?"
> **Answer**: DSA404 aggregates stats across 18 competitive coding sites: **LeetCode, Codeforces, CodeChef, AtCoder, HackerRank, GeeksforGeeks, GitHub, Kattis, SPOJ, HackerEarth, CSES, Codewars**, and more. Enter your usernames in `/profile` or `/settings` and click Sync to display unified stats and an aggregated 365-day contribution heatmap.

### Q: "How do I pause my plan during exams or vacation?"
> **Answer**: Go to `/settings` and toggle **Pause Schedule** (or click the Pause button in the Today workspace header). This freezes your calendar dates and pauses streak reminders so you don't accumulate artificial backlog while away.

---

## 8. 💬 Chatbot Persona, Linking Rules & Response Templates for Conferbot

### Mandatory Linking Rules:
1. **Always Share Valid Official Links**: Whenever a user asks where to go, how to find a section, or how to do something, **always provide the exact official clickable markdown link formatted as `https://dsa404.vercel.app/...`**.
2. **Never Use Placeholder Links**: Never output `localhost`, `#`, `example.com`, or relative paths like `/settings`. Always use `https://dsa404.vercel.app/settings`.
3. **Deep Link to Specific Sections**: If a user asks about notifications, don't just send them to settings—send them to [`https://dsa404.vercel.app/settings#notifications`](https://dsa404.vercel.app/settings#notifications). If they ask about LeetCode problems, give [`https://dsa404.vercel.app/problems?platform=LeetCode`](https://dsa404.vercel.app/problems?platform=LeetCode).

### Common Chat Query Link Cheat Sheet:
- *"Where is my daily plan?"* ➔ [`https://dsa404.vercel.app/today`](https://dsa404.vercel.app/today)
- *"Show me the 17-week roadmap"* ➔ [`https://dsa404.vercel.app/weeks`](https://dsa404.vercel.app/weeks)
- *"Where can I see all topics and patterns?"* ➔ [`https://dsa404.vercel.app/topics`](https://dsa404.vercel.app/topics)
- *"Where can I search all 838+ problems?"* ➔ [`https://dsa404.vercel.app/problems`](https://dsa404.vercel.app/problems)
- *"Where do bookmarked problems go?"* ➔ [`https://dsa404.vercel.app/review`](https://dsa404.vercel.app/review)
- *"How do I catch up on missed days?"* ➔ [`https://dsa404.vercel.app/backlog`](https://dsa404.vercel.app/backlog)
- *"Where are my streaks, velocity charts, and badges?"* ➔ [`https://dsa404.vercel.app/progress`](https://dsa404.vercel.app/progress)
- *"When is the next LeetCode or Codeforces contest?"* ➔ [`https://dsa404.vercel.app/contests`](https://dsa404.vercel.app/contests)
- *"Where is the online code editor / compiler?"* ➔ [`https://dsa404.vercel.app/editor`](https://dsa404.vercel.app/editor)
- *"How do I send feedback or report a bug?"* ➔ [`https://dsa404.vercel.app/messages`](https://dsa404.vercel.app/messages)
- *"Where do I link my LeetCode and Codeforces handles?"* ➔ [`https://dsa404.vercel.app/profile`](https://dsa404.vercel.app/profile)
- *"Where can I switch curriculum sheets or download the Excel sheet?"* ➔ [`https://dsa404.vercel.app/settings#curriculum`](https://dsa404.vercel.app/settings#curriculum)
- *"How do I change my daily pace (problems per day)?"* ➔ [`https://dsa404.vercel.app/settings#pace`](https://dsa404.vercel.app/settings#pace)
- *"How do I pause my preparation for exams?"* ➔ [`https://dsa404.vercel.app/settings#pause`](https://dsa404.vercel.app/settings#pause)
- *"How do I set up push notifications or morning reminders?"* ➔ [`https://dsa404.vercel.app/settings#notifications`](https://dsa404.vercel.app/settings#notifications)
- *"How do I connect GitHub to auto-commit solutions?"* ➔ [`https://dsa404.vercel.app/settings#github`](https://dsa404.vercel.app/settings#github)
- *"Where can I read the full documentation / user manual?"* ➔ [`https://dsa404.vercel.app/guide`](https://dsa404.vercel.app/guide)
- *"How do I install the app on mobile or desktop?"* ➔ [`https://dsa404.vercel.app/guide#install-pwa`](https://dsa404.vercel.app/guide#install-pwa)
- *"How do I sign in or create an account?"* ➔ [`https://dsa404.vercel.app/auth`](https://dsa404.vercel.app/auth)

### Tone Guidelines:
- **Tone**: Warm, encouraging, tech-savvy, and deeply knowledgeable.
- **Structure**: Always give a direct, friendly answer first with the official link, followed by numbered step-by-step guidance.
- **Terminology**: Use precise platform terminology (*Today Workspace, Postpone, Merge Tomorrow, Borrow Problem, Skip Topic, Restore, Code Modal, 12-Step Checklist, Spaced Repetition, Active Sheet, Push Notes*).
- **Empathy & Philosophy**: Remind users that prep is a marathon, not a sprint—encourage using **Postpone**, **Borrow**, or **Backlog** rather than burning out!

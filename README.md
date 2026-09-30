<div align="center">

# ⚡ DSA404 Tracker
### The Ultimate Intelligent Data Structures & Algorithms Preparation Engine

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-12.19-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

<p align="center">
  A state-of-the-art, spaced-repetition algorithmic preparation platform engineered to transform raw coding practice into consistent mastery. Featuring an automated teacher-student study engine, multi-platform ratings aggregation across 18 competitive coding sites, live contest countdowns, GitHub auto-sync, Sunday revision days, and high-density performance analytics.
</p>

[Explore Features](#-core-features--subsystems) • [Architecture](#-architecture--folder-structure) • [Quickstart](#-quickstart--installation) • [Environment Setup](#-environment-variables) • [SRS Document](./SRS.md)

</div>

---

## 🌟 Vision & Key Highlights

Most developers fail DSA preparation due to **cognitive fatigue, lack of spaced repetition, and disjointed platform tracking**. DSA404 solves this through an integrated, automated coaching ecosystem:

- 🧠 **Teacher-Student Spaced Repetition**: Dynamic daily problem queues with automatic **Sunday Revision Days** (new problem queues pause to review flagged and struggling problems).
- 📊 **Unified 18-Platform Portfolio**: Live rating trajectories, global ranks, and unified solved counters spanning LeetCode, Codeforces, CodeChef, AtCoder, HackerRank, GeeksforGeeks, Kattis, SPOJ, and more.
- 📅 **Curated Sheet Integration**: Out-of-the-box support for 6 legendary DSA sheets: **Core 404 Patterns**, **Striver A2Z**, **NeetCode 150**, **Love Babbar 450**, **Fraz 450**, and **Blind 75**.
- 🔔 **Slide-Over Notification Panel**: Top-right bell trigger providing immediate updates for upcoming contests, spaced-repetition reviews, streak health, and GitHub sync statuses.
- 🐙 **Automated GitHub Repository Sync**: Solved solutions, time/space complexity notes, and custom intuitions automatically commit directly to your personal GitHub repository.
- 📋 **High-Density Solved Archive**: Streamlined row-wise archive displaying all solved problems with instant fuzzy search, platform tags, and difficulty filtering.
- ⏱️ **Live Contest Radar**: Real-time contest schedules and countdown timers for upcoming competitive rounds across all major platforms.

---

## 🚀 Core Features & Subsystems

DSA404 is organized into **20 robust, production-grade subsystems**:

### 1. Daily Workspace (`/today`)
- **Smart Queue**: Intelligently surfaces target problems scheduled for today based on your chosen preparation pace.
- **Integrated Code Modal**: Multi-language code editor (C++, Java, Python, JavaScript, TypeScript) with syntax highlighting, template starter code, and personal intuition notes.
- **Session Focus Timer**: Built-in Pomodoro/stopwatch timer tracking exact problem-solving velocity without leaving the page.
- **Day Notes**: Dedicated session scratchpad to document high-level thoughts, patterns learned, and reminders for the day.
- **Contest Countdown Banner**: Real-time alert bar showing upcoming competitive programming contests starting within 24 hours.

### 2. Adaptive Planning Engine (`src/engine/planner.ts`)
- **6 Standard Sheets**: Instant switching between Core 404, Striver A2Z, NeetCode 150, Love Babbar 450, Fraz 450, and Blind 75.
- **Sunday Revision Rhythm**: Automatically designates every 7th day as a spaced-repetition catch-up day.
- **Schedule Auto-Healing**: Resilient auto-correction engine that repairs missing or drifted schedule dates when plans are modified or resumed after pauses.
- **Leitner Spaced Repetition**: Automatically schedules reviews for problems flagged as difficult or failed at Day +3, Day +7, and Day +21 intervals.

### 3. Roadmaps & Visual Milestones (`/weeks` & `/topics`)
- **16-Week Chronological Roadmap**: Clear week-by-week curriculum with weekly completion bars, target quotas, and rest/revision markers.
- **Pattern-Centric Topic Clusters**: Categorized by Two Pointers, Sliding Window, Fast & Slow Pointers, Monotonic Stack, Binary Search, Trees, Graphs, Dynamic Programming, and more.
- **Visual Completion Metres**: Granular difficulty bars (Easy, Medium, Hard) for every individual pattern module.

### 4. 18-Platform Rating & Profile Aggregation
Direct profile scraping and API aggregation adapters for:
1. **LeetCode** (Rating, Solved Breakdown, Contest Rank)
2. **Codeforces** (Max Rating, Current Rank, Contest History)
3. **CodeChef** (Global Rank, Stars, Solved Calendar)
4. **AtCoder** (Kyu/Dan Rank, Contest Trajectory)
5. **HackerRank** (Badges, Stars, Domain Scores)
6. **GeeksforGeeks** (Coding Score, Total Solved)
7. **GitHub** (Live Contribution Heatmap, Public Repos)
8. **Kattis**, **SPOJ**, **HackerEarth**, **CSES**, **InterviewBit**, **TopCoder**, **Codewars**, **AlgoExpert**, **Project Euler**, **CodinGame**, **LintCode**.

### 5. Multi-Platform Activity Heatmap
- Consolidated 365-day contribution matrix mapping study frequency across your coding platforms.
- Accurately tracks **actual unique problems solved** (preventing multi-submission skew).
- Platform filter chips to drill down into platform-specific activity.

### 6. Live Contest Radar (`/contests`)
- Aggregated real-time schedule of contests across LeetCode, Codeforces, CodeChef, AtCoder, and HackerEarth.
- Real-time countdown clocks, contest duration, and direct one-click launch links to contest lobbies.

### 7. Coder Profile & Public Portfolio (`/profile` & `/profile/[username]`)
- **Custom Showcase**: Custom banner upload, avatar selection, social links (GitHub, LinkedIn, Twitter/X, Discord, Portfolio), bio, and notes.
- **Unified Algorithmic Rating**: Weighted composite score synthesizing performance across all active platforms.
- **All Solved Problems Archive**: High-density row-wise list view with instant fuzzy search, platform badges, difficulty tags, and quick-view notes modal.

### 8. Slide-Over Notification Panel (`NotificationPanel.tsx`)
- Top-right bell trigger accessible globally across all authenticated pages.
- Unread badge counter for immediate awareness.
- Filterable tabs: **All**, **Contests**, **Reviews**, and **System**.
- One-click "Mark all as read" and persistent storage.

### 9. Automatic GitHub Sync Engine (`src/engine/sync/`)
- Connect your personal GitHub repository via Personal Access Token (PAT).
- Automatically creates organized directory structures: `/{topic}/{difficulty}_{problem_slug}/{solution}.{ext}`.
- Commits problem description, time & space complexities, custom intuitions, and formatted solution code upon problem completion.

### 10. Settings & Personalization (`/settings`)
- **Active Sheet Switcher**: Change primary curriculum on the fly without losing previous solving history.
- **Pacing Controls**: Adjust target end date, daily problem quota (1 to 10 problems/day), and rest-day rules.
- **Full Data Backup**: One-click export to formatted Excel spreadsheet (`.xlsx`) or JSON.
- **Profile Customization**: Manage usernames across all 18 competitive programming platforms.

### 11. Performance Analytics (`/analytics`)
- Interactive radar charts mapping algorithmic topic mastery.
- Time spent vs. difficulty velocity charts.
- Projected completion date forecasts calculated from rolling 14-day velocity.

### 12. Spaced Repetition Review Deck (`/review`)
- Flashcard-style interface for rapid mental retrieval of optimal time/space complexities and edge cases.
- "Show Intuition" toggle with confidence self-rating (Easy, Medium, Hard, Failed).

### 13. Algorithmic Cheatsheets & Big-O Reference (`/cheatsheets`)
- Quick-reference guides for common data structure trade-offs.
- Standard algorithmic boilerplate templates in C++, Java, and Python.

### 14. Command Palette (`Ctrl + K` / `Cmd + K`)
- Instant global navigation across all routes and problem sets.
- Fuzzy title, ID, topic, and platform search with immediate keyboard shortcuts.

### 15. Mock Assessment Simulator (`/mock`)
- Timed, randomized 2-problem and 3-problem interview test sets.
- Real-world technical screen conditions with countdown timer and no access to notes.

### 16. Bookmarks & Personal Notes
- Favorite, pin, and flag challenging problems for later revisit.
- Multi-tag classification (e.g., `#RevisitBeforeInterview`, `#CleverTrick`, `#EdgeCaseTrap`).

### 17. Audio Feedback & Celebrations
- Optional subtle acoustic cues upon completing problems, completing daily queues, and reaching milestone streaks.
- Confetti celebration animations on milestone achievements.

### 18. Authentication & Authorization
- Firebase Authentication supporting Email/Password, Google OAuth, and GitHub OAuth.
- Protected route middleware ensuring uninterrupted state persistence across sessions.

### 19. Offline Resilience & Persistence
- LocalStorage caching layer guaranteeing offline operability during network drops.
- Seamless automatic bidirectional sync with Cloud Firestore upon reconnect.

### 20. Excel Sheet Export & Import
- Seamless download of custom preparation progress into styled `.xlsx` spreadsheets for offline sharing, mentor reviews, or academic tracking.

---

## 🏗️ Architecture & Folder Structure

DSA404 is engineered on **Next.js 16 (App Router)**, **React 19**, and **Tailwind CSS 4**:

```
├── app/                              # Next.js 16 App Router Routes
│   ├── (authenticated)/              # Protected Route Group
│   │   ├── today/                    # Daily Workspace & Queue
│   │   ├── weeks/                    # 16-Week Chronological Roadmap
│   │   ├── topics/                   # Pattern-Based Topic Clusters
│   │   ├── contests/                 # Live Multi-Platform Contest Radar
│   │   ├── review/                   # Spaced Repetition Flashcard Deck
│   │   ├── analytics/                # Velocity & Topic Mastery Charts
│   │   ├── cheatsheets/              # Big-O & Pattern Cheatsheets
│   │   ├── mock/                     # Mock Assessment Simulator
│   │   ├── profile/                  # Coder Profile & Solved Archive
│   │   ├── settings/                 # Pacing, Sheet Selector & Integrations
│   │   └── layout.tsx                # Authenticated Shell Wrapper
│   ├── api/                          # Serverless Next.js API Endpoints
│   │   ├── profile/                  # Platform Profile Scrapers & Aggregators
│   │   │   ├── leetcode/             # LeetCode GraphQL & Profile Scraping
│   │   │   ├── codeforces/           # Codeforces Official API
│   │   │   ├── codechef/             # CodeChef Profile & Calendar Scraping
│   │   │   ├── github/               # GitHub Contributions & Repo Sync
│   │   │   └── ...                   # Additional Platform Adapters
│   │   ├── contests/                 # Contest Schedule Aggregation API
│   │   └── sync/                     # Automated GitHub Repo Push API
│   ├── login/                        # Authentication Pages
│   ├── register/                     # Account Creation
│   ├── layout.tsx                    # Root Layout with Font & Theme Providers
│   └── page.tsx                      # Landing & Feature Showcase Page
│
├── src/                              # Core Source Directory
│   ├── components/                   # Reusable UI & Feature Components
│   │   ├── AppShell.tsx              # Sidebar, Topbar & Notification Trigger
│   │   ├── NotificationPanel.tsx     # Slide-over Notification Panel Drawer
│   │   ├── SolvedProblemsArchive.tsx # Row-wise Dense Solved Problems Table
│   │   ├── PlatformActivityHeatmap.tsx # 365-Day Solved Contribution Heatmap
│   │   ├── PlatformHeatmapModal.tsx  # Detailed Platform Drill-down Modal
│   │   ├── CodeModal.tsx             # Code Editor, Languages & Notes Modal
│   │   ├── DayNotesModal.tsx         # Session Day Notes Scratchpad
│   │   ├── ContestRadarCard.tsx      # Live Contest Countdown Card
│   │   ├── QuickStatusToggle.tsx     # Fast Status Pill Dropdown
│   │   └── ui/                       # Radix UI + Tailwind Primitives
│   │
│   ├── engine/                       # Business Logic & Core Algorithms
│   │   ├── planner.ts                # Schedule Generator & Auto-healer
│   │   ├── sync/                     # GitHub Automatic Commit Engine
│   │   ├── repetition.ts             # Leitner Spaced-Repetition Scheduler
│   │   └── sheets/                   # Embedded Curricula Definitions
│   │       ├── core404.ts            # Core 404 Pattern-Grouped Sheet
│   │       ├── striverA2Z.ts         # Striver's A2Z DSA Sheet
│   │       ├── neetcode150.ts        # NeetCode 150 Core List
│   │       ├── loveBabbar450.ts      # Love Babbar 450 Sheet
│   │       ├── fraz450.ts            # Fraz 450 DSA Sheet
│   │       └── blind75.ts            # Blind 75 Curated Problems
│   │
│   ├── hooks/                        # Custom React Hooks
│   │   ├── usePlan.ts                # Active Study Plan State & Healing
│   │   ├── usePlatforms.ts           # 18-Platform Data Aggregator Hook
│   │   ├── useNotifications.ts       # Global Notification State & Dispatcher
│   │   └── useDebounce.ts            # Search Input Debouncer
│   │
│   ├── lib/                          # Utility & Third-party Libraries
│   │   ├── firebase.ts               # Firebase Client SDK Initialization
│   │   ├── firebaseAdmin.ts          # Firebase Admin SDK Configuration
│   │   ├── platforms/                # Platform Scraper Implementations
│   │   │   ├── leetcode.ts           # LeetCode Scraper & GraphQL
│   │   │   ├── codeforces.ts         # Codeforces API Client
│   │   │   ├── codechef.ts           # CodeChef Calendar & Profile Parser
│   │   │   └── github.ts             # GitHub GraphQL Contributions Client
│   │   └── excel.ts                  # XLSX Export & Sheet Generation
│   │
│   └── types/                        # TypeScript Interfaces & Type Contracts
│       ├── problem.ts                # Problem, Sheet & Pattern Types
│       ├── plan.ts                   # Study Plan, Days & Week Types
│       └── platform.ts               # Platform Stats & Contest Types
│
├── public/                           # Static Assets, Badges & Audio Cues
├── firestore.rules                   # Firebase Security Rules (Row-Level Security)
└── SRS.md                            # Comprehensive Software Requirements Spec
```

---

## 💻 Quickstart & Installation

### Prerequisites
- **Node.js**: `v20.0.0` or higher
- **npm** or **bun** / **pnpm**
- **Firebase Project**: A Firebase project with Authentication and Cloud Firestore enabled.

### 1. Clone the Repository
```bash
git clone https://github.com/404-PBMNaiduNotFound/DSA404.git
cd DSA404
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory:
```bash
cp .env.example .env.local
```
Fill in your Firebase credentials and external API tokens (see [Environment Variables](#-environment-variables)).

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build & Verification
```bash
npm run build
npm run start
```

---

## 🔑 Environment Variables

Create a `.env.local` file with the following variables:

```env
# ==========================================
# Firebase Client SDK Configuration
# ==========================================
NEXT_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="your-measurement-id"

# ==========================================
# Firebase Admin SDK (Server-Side)
# ==========================================
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# ==========================================
# Optional Integrations
# ==========================================
GITHUB_ACCESS_TOKEN="ghp_yourPersonalAccessTokenForHigherRateLimits"
```

---

## 📖 Curated DSA Curricula

DSA404 comes pre-loaded with **6 world-standard problem sheets**:

| Sheet Name | Total Problems | Focus Area | Recommended For |
|:---|:---:|:---|:---|
| **Core 404** | **404** | Master 32 Algorithmic Patterns | Comprehensive Mastery & Product Companies |
| **Striver A2Z** | **455** | Complete Step-by-Step Curriculum | Beginner to Advanced Foundational DSA |
| **NeetCode 150** | **150** | High-Yield Interview Archetypes | FAANG / High-Paced Interview Sprints |
| **Love Babbar 450** | **450** | Classic Interview Classics | Comprehensive Problem-Solving Breadth |
| **Fraz 450** | **450** | Lead Coding Curricula | Deep Conceptual Drills |
| **Blind 75** | **75** | The Most Essential Archetypes | Last-Minute Revision & High ROI |

---

## 🧪 Verification & Quality Assurance

The codebase adheres to strict quality and type-safety standards:

```bash
# Type Check
npx tsc --noEmit

# Lint Check
npm run lint

# Production Next.js Build
npm run build
```

---

## 🤝 Contributing

Contributions, feature requests, and optimizations are welcome!
1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License & Documentation

- Project License: Distributed under the **MIT License**.
- Software Requirements Specification: Read the complete [SRS Document](./SRS.md).
- Complete Feature Catalog: Consult the 141-feature breakdown in [COMPLETE_FEATURES_DOCUMENTATION.md](./COMPLETE_FEATURES_DOCUMENTATION.md).

<div align="center">
  <sub>Engineered with precision for ambitious software engineers worldwide.</sub>
</div>

import { LucideIcon, Play, UserCircle, Settings, Flame, Bell, Code2, Trophy, BarChart3, CalendarRange, LayoutGrid, CalendarDays, BookmarkCheck, Sparkles, MessageSquare, BookOpen, Bug, Search } from "lucide-react";

export type GuideSection = {
  id: string;
  title: string;
  icon: any; // We'll use any or LucideIcon
  summary: string;
  steps: string[];
  tips?: string[];
  route?: string;
  relatedSections?: string[];
};

export const USER_GUIDE_CONTENT: GuideSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Play,
    summary: "Welcome to DSA⁴⁰⁴! This guide explains how to get started on your journey.",
    steps: [
      "Upon logging in, you will be taken to the 'Today' workspace.",
      "Complete the onboarding wizard if you haven't already to set your pace and start date.",
      "Explore the sidebar to navigate between learning, practicing, and tracking features."
    ],
    tips: ["Bookmark the site or install it as a PWA for quick access."],
    route: "/today",
    relatedSections: ["today-workspace", "profile-setup"]
  },
  {
    id: "profile-setup",
    title: "Completing the Profile",
    icon: UserCircle,
    summary: "Set up your public coder profile and connect platforms.",
    steps: [
      "Navigate to the 'Profile' page from the sidebar.",
      "Click 'Edit Profile' to add a display name and short bio.",
      "Add your coding handles (LeetCode, Codeforces, GeeksforGeeks, CodeChef, CodingNinjas) to fetch your global stats.",
      "Save your changes."
    ],
    tips: ["Your profile displays your total solved count from all linked platforms in real-time."],
    route: "/profile",
    relatedSections: ["account-settings"]
  },
  {
    id: "today-workspace",
    title: "Daily Learning Plan (Today)",
    icon: Sparkles,
    summary: "Your main dashboard for daily tasks.",
    steps: [
      "Go to the 'Today' tab.",
      "View your assigned topics, sub-topics, and problems for the current day.",
      "Click on any problem to view its details or open it in the editor.",
      "Check off problems as you solve them to update your progress."
    ],
    tips: ["If you fall behind, you can find missed tasks in the Backlog."],
    route: "/today",
    relatedSections: ["coding-editor", "backlog-management", "topic-learning"]
  },
  {
    id: "problems-practice",
    title: "Problems and Coding Practice",
    icon: Code2,
    summary: "Access the full database of 838+ curated DSA problems.",
    steps: [
      "Open the 'Problems' page.",
      "Use the filters to sort by difficulty, topic, pattern, or platform.",
      "Use the search bar to find specific problems by name.",
      "Click on a problem to start solving."
    ],
    tips: ["Toggle 'Hide Solved' to focus only on new challenges."],
    route: "/problems",
    relatedSections: ["today-workspace", "revision-review"]
  },
  {
    id: "topic-learning",
    title: "Topic and Pattern Learning",
    icon: LayoutGrid,
    summary: "View the entire syllabus grouped by core topics.",
    steps: [
      "Navigate to the 'Topics' page.",
      "Expand a topic to see its subtopics and underlying patterns.",
      "Track your completion percentage for each specific topic."
    ],
    tips: ["Topics are ordered sequentially to build fundamental knowledge before advanced concepts."],
    route: "/topics",
    relatedSections: ["weekly-plan"]
  },
  {
    id: "weekly-plan",
    title: "Weekly Learning Plan (Roadmap)",
    icon: CalendarRange,
    summary: "View your 17-week structured roadmap.",
    steps: [
      "Open the 'Roadmap' (Weeks) page.",
      "Scroll through the weeks to see what topics are scheduled.",
      "Check your progress for past and current weeks."
    ],
    tips: ["The roadmap adapts dynamically based on your chosen pace (e.g., 2 or 5 problems per day)."],
    route: "/weeks",
    relatedSections: ["today-workspace"]
  },
  {
    id: "progress-tracking",
    title: "Progress Tracking",
    icon: BarChart3,
    summary: "Visualize your journey and analyze your performance.",
    steps: [
      "Visit the 'Progress' page.",
      "View your global rank, total problems solved, and difficulty breakdown.",
      "Check the heat map to see your daily activity and consistency."
    ],
    tips: ["Hover over the heat map cells to see exactly how many problems you solved on that date."],
    route: "/progress",
    relatedSections: ["streaks"]
  },
  {
    id: "revision-review",
    title: "Revision and Review",
    icon: BookmarkCheck,
    summary: "Revisit problems you flagged for review.",
    steps: [
      "Go to the 'Review' page.",
      "Find problems you previously marked as 'Needs Review' or 'Hard'.",
      "Attempt to solve them again without hints.",
      "Remove the review flag once you have mastered the problem."
    ],
    tips: ["Spaced repetition is key: visit this page weekly to solidify your understanding."],
    route: "/review",
    relatedSections: ["problems-practice"]
  },
  {
    id: "backlog-management",
    title: "Backlog Management",
    icon: CalendarDays,
    summary: "Catch up on missed tasks without breaking your current schedule.",
    steps: [
      "Open the 'Backlog' page.",
      "Identify days where you did not meet your daily quota.",
      "Complete the pending problems listed to clear the backlog."
    ],
    tips: ["Clearing your backlog helps you stay aligned with the 17-week roadmap."],
    route: "/backlog",
    relatedSections: ["today-workspace", "weekly-plan"]
  },
  {
    id: "coding-editor",
    title: "Coding Editor",
    icon: Code2,
    summary: "Write, compile, and run code directly in the browser.",
    steps: [
      "Navigate to the 'Editor' page or click a problem.",
      "Select your preferred language (C++, Java, Python, JavaScript).",
      "Write your solution in the Monaco editor.",
      "Click 'Run' to test your code against sample test cases."
    ],
    tips: ["Use standard input/output formats. The editor supports Vim/Emacs bindings via settings."],
    route: "/editor?name=Two%20Sum&topic=Arrays",
    relatedSections: ["ai-tutor"]
  },
  {
    id: "contests",
    title: "Contests",
    icon: Trophy,
    summary: "Track live and upcoming coding competitions.",
    steps: [
      "Go to the 'Contests' page.",
      "Browse upcoming contests from LeetCode, Codeforces, CodeChef, etc.",
      "Click on a contest to register or view details on the official platform."
    ],
    tips: ["Participating in contests improves your speed and pressure-handling skills."],
    route: "/contests",
    relatedSections: ["progress-tracking"]
  },
  {
    id: "ai-tutor",
    title: "AI Tutor (Solve Feature)",
    icon: Sparkles,
    summary: "Get Socratic hints and debugging help.",
    steps: [
      "While viewing a problem or in the editor, click 'Solve with AI' or 'Hint'.",
      "Ask a specific question about the problem or your code.",
      "The AI Tutor will guide you step-by-step instead of giving the direct answer."
    ],
    tips: ["Paste your current code if you want the AI to point out logical errors."],
    route: "https://chatgpt.com/?q=I+am+practicing+data+structures+and+algorithms.+Can+you+act+as+my+AI+tutor+and+help+me+with+a+problem%3F+Please+give+hints+instead+of+direct+answers.",
    relatedSections: ["coding-editor"]
  },
  {
    id: "streaks",
    title: "Streaks",
    icon: Flame,
    summary: "Maintain daily consistency.",
    steps: [
      "Solve at least one problem every day to increase your streak.",
      "View your current streak in the sidebar or progress page.",
      "If you miss a day, your streak will reset."
    ],
    tips: ["Use the vacation/pause feature in Settings if you need a break without losing your streak."],
    route: "/progress",
    relatedSections: ["progress-tracking"]
  },
  {
    id: "notifications",
    title: "Notifications",
    icon: Bell,
    summary: "Stay updated on your goals and platform changes.",
    steps: [
      "Click the Bell icon in the header.",
      "View daily reminders, updates, and system alerts."
    ],
    tips: ["You can customize which notifications you receive in Settings."],
    route: "/settings#notifications",
    relatedSections: ["account-settings"]
  },
  {
    id: "messages",
    title: "Messages",
    icon: MessageSquare,
    summary: "Read platform announcements and broadcast alerts.",
    steps: [
      "Navigate to the 'Messages' page via the sidebar.",
      "Read important updates from the DSA404 admins."
    ],
    tips: ["Unread messages will show a badge indicator on the sidebar."],
    route: "/messages",
    relatedSections: ["notifications"]
  },
  {
    id: "feedback-requests",
    title: "Sending Feedback & Improvement Requests",
    icon: Bug,
    summary: "Help us improve the platform.",
    steps: [
      "Open the command palette (Cmd/Ctrl + K) or find the feedback button in the sidebar.",
      "Select 'Report Bug' or 'Request Feature'.",
      "Provide a detailed description and submit."
    ],
    tips: ["Include steps to reproduce if you are reporting a bug."],
    route: "/messages",
    relatedSections: []
  },
  {
    id: "theme-settings",
    title: "Theme and Appearance Settings",
    icon: Settings,
    summary: "Customize the look and feel of the app.",
    steps: [
      "Click the Palette icon in the header.",
      "Choose a light, dark, or system theme.",
      "Customize the primary color accent and UI radius."
    ],
    tips: ["Your theme preferences sync across all your devices."],
    route: "#theme-panel",
    relatedSections: ["account-settings"]
  },
  {
    id: "account-settings",
    title: "Account and Profile Settings",
    icon: Settings,
    summary: "Manage your personal information and app preferences.",
    steps: [
      "Go to the 'Settings' page.",
      "Update your email, password, and learning pace.",
      "Toggle features like 'GitHub Sync' or 'Guest Mode'."
    ],
    tips: ["Changing your learning pace will recalculate your 17-week roadmap."],
    route: "/settings",
    relatedSections: ["profile-setup"]
  },
  {
    id: "install-pwa",
    title: "Installing the App (PWA)",
    icon: Play,
    summary: "Install DSA404 as a desktop or mobile application.",
    steps: [
      "On Chrome/Edge, look for the install icon in the address bar.",
      "On iOS Safari, tap 'Share' -> 'Add to Home Screen'.",
      "On Android Chrome, tap the menu and select 'Install app'."
    ],
    tips: ["Installing the PWA provides a full-screen, native-like experience."],
    route: "/",
    relatedSections: []
  },
  {
    id: "privacy-signout",
    title: "Privacy and Sign Out",
    icon: UserCircle,
    summary: "Manage your session.",
    steps: [
      "Click your avatar in the header to open the user menu.",
      "Select 'Sign Out' to securely end your session."
    ],
    tips: ["Your progress is saved securely in the cloud and will be available when you return."],
    route: "/",
    relatedSections: ["account-settings"]
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    icon: Search,
    summary: "Common issues and how to fix them.",
    steps: [
      "If stats are not updating, go to Profile and click 'Refresh Stats'.",
      "If the page is stuck, try a hard refresh (Cmd/Ctrl + Shift + R).",
      "If GitHub sync fails, ensure your GitHub account is successfully connected in Settings."
    ],
    tips: ["You can always reach out via the Feedback form for further assistance."],
    route: "/settings",
    relatedSections: ["feedback-requests"]
  }
];

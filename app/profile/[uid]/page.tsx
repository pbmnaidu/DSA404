"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  loadUserProfile,
  loadPublicDays,
  resolveProfileIdentifier,
  type CodingProfiles,
  type CompletedProblemSnapshot,
  type PublicStats,
  type SocialLinkItem,
  type UserProfile,
} from "@/lib/db";
import {
  LinkedInIcon,
  GitHubIcon,
  TwitterIcon,
  YouTubeIcon,
  getSocialIcon,
} from "@/components/SocialIcons";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ExternalLink, Globe, Code2, Flame, Sparkles, TrendingUp, BarChart3, CheckCircle2, Mail, UserCircle2 } from "lucide-react";
import { SubmissionHeatmap } from "@/components/SubmissionHeatmap";
import { GitHubContributionHeatmap, extractGitHubUsername, resolveGitHubUrl } from "@/components/GitHubContributionHeatmap";
import { UnifiedProfileDashboard } from "@/components/coding-profiles/UnifiedProfileDashboard";
import { BadgesGrid } from "@/components/BadgesGrid";
import { computeBadges, currentStreak, solvedTrend, difficultySplit } from "@/lib/gamification";
import { CodeModal } from "@/components/CodeModal";
import { QuoteLoader } from "@/components/QuoteLoader";
import type { Day } from "@/lib/types";

// Difficulty color mapping for public profile UI
const diffColor: Record<string, string> = {
  Easy: "#22c55e",
  Medium: "#f97316",
  Hard: "#ef4444",
};

const CODING_PLATFORM_META: Partial<
  Record<
    Exclude<keyof CodingProfiles, "customLinks">,
    { label: string; color: string; bgColor: string }
  >
> = {
  leetcode: { label: "LeetCode", color: "#FFA116", bgColor: "rgba(255,161,22,0.12)" },
  codeforces: { label: "Codeforces", color: "#1F8ACB", bgColor: "rgba(31,138,203,0.12)" },
  codechef: { label: "CodeChef", color: "#5B4638", bgColor: "rgba(91,70,56,0.12)" },
  atcoder: { label: "AtCoder", color: "#8BC4E8", bgColor: "rgba(139,196,232,0.12)" },
  hackerrank: { label: "HackerRank", color: "#00EA64", bgColor: "rgba(0,234,100,0.12)" },
  gfg: { label: "GeeksforGeeks", color: "#2F8D46", bgColor: "rgba(47,141,70,0.12)" },
};

interface ExtendedCompletedSnapshot extends CompletedProblemSnapshot {
  code?: string;
  submissionLink?: string;
}

function getDemoProfileData(): {
  profile: Partial<UserProfile>;
  days: Day[];
} {
  const demoProblems: ExtendedCompletedSnapshot[] = [
    {
      name: "Two Sum",
      platform: "LeetCode",
      difficulty: "Easy",
      link: "https://leetcode.com/problems/two-sum/",
      submissionLink: "https://leetcode.com/",
      keyPoints: "Hash map lookup in O(N) time and O(N) space.",
      code: `function twoSum(nums: number[], target: number): number[] {\n  const map = new Map<number, number>();\n  for (let i = 0; i < nums.length; i++) {\n    const comp = target - nums[i];\n    if (map.has(comp)) return [map.get(comp)!, i];\n    map.set(nums[i], i);\n  }\n  return [];\n}`,
    },
    {
      name: "LRU Cache",
      platform: "LeetCode",
      difficulty: "Medium",
      link: "https://leetcode.com/problems/lru-cache/",
      submissionLink: "https://leetcode.com/",
      keyPoints: "Doubly linked list combined with hash table for O(1) get and put.",
      code: `class LRUCache {\n  private capacity: number;\n  private map = new Map<number, number>();\n  constructor(capacity: number) { this.capacity = capacity; }\n  get(key: number): number {\n    if (!this.map.has(key)) return -1;\n    const val = this.map.get(key)!;\n    this.map.delete(key);\n    this.map.set(key, val);\n    return val;\n  }\n  put(key: number, value: number): void {\n    if (this.map.has(key)) this.map.delete(key);\n    else if (this.map.size >= this.capacity) {\n      const oldest = this.map.keys().next().value;\n      this.map.delete(oldest!);\n    }\n    this.map.set(key, value);\n  }\n}`,
    },
    {
      name: "Trapping Rain Water",
      platform: "LeetCode",
      difficulty: "Hard",
      link: "https://leetcode.com/problems/trapping-rain-water/",
      submissionLink: "https://leetcode.com/",
      keyPoints: "Two-pointer technique with leftMax and rightMax bounds.",
      code: `function trap(height: number[]): number {\n  let left = 0, right = height.length - 1;\n  let leftMax = 0, rightMax = 0, ans = 0;\n  while (left < right) {\n    if (height[left] < height[right]) {\n      height[left] >= leftMax ? (leftMax = height[left]) : (ans += leftMax - height[left]);\n      left++;\n    } else {\n      height[right] >= rightMax ? (rightMax = height[right]) : (ans += rightMax - height[right]);\n      right--;\n    }\n  }\n  return ans;\n}`,
    },
    {
      name: "Detect Cycle in a Directed Graph",
      platform: "GeeksforGeeks",
      difficulty: "Medium",
      link: "https://www.geeksforgeeks.org/problems/detect-cycle-in-a-directed-graph/1",
      submissionLink: "https://www.geeksforgeeks.org/",
      keyPoints: "DFS with recursion stack tracking or Kahn's topological sort.",
      code: `class Solution {\n  isCyclic(V: number, adj: number[][]): boolean {\n    const visited = new Array(V).fill(false);\n    const inStack = new Array(V).fill(false);\n    const dfs = (u: number): boolean => {\n      visited[u] = true;\n      inStack[u] = true;\n      for (const v of adj[u]) {\n        if (!visited[v] && dfs(v)) return true;\n        else if (inStack[v]) return true;\n      }\n      inStack[u] = false;\n      return false;\n    };\n    for (let i = 0; i < V; i++) if (!visited[i] && dfs(i)) return true;\n    return false;\n  }\n}`,
    },
    {
      name: "Watermelon (4A)",
      platform: "Codeforces",
      difficulty: "Easy",
      link: "https://codeforces.com/problemset/problem/4/A",
      keyPoints: "Even weight strictly greater than 2.",
      code: `const fs = require('fs');\nconst w = parseInt(fs.readFileSync(0, 'utf-8').trim(), 10);\nconsole.log(w > 2 && w % 2 === 0 ? "YES" : "NO");`,
    }
  ];

  const demoDays: Day[] = [];
  const now = new Date();
  for (let i = 24; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    demoDays.push({
      id: `demo-day-${25 - i}`,
      dayNumber: 25 - i,
      date: dateStr,
      section: i % 2 === 0 ? "Dynamic Programming" : "Graphs & Trees",
      topic: i % 2 === 0 ? "DP Optimization" : "Shortest Path BFS/DFS",
      subtopics: ["Pattern Analysis", "Implementation"],
      problems: [
        {
          name: demoProblems[i % demoProblems.length].name,
          platform: demoProblems[i % demoProblems.length].platform,
          difficulty: demoProblems[i % demoProblems.length].difficulty as any,
          link: demoProblems[i % demoProblems.length].link,
          linkVerified: true,
          takeUForwardLink: null,
          estTime: 30,
          done: true,
          isHard: demoProblems[i % demoProblems.length].difficulty === "Hard",
          completedAt: dateStr,
        },
      ],
      checklist: [],
      status: "completed",
      notes: "Reviewed optimal time complexity and edge cases.",
      revisionNotes: "",
      skipped: false,
    });
  }

  const capabilities = {
    profile: true,
    rating: true,
    ratingHistory: true,
    solvedProblems: true,
    difficultyStats: true,
    contestStats: true,
    contestHistory: true,
    recentSubmissions: true,
    languageStats: true,
    badges: true,
    streak: true,
    topicStats: true,
  };

  return {
    profile: {
      displayName: "Alex Rivera",
      username: "alex_rivera",
      photoURL: "",
      bannerURL: "",
      bio: "Senior Software Engineer · Distributed Systems & Competitive Programming · Ex-FAANG Intern",
      aboutMe: "Full-stack software engineer and algorithmic problem solver with 4+ years of experience building scalable backend architectures, high-throughput microservices, and distributed data pipelines. Actively mastering the 404 DSA milestone to refine problem solving across dynamic programming, graph theory, and advanced data structures. Regular contest participant on LeetCode (Knight) and Codeforces (Expert).",
      email: "alex.rivera.dev@gmail.com",
      linkedin: "https://linkedin.com/in/alexrivera-dev",
      github: "https://github.com/alexrivera-dev",
      portfolio: "https://alexrivera.dev",
      socialLinks: [
        { platform: "GitHub", url: "https://github.com/alexrivera-dev" },
        { platform: "Twitter", url: "https://x.com/alexrivera_codes" },
        { platform: "YouTube", url: "https://youtube.com/@alexrivera_dev" },
        { platform: "Discord", url: "https://discord.gg/algodevs" },
      ],
      codingProfiles: {
        leetcode: "alex_rivera",
        codeforces: "alex_rivera",
        gfg: "alex_rivera",
        hackerrank: "alex_rivera",
        codechef: "alex_rivera",
      },
      platformStats: {
        leetcode: {
          platform: "leetcode",
          username: "alex_rivera",
          displayName: "Alex Rivera",
          profileUrl: "https://leetcode.com/u/alex_rivera/",
          avatarUrl: null,
          country: "US",
          rank: "Knight (Top 3.8%)",
          rating: 1892,
          maxRating: 1940,
          totalSolved: 218,
          easySolved: 78,
          mediumSolved: 116,
          hardSolved: 24,
          contestsParticipated: 34,
          contestRating: 1892,
          ratingHistory: [
            { contestName: "Weekly Contest 386", rating: 1780, rank: 2100, timestamp: 1708828800, date: "2024-02-25" },
            { contestName: "Biweekly Contest 125", rating: 1824, rank: 1640, timestamp: 1709347200, date: "2024-03-02" },
            { contestName: "Weekly Contest 390", rating: 1855, rank: 1320, timestamp: 1711248000, date: "2024-03-24" },
            { contestName: "Biweekly Contest 127", rating: 1892, rank: 980, timestamp: 1711766400, date: "2024-03-30" },
          ],
          recentSubmissions: [],
          acceptedSubmissions: [],
          languages: { TypeScript: 142, Python: 54, Java: 22 },
          badges: ["Knight", "100 Days Badge 2024", "Top 5% Monthly"],
          streak: 28,
          submissionCalendar: { "2024-03-01": 3, "2024-03-02": 5, "2024-03-03": 4 },
          topicStats: [],
          lastActivity: "2 hours ago",
          fetchedAt: new Date().toISOString(),
          status: "SUCCESS",
          dataSource: "Official GraphQL/REST",
          capabilities,
        },
        codeforces: {
          platform: "codeforces",
          username: "alex_rivera",
          displayName: "Alex Rivera",
          profileUrl: "https://codeforces.com/profile/alex_rivera",
          avatarUrl: null,
          country: "US",
          rank: "Expert",
          rating: 1642,
          maxRating: 1680,
          totalSolved: 64,
          easySolved: 32,
          mediumSolved: 24,
          hardSolved: 8,
          contestsParticipated: 22,
          contestRating: 1642,
          ratingHistory: [
            { contestName: "Codeforces Round 920 (Div. 3)", rating: 1520, rank: 980, timestamp: 1705334400, date: "2024-01-15" },
            { contestName: "Codeforces Round 925 (Div. 3)", rating: 1585, rank: 620, timestamp: 1707830400, date: "2024-02-13" },
            { contestName: "Codeforces Round 932 (Div. 2)", rating: 1642, rank: 410, timestamp: 1709644800, date: "2024-03-05" },
          ],
          recentSubmissions: [],
          acceptedSubmissions: [],
          languages: { "C++": 48, Python: 16 },
          badges: ["Expert", "Specialist"],
          streak: 14,
          submissionCalendar: {},
          topicStats: [],
          lastActivity: "Yesterday",
          fetchedAt: new Date().toISOString(),
          status: "SUCCESS",
          dataSource: "Official API",
          capabilities,
        },
        gfg: {
          platform: "gfg",
          username: "alex_rivera",
          displayName: "Alex Rivera",
          profileUrl: "https://www.geeksforgeeks.org/user/alex_rivera/",
          avatarUrl: null,
          country: "US",
          rank: "Institute Rank 3",
          rating: 875,
          maxRating: 875,
          totalSolved: 96,
          easySolved: 44,
          mediumSolved: 42,
          hardSolved: 10,
          contestsParticipated: 8,
          contestRating: 875,
          ratingHistory: [],
          recentSubmissions: [],
          acceptedSubmissions: [],
          languages: { Java: 60, "C++": 36 },
          badges: ["POTD 60-Day Streak", "Geek Master"],
          streak: 21,
          submissionCalendar: {},
          topicStats: [],
          lastActivity: "Today",
          fetchedAt: new Date().toISOString(),
          status: "SUCCESS",
          dataSource: "Official API",
          capabilities: {
            ...capabilities,
            ratingHistory: false,
            contestHistory: false,
          },
        },
        hackerrank: {
          platform: "hackerrank",
          username: "alex_rivera",
          displayName: "Alex Rivera",
          profileUrl: "https://www.hackerrank.com/profile/alex_rivera",
          avatarUrl: null,
          country: "US",
          rank: "Top 2% Global",
          rating: null,
          maxRating: null,
          totalSolved: 42,
          easySolved: 20,
          mediumSolved: 18,
          hardSolved: 4,
          contestsParticipated: 6,
          contestRating: null,
          ratingHistory: [],
          recentSubmissions: [],
          acceptedSubmissions: [],
          languages: { Python: 24, "Problem Solving": 18 },
          badges: ["Problem Solving (Gold 5★)", "Python (5★)", "Algorithms (Silver)"],
          streak: 9,
          submissionCalendar: {},
          topicStats: [],
          lastActivity: "3 days ago",
          fetchedAt: new Date().toISOString(),
          status: "SUCCESS",
          dataSource: "Official API",
          capabilities: {
            ...capabilities,
            rating: false,
            ratingHistory: false,
            contestStats: false,
            contestHistory: false,
          },
        },
        codechef: {
          platform: "codechef",
          username: "alex_rivera",
          displayName: "Alex Rivera",
          profileUrl: "https://www.codechef.com/users/alex_rivera",
          avatarUrl: null,
          country: "US",
          rank: "4★ Star Coder",
          rating: 1782,
          maxRating: 1810,
          totalSolved: 38,
          easySolved: 14,
          mediumSolved: 18,
          hardSolved: 6,
          contestsParticipated: 14,
          contestRating: 1782,
          ratingHistory: [
            { contestName: "Starters 120", rating: 1690, rank: 640, timestamp: 1707264000, date: "2024-02-07" },
            { contestName: "Starters 124", rating: 1740, rank: 480, timestamp: 1709683200, date: "2024-03-06" },
            { contestName: "Starters 128", rating: 1782, rank: 310, timestamp: 1712102400, date: "2024-04-03" },
          ],
          recentSubmissions: [],
          acceptedSubmissions: [],
          languages: { "C++": 30, Java: 8 },
          badges: ["4 Star Coder", "Division 2 Contender"],
          streak: 11,
          submissionCalendar: {},
          topicStats: [],
          lastActivity: "1 week ago",
          fetchedAt: new Date().toISOString(),
          status: "SUCCESS",
          dataSource: "Official API",
          capabilities,
        },
        github: {
          platform: "github",
          username: "alexrivera-dev",
          displayName: "Alex Rivera",
          profileUrl: "https://github.com/alexrivera-dev",
          avatarUrl: null,
          country: "US",
          rank: "Pro Developer",
          rating: null,
          maxRating: null,
          totalSolved: 48,
          easySolved: null,
          mediumSolved: null,
          hardSolved: null,
          contestsParticipated: null,
          contestRating: null,
          ratingHistory: [],
          recentSubmissions: [],
          acceptedSubmissions: [],
          languages: { TypeScript: 52, Rust: 28, Go: 20 },
          badges: ["Pull Shark", "Arctic Code Vault Contributor", "Quickdraw"],
          streak: 42,
          submissionCalendar: {},
          topicStats: [],
          lastActivity: "Today",
          fetchedAt: new Date().toISOString(),
          status: "SUCCESS",
          dataSource: "Official API",
          capabilities: {
            ...capabilities,
            rating: false,
            ratingHistory: false,
            difficultyStats: false,
            contestStats: false,
            contestHistory: false,
          },
        },
      },
      publicStats: {
        totalSolved: 458,
        byPlatform: {
          LeetCode: 218,
          GeeksforGeeks: 96,
          Codeforces: 64,
          HackerRank: 42,
          CodeChef: 38,
        },
        lastUpdated: new Date().toISOString(),
      },
      completedProblems: demoProblems,
    },
    days: demoDays,
  };
}

export default function PublicProfilePage() {
  const params = useParams<{ uid: string }>();
  // Route folder is still named [uid] to avoid a broad rename, but the value
  // can now be either a chosen username (new links) or a raw Firebase uid
  // (links shared before usernames existed) — resolved below.
  const identifier = params?.uid ?? "";

  const [notFound, setNotFound] = useState(false);
  const [selectedProb, setSelectedProb] = useState<ExtendedCompletedSnapshot | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [resolvedUid, setResolvedUid] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [bannerURL, setBannerURL] = useState("");
  const [bio, setBio] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [email, setEmail] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [socialLinks, setSocialLinks] = useState<SocialLinkItem[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [codingProfiles, setCodingProfiles] = useState<CodingProfiles>({});
  const [platformStats, setPlatformStats] = useState<Record<string, any>>({});
  const [publicStats, setPublicStats] = useState<PublicStats>({
    totalSolved: 0,
    byPlatform: {},
    lastUpdated: "",
  });
  const [completedProblems, setCompletedProblems] = useState<ExtendedCompletedSnapshot[]>([]);
  const [platformFilter, setPlatformFilter] = useState("All");
  const [days, setDays] = useState<Day[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!identifier) return;
    setLoading(true);

    if (identifier.toLowerCase() === "demo") {
      const demo = getDemoProfileData();
      setIsDemo(true);
      setResolvedUid("demo");
      setDisplayName(demo.profile.displayName ?? "");
      setUsername(demo.profile.username ?? "");
      setPhotoURL(demo.profile.photoURL ?? "");
      setBannerURL(demo.profile.bannerURL ?? "");
      setBio(demo.profile.bio ?? "");
      setAboutMe(demo.profile.aboutMe ?? "");
      setEmail(demo.profile.email ?? "");
      setLinkedin(demo.profile.linkedin ?? "");
      setGithub(demo.profile.github ?? "https://github.com/alexrivera-dev");
      setPortfolio(demo.profile.portfolio ?? "");
      setSocialLinks(demo.profile.socialLinks ?? []);
      setCodingProfiles(demo.profile.codingProfiles ?? {});
      if (demo.profile.platformStats) {
        setPlatformStats(demo.profile.platformStats);
      }
      setPublicStats(
        demo.profile.publicStats ?? { totalSolved: 0, byPlatform: {}, lastUpdated: "" }
      );
      setCompletedProblems((demo.profile.completedProblems as ExtendedCompletedSnapshot[]) ?? []);
      setDays(demo.days);
      setLoading(false);
      return;
    }

    resolveProfileIdentifier(identifier)
      .then((uid) => {
        if (!uid) {
          setNotFound(true);
          return;
        }
        setResolvedUid(uid);
        return Promise.all([loadUserProfile(uid), loadPublicDays(uid)]).then(([p, loadedDays]) => {
          if (!p.displayName && !p.bio && !p.photoURL && loadedDays.length === 0) {
            setNotFound(true);
            return;
          }
          setDisplayName(p.displayName ?? "");
          setUsername(p.username ?? "");
          setPhotoURL(p.photoURL ?? "");
          setBannerURL(p.bannerURL ?? "");
          setBio(p.bio ?? "");
          setAboutMe(p.aboutMe ?? "");
          setEmail(p.email ?? "");
          setLinkedin(p.linkedin ?? "");
          setGithub(p.github ?? (p.socialLinks?.find((s) => s.platform.toLowerCase() === "github")?.url ?? ""));
          setPortfolio(p.portfolio ?? "");
          setSocialLinks(p.socialLinks ?? []);
          setCodingProfiles(p.codingProfiles ?? {});
          if (p.platformStats) setPlatformStats(p.platformStats);
          setPublicStats(
            p.publicStats ?? { totalSolved: 0, byPlatform: {}, lastUpdated: "" }
          );
          setCompletedProblems((p.completedProblems as ExtendedCompletedSnapshot[]) ?? []);
          setDays(loadedDays);
        });
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [identifier]);

  const platformOptions = useMemo(
    () => ["All", ...Array.from(new Set(completedProblems.map((p) => p.platform))).sort()],
    [completedProblems]
  );

  const filteredCompleted = useMemo(
    () =>
      platformFilter === "All"
        ? completedProblems
        : completedProblems.filter((p) => p.platform === platformFilter),
    [completedProblems, platformFilter]
  );

  const initials = (displayName || "?")[0]?.toUpperCase() ?? "?";

  // Badges & streak calculation from public days
  const badges = useMemo(() => computeBadges(days), [days]);
  const streakCount = useMemo(() => currentStreak(days), [days]);

  // 404 DSA Roadmap Graph data
  const trend = useMemo(() => solvedTrend(days), [days]);
  const diffSplit = useMemo(() => difficultySplit(days), [days]);

  // Heatmap calculations — grouped by the date each problem was actually
  // marked done (not the day it was originally assigned to), so a backlog
  // problem solved today shows up on today's square. Falls back to the
  // day's own date for rows completed before this field existed.
  const { heatmapData, detailMap } = useMemo(() => {
    const dateMap = new Map<string, any[]>();
    for (const day of days ?? []) {
      const doneProbs = day.problems.filter((p) => p.done);
      for (const p of doneProbs) {
        const dateStr = p.completedAt || day.date;
        const existing = dateMap.get(dateStr) ?? [];
        dateMap.set(dateStr, [...existing, p]);
      }
    }
    const hData: { date: string; solved: number }[] = [];
    const dMap: Record<string, any[]> = {};
    dateMap.forEach((probs, dateStr) => {
      hData.push({ date: dateStr, solved: probs.length });
      dMap[dateStr] = probs;
    });
    for (const day of days ?? []) {
      if (!day.skipped && !dateMap.has(day.date)) {
        hData.push({ date: day.date, solved: 0 });
      }
    }
    return { heatmapData: hData, detailMap: dMap };
  }, [days]);

  // Auto-extract GitHub username/handle and profile URL from all available sources
  const effectiveGithubRaw = useMemo(() => {
    if (github && github.trim()) return github.trim();
    const fromSocial = socialLinks.find((s) => s.platform.toLowerCase() === "github")?.url;
    if (fromSocial && fromSocial.trim()) return fromSocial.trim();
    if (codingProfiles.github && codingProfiles.github.trim()) return codingProfiles.github.trim();
    if (isDemo) return "alexrivera-dev";
    if (username && username.trim()) return username.trim();
    return "";
  }, [github, socialLinks, codingProfiles, isDemo, username]);

  const effectiveGithubUsername = useMemo(() => {
    return extractGitHubUsername(effectiveGithubRaw) || effectiveGithubRaw.replace(/^@+/, "");
  }, [effectiveGithubRaw]);

  const githubProfileUrl = useMemo(() => {
    return resolveGitHubUrl(effectiveGithubRaw);
  }, [effectiveGithubRaw]);

  const githubUsername = effectiveGithubUsername;

  if (loading) {
    return <QuoteLoader fullScreen />;
  }



  // ── 404 state ──
  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <Globe className="size-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Profile not found</h1>
        <p className="text-muted-foreground">This profile doesn&apos;t exist or hasn&apos;t been set up yet.</p>
        <Link
          href="/"
          className="mt-2 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          <div className="size-5 rounded-full overflow-hidden border border-border shadow-sm ring-1 ring-primary/20 bg-background shrink-0">
            <img src="/logo.jpg" alt="DSA404 Logo" className="size-full object-cover" />
          </div>
          <span>Go to</span>
          <div className="font-display font-black tracking-tighter text-sm leading-none inline-flex items-baseline select-none">
            <span className="bg-gradient-to-br from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">DSA</span>
            <span className="bg-gradient-to-br from-primary to-orange-500 bg-clip-text text-transparent ml-[0.5px]">⁴⁰⁴</span>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Branded top bar ── */}
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center gap-2.5 px-4 sm:px-6 lg:px-8 py-3">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <div className="size-7 rounded-full overflow-hidden border border-border/80 shadow-sm ring-1 ring-primary/20 bg-background shrink-0">
              <img src="/logo.jpg" alt="DSA404 Logo" className="size-full object-cover" />
            </div>
            <div className="font-display font-black tracking-tighter text-[20px] leading-none flex items-baseline select-none">
              <span className="bg-gradient-to-br from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent drop-shadow-sm">DSA</span>
              <span className="bg-gradient-to-br from-primary to-orange-500 bg-clip-text text-transparent drop-shadow-sm ml-[1px]">⁴⁰⁴</span>
            </div>
          </Link>
          <span className="ml-auto text-xs text-muted-foreground">Public Profile</span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* ── Demo Mode Showcase Ribbon ── */}
        {isDemo && (
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/15 via-purple-500/10 to-primary/10 p-4 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                <Sparkles className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-foreground">Live Public Profile Showcase (Demo)</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground">DEMO MODE</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  This showcase demonstrates how your DSA portfolio and verified social links present to recruiters and peers.
                </p>
              </div>
            </div>
            <Link
              href="/auth"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-4 py-2 shadow-sm transition-all"
            >
              <span>Create Your Profile</span>
              <ExternalLink className="size-3" />
            </Link>
          </div>
        )}

        {/* ── GitHub / LeetCode Style Profile Hero Card ── */}
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="h-24 sm:h-32 w-full bg-gradient-to-r from-primary/30 via-primary/10 to-accent/20 border-b border-border/40 relative overflow-hidden">
            {bannerURL && (
              <img src={bannerURL} alt="Profile cover banner" className="absolute inset-0 size-full object-cover" />
            )}
            <div className="absolute right-2 top-2 sm:right-4 sm:top-3 flex flex-wrap justify-end items-center gap-1.5 sm:gap-2 z-10 max-w-[85%]">
              <span className="inline-flex items-center gap-1 rounded-full bg-background/85 backdrop-blur px-2 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold text-foreground border border-border/50 shadow-sm">
                <Flame className="size-3.5 text-orange-500" />
                {streakCount} Day Streak
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-background/85 backdrop-blur px-2 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold text-primary border border-border/50 shadow-sm">
                <Sparkles className="size-3.5" />
                {publicStats.totalSolved} Solved
              </span>
            </div>
          </div>

          <div className="px-4 sm:px-6 pb-6 pt-0">
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-end gap-4 sm:gap-5 -mt-10 sm:-mt-12 mb-3">
              <div className="size-20 sm:size-24 shrink-0 overflow-hidden rounded-full border-4 border-card bg-muted shadow-lg flex items-center justify-center z-10">
                {photoURL ? (
                  <img src={photoURL} alt={`${displayName} avatar`} className="size-full object-cover" />
                ) : (
                  <span className="text-3xl sm:text-4xl font-bold text-primary">{initials}</span>
                )}
              </div>

              <div className="flex-1 min-w-0 pt-1 sm:pt-2">
                <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
                  {(displayName || "").toLowerCase().includes("bhanu") ? (
                    <a
                      href="https://pbmnaiduportfolio.vercel.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors cursor-pointer"
                      title="Visit Bhanu's Portfolio"
                    >
                      {displayName}
                    </a>
                  ) : (
                    displayName || "Anonymous Coder"
                  )}
                </h1>
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  {username && username !== effectiveGithubUsername && (
                    <p className="text-xs font-mono font-medium text-primary truncate">@{username}</p>
                  )}
                  {githubProfileUrl && (
                    <a
                      href={githubProfileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-800/20 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-800/35 dark:hover:bg-zinc-700/60 border border-zinc-500/30 transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer group"
                      title={`Open GitHub profile: ${githubProfileUrl}`}
                    >
                      <GitHubIcon className="size-3.5 shrink-0" />
                      <span className="font-mono">{effectiveGithubUsername ? `@${effectiveGithubUsername}` : "GitHub"}</span>
                      <ExternalLink className="size-2.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                    </a>
                  )}
                  {linkedin && (
                    <a
                      href={linkedin.startsWith("http") ? linkedin : linkedin.includes("linkedin.com") ? `https://${linkedin}` : `https://linkedin.com/in/${linkedin.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#0077b5]/15 text-[#0077b5] dark:text-[#3897f0] hover:bg-[#0077b5]/25 border border-[#0077b5]/30 transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer"
                      title={`Open LinkedIn profile: ${linkedin}`}
                    >
                      <LinkedInIcon className="size-3 shrink-0" />
                      <span>LinkedIn</span>
                      <ExternalLink className="size-2.5 opacity-70" />
                    </a>
                  )}
                  {portfolio && (
                    <a
                      href={portfolio.startsWith("http") ? portfolio : `https://${portfolio}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer"
                      title={`Open Portfolio: ${portfolio}`}
                    >
                      <Globe className="size-3 shrink-0" />
                      <span>Portfolio</span>
                      <ExternalLink className="size-2.5 opacity-70" />
                    </a>
                  )}
                </div>
                {bio && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{bio}</p>}
              </div>
            </div>
          </div>
        </section>

        {/* ── About Me Public Section ── */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Sparkles className="size-4" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold tracking-tight text-foreground">About Me</h2>
                <p className="text-xs text-muted-foreground">Professional profile, background, &amp; verified developer links</p>
              </div>
            </div>
            {isDemo && (
              <span className="self-start sm:self-auto rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-0.5 text-[11px] font-mono font-bold text-blue-500">
                Demo Showcase Mode
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Identity & Career Info */}
            <div className="space-y-3 rounded-xl border border-border/60 bg-background/50 p-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-2 text-xs">
                <span className="text-muted-foreground font-medium">Full Name</span>
                {(displayName || "").toLowerCase().includes("bhanu") ? (
                  <a
                    href="https://pbmnaiduportfolio.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-foreground hover:text-primary transition-colors underline decoration-dotted truncate max-w-[200px] cursor-pointer"
                    title="Visit Bhanu's Portfolio"
                  >
                    {displayName}
                  </a>
                ) : (
                  <span className="font-bold text-foreground truncate max-w-[200px]">{displayName || "Anonymous Coder"}</span>
                )}
              </div>
              <div className="flex items-center justify-between border-b border-border/40 pb-2 text-xs">
                <span className="text-muted-foreground font-medium">Goal / Career Focus</span>
                <span className="font-bold text-primary truncate max-w-[200px]">{bio || "SDE Aspirant"}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/40 pb-2 text-xs">
                <span className="text-muted-foreground font-medium flex items-center gap-1">
                  <Mail className="size-3 text-muted-foreground" /> Contact Email
                </span>
                {email ? (
                  <a
                    href={`mailto:${email}`}
                    className="font-mono text-foreground hover:text-primary transition-colors underline decoration-dotted truncate max-w-[200px]"
                    title={`Email ${email}`}
                  >
                    {email}
                  </a>
                ) : (
                  <span className="text-muted-foreground italic">Private</span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Handle</span>
                <span className="font-mono font-semibold text-primary">@{username || "coder"}</span>
              </div>
            </div>

            {/* Social & Professional Connections */}
            <div className="space-y-3 rounded-xl border border-border/60 bg-background/50 p-4 flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                  Verified Social &amp; Web Links
                </p>
                <div className="flex flex-wrap gap-2">
                  {githubProfileUrl && (
                    <a
                      href={githubProfileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800/15 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-800/25 dark:hover:bg-zinc-700/40 border border-zinc-500/30 transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer group"
                      title={`Open GitHub: ${githubProfileUrl}`}
                    >
                      <GitHubIcon className="size-3.5 shrink-0" />
                      <span>GitHub{effectiveGithubUsername ? ` (@${effectiveGithubUsername})` : ""}</span>
                      <ExternalLink className="size-3 opacity-70 group-hover:opacity-100 transition-opacity" />
                    </a>
                  )}

                  {linkedin && (
                    <a
                      href={linkedin.startsWith("http") ? linkedin : linkedin.includes("linkedin.com") ? `https://${linkedin}` : `https://linkedin.com/in/${linkedin.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0077b5]/15 text-[#0077b5] dark:text-[#3897f0] hover:bg-[#0077b5]/25 border border-[#0077b5]/30 transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer"
                      title={`Open LinkedIn: ${linkedin}`}
                    >
                      <LinkedInIcon className="size-3.5 shrink-0" />
                      <span>LinkedIn</span>
                      <ExternalLink className="size-3 opacity-70" />
                    </a>
                  )}

                  {portfolio && (
                    <a
                      href={portfolio.startsWith("http") ? portfolio : `https://${portfolio}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer"
                      title={`Open Portfolio: ${portfolio}`}
                    >
                      <Globe className="size-3.5 shrink-0" />
                      <span>Portfolio</span>
                      <ExternalLink className="size-3 opacity-70" />
                    </a>
                  )}

                  {/* Other Social Media Links */}
                  {socialLinks.map((s, idx) => (
                    <a
                      key={idx}
                      href={s.url.startsWith("http") ? s.url : `https://${s.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/25 transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer"
                      title={`Open ${s.platform}: ${s.url}`}
                    >
                      {getSocialIcon(s.platform, "size-3.5 shrink-0")}
                      <span>{s.platform}</span>
                      <ExternalLink className="size-3 opacity-70" />
                    </a>
                  ))}

                  {!githubProfileUrl && !linkedin && !portfolio && socialLinks.length === 0 && (
                    <span className="text-xs text-muted-foreground italic">No public social media links attached.</span>
                  )}
                </div>
              </div>

              {/* Coding Platforms Quick Badges */}
              {Object.entries(codingProfiles).some(([k, v]) => k !== "customLinks" && k !== "platformStats" && typeof v === "string" && Boolean(v.trim())) && (
                <div className="pt-3 border-t border-border/40 mt-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Code2 className="size-3.5 text-primary" />
                    Connected Coding Platforms
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(codingProfiles)
                      .filter(([k, v]) => k !== "customLinks" && k !== "platformStats" && typeof v === "string" && Boolean(v.trim()))
                      .map(([platform, uname]) => {
                        const meta = CODING_PLATFORM_META[platform as keyof typeof CODING_PLATFORM_META];
                        const label = meta?.label || platform;
                        const url =
                          platform === "leetcode" ? `https://leetcode.com/u/${uname}/` :
                          platform === "codeforces" ? `https://codeforces.com/profile/${uname}` :
                          platform === "codechef" ? `https://codechef.com/users/${uname}` :
                          platform === "hackerrank" ? `https://hackerrank.com/profile/${uname}` :
                          platform === "gfg" ? `https://geeksforgeeks.org/user/${uname}/` :
                          platform === "github" ? `https://github.com/${uname}` :
                          `#`;
                        return (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer"
                            style={{
                              backgroundColor: meta?.bgColor || "rgba(255,255,255,0.06)",
                              color: meta?.color || "inherit",
                              borderColor: meta ? `${meta.color}40` : "var(--color-border)",
                            }}
                            title={`Open ${label} profile: ${uname}`}
                          >
                            <Code2 className="size-3 shrink-0" />
                            <span>{label}</span>
                            <span className="opacity-70 text-[10px] font-mono font-normal">@{uname}</span>
                            <ExternalLink className="size-2.5 opacity-60 ml-0.5" />
                          </a>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Narrative About Me text */}
          {aboutMe && (
            <div className="rounded-xl border border-border/60 bg-background/40 p-4 space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <UserCircle2 className="size-3.5 text-primary" /> Story &amp; Trajectory
              </p>
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {aboutMe}
              </p>
            </div>
          )}
        </section>

        {/* ── Unified Coding Profiles & Live Platform Stats Dashboard ── */}
        {(Object.entries(codingProfiles).some(([k, v]) => k !== "customLinks" && k !== "platformStats" && typeof v === "string" && Boolean(v.trim())) ||
          (codingProfiles.customLinks ?? []).some((cl) => cl.url)) && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="size-5 text-primary" />
              <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
                Coding Profiles & Live Analytics
              </h2>
            </div>
            <UnifiedProfileDashboard
              initialProfiles={codingProfiles as Record<string, string>}
              initialStats={platformStats}
              userId={resolvedUid}
              readOnly={true}
            />

            {/* Custom links */}
            {(codingProfiles.customLinks ?? []).some((cl) => cl.url) && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Custom Links</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {(codingProfiles.customLinks ?? []).map((cl, idx) =>
                    cl.url ? (
                      <a
                        key={idx}
                        href={cl.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 bg-primary/5 hover:border-primary/50 transition-all"
                      >
                        <Globe className="size-4 shrink-0 text-primary" />
                        <span className="text-xs font-semibold truncate">{cl.label || "Custom Link"}</span>
                        <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground truncate">
                          <ExternalLink className="size-3 shrink-0" />
                          <span className="truncate">{cl.url.replace(/^https?:\/\/(www\.)?/, "")}</span>
                        </span>
                      </a>
                    ) : null
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── DSA 404 Solving Trend & Roadmap Progression Graph (from Progress Tab) ── */}
        {days.length > 0 && (
          <section className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-foreground">404 DSA Sheet Progress & Solving Trend</h2>
                  <p className="text-xs text-muted-foreground">Daily solving consistency & difficulty trajectory</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-bold text-primary">
                  {days.reduce((acc, d) => acc + (d.problems?.filter((p) => p.done).length || 0), 0)} Plan Solved
                </span>
                <span className="rounded-full border border-border bg-background px-3 py-1 font-bold text-foreground">
                  {days.filter((d) => !d.skipped && d.problems.every((p) => p.done)).length} Days Completed
                </span>
              </div>
            </div>

            {/* Solving Trend Area Chart */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="size-3.5 text-primary" />
                Daily Solving Activity Trend
              </h3>
              <div className="h-64 w-full rounded-2xl border border-border bg-background/50 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ left: -20, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="publicSolvedFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.6} />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                    <RTooltip
                      contentStyle={{
                        background: "var(--color-popover)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 12,
                        color: "var(--color-popover-foreground)",
                        fontSize: 12,
                      }}
                      formatter={(value, name) => {
                        if (name === "Plan solved") return [`${value} problems`, "Plan Solved"];
                        return [value, name];
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area
                      type="monotone"
                      dataKey="solved"
                      name="Plan solved"
                      stroke="var(--color-primary)"
                      fill="url(#publicSolvedFill)"
                      strokeWidth={2.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Difficulty Split Bar Chart */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <BarChart3 className="size-3.5 text-primary" />
                Difficulty Distribution (Easy / Medium / Hard)
              </h3>
              <div className="h-48 w-full rounded-2xl border border-border bg-background/50 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={diffSplit} margin={{ left: -20, right: 8, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.6} />
                    <XAxis dataKey="difficulty" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                    <RTooltip
                      contentStyle={{
                        background: "var(--color-popover)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 12,
                        color: "var(--color-popover-foreground)",
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="done" name="Solved" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="remaining" name="Remaining" fill="rgba(255,255,255,0.12)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        )}

        {/* ── Submission Heatmap ── */}
        {days.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 font-display text-lg font-semibold flex items-center gap-2">
              <Flame className="size-5 text-orange-500" />
              Submission Heatmap
            </h2>
            <SubmissionHeatmap data={heatmapData} detailMap={detailMap} />
          </section>
        )}

        {/* ── GitHub Contribution Activity Heatmap ── */}
        {githubUsername ? (
          <GitHubContributionHeatmap username={githubUsername} />
        ) : null}

        {/* ── Badges & Achievements Section ── */}
        {days.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <BadgesGrid badges={badges} />
          </section>
        )}

        {/* ── Statistics ── */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 font-display text-lg font-semibold">Statistics</h2>

          <div className="mb-4 flex items-end gap-2">
            <span className="font-display text-5xl font-bold tabular-nums text-primary">
              {publicStats.totalSolved}
            </span>
            <span className="mb-1 text-sm text-muted-foreground">problems solved</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Object.entries(publicStats.byPlatform)
              .sort((a, b) => b[1] - a[1])
              .map(([platform, count]) => (
                <div key={platform} className="rounded-xl border border-border bg-background p-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{platform}</p>
                  <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{count}</p>
                </div>
              ))}
            {Object.keys(publicStats.byPlatform).length === 0 && (
              <p className="col-span-full text-sm text-muted-foreground">
                No solved problems recorded yet.
              </p>
            )}
          </div>

          {publicStats.lastUpdated && (
            <p className="mt-3 text-[11px] text-muted-foreground">
              Last updated {new Date(publicStats.lastUpdated).toLocaleDateString()}
            </p>
          )}
        </section>

        {/* ── Completed Problems ── */}
        {completedProblems.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold">
                Completed Problems
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({filteredCompleted.length})
                </span>
              </h2>

              <div className="flex flex-wrap items-center gap-2">
                {platformOptions.map((pl) => (
                  <button
                    key={pl}
                    onClick={() => setPlatformFilter(pl)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${platformFilter === pl
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:bg-muted"
                      }`}
                  >
                    {pl}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-border">
              {filteredCompleted.map((p) => (
                <div
                  key={`${p.name}|${p.link}`}
                  className="flex items-center gap-3 py-2.5 hover:bg-muted/30 px-2 rounded-lg cursor-pointer transition-colors"
                  onClick={() => setSelectedProb(p)}
                >
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className="text-sm font-medium hover:text-primary line-clamp-1">
                      {p.name}
                    </span>
                    {p.code && (
                      <span className="flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                        <Code2 className="size-3" /> Code
                      </span>
                    )}
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={{ color: "#6366f1", background: "rgba(99,102,241,0.1)" }}
                  >
                    {p.platform}
                  </span>
                  <span
                    className="shrink-0 text-xs font-medium"
                    style={{ color: diffColor[p.difficulty] ?? "#6366f1" }}
                  >
                    {p.difficulty}
                  </span>
                  <a
                    href={p.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Open ${p.name}`}
                    className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {selectedProb && (
          <CodeModal
            open={Boolean(selectedProb)}
            onOpenChange={(v) => {
              if (!v) setSelectedProb(null);
            }}
            problemName={selectedProb.name}
            existingSubmission={
              selectedProb.code
                ? { code: selectedProb.code, link: selectedProb.submissionLink ?? "", submittedAt: "" }
                : undefined
            }
            readOnly={true}
            onSave={async () => { }}
          />
        )}

        {/* ── Footer ── */}
        <footer className="pb-8 text-center text-xs text-muted-foreground">
          Built with{" "}
          <Link href="/" className="inline-flex items-center gap-1.5 align-middle hover:opacity-90 transition-opacity">
            <div className="size-4 rounded-full overflow-hidden border border-border shadow-sm ring-1 ring-primary/20 bg-background shrink-0">
              <img src="/logo.jpg" alt="DSA404 Logo" className="size-full object-cover" />
            </div>
            <span className="font-display font-black tracking-tighter text-xs leading-none flex items-baseline select-none">
              <span className="bg-gradient-to-br from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">DSA</span>
              <span className="bg-gradient-to-br from-primary to-orange-500 bg-clip-text text-transparent ml-[0.5px]">⁴⁰⁴</span>
            </span>
          </Link>
          {" "}— Track your DSA journey.
        </footer>
      </main>
    </div>
  );
}

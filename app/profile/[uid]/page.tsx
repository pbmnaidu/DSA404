"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { auth } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  loadUserProfile,
  loadPublicDays,
  loadProblemCompletions,
  loadCodeSubmissions,
  syncPublicSolvedProblems,
  resolveProfileIdentifier,
  type CodingProfiles,
  type CompletedProblemSnapshot,
  type CodeSubmission,
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
import { ExternalLink, Globe, Code2, Flame, Sparkles, TrendingUp, BarChart3, CheckCircle2, Mail, UserCircle2, Search, BookOpen } from "lucide-react";
import { SubmissionHeatmap } from "@/components/SubmissionHeatmap";
import { GitHubContributionHeatmap, extractGitHubUsername, resolveGitHubUrl } from "@/components/GitHubContributionHeatmap";
import { UnifiedProfileDashboard } from "@/components/coding-profiles/UnifiedProfileDashboard";
import { BadgesGrid } from "@/components/BadgesGrid";
import { computeBadges, currentStreak, solvedTrend, difficultySplit } from "@/lib/gamification";
import { SolvedProblemsArchive } from "@/components/SolvedProblemsArchive";
import { QuoteLoader } from "@/components/QuoteLoader";
import {
  getCanonicalProblemLink,
  normalizePlatformName,
  getProblemMetadata,
} from "@/lib/problems";
import type { Day } from "@/lib/types";

// Difficulty color mapping for public profile UI
const diffColor: Record<string, string> = {
  Easy: "#22c55e",
  Medium: "#f97316",
  Hard: "#ef4444",
};

const PLATFORM_BADGE_STYLE: Record<string, { color: string; bg: string }> = {
  LeetCode: { color: "#FFA116", bg: "rgba(255,161,22,0.12)" },
  GeeksforGeeks: { color: "#2F8D46", bg: "rgba(47,141,70,0.12)" },
  GFG: { color: "#2F8D46", bg: "rgba(47,141,70,0.12)" },
  Codeforces: { color: "#1F8ACB", bg: "rgba(31,138,203,0.12)" },
  CodeChef: { color: "#a87146", bg: "rgba(168,113,70,0.12)" },
  HackerRank: { color: "#00EA64", bg: "rgba(0,234,100,0.12)" },
  AtCoder: { color: "#8BC4E8", bg: "rgba(139,196,232,0.12)" },
  CodeStudio: { color: "#f2711c", bg: "rgba(242,113,28,0.12)" },
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
          totalSolved: null, // GitHub represents git contributions, NOT solved problems
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
            solvedProblems: false,
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
  const { user: authUser } = useAuth();

  const [notFound, setNotFound] = useState(false);

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
  const [activityHeatmap, setActivityHeatmap] = useState<Record<string, number>>({});
  const [days, setDays] = useState<Day[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time synchronization when viewing user is confirmed as the profile owner
  useEffect(() => {
    if (!resolvedUid || !authUser || authUser.uid !== resolvedUid) return;
    let isCancelled = false;

    async function syncOwnerData() {
      try {
        const [userCompletions, userSubmissions] = await Promise.all([
          loadProblemCompletions(resolvedUid).catch(() => new Set<string>()),
          loadCodeSubmissions(resolvedUid).catch(() => ({} as Record<string, CodeSubmission>)),
        ]);
        const syncedList = await syncPublicSolvedProblems(
          resolvedUid,
          days.length > 0 ? days : undefined,
          userCompletions,
          userSubmissions,
        );
        if (!isCancelled && syncedList && syncedList.length > 0) {
          setCompletedProblems(syncedList);
          const fresh = await loadUserProfile(resolvedUid);
          if (fresh.publicStats) setPublicStats(fresh.publicStats);
          if (fresh.activityHeatmap) setActivityHeatmap(fresh.activityHeatmap);
        }
      } catch (e) {
        console.warn("Real-time profile sync error:", e);
      }
    }

    void syncOwnerData();
    return () => {
      isCancelled = true;
    };
  }, [authUser, resolvedUid, days]);

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
      setActivityHeatmap({
        "2024-03-01": 3,
        "2024-03-02": 5,
        "2024-03-03": 4,
      });
      setPublicStats(
        demo.profile.publicStats ?? { totalSolved: 0, byPlatform: {}, lastUpdated: "" }
      );
      setCompletedProblems((demo.profile.completedProblems as ExtendedCompletedSnapshot[]) ?? []);
      setDays(demo.days);
      setLoading(false);
      return;
    }

    resolveProfileIdentifier(identifier)
      .then(async (uid) => {
        if (!uid) {
          setNotFound(true);
          return;
        }
        setResolvedUid(uid);

        let [p, loadedDays] = await Promise.all([
          loadUserProfile(uid),
          loadPublicDays(uid),
        ]);

        // If authenticated user is viewing their own profile, ensure latest completions & code submissions sync
        const isOwnerViewing = Boolean(
          (auth.currentUser?.uid && auth.currentUser.uid === uid) ||
          (authUser?.uid && authUser.uid === uid)
        );
        if (isOwnerViewing) {
          try {
            const [userCompletions, userSubmissions] = await Promise.all([
              loadProblemCompletions(uid).catch(() => new Set<string>()),
              loadCodeSubmissions(uid).catch(() => ({} as Record<string, CodeSubmission>)),
            ]);
            await syncPublicSolvedProblems(uid, loadedDays, userCompletions, userSubmissions);
            p = await loadUserProfile(uid);
          } catch (syncErr) {
            console.warn("Auto-sync of public solved problems skipped:", syncErr);
          }
        } else if ((!p.completedProblems || p.completedProblems.length === 0) && typeof window !== "undefined") {
          // If public document completedProblems is still empty, check local storage for recovery
          try {
            const localCompRaw = localStorage.getItem(`dsa_completed_problems_${uid}`);
            const localSubsRaw = localStorage.getItem(`dsa_code_submissions_${uid}`);
            if (localCompRaw) {
              const compArr = JSON.parse(localCompRaw);
              if (Array.isArray(compArr) && compArr.length > 0) {
                const subsObj = localSubsRaw ? JSON.parse(localSubsRaw) : {};
                await syncPublicSolvedProblems(uid, loadedDays, new Set(compArr), subsObj);
                p = await loadUserProfile(uid);
              }
            }
          } catch (localErr) {
            console.warn("Local storage fallback skipped:", localErr);
          }
        }

        if (
          !p.displayName &&
          !p.username &&
          !p.bio &&
          !p.photoURL &&
          loadedDays.length === 0 &&
          (!p.completedProblems || p.completedProblems.length === 0)
        ) {
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
        if (p.activityHeatmap) setActivityHeatmap(p.activityHeatmap);

        // Extract and merge all solved problems from user profile and loadedDays
        const profileCompleted: ExtendedCompletedSnapshot[] =
          (p.completedProblems as ExtendedCompletedSnapshot[]) ?? [];

        // Build index of dates & metadata from loadedDays to heal any snapshot missing date/platform
        const dayProblemMap = new Map<string, { date: string; platform?: string; difficulty?: string; link?: string }>();
        for (const day of loadedDays ?? []) {
          for (const prob of day.problems ?? []) {
            if (prob.done && prob.name) {
              dayProblemMap.set(prob.name, {
                date: prob.completedAt || day.date,
                platform: prob.platform,
                difficulty: prob.difficulty,
                link: prob.link || undefined,
              });
            }
          }
        }

        const seen = new Set<string>();
        const allMergedCompleted: ExtendedCompletedSnapshot[] = [];
        const fallbackDate = p.publicStats?.lastUpdated?.slice(0, 10) || new Date().toISOString().slice(0, 10);

        // 1. Add all from profile doc first (preserves user code snippets, key points, submissions)
        for (const prob of profileCompleted) {
          if (!prob?.name || seen.has(prob.name)) continue;
          seen.add(prob.name);

          const dayInfo = dayProblemMap.get(prob.name);
          const rawDate = prob.completedAt || (prob as any).submittedAt || dayInfo?.date || fallbackDate;
          const platLink = prob.link || dayInfo?.link || getCanonicalProblemLink(prob.name) || "";
          const meta = getProblemMetadata(prob.name);
          const normPlat = normalizePlatformName(prob.platform || dayInfo?.platform || meta?.platform, platLink);
          const difficulty = prob.difficulty && prob.difficulty !== "DSA" ? prob.difficulty : (dayInfo?.difficulty || meta?.difficulty || "Medium");

          allMergedCompleted.push({
            ...prob,
            platform: normPlat,
            difficulty: difficulty as any,
            link: platLink,
            completedAt: rawDate,
          });
        }

        // 2. Add all done problems from loadedDays that aren't already included
        for (const day of loadedDays ?? []) {
          for (const prob of day.problems ?? []) {
            if (prob.done && prob.name && !seen.has(prob.name)) {
              seen.add(prob.name);
              const platLink = prob.link || getCanonicalProblemLink(prob.name) || "";
              const meta = getProblemMetadata(prob.name);
              const normPlat = normalizePlatformName(prob.platform || meta?.platform, platLink);
              const difficulty = prob.difficulty && prob.difficulty !== "DSA" ? prob.difficulty : (meta?.difficulty || "Medium");

              allMergedCompleted.push({
                name: prob.name,
                platform: normPlat,
                difficulty: difficulty as any,
                link: platLink,
                completedAt: prob.completedAt || day.date || fallbackDate,
              });
            }
          }
        }

        // Always check local storage for any solved problems/submissions not yet in allMergedCompleted
        if (typeof window !== "undefined") {
          try {
            const localCompRaw = localStorage.getItem(`dsa_completed_problems_${uid}`);
            const localSubsRaw = localStorage.getItem(`dsa_code_submissions_${uid}`);
            if (localSubsRaw) {
              const subsObj = JSON.parse(localSubsRaw);
              for (const [probName, sub] of Object.entries(subsObj as Record<string, any>)) {
                if (probName && !seen.has(probName)) {
                  seen.add(probName);
                  const platLink = getCanonicalProblemLink(probName) || sub.link || "";
                  const meta = getProblemMetadata(probName);
                  const normPlat = normalizePlatformName(sub.platform || meta?.platform || "DSA", platLink);
                  const completedAt = sub.submittedAt?.slice(0, 10) || fallbackDate;
                  allMergedCompleted.push({
                    name: probName,
                    platform: normPlat,
                    difficulty: (sub.difficulty || meta?.difficulty || "Medium") as any,
                    link: platLink,
                    completedAt,
                    submittedAt: sub.submittedAt || new Date().toISOString(),
                    code: sub.code,
                    submissionLink: sub.link || platLink,
                    keyPoints: sub.keyPoints,
                  });
                }
              }
            }
            if (localCompRaw) {
              const compArr = JSON.parse(localCompRaw);
              if (Array.isArray(compArr)) {
                for (const name of compArr) {
                  if (name && !seen.has(name)) {
                    seen.add(name);
                    const platLink = getCanonicalProblemLink(name) || "";
                    const meta = getProblemMetadata(name);
                    const normPlat = normalizePlatformName(meta?.platform || "DSA", platLink);
                    allMergedCompleted.push({
                      name,
                      platform: normPlat,
                      difficulty: (meta?.difficulty || "Medium") as any,
                      link: platLink,
                      completedAt: fallbackDate,
                    });
                  }
                }
              }
            }
          } catch (localErr) {
            console.warn("Local storage check skipped:", localErr);
          }
        }


        // Compute accurate publicStats breakdown
        const statsByPlatform: Record<string, number> = {};
        for (const cp of allMergedCompleted) {
          const plat = cp.platform || "DSA";
          statsByPlatform[plat] = (statsByPlatform[plat] ?? 0) + 1;
        }

        // Merge with existing profile publicStats if any platform had higher count
        if (p.publicStats?.byPlatform) {
          for (const [k, v] of Object.entries(p.publicStats.byPlatform)) {
            const norm = normalizePlatformName(k);
            if (!statsByPlatform[norm] || statsByPlatform[norm] < v) {
              statsByPlatform[norm] = Math.max(statsByPlatform[norm] ?? 0, v);
            }
          }
        }

        // Merge with external connected platform stats (LeetCode, GFG, Codeforces, etc.)
        // Exclude GitHub: Git contributions/commits are not solved coding problems
        if (p.platformStats && typeof p.platformStats === "object") {
          for (const [rawKey, prof] of Object.entries(p.platformStats)) {
            const lk = rawKey.toLowerCase();
            if (lk === "github" || lk === "linkedin") continue;
            if (prof && typeof prof === "object" && typeof (prof as any).totalSolved === "number" && (prof as any).totalSolved > 0) {
              const norm = normalizePlatformName(rawKey);
              const solved = (prof as any).totalSolved;
              statsByPlatform[norm] = Math.max(statsByPlatform[norm] ?? 0, solved);
            }
          }
        }
        delete statsByPlatform["GitHub"];
        delete statsByPlatform["github"];

        const allPlatformsTotal = Object.values(statsByPlatform).reduce((a, b) => a + b, 0);
        const trackerProblemsCount = allMergedCompleted.filter((cp) => cp.platform?.toLowerCase() !== "github").length;
        const totalSolved = Math.max(trackerProblemsCount, allPlatformsTotal);

        if (allPlatformsTotal < trackerProblemsCount) {
          statsByPlatform["DSA"] = (statsByPlatform["DSA"] ?? 0) + (trackerProblemsCount - allPlatformsTotal);
        }

        setPublicStats({
          totalSolved,
          byPlatform:
            Object.keys(statsByPlatform).length > 0
              ? statsByPlatform
              : p.publicStats?.byPlatform ?? {},
          lastUpdated: p.publicStats?.lastUpdated || new Date().toISOString(),
        });
        setCompletedProblems(allMergedCompleted);
        setDays(loadedDays);
      })
      .catch((err) => {
        console.error("Failed to load profile:", err);
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [identifier]);


  // Synthesize virtual days or merge completed problems into days for roadmap graph, badges, streak, difficulty split
  const effectiveDays = useMemo<Day[]>(() => {
    if (days.length === 0) {
      if (completedProblems.length === 0) return [];

      const byDate = new Map<string, ExtendedCompletedSnapshot[]>();
      for (const p of completedProblems) {
        const d = p.completedAt?.slice(0, 10) || new Date().toISOString().slice(0, 10);
        const list = byDate.get(d) ?? [];
        list.push(p);
        byDate.set(d, list);
      }

      const sortedDates = Array.from(byDate.keys()).sort();
      return sortedDates.map((dateStr, idx) => {
        const probs = byDate.get(dateStr) ?? [];
        return {
          id: `virtual-day-${idx + 1}`,
          dayNumber: idx + 1,
          date: dateStr,
          section: probs[0]?.platform || "DSA Milestone",
          topic: "Problems Solved",
          subtopics: [],
          problems: probs.map((p) => {
            const diff = (p.difficulty as any) || "Medium";
            return {
              name: p.name,
              platform: p.platform,
              difficulty: diff,
              link: p.link,
              linkVerified: true,
              takeUForwardLink: null,
              estTime: 30,
              done: true,
              isHard: diff === "Hard" || diff === "Advanced" || diff === "Expert",
              completedAt: dateStr,
            };
          }),
          checklist: [],
          status: "completed" as const,
          notes: "",
          revisionNotes: "",
          skipped: false,
        };
      });
    }

    if (completedProblems.length === 0) return days;
    const completedMap = new Map(completedProblems.map((cp) => [cp.name, cp]));
    const matchedNames = new Set<string>();

    const updatedDays = days.map((day) => {
      let dayModified = false;
      const updatedProblems = (day.problems ?? []).map((prob) => {
        const match = completedMap.get(prob.name);
        if (match) {
          matchedNames.add(prob.name);
          if (!prob.done) {
            dayModified = true;
            return {
              ...prob,
              done: true,
              completedAt: match.completedAt || prob.completedAt || day.date,
            };
          }
        }
        return prob;
      });
      return dayModified ? { ...day, problems: updatedProblems } : day;
    });

    const unmatched = completedProblems.filter((cp) => !matchedNames.has(cp.name));
    if (unmatched.length === 0) return updatedDays;

    const unmatchedByDate = new Map<string, ExtendedCompletedSnapshot[]>();
    for (const p of unmatched) {
      const d = p.completedAt?.slice(0, 10) || new Date().toISOString().slice(0, 10);
      const list = unmatchedByDate.get(d) ?? [];
      list.push(p);
      unmatchedByDate.set(d, list);
    }

    const resultDays = [...updatedDays];
    const dayByDate = new Map<string, Day>();
    resultDays.forEach((d) => dayByDate.set(d.date, d));

    let virtualDayIdx = resultDays.length + 1;
    unmatchedByDate.forEach((probs, dateStr) => {
      const existingDay = dayByDate.get(dateStr);
      const newProbs = probs.map((p) => {
        const diff = (p.difficulty as any) || "Medium";
        return {
          name: p.name,
          platform: p.platform,
          difficulty: diff,
          link: p.link,
          linkVerified: true,
          takeUForwardLink: null,
          estTime: 30,
          done: true,
          isHard: diff === "Hard" || diff === "Advanced" || diff === "Expert",
          completedAt: dateStr,
        };
      });

      if (existingDay) {
        existingDay.problems = [...existingDay.problems, ...newProbs];
      } else {
        resultDays.push({
          id: `virtual-day-${virtualDayIdx++}`,
          dayNumber: virtualDayIdx,
          date: dateStr,
          section: probs[0]?.platform || "DSA Milestone",
          topic: "Problems Solved",
          subtopics: [],
          problems: newProbs,
          checklist: [],
          status: "completed" as const,
          notes: "",
          revisionNotes: "",
          skipped: false,
        });
      }
    });

    return resultDays;
  }, [days, completedProblems]);

  const initials = (displayName || "?")[0]?.toUpperCase() ?? "?";

  // Badges & streak calculation from public days or effective days
  const badges = useMemo(() => computeBadges(effectiveDays), [effectiveDays]);
  const streakCount = useMemo(() => currentStreak(effectiveDays), [effectiveDays]);

  // 404 DSA Roadmap Graph data
  const trend = useMemo(() => solvedTrend(effectiveDays), [effectiveDays]);
  const diffSplit = useMemo(() => difficultySplit(effectiveDays), [effectiveDays]);

  // Heatmap calculations — checking plan days, effective days, completed problem snapshots, and user activityHeatmap
  const { heatmapData, detailMap } = useMemo(() => {
    const dateMap = new Map<string, any[]>();
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const daysToUse = days.length > 0 ? days : effectiveDays;
    const todayStr = new Date().toISOString().slice(0, 10);

    // 1. From days or effectiveDays
    for (const day of daysToUse ?? []) {
      const doneProbs = (day.problems ?? []).filter((p) => p.done);
      for (const p of doneProbs) {
        const rawDate = p.completedAt || day.date;
        const dateStr = rawDate && typeof rawDate === "string" ? rawDate.slice(0, 10) : "";
        if (dateStr && dateRegex.test(dateStr) && dateStr <= todayStr) {
          const platLink = getCanonicalProblemLink(p.name) || p.link || "";
          const item = {
            ...p,
            platform: normalizePlatformName(p.platform, platLink),
            submissionLink: (p as any).submissionLink || platLink,
            code: (p as any).code,
            keyPoints: (p as any).keyPoints,
            done: true,
          };
          const existing = dateMap.get(dateStr) ?? [];
          if (!existing.some((x) => x.name === p.name)) {
            dateMap.set(dateStr, [...existing, item]);
          }
        }
      }
    }

    // 2. From completed problems list
    for (const p of completedProblems ?? []) {
      const rawDate = p.completedAt || (p as any).submittedAt || todayStr;
      const dateStr = rawDate && typeof rawDate === "string" ? rawDate.slice(0, 10) : todayStr;
      if (dateStr && dateRegex.test(dateStr) && dateStr <= todayStr) {
        const platLink = getCanonicalProblemLink(p.name) || p.link || "";
        const item = {
          name: p.name,
          platform: normalizePlatformName(p.platform, platLink),
          difficulty: p.difficulty || "Medium",
          link: platLink,
          submissionLink: p.submissionLink || platLink,
          code: p.code,
          keyPoints: p.keyPoints,
          done: true,
        };
        const existing = dateMap.get(dateStr) ?? [];
        if (!existing.some((x) => x.name === p.name)) {
          dateMap.set(dateStr, [...existing, item]);
        }
      }
    }

    // 3. Register any additional dates from activityHeatmap
    if (activityHeatmap) {
      for (const dateStr of Object.keys(activityHeatmap)) {
        if (dateStr && dateRegex.test(dateStr) && dateStr <= todayStr && !dateMap.has(dateStr)) {
          dateMap.set(dateStr, []);
        }
      }
    }

    const hData: { date: string; solved: number }[] = [];
    const dMap: Record<string, any[]> = {};
    dateMap.forEach((probs, dateStr) => {
      if (dateStr <= todayStr) {
        const syncedCount = activityHeatmap?.[dateStr] ?? 0;
        const count = Math.max(probs.length, syncedCount);
        hData.push({ date: dateStr, solved: count });
        dMap[dateStr] = probs;
      }
    });

    // Only populate non-future days up to today with 0 count
    for (const day of daysToUse ?? []) {
      if (day.date && dateRegex.test(day.date) && day.date <= todayStr && !day.skipped && !dateMap.has(day.date)) {
        hData.push({ date: day.date, solved: 0 });
      }
    }

    return { heatmapData: hData, detailMap: dMap };
  }, [days, effectiveDays, completedProblems, activityHeatmap]);

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

  // Unified statistics aggregating problems solved across all platforms (DSA Tracker + LeetCode + GFG + Codeforces + CodeChef + HackerRank, etc.)
  const allPlatformsStats = useMemo(() => {
    const byPlatform: Record<string, number> = {};

    // 1. Count from completed problems in DSA tracker (exclude GitHub)
    for (const cp of completedProblems) {
      if (cp.platform?.toLowerCase() === "github") continue;
      const plat = normalizePlatformName(cp.platform) || "DSA";
      byPlatform[plat] = (byPlatform[plat] ?? 0) + 1;
    }

    // 2. External connected platforms (LeetCode, GFG, Codeforces, CodeChef, HackerRank, etc.)
    // Explicitly exclude GitHub: contributions/commits are displayed in the contribution heatmap, not solved problems
    let externalPlatformsTotal = 0;
    const statsObj = platformStats && typeof platformStats === "object" ? platformStats : {};
    for (const [rawKey, prof] of Object.entries(statsObj)) {
      const lk = rawKey.toLowerCase();
      if (lk === "github" || lk === "linkedin") continue;
      if (prof && typeof prof === "object" && typeof (prof as any).totalSolved === "number" && (prof as any).totalSolved > 0) {
        const norm = normalizePlatformName(rawKey);
        const solved = (prof as any).totalSolved;
        externalPlatformsTotal += solved;
        byPlatform[norm] = Math.max(byPlatform[norm] ?? 0, solved);
      }
    }

    // 3. Merge publicStats.byPlatform if recorded higher
    if (publicStats?.byPlatform) {
      for (const [k, v] of Object.entries(publicStats.byPlatform)) {
        if (k.toLowerCase() === "github" || k.toLowerCase() === "linkedin") continue;
        if (typeof v === "number" && v > 0) {
          const norm = normalizePlatformName(k);
          if (!byPlatform[norm] || byPlatform[norm] < v) {
            byPlatform[norm] = v;
          }
        }
      }
    }
    delete byPlatform["GitHub"];
    delete byPlatform["github"];

    // 4. Heatmap total solved count & tracker total (problems completed within 404 DSA milestone)
    const heatmapTotal = heatmapData.reduce((acc, d) => acc + (d.solved > 0 ? d.solved : 0), 0);
    const trackerProblemsCount = completedProblems.filter((p) => p.platform?.toLowerCase() !== "github").length;
    const trackerTotal = Math.max(trackerProblemsCount, heatmapTotal);

    // 5. Grand total solved across all platforms is the sum of each platform's solved count
    const platformsSum = Object.values(byPlatform).reduce((acc, count) => acc + count, 0);
    const grandTotalSolved = Math.max(platformsSum, trackerTotal);

    // If platformsSum < trackerTotal (e.g. untagged DSA problems not in byPlatform), balance it
    if (platformsSum < trackerTotal) {
      const diff = trackerTotal - platformsSum;
      byPlatform["DSA"] = (byPlatform["DSA"] ?? 0) + diff;
    }

    return {
      grandTotalSolved,
      trackerTotal,
      externalPlatformsTotal,
      byPlatform,
    };
  }, [completedProblems, publicStats, heatmapData, platformStats]);

  if (loading) {
    return <QuoteLoader fullScreen />;
  }



  // ── 404 state ──
  // ── 404 state ──
  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <Globe className="size-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Profile not found</h1>
        <p className="text-muted-foreground">This profile doesn't exist or hasn't been set up yet.</p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <span>Return to</span>
          <div className="font-display font-black tracking-tighter text-sm leading-none inline-flex items-baseline select-none">
            <span>DSA</span>
            <span className="text-orange-500 ml-[0.5px]">⁴⁰⁴</span>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Branded top bar ── */}
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-[1400px] items-center gap-2.5 px-4 sm:px-6 lg:px-8 py-3">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <div className="size-7 rounded-full overflow-hidden border border-border/80 shadow-sm ring-1 ring-primary/20 bg-background shrink-0">
              <img src="/logo.jpg" alt="DSA404 Logo" className="size-full object-cover" />
            </div>
            <div className="font-display font-black tracking-tighter text-[20px] leading-none flex items-baseline select-none">
              <span className="text-foreground drop-shadow-sm">DSA</span>
              <span className="text-primary drop-shadow-sm ml-[1px]">⁴⁰⁴</span>
            </div>
          </Link>
          <span className="ml-auto text-xs font-semibold uppercase tracking-wider text-muted-foreground">Public Portfolio</span>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in pb-24">
        
        {/* ── Demo Mode Showcase Ribbon ── */}
        {isDemo && (
          <div className="rounded-3xl border border-primary/30 bg-primary/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                <Sparkles className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-foreground">Live Public Profile Showcase</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground">DEMO</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  See how your DSA portfolio and verified social links present to recruiters.
                </p>
              </div>
            </div>
            <Link
              href="/auth"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-4 py-2 shadow-sm transition-all"
            >
              <span>Create Profile</span>
              <ExternalLink className="size-3" />
            </Link>
          </div>
        )}

        {/* ── HERO BANNER (EDITORIAL) ── */}
        <section className="relative rounded-3xl overflow-hidden border border-border bg-card shadow-sm">
          <div className="h-48 md:h-64 w-full relative bg-muted">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent" />
            {bannerURL && <img src={bannerURL} alt="banner" className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay" />}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
          </div>

          <div className="relative px-6 md:px-10 pb-8 -mt-20 md:-mt-24 flex flex-col md:flex-row items-end gap-6 md:gap-8">
            {/* Avatar */}
            <div className="size-32 md:size-40 rounded-[2rem] border-4 border-card shadow-xl overflow-hidden shrink-0 bg-secondary flex items-center justify-center hover:scale-[1.02] transition-transform duration-300">
              {photoURL ? (
                <img src={photoURL} alt="Avatar" className="size-full object-cover" />
              ) : (
                <span className="text-5xl font-black text-primary/50">{initials}</span>
              )}
            </div>

            {/* Core Info */}
            <div className="flex-1 min-w-0 w-full pb-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <h1 className="text-3xl md:text-5xl font-display font-black tracking-tight text-foreground truncate">
                    {displayName || "Anonymous Coder"}
                  </h1>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    {username && username !== effectiveGithubUsername && (
                      <span className="font-mono text-primary font-bold">@{username}</span>
                    )}
                    <span className="text-muted-foreground font-medium">{bio || "Software Engineer Aspirant"}</span>
                  </div>
                </div>
              </div>
              
              {/* External Link Rail */}
              <div className="flex flex-wrap items-center gap-3 mt-4">
                {githubProfileUrl && (
                  <a href={githubProfileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors bg-secondary/50 px-3 py-1.5 rounded-lg border border-border shadow-sm">
                    <GitHubIcon className="size-3.5" /> GitHub <ExternalLink className="size-3 opacity-50" />
                  </a>
                )}
                {linkedin && (
                  <a href={linkedin.startsWith("http") ? linkedin : `https://linkedin.com/in/${linkedin}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors bg-secondary/50 px-3 py-1.5 rounded-lg border border-border shadow-sm">
                    <LinkedInIcon className="size-3.5" /> LinkedIn <ExternalLink className="size-3 opacity-50" />
                  </a>
                )}
                {portfolio && (
                  <a href={portfolio.startsWith("http") ? portfolio : `https://${portfolio}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors bg-secondary/50 px-3 py-1.5 rounded-lg border border-border shadow-sm">
                    <Globe className="size-3.5" /> Portfolio <ExternalLink className="size-3 opacity-50" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── PROFILE WORKSPACE ── */}
        {/* ── TWO COLUMN WORKSPACE ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* PRIMARY COLUMN: Main Analytics */}
          <main className="order-1 min-w-0 space-y-8 lg:contents">
            
            {/* Unified Platform Profiles */}
            {(Object.entries(codingProfiles).some(([k, v]) => k !== "customLinks" && k !== "platformStats" && typeof v === "string" && Boolean(v.trim()))) && (
              <div className="rounded-3xl border border-border bg-card p-4 shadow-sm overflow-hidden sm:p-6 lg:order-1 lg:col-span-8 lg:p-8">
                <UnifiedProfileDashboard
                  initialProfiles={codingProfiles as Record<string, string>}
                  initialStats={platformStats}
                  userId={resolvedUid}
                  readOnly={true}
                />
              </div>
            )}

            {/* Solving Trend (Public) */}
            {effectiveDays.length > 0 && (
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm overflow-hidden lg:order-3 lg:col-span-12">
                <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
                  <TrendingUp className="size-4 text-primary" /> Platform Solving Trend
                </h3>
                <div className="h-64 w-full mt-4">
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
                        contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, color: "var(--color-popover-foreground)", fontSize: 12, padding: "12px" }}
                      />
                      <Area type="monotone" dataKey="solved" name="Solved" stroke="var(--color-primary)" fill="url(#publicSolvedFill)" strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Solved Days Heatmap */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm overflow-hidden lg:order-4 lg:col-span-12">
              <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
                Learning Consistency
              </h3>
              <p className="text-xs text-muted-foreground mb-6">Daily problem-solving activity across the platform.</p>
              <div className="max-w-full overflow-x-auto pb-2">
                <SubmissionHeatmap data={heatmapData} detailMap={detailMap} />
              </div>
            </div>

            {/* GitHub Heatmap */}
            {githubUsername && (
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm overflow-hidden lg:order-5 lg:col-span-12">
                <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
                  <GitHubIcon className="size-4" /> GitHub Contributions
                </h3>
                <p className="text-xs text-muted-foreground mb-6">Synced activity for @{githubUsername}.</p>
                <div className="max-w-full overflow-x-auto pb-2">
                  <GitHubContributionHeatmap username={githubUsername} />
                </div>
              </div>
            )}

            {/* Solved Problems Archive */}
            <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden lg:order-6 lg:col-span-12">
              <SolvedProblemsArchive completedProblems={completedProblems} />
            </div>

          </main>

          {/* SECONDARY COLUMN: Summary & Narrative */}
          <aside className="order-2 min-w-0 space-y-6 lg:order-2 lg:col-span-4 lg:sticky lg:top-6 lg:self-start">
            
            {/* Top Line Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-3xl border border-border bg-card p-5 shadow-sm flex flex-col justify-center">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Total Solved</span>
                <span className="text-3xl font-display font-black text-primary mt-1">{allPlatformsStats.grandTotalSolved}</span>
              </div>
              <div className="rounded-3xl border border-border bg-card p-5 shadow-sm flex flex-col justify-center">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Current Streak</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <Flame className="size-5 text-orange-500" />
                  <span className="text-3xl font-display font-black text-foreground">{streakCount}</span>
                </div>
              </div>
              <div className="col-span-2 rounded-3xl border border-border bg-card p-5 shadow-sm">
                <span className="text-[10px] font-bold uppercase text-muted-foreground mb-3 block">Platform Distribution</span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(allPlatformsStats.byPlatform).sort((a,b) => b[1] - a[1]).map(([plat, num]) => (
                    <div key={plat} className="flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 rounded-lg">
                      <span className="size-1.5 rounded-full bg-primary/50" />
                      <span className="text-xs font-semibold">{plat}</span>
                      <span className="text-xs text-muted-foreground font-mono">{num}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* About Me & Contact */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <UserCircle2 className="size-4 text-primary" /> Story & Trajectory
              </h3>
              
              {aboutMe ? (
                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{aboutMe}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No detailed biography provided.</p>
              )}

              {email && (
                <div className="mt-6 pt-4 border-t border-border/50">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-2">Contact Email</span>
                  <a href={"mailto:" + email} className="text-sm font-mono text-primary hover:underline">{email}</a>
                </div>
              )}

              {/* Other Custom Links */}
              {((codingProfiles.customLinks ?? []).some((cl) => cl.url) || socialLinks.length > 0) && (
                <div className="mt-6 pt-4 border-t border-border/50">
                  <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-3">Verified Links</h4>
                  <div className="flex flex-col gap-2">
                    {socialLinks.map((s, i) => (
                      <a key={"social-" + i} href={s.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-foreground hover:text-primary transition-colors flex items-center justify-between bg-secondary/40 px-3 py-2 rounded-lg">
                        <span className="flex items-center gap-2">{getSocialIcon(s.platform, "size-3.5")} {s.platform}</span>
                        <ExternalLink className="size-3 opacity-50" />
                      </a>
                    ))}
                    {(codingProfiles.customLinks ?? []).filter(cl => cl.url).map((cl, i) => (
                      <a key={"custom-" + i} href={cl.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-foreground hover:text-primary transition-colors flex items-center justify-between bg-secondary/40 px-3 py-2 rounded-lg">
                        <span className="flex items-center gap-2"><Globe className="size-3.5 text-muted-foreground" /> {cl.label || "Link"}</span>
                        <ExternalLink className="size-3 opacity-50" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Badges */}
            {effectiveDays.length > 0 && (
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                  <Flame className="size-4 text-orange-500" /> Achievements
                </h3>
                <BadgesGrid badges={badges} />
              </div>
            )}
            
            {/* Global Difficulty Split */}
            {effectiveDays.length > 0 && (
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <BarChart3 className="size-3.5 text-primary" /> Difficulty Split
                </h3>
                <div className="h-48 w-full bg-secondary/30 rounded-2xl p-2 border border-border/50">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={diffSplit} margin={{ left: -20, right: 8, top: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.6} />
                      <XAxis dataKey="difficulty" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                      <RTooltip
                        contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, color: "var(--color-popover-foreground)", fontSize: 12, padding: "12px" }}
                      />
                      <Bar dataKey="done" name="Solved" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

          </aside>
        </div>
      {/* ── Footer ── */}
        <footer className="pt-8 text-center text-xs font-medium text-muted-foreground">
          Built with{" "}
          <Link href="/" className="inline-flex items-center gap-1.5 align-middle hover:opacity-90 transition-opacity">
            <span className="font-display font-black tracking-tighter text-xs leading-none flex items-baseline select-none text-foreground">
              DSA<span className="text-primary ml-[0.5px]">⁴⁰⁴</span>
            </span>
          </Link>
          {" "}— The premier DSA learning workspace.
        </footer>
      </main>
    </div>
  );
}

import { addDays, seedDays, todayIso } from "./plan";
import type { Day } from "./types";
import type { PlanMeta, UserProfile, CodeSubmission, ScheduleEventRow } from "./db";
import type { UserSettings } from "./settings";
import { DEFAULT_SETTINGS } from "./settings";

export const GUEST_USER_ID = "guest_3star_coder";

export const GUEST_STORAGE_KEYS = {
  MODE: "dsa404_guest_mode",
  DAYS: "dsa404_guest_days_v2",
  PROFILE: "dsa404_guest_profile_v2",
  SETTINGS: "dsa404_guest_settings_v2",
  SUBMISSIONS: "dsa404_guest_submissions_v2",
  COMPLETIONS: "dsa404_guest_completions_v2",
  GUIDES_VISIBLE: "dsa404_guest_guides_visible_v2",
};

/** Check if current browser session is running in Guest / Demo mode. */
export function isGuestMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(GUEST_STORAGE_KEYS.MODE) === "true";
  } catch {
    return false;
  }
}

/** Check if given userId is the guest account or guest mode is active. */
export function isGuestUser(userId?: string | null): boolean {
  if (!userId) return isGuestMode();
  return userId === GUEST_USER_ID || (isGuestMode() && userId === GUEST_USER_ID);
}

/** Enable Guest Mode and ensure default 3-star coder data is seeded in localStorage. */
export function enableGuestMode(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUEST_STORAGE_KEYS.MODE, "true");
    // Ensure initial 3-star coder dataset is ready in localStorage
    ensureGuestDataInitialized();
  } catch (e) {
    console.error("Failed to enable guest mode in localStorage:", e);
  }
}

/** Disable Guest Mode and clear active flag. */
export function disableGuestMode(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(GUEST_STORAGE_KEYS.MODE);
  } catch (e) {
    console.error("Failed to disable guest mode:", e);
  }
}

/** Reset all guest data back to fresh 3-star coder state. */
export function resetGuestData(): void {
  if (typeof window === "undefined") return;
  try {
    Object.values(GUEST_STORAGE_KEYS).forEach((k) => {
      if (k !== GUEST_STORAGE_KEYS.MODE) {
        localStorage.removeItem(k);
      }
    });
    localStorage.setItem(GUEST_STORAGE_KEYS.MODE, "true");
    ensureGuestDataInitialized(true);
  } catch (e) {
    console.error("Failed to reset guest data:", e);
  }
}

/** Check if beginner guides banner is expanded. */
export function isGuestGuidesVisible(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const val = localStorage.getItem(GUEST_STORAGE_KEYS.GUIDES_VISIBLE);
    return val !== "false"; // true by default for naive users
  } catch {
    return true;
  }
}

export function setGuestGuidesVisible(visible: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUEST_STORAGE_KEYS.GUIDES_VISIBLE, visible ? "true" : "false");
  } catch {}
}

/** Mock Firebase User instance representing the 3-star coder. */
export function getGuestUser() {
  return {
    uid: GUEST_USER_ID,
    email: "alex.rivera.3star@dsa404.dev",
    displayName: "Alex Rivera",
    photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    isAnonymous: true,
    emailVerified: true,
    metadata: {
      creationTime: new Date(Date.now() - 45 * 86400000).toUTCString(),
      lastSignInTime: new Date().toUTCString(),
    },
  };
}

// ─── Default 3-Star Coder Profile ─────────────────────────────────────────────
function buildDefaultGuestProfile(): UserProfile {
  const today = todayIso();
  
  // Build 120-day submission heatmap with realistic consistency
  const activityHeatmap: Record<string, number> = {};
  for (let i = 120; i >= 0; i--) {
    const dateStr = addDays(today, -i);
    // Active on ~88% of days, solving 2-5 problems
    if (i % 7 !== 3) {
      activityHeatmap[dateStr] = 2 + ((i * 3 + 1) % 4);
    }
  }

  return {
    displayName: "Alex Rivera",
    username: "alex_3star",
    email: "alex.rivera.3star@dsa404.dev",
    photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    bannerURL: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
    bio: "3★ Competitive Programmer & DSA Specialist | 348 Solved | LeetCode Knight (1842) | CodeChef 3★ (1695) | Codeforces Specialist (1460)",
    aboutMe: "Hi there! 👋 I am Alex, a 3rd-year CS student. I've been using DSA⁴⁰⁴ to practice daily patterns, stay accountable with streaks, and prep for top tech interviews. Feel free to explore my roadmap, verified solutions, and CP stats below!",
    notes: "Personal Review Goal: Master Graph BFS/DFS before the weekend contest. Re-solve Trapping Rain Water and LRU Cache.",
    linkedin: "https://linkedin.com/in/alex-rivera-cs",
    github: "https://github.com/alexrivera-dev",
    portfolio: "https://alexrivera.dev",
    socialLinks: [
      { platform: "Twitter", url: "https://twitter.com/alex_codes" },
      { platform: "YouTube", url: "https://youtube.com/@alex_algorithms" },
    ],
    codingProfiles: {
      leetcode: "alex_rivera",
      codechef: "alex_3star",
      codeforces: "alex_cf",
      gfg: "alexrivera_gfg",
      hackerrank: "alex_coder",
      github: "alexrivera-dev",
    },
    platformStats: {
      codechef: {
        platform: "codechef",
        username: "alex_3star",
        displayName: "Alex Rivera",
        rating: 1695,
        maxRating: 1740,
        rank: "3★ (Div 2)",
        stars: 3,
        globalRank: 11240,
        countryRank: 3180,
        contestsParticipated: 24,
        totalSolved: 78,
        status: "SUCCESS",
        dataSource: "Official API",
        fetchedAt: new Date().toISOString(),
        badges: ["3★ Coder", "Division 2 Contender", "Starters 120 Top 500"],
        capabilities: { profile: true, rating: true, ratingHistory: true, solvedProblems: true, contestStats: true },
        ratingHistory: [
          { contestName: "Starters 115 (Div 3)", rating: 1480, rank: 412, date: "2024-01-10", timestamp: 1704844800000 },
          { contestName: "Starters 118 (Div 3)", rating: 1560, rank: 280, date: "2024-01-31", timestamp: 1706659200000 },
          { contestName: "Starters 121 (Div 2)", rating: 1635, rank: 620, date: "2024-02-21", timestamp: 1708473600000 },
          { contestName: "Starters 124 (Div 2)", rating: 1695, rank: 485, date: "2024-03-13", timestamp: 1710288000000 },
        ],
      },
      leetcode: {
        platform: "leetcode",
        username: "alex_rivera",
        displayName: "Alex Rivera",
        rating: 1842,
        maxRating: 1870,
        rank: "Knight (Top 7.4%)",
        totalSolved: 348,
        easySolved: 142,
        mediumSolved: 176,
        hardSolved: 30,
        contestsParticipated: 32,
        contestRating: 1842,
        status: "SUCCESS",
        dataSource: "Official GraphQL/REST",
        fetchedAt: new Date().toISOString(),
        badges: ["Knight Badge", "50 Days Streak 2024", "100 Days Badge", "Top 10%"],
        capabilities: { profile: true, rating: true, ratingHistory: true, solvedProblems: true, contestStats: true },
        ratingHistory: [
          { contestName: "Weekly Contest 380", rating: 1710, rank: 2950, date: "2024-01-14", timestamp: 1705190400000 },
          { contestName: "Biweekly Contest 122", rating: 1765, rank: 2100, date: "2024-01-20", timestamp: 1705708800000 },
          { contestName: "Weekly Contest 384", rating: 1805, rank: 1720, date: "2024-02-11", timestamp: 1707609600000 },
          { contestName: "Biweekly Contest 125", rating: 1842, rank: 1420, date: "2024-03-02", timestamp: 1709337600000 },
        ],
      },
      codeforces: {
        platform: "codeforces",
        username: "alex_cf",
        displayName: "Alex Rivera",
        rating: 1460,
        maxRating: 1498,
        rank: "Specialist",
        totalSolved: 115,
        contestsParticipated: 28,
        status: "SUCCESS",
        dataSource: "Official API",
        fetchedAt: new Date().toISOString(),
        capabilities: { profile: true, rating: true, solvedProblems: true, contestStats: true },
      },
      gfg: {
        platform: "gfg",
        username: "alexrivera_gfg",
        displayName: "Alex Rivera",
        score: 940,
        totalSolved: 164,
        rank: "Campus Rank #4",
        status: "SUCCESS",
        dataSource: "Permitted Public Source",
        fetchedAt: new Date().toISOString(),
        capabilities: { profile: true, rating: false, solvedProblems: true },
      },
      hackerrank: {
        platform: "hackerrank",
        username: "alex_coder",
        displayName: "Alex Rivera",
        badges: ["6★ Problem Solving", "5★ C++", "5★ Python"],
        status: "SUCCESS",
        dataSource: "Permitted Public Source",
        fetchedAt: new Date().toISOString(),
        capabilities: { profile: true, badges: true },
      },
      github: {
        platform: "github",
        username: "alexrivera-dev",
        displayName: "Alex Rivera",
        totalRepos: 18,
        followers: 64,
        contributions: 482,
        status: "SUCCESS",
        dataSource: "Official API",
        fetchedAt: new Date().toISOString(),
        capabilities: { profile: true },
      },
    },
    publicStats: {
      totalSolved: 348,
      byPlatform: { leetcode: 210, codechef: 65, gfg: 45, codeforces: 28 },
      lastUpdated: new Date().toISOString(),
    },
    completedProblems: [],
    activityHeatmap,
  };
}

// ─── Default 3-Star Coder Submissions & Solutions ─────────────────────────────
function buildDefaultGuestSubmissions(): Record<string, CodeSubmission> {
  const nowIso = new Date().toISOString();
  return {
    "Two Sum": {
      code: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        unordered_map<int, int> seen;\n        for (int i = 0; i < nums.size(); ++i) {\n            int complement = target - nums[i];\n            if (seen.count(complement)) {\n                return {seen[complement], i};\n            }\n            seen[nums[i]] = i;\n        }\n        return {};\n    }\n};`,
      link: "https://leetcode.com/problems/two-sum/",
      keyPoints: "Single pass hash map. Stores {value: index}. Time: O(N), Space: O(N).",
      submittedAt: nowIso,
    },
    "Valid Palindrome": {
      code: `class Solution {\npublic:\n    bool isPalindrome(string s) {\n        int l = 0, r = s.size() - 1;\n        while (l < r) {\n            while (l < r && !isalnum(s[l])) l++;\n            while (l < r && !isalnum(s[r])) r--;\n            if (tolower(s[l]) != tolower(s[r])) return false;\n            l++; r--;\n        }\n        return true;\n    }\n};`,
      link: "https://leetcode.com/problems/valid-palindrome/",
      keyPoints: "Two pointers inward from bounds. Skips non-alphanumeric. Time: O(N), Space: O(1).",
      submittedAt: nowIso,
    },
    "Container With Most Water": {
      code: `class Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        int l = 0, r = height.size() - 1;\n        int maxWater = 0;\n        while (l < r) {\n            int h = min(height[l], height[r]);\n            maxWater = max(maxWater, h * (r - l));\n            if (height[l] < height[r]) l++;\n            else r--;\n        }\n        return maxWater;\n    }\n};`,
      link: "https://leetcode.com/problems/container-with-most-water/",
      keyPoints: "Two pointers from edges inward. Always shrink from smaller height. Time: O(N), Space: O(1).",
      submittedAt: nowIso,
    },
    "Lowest Common Ancestor of a BST": {
      code: `class Solution {\npublic:\n    TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {\n        while (root) {\n            if (p->val < root->val && q->val < root->val) root = root->left;\n            else if (p->val > root->val && q->val > root->val) root = root->right;\n            else return root;\n        }\n        return nullptr;\n    }\n};`,
      link: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/",
      keyPoints: "BST search property: if both values deviate on sides, root is LCA split point. Time: O(H), Space: O(1).",
      submittedAt: nowIso,
    },
    "Validate Binary Search Tree": {
      code: `class Solution {\npublic:\n    bool validate(TreeNode* node, long minVal, long maxVal) {\n        if (!node) return true;\n        if (node->val <= minVal || node->val >= maxVal) return false;\n        return validate(node->left, minVal, node->val) && validate(node->right, node->val, maxVal);\n    }\n    bool isValidBST(TreeNode* root) {\n        return validate(root, LONG_MIN, LONG_MAX);\n    }\n};`,
      link: "https://leetcode.com/problems/validate-binary-search-tree/",
      keyPoints: "Pass valid value range (minVal, maxVal) recursively down tree. Time: O(N), Space: O(H).",
      submittedAt: nowIso,
    },
    "Reverse Linked List": {
      code: `class Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        ListNode* prev = nullptr;\n        ListNode* curr = head;\n        while (curr) {\n            ListNode* next = curr->next;\n            curr->next = prev;\n            prev = curr;\n            curr = next;\n        }\n        return prev;\n    }\n};`,
      link: "https://leetcode.com/problems/reverse-linked-list/",
      keyPoints: "Classic 3-pointer iterative pointer reversal. Time: O(N), Space: O(1).",
      submittedAt: nowIso,
    },
    "Longest Substring Without Repeating Characters": {
      code: `class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        unordered_map<char, int> lastSeen;\n        int maxLen = 0, start = 0;\n        for (int i = 0; i < s.size(); ++i) {\n            if (lastSeen.count(s[i]) && lastSeen[s[i]] >= start) {\n                start = lastSeen[s[i]] + 1;\n            }\n            lastSeen[s[i]] = i;\n            maxLen = max(maxLen, i - start + 1);\n        }\n        return maxLen;\n    }\n};`,
      link: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
      keyPoints: "Sliding window with last seen character index map. Time: O(N), Space: O(min(N, M)).",
      submittedAt: nowIso,
    },
    "Coin Change": {
      code: `class Solution {\npublic:\n    int coinChange(vector<int>& coins, int amount) {\n        vector<int> dp(amount + 1, amount + 1);\n        dp[0] = 0;\n        for (int i = 1; i <= amount; ++i) {\n            for (int c : coins) {\n                if (i - c >= 0) dp[i] = min(dp[i], dp[i - c] + 1);\n            }\n        }\n        return dp[amount] > amount ? -1 : dp[amount];\n    }\n};`,
      link: "https://leetcode.com/problems/coin-change/",
      keyPoints: "Bottom-up 1D DP. dp[i] = min coins to make value i. Time: O(N * amount), Space: O(amount).",
      submittedAt: nowIso,
    },
    "Number of Islands": {
      code: `class Solution {\npublic:\n    void dfs(vector<vector<char>>& grid, int r, int c) {\n        if (r < 0 || c < 0 || r >= grid.size() || c >= grid[0].size() || grid[r][c] != '1') return;\n        grid[r][c] = '0';\n        dfs(grid, r + 1, c); dfs(grid, r - 1, c);\n        dfs(grid, r, c + 1); dfs(grid, r, c - 1);\n    }\n    int numIslands(vector<vector<char>>& grid) {\n        int count = 0;\n        for (int r = 0; r < grid.size(); ++r) {\n            for (int c = 0; c < grid[0].size(); ++c) {\n                if (grid[r][c] == '1') {\n                    count++;\n                    dfs(grid, r, c);\n                }\n            }\n        }\n        return count;\n    }\n};`,
      link: "https://leetcode.com/problems/number-of-islands/",
      keyPoints: "Flood fill via 4-directional DFS. Sinks visited land to avoid extra memory. Time: O(M*N), Space: O(M*N).",
      submittedAt: nowIso,
    },
  };
}

// ─── Default 3-Star Coder Roadmap / Days ──────────────────────────────────────
function buildDefaultGuestDays(): Day[] {
  const today = todayIso();
  const startDate = addDays(today, -45); // Day 46 is Today
  const rawDays = seedDays(startDate, "core404");

  return rawDays.map((d) => {
    // 1. Past Days (Day 1 to 45) -> All completed
    if (d.date < today) {
      // Intentionally leave 1 problem uncompleted on Day 40 for a realistic Backlog tab
      if (d.dayNumber === 40) {
        return {
          ...d,
          status: "in_progress",
          checklist: d.checklist.map((c, idx) => ({ ...c, done: idx < 6 })),
          problems: d.problems.map((p, idx) => ({
            ...p,
            done: idx === 0,
            completedAt: idx === 0 ? `${d.date}T19:00:00Z` : undefined,
            forReview: idx === 1, // Flagged for review
          })),
          notes: "Need to re-visit time complexity for negative weights.",
        };
      }

      return {
        ...d,
        status: "completed",
        checklist: d.checklist.map((c) => ({ ...c, done: true })),
        problems: d.problems.map((p, idx) => ({
          ...p,
          done: true,
          completedAt: `${d.date}T18:${String(30 + idx * 10).padStart(2, "0")}:00Z`,
          // Flag a few landmark problems for the Review tab
          forReview: d.dayNumber === 10 || d.dayNumber === 22 || d.dayNumber === 35 || d.dayNumber === 44,
        })),
        notes: d.notes || `Completed all problems with optimal time complexity on ${d.date}.`,
      };
    }

    // 2. Today's Day (Day 46) -> 2 solved, 1 pending
    if (d.date === today) {
      return {
        ...d,
        status: "in_progress",
        topic: "Binary Trees & BST Essentials",
        subtopics: ["LCA in BST", "BST Validation", "Path Sum Algorithms"],
        checklist: d.checklist.map((c, idx) => ({ ...c, done: idx < 8 })),
        problems: d.problems.map((p, idx) => {
          if (idx === 0) {
            return {
              ...p,
              name: "Lowest Common Ancestor of a BST",
              difficulty: "Medium",
              platform: "LeetCode",
              link: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/",
              done: true,
              completedAt: `${today}T10:15:00Z`,
              forReview: true,
            };
          }
          if (idx === 1) {
            return {
              ...p,
              name: "Validate Binary Search Tree",
              difficulty: "Medium",
              platform: "LeetCode",
              link: "https://leetcode.com/problems/validate-binary-search-tree/",
              done: true,
              completedAt: `${today}T14:40:00Z`,
              forReview: true,
            };
          }
          return {
            ...p,
            name: "Binary Tree Maximum Path Sum",
            difficulty: "Hard",
            platform: "LeetCode",
            link: "https://leetcode.com/problems/binary-tree-maximum-path-sum/",
            done: false,
          };
        }),
        notes: "Key takeaway: In a BST, in-order traversal yields strictly ascending order. For Lowest Common Ancestor, when values diverge on left and right, the current node is the LCA split point!",
      };
    }

    // 3. Upcoming Future Days -> Pending
    return {
      ...d,
      status: "pending",
      checklist: d.checklist.map((c) => ({ ...c, done: false })),
      problems: d.problems.map((p) => ({ ...p, done: false })),
    };
  });
}

// ─── Default Guest Settings ───────────────────────────────────────────────────
function buildDefaultGuestSettings(): UserSettings {
  return {
    ...DEFAULT_SETTINGS,
    counts: {
      target: 3,
      tier: "balanced",
      easy: 2,
      medium: 1,
      hard: 0,
    },
    activeSheet: "core404",
    reminderTime: "20:00",
    morningReminderTime: "08:00",
    pushEnabled: false,
    emailEnabled: false,
    timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC",
    paused: false,
  };
}

// ─── Storage Synchronization Handlers ─────────────────────────────────────────
export function ensureGuestDataInitialized(force = false): void {
  if (typeof window === "undefined") return;

  if (force || !localStorage.getItem(GUEST_STORAGE_KEYS.PROFILE)) {
    const profile = buildDefaultGuestProfile();
    localStorage.setItem(GUEST_STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }

  if (force || !localStorage.getItem(GUEST_STORAGE_KEYS.SETTINGS)) {
    const settings = buildDefaultGuestSettings();
    localStorage.setItem(GUEST_STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  if (force || !localStorage.getItem(GUEST_STORAGE_KEYS.SUBMISSIONS)) {
    const submissions = buildDefaultGuestSubmissions();
    localStorage.setItem(GUEST_STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
    const completions = Object.keys(submissions);
    localStorage.setItem(GUEST_STORAGE_KEYS.COMPLETIONS, JSON.stringify(completions));
  }

  if (force || !localStorage.getItem(GUEST_STORAGE_KEYS.DAYS)) {
    const days = buildDefaultGuestDays();
    localStorage.setItem(GUEST_STORAGE_KEYS.DAYS, JSON.stringify(days));
  }
}

export function getGuestProfile(): Partial<UserProfile> {
  if (typeof window === "undefined") return buildDefaultGuestProfile();
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEYS.PROFILE);
    if (!raw) {
      const def = buildDefaultGuestProfile();
      localStorage.setItem(GUEST_STORAGE_KEYS.PROFILE, JSON.stringify(def));
      return def;
    }
    return JSON.parse(raw);
  } catch {
    return buildDefaultGuestProfile();
  }
}

export function saveGuestProfile(patch: Partial<UserProfile>): void {
  if (typeof window === "undefined") return;
  try {
    const current = getGuestProfile();
    const updated = { ...current, ...patch };
    localStorage.setItem(GUEST_STORAGE_KEYS.PROFILE, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save guest profile to localStorage:", e);
  }
}

export function getGuestPlan(): { days: Day[]; meta: PlanMeta; sheetId: string } {
  const today = todayIso();
  const startDate = addDays(today, -45);
  let days: Day[] = [];

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(GUEST_STORAGE_KEYS.DAYS);
      if (raw) {
        days = JSON.parse(raw);
      }
    } catch {}
  }

  if (!days || days.length === 0) {
    days = buildDefaultGuestDays();
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(GUEST_STORAGE_KEYS.DAYS, JSON.stringify(days));
      } catch {}
    }
  }

  return {
    days,
    meta: {
      startDate,
      lastActiveDate: today,
      lastSyncedAt: new Date().toISOString(),
    },
    sheetId: "core404",
  };
}

export function saveGuestPlan(days: Day[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUEST_STORAGE_KEYS.DAYS, JSON.stringify(days));
  } catch (e) {
    console.error("Failed to save guest plan to localStorage:", e);
  }
}

export function saveGuestDay(day: Day): void {
  if (typeof window === "undefined") return;
  try {
    const plan = getGuestPlan();
    const updated = plan.days.map((d) => (d.id === day.id || d.dayNumber === day.dayNumber ? day : d));
    saveGuestPlan(updated);
  } catch (e) {
    console.error("Failed to save guest day:", e);
  }
}

export function getGuestSettings(): UserSettings {
  if (typeof window === "undefined") return buildDefaultGuestSettings();
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEYS.SETTINGS);
    if (!raw) {
      const def = buildDefaultGuestSettings();
      localStorage.setItem(GUEST_STORAGE_KEYS.SETTINGS, JSON.stringify(def));
      return def;
    }
    return JSON.parse(raw);
  } catch {
    return buildDefaultGuestSettings();
  }
}

export function saveGuestSettings(patch: Partial<UserSettings>): void {
  if (typeof window === "undefined") return;
  try {
    const current = getGuestSettings();
    const updated = { ...current, ...patch };
    localStorage.setItem(GUEST_STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save guest settings:", e);
  }
}

export function getGuestCodeSubmissions(): Record<string, CodeSubmission> {
  if (typeof window === "undefined") return buildDefaultGuestSubmissions();
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEYS.SUBMISSIONS);
    if (!raw) {
      const def = buildDefaultGuestSubmissions();
      localStorage.setItem(GUEST_STORAGE_KEYS.SUBMISSIONS, JSON.stringify(def));
      return def;
    }
    return JSON.parse(raw);
  } catch {
    return buildDefaultGuestSubmissions();
  }
}

export function saveGuestCodeSubmission(problemName: string, sub: CodeSubmission): void {
  if (typeof window === "undefined") return;
  try {
    const subs = getGuestCodeSubmissions();
    subs[problemName] = sub;
    localStorage.setItem(GUEST_STORAGE_KEYS.SUBMISSIONS, JSON.stringify(subs));

    // Also update completions set
    const compSet = getGuestProblemCompletions();
    compSet.add(problemName);
    localStorage.setItem(GUEST_STORAGE_KEYS.COMPLETIONS, JSON.stringify(Array.from(compSet)));
  } catch (e) {
    console.error("Failed to save guest code submission:", e);
  }
}

export function removeGuestCodeSubmission(problemName: string): void {
  if (typeof window === "undefined") return;
  try {
    const subs = getGuestCodeSubmissions();
    delete subs[problemName];
    localStorage.setItem(GUEST_STORAGE_KEYS.SUBMISSIONS, JSON.stringify(subs));
  } catch (e) {}
}

export function getGuestProblemCompletions(): Set<string> {
  if (typeof window === "undefined") return new Set(Object.keys(buildDefaultGuestSubmissions()));
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEYS.COMPLETIONS);
    if (raw) {
      const arr = JSON.parse(raw);
      return new Set(Array.isArray(arr) ? arr : Object.keys(buildDefaultGuestSubmissions()));
    }
    const defKeys = Object.keys(buildDefaultGuestSubmissions());
    localStorage.setItem(GUEST_STORAGE_KEYS.COMPLETIONS, JSON.stringify(defKeys));
    return new Set(defKeys);
  } catch {
    return new Set(Object.keys(buildDefaultGuestSubmissions()));
  }
}

export function getGuestScheduleEvents(): ScheduleEventRow[] {
  const now = Date.now();
  return [
    {
      id: "guest-event-1",
      kind: "pace_rebalance",
      detail: "Daily pace calibrated to 3 problems/day (Moderate: 2 Easy, 1 Medium, 0 Hard).",
      createdAtIso: new Date(now - 14 * 86400000).toISOString(),
      snapshot: null,
      canRevert: false,
      isWithinWeek: false,
    },
    {
      id: "guest-event-2",
      kind: "topic_milestone",
      detail: "Completed curriculum section: Sliding Window & Two Pointers (100% solved).",
      createdAtIso: new Date(now - 8 * 86400000).toISOString(),
      snapshot: null,
      canRevert: false,
      isWithinWeek: false,
    },
    {
      id: "guest-event-3",
      kind: "streak_milestone",
      detail: "Achieved 40-Day Consistent Coding Streak milestone 🔥!",
      createdAtIso: new Date(now - 2 * 86400000).toISOString(),
      snapshot: null,
      canRevert: false,
      isWithinWeek: true,
    },
    {
      id: "guest-event-4",
      kind: "daily_progress",
      detail: "Solved 2 core problems for today: Lowest Common Ancestor & BST Validation.",
      createdAtIso: new Date(now - 3600000).toISOString(),
      snapshot: null,
      canRevert: false,
      isWithinWeek: true,
    },
  ];
}

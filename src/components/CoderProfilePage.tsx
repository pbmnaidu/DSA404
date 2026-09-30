"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { updateProfile } from "firebase/auth";
import { auth } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePlan } from "@/hooks/usePlan";
import { useProblemCompletions } from "@/hooks/useProblemCompletions";
import {
  loadOwnerProfile,
  saveUserProfile,
  saveAvatarBase64,
  saveBannerBase64,
  claimUsername,
  isUsernameAvailable,
  normalizeUsername,
  USERNAME_REGEX,
  type CodingProfiles,
  type CustomLink,
  type SocialLinkItem,
  type CompletedProblemSnapshot,
  type PublicStats,
  syncPublicSolvedProblems,
} from "@/lib/db";
import { todayIso } from "@/lib/plan";
import {
  LinkedInIcon,
  GitHubIcon,
  TwitterIcon,
  YouTubeIcon,
  getSocialIcon,
} from "@/components/SocialIcons";
import { ALL_PROBLEMS, getCanonicalProblemLink } from "@/lib/problems";
import { SubmissionHeatmap } from "@/components/SubmissionHeatmap";
import { GitHubContributionHeatmap, extractGitHubUsername, resolveGitHubUrl } from "@/components/GitHubContributionHeatmap";
import { getLocalGitHubSyncConfig } from "@/lib/github-sync";
import { UnifiedProfileDashboard } from "@/components/coding-profiles/UnifiedProfileDashboard";
import { BadgesGrid } from "@/components/BadgesGrid";
import { computeBadges, currentStreak } from "@/lib/gamification";
import { SolvedProblemsArchive } from "@/components/SolvedProblemsArchive";
import { CodeModal } from "@/components/CodeModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Camera,
  Check,
  CheckCircle2,
  Code2,
  ExternalLink,
  Flame,
  Globe,
  Image as ImageIcon,
  Pencil,
  Plus,
  RefreshCw,
  Share2,
  Trash2,
  UserCircle2,
  X,
  Mail,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
  Lock,
  FileText,
  Link2,
  Eye,
  Trophy,
} from "lucide-react";
import { extractHandleFromInput } from "@/lib/contest-platform-linker";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ── Platform metadata ────────────────────────────────────────────────────────
const PLATFORMS: {
  key: Exclude<keyof CodingProfiles, "customLinks" | "github">;
  label: string;
  placeholder: string;
  color: string;
  bgColor: string;
}[] = [
    { key: "leetcode", label: "LeetCode", placeholder: "https://leetcode.com/yourname", color: "#FFA116", bgColor: "rgba(255,161,22,0.12)" },
    { key: "codeforces", label: "Codeforces", placeholder: "https://codeforces.com/profile/yourname", color: "#1F8ACB", bgColor: "rgba(31,138,203,0.12)" },
    { key: "codechef", label: "CodeChef", placeholder: "https://www.codechef.com/users/yourname", color: "#5B4638", bgColor: "rgba(91,70,56,0.12)" },
    { key: "atcoder", label: "AtCoder", placeholder: "https://atcoder.jp/users/yourname", color: "#8BC4E8", bgColor: "rgba(139,196,232,0.12)" },
    { key: "hackerrank", label: "HackerRank", placeholder: "https://www.hackerrank.com/profile/yourname", color: "#00EA64", bgColor: "rgba(0,234,100,0.12)" },
    { key: "gfg", label: "GeeksforGeeks", placeholder: "https://www.geeksforgeeks.org/user/yourname", color: "#2F8D46", bgColor: "rgba(47,141,70,0.12)" },
  ];

// ── Image helpers ────────────────────────────────────────────────────────────
async function compressImageToDataUrl(file: File, maxPx = 128, quality = 0.5): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        const canvas = document.createElement("canvas");
        canvas.width = maxPx; canvas.height = maxPx;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, maxPx, maxPx);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

async function compressBannerToDataUrl(file: File, width = 1200, height = 360, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        // Cover-fit: preserve aspect ratio
        const scale = Math.max(width / img.width, height / img.height);
        const sw = width / scale, sh = height / scale;
        const sx = (img.width - sw) / 2, sy = (img.height - sh) / 2;
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Failed to load banner"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function ThemedTooltip({ hint, children }: { hint: string; children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs rounded-xl border border-white/15 bg-popover/95 backdrop-blur-md px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-2xl">
          {hint}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export function CoderProfilePage() {
  const { user } = useAuth();
  const { days, loading } = usePlan();
  const { completed: pbCompleted, submissions } = useProblemCompletions();

  // — Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // — Profile state
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [socialLinks, setSocialLinks] = useState<SocialLinkItem[]>([]);
  const [username, setUsername] = useState("");
  const [usernameDraft, setUsernameDraft] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [photoURL, setPhotoURL] = useState("");
  const [bannerURL, setBannerURL] = useState("");
  const [codingProfiles, setCodingProfiles] = useState<CodingProfiles>({});
  const [platformStats, setPlatformStats] = useState<Record<string, any>>({});
  const [firestoreCompletedProblems, setFirestoreCompletedProblems] = useState<CompletedProblemSnapshot[]>([]);
  const [publicStats, setPublicStats] = useState<PublicStats | null>(null);
  const [editingProfiles, setEditingProfiles] = useState(false);
  const [draftProfiles, setDraftProfiles] = useState<CodingProfiles>({});
  const [draftCustomLinks, setDraftCustomLinks] = useState<CustomLink[]>([]);
  const [copied, setCopied] = useState(false);
  const [selectedProblemForModal, setSelectedProblemForModal] = useState<string | null>(null);

  // — Edit Details section toggle & Gmail modal state
  const [showEditDetails, setShowEditDetails] = useState(false);
  const [profileEmail, setProfileEmail] = useState("");
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [gmailInput, setGmailInput] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  // Custom social link draft in Edit form
  const [customSocialPlatform, setCustomSocialPlatform] = useState("");
  const [customSocialUrl, setCustomSocialUrl] = useState("");

  const currentEmail = profileEmail || user?.email || "";

  // — Load profile
  useEffect(() => {
    if (!user || !user.uid) {
      setLoadingProfile(false);
      setPhotoURL("");
      setBannerURL("");
      return;
    }
    const localAvatar = localStorage.getItem(`local_avatar_url_${user.uid}`);
    const localBanner = localStorage.getItem(`local_banner_url_${user.uid}`);
    if (localAvatar) setPhotoURL(localAvatar);
    if (localBanner) setBannerURL(localBanner);

    setLoadingProfile(true);
    loadOwnerProfile(user.uid)
      .then((p) => {
        setDisplayName(p.displayName ?? user.displayName ?? "");
        setBio(p.bio ?? "");
        setAboutMe(p.aboutMe ?? "");
        setNotes(p.notes ?? "");
        setLinkedin(p.linkedin ?? "");
        setGithub(p.github ?? (p.socialLinks?.find((s) => s.platform.toLowerCase() === "github")?.url ?? ""));
        setPortfolio(p.portfolio ?? "");
        setSocialLinks(p.socialLinks ?? []);
        setUsername(p.username ?? "");
        setUsernameDraft(p.username ?? "");
        if (p.email) {
          setProfileEmail(p.email);
        } else if (user.email) {
          setProfileEmail(user.email);
        }
        if (p.platformStats) setPlatformStats(p.platformStats);
        if (p.completedProblems && Array.isArray(p.completedProblems)) {
          setFirestoreCompletedProblems(p.completedProblems);
        }
        if (p.publicStats) {
          setPublicStats(p.publicStats);
        }
        // Auto-fill from the Google account photo the first time there's no
        // avatar saved yet (no Firestore photoURL and nothing cached
        // locally/uploaded above) — never overrides a photo the user chose.
        if (p.photoURL) {
          setPhotoURL(p.photoURL);
        } else if (!localAvatar && user.photoURL) {
          setPhotoURL(user.photoURL);
          saveUserProfile(user.uid, { photoURL: user.photoURL }).catch(() => { });
        }
        if (p.bannerURL) setBannerURL(p.bannerURL);
        setCodingProfiles(p.codingProfiles ?? {});
        setDraftProfiles(p.codingProfiles ?? {});
        setDraftCustomLinks(p.codingProfiles?.customLinks ?? []);
      })
      .finally(() => setLoadingProfile(false));
  }, [user?.uid, user?.email]);

  // If user has no email linked when visiting profile, prompt them
  useEffect(() => {
    if (!loadingProfile && user && !currentEmail) {
      setGmailInput("");
      setIsEmailModalOpen(true);
    }
  }, [loadingProfile, user, currentEmail]);

  const handleSaveGmail = async () => {
    if (!user) return;
    const trimmed = gmailInput.trim().toLowerCase();
    const GMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    if (!GMAIL_REGEX.test(trimmed)) {
      toast.error("Invalid Gmail address", {
        description: "Please enter a valid Gmail address ending with @gmail.com",
      });
      return;
    }

    setSavingEmail(true);
    try {
      await saveUserProfile(user.uid, { email: trimmed });
      setProfileEmail(trimmed);
      setIsEmailModalOpen(false);
      toast.success("Gmail address saved! 🎉", {
        description: `Linked ${trimmed} to your account.`,
      });
    } catch (err) {
      toast.error("Failed to save Gmail address", {
        description: "Please try again.",
      });
    } finally {
      setSavingEmail(false);
    }
  };

  // — Live username availability check as the user edits their handle.
  // Idle whenever the draft matches what's already saved — no need to
  // re-check a username you already own.
  useEffect(() => {
    const raw = usernameDraft.trim();
    if (!raw || normalizeUsername(raw) === username) {
      setUsernameStatus("idle");
      return;
    }
    const u = normalizeUsername(raw);
    if (!USERNAME_REGEX.test(u)) {
      setUsernameStatus("invalid");
      return;
    }
    setUsernameStatus("checking");
    const t = setTimeout(async () => {
      try {
        const available = await isUsernameAvailable(u);
        setUsernameStatus(available ? "available" : "taken");
      } catch {
        setUsernameStatus("idle");
      }
    }, 450);
    return () => clearTimeout(t);
  }, [usernameDraft, username]);

  const saveUsername = useCallback(async () => {
    if (!user) return;
    const u = normalizeUsername(usernameDraft);
    if (u === username) return;
    if (!USERNAME_REGEX.test(u)) {
      setUsernameStatus("invalid");
      toast.error("Invalid handle format", { description: "3-20 characters: lowercase letters, numbers, - or _ only." });
      return;
    }
    setUsernameSaving(true);
    try {
      await claimUsername(user.uid, u);
      setUsername(u);
      setUsernameDraft(u);
      setUsernameStatus("idle");
      toast.success("Username updated!", { description: `Your public profile is live at /profile/${u}` });
    } catch (err) {
      if (err instanceof Error && err.message === "USERNAME_TAKEN") {
        setUsernameStatus("taken");
        toast.error("That username is already taken — try another.");
      } else if (err instanceof Error && err.message === "USERNAME_INVALID") {
        setUsernameStatus("invalid");
        toast.error("Invalid handle format", { description: "3-20 characters: lowercase letters, numbers, - or _ only." });
      } else {
        // Do NOT silently write `username` onto the profile doc here — that
        // was the actual cause of the /profile/{username} 404 bug: it made
        // the profile claim a username without ever creating the
        // usernames/{username} -> uid index doc that public URL resolution
        // depends on. Surface the failure instead so the user can retry.
        toast.error("Couldn't claim username", {
          description: (err as Error).message || "Please try again — your public link wasn't updated.",
        });
      }
    } finally {
      setUsernameSaving(false);
    }
  }, [user, usernameDraft, username]);

  // — Computed stats
  const streakCount = useMemo(() => currentStreak(days), [days]);
  const badges = useMemo(() => computeBadges(days), [days]);

  const completedProblems = useMemo<CompletedProblemSnapshot[]>(() => {
    const seen = new Set<string>();
    const list: CompletedProblemSnapshot[] = [];
    const today = todayIso();
    for (const day of days) {
      for (const p of day.problems) {
        if (p.done && !seen.has(p.name)) {
          seen.add(p.name);
          const sub = submissions[p.name];
          const platLink = getCanonicalProblemLink(p.name) || p.link || "";
          const rawPlat = p.platform || "DSA";
          const normPlat = (rawPlat === "GFG" || rawPlat.toLowerCase().includes("geeks")) ? "GeeksforGeeks" : rawPlat;
          const completedAt = p.completedAt?.slice(0, 10) || sub?.submittedAt?.slice(0, 10) || day.date || today;
          const submittedAt = sub?.submittedAt || p.completedAt || new Date().toISOString();
          list.push({
            name: p.name,
            platform: normPlat,
            difficulty: p.difficulty || "Medium",
            link: platLink,
            completedAt,
            submittedAt,
            topic: day.topic,
            section: day.section,
            ...(sub ? { code: sub.code, submissionLink: sub.link || platLink, keyPoints: sub.keyPoints } : {}),
          });
        }
      }
    }
    for (const fp of ALL_PROBLEMS) {
      if (pbCompleted.has(fp.name) && !seen.has(fp.name)) {
        seen.add(fp.name);
        const sub = submissions[fp.name];
        const platLink = getCanonicalProblemLink(fp.name) || fp.link || "";
        const rawPlat = fp.platform || "DSA";
        const normPlat = (rawPlat === "GFG" || rawPlat.toLowerCase().includes("geeks")) ? "GeeksforGeeks" : rawPlat;
        const completedAt = sub?.submittedAt?.slice(0, 10) || today;
        const submittedAt = sub?.submittedAt || new Date().toISOString();
        list.push({
          name: fp.name,
          platform: normPlat,
          difficulty: fp.difficulty || "Medium",
          link: platLink,
          completedAt,
          submittedAt,
          topic: fp.topic,
          section: fp.sheet,
          ...(sub ? { code: sub.code, submissionLink: sub.link || platLink, keyPoints: sub.keyPoints } : {}),
        });
      }
    }
    // Also include any submissions that were submitted on Problems tab or CodeModal
    for (const [probName, sub] of Object.entries(submissions ?? {})) {
      if (!probName || seen.has(probName)) continue;
      seen.add(probName);
      const platLink = getCanonicalProblemLink(probName) || sub.link || "";
      const rawPlat = (sub as any).platform || "DSA";
      const normPlat = (rawPlat === "GFG" || rawPlat.toLowerCase().includes("geeks")) ? "GeeksforGeeks" : rawPlat;
      const completedAt = sub.submittedAt?.slice(0, 10) || today;
      const submittedAt = sub.submittedAt || new Date().toISOString();
      list.push({
        name: probName,
        platform: normPlat,
        difficulty: ((sub as any).difficulty || "Medium") as any,
        link: platLink,
        completedAt,
        submittedAt,
        topic: (sub as any).topic || "Problems",
        section: (sub as any).section || "Problems Tab",
        ...(sub.code ? { code: sub.code, submissionLink: sub.link || platLink, keyPoints: sub.keyPoints } : {}),
      });
    }
    // Include Firestore completedProblems snapshots
    for (const fp of firestoreCompletedProblems) {
      if (!fp?.name || seen.has(fp.name)) continue;
      seen.add(fp.name);
      const sub = submissions[fp.name];
      const platLink = fp.link || getCanonicalProblemLink(fp.name) || sub?.link || "";
      const rawPlat = fp.platform || "DSA";
      const normPlat = (rawPlat === "GFG" || rawPlat.toLowerCase().includes("geeks")) ? "GeeksforGeeks" : rawPlat;
      const completedAt = fp.completedAt || sub?.submittedAt?.slice(0, 10) || today;
      const submittedAt = fp.submittedAt || sub?.submittedAt || new Date().toISOString();
      list.push({
        name: fp.name,
        platform: normPlat,
        difficulty: (fp.difficulty || "Medium") as any,
        link: platLink,
        completedAt,
        submittedAt,
        topic: fp.topic || (fp as any).sheet || "DSA Sheet",
        section: fp.section || "Core Problems",
        ...(fp.code || sub?.code ? { code: fp.code || sub?.code, submissionLink: fp.submissionLink || sub?.link || platLink, keyPoints: fp.keyPoints || sub?.keyPoints } : {}),
      });
    }
    // Fallback: check local storage completed problems for user
    if (typeof window !== "undefined" && user?.uid) {
      try {
        const localCompRaw = localStorage.getItem(`dsa_completed_problems_${user.uid}`);
        if (localCompRaw) {
          const compArr = JSON.parse(localCompRaw);
          if (Array.isArray(compArr)) {
            for (const name of compArr) {
              if (name && !seen.has(name)) {
                seen.add(name);
                const sub = submissions[name];
                const platLink = getCanonicalProblemLink(name) || "";
                list.push({
                  name,
                  platform: "DSA",
                  difficulty: "Medium",
                  link: platLink,
                  completedAt: sub?.submittedAt?.slice(0, 10) || today,
                  submittedAt: sub?.submittedAt || new Date().toISOString(),
                  topic: "DSA Sheet",
                  section: "Core Problems",
                  ...(sub ? { code: sub.code, submissionLink: sub.link || platLink, keyPoints: sub.keyPoints } : {}),
                });
              }
            }
          }
        }
      } catch { }
    }
    return list;
  }, [days, pbCompleted, submissions, user?.uid, firestoreCompletedProblems]);

  // Auto-sync solved problems to world-readable userDoc in the background
  useEffect(() => {
    if (user?.uid && completedProblems.length > 0) {
      void syncPublicSolvedProblems(user.uid, days, pbCompleted, submissions);
    }
  }, [user?.uid, completedProblems.length, days, pbCompleted, submissions]);

  const { heatmapData, detailMap } = useMemo(() => {
    const dateMap = new Map<string, any[]>();
    for (const day of days) {
      const doneProbs = day.problems.filter((p) => p.done);
      for (const p of doneProbs) {
        const dateStr = p.completedAt || day.date;
        const sub = submissions[p.name];
        const platLink = getCanonicalProblemLink(p.name) || p.link || "";
        const item = {
          ...p,
          submissionLink: sub?.link || (p as any).submissionLink || platLink || undefined,
          code: sub?.code || (p as any).code || undefined,
          keyPoints: sub?.keyPoints || (p as any).keyPoints || undefined,
        };
        const existing = dateMap.get(dateStr) ?? [];
        dateMap.set(dateStr, [...existing, item]);
      }
    }
    for (const [probName, sub] of Object.entries(submissions)) {
      if (sub.submittedAt) {
        const dateStr = sub.submittedAt.slice(0, 10);
        const existing = dateMap.get(dateStr) ?? [];
        if (!existing.some((p) => p.name === probName)) {
          const platLink = getCanonicalProblemLink(probName) || "";
          dateMap.set(dateStr, [
            ...existing,
            {
              name: probName,
              done: true,
              platform: "Problems Tab",
              submissionLink: sub.link || platLink || undefined,
              code: sub.code || undefined,
              keyPoints: sub.keyPoints || undefined,
            },
          ]);
        }
      }
    }
    const hData: { date: string; solved: number }[] = [];
    const dMap: Record<string, any[]> = {};
    dateMap.forEach((probs, dateStr) => { hData.push({ date: dateStr, solved: probs.length }); dMap[dateStr] = probs; });
    for (const day of days) {
      if (!day.skipped && !dateMap.has(day.date)) hData.push({ date: day.date, solved: 0 });
    }
    return { heatmapData: hData, detailMap: dMap };
  }, [days, submissions]);

  const stats = useMemo(() => {
    const byPlatform: Record<string, number> = {};
    for (const p of completedProblems) {
      // Exclude GitHub: Git contributions/commits are not solved coding problems
      if (p.platform?.toLowerCase() === "github") continue;
      const plat = (p.platform === "GFG" || p.platform?.toLowerCase().includes("geeks")) ? "GeeksforGeeks" : (p.platform || "DSA");
      byPlatform[plat] = (byPlatform[plat] ?? 0) + 1;
    }

    // Include external connected platforms from platformStats (LeetCode, GFG, Codeforces, CodeChef, HackerRank, etc.)
    // Explicitly exclude GitHub: contributions/commits are displayed in the contribution heatmap, not solved problems
    let externalPlatformsTotal = 0;
    if (platformStats && typeof platformStats === "object") {
      for (const [rawKey, prof] of Object.entries(platformStats)) {
        const lk = rawKey.toLowerCase();
        if (lk === "github" || lk === "linkedin") continue;
        if (prof && typeof prof === "object" && typeof prof.totalSolved === "number" && prof.totalSolved > 0) {
          const normKey =
            lk === "leetcode"
              ? "LeetCode"
              : lk === "gfg" || lk.includes("geeks")
              ? "GeeksforGeeks"
              : lk === "codeforces"
              ? "Codeforces"
              : lk === "codechef"
              ? "CodeChef"
              : lk === "hackerrank"
              ? "HackerRank"
              : lk === "atcoder"
              ? "AtCoder"
              : rawKey;

          externalPlatformsTotal += prof.totalSolved;
          byPlatform[normKey] = Math.max(byPlatform[normKey] ?? 0, prof.totalSolved);
        }
      }
    }

    // Merge with publicStats.byPlatform if recorded higher
    if (publicStats?.byPlatform) {
      for (const [k, v] of Object.entries(publicStats.byPlatform)) {
        if (k.toLowerCase() === "github" || k.toLowerCase() === "linkedin") continue;
        if (typeof v === "number" && v > 0) {
          const lk = k.toLowerCase();
          const normKey =
            lk === "leetcode"
              ? "LeetCode"
              : lk === "gfg" || lk.includes("geeks")
              ? "GeeksforGeeks"
              : lk === "codeforces"
              ? "Codeforces"
              : lk === "codechef"
              ? "CodeChef"
              : lk === "hackerrank"
              ? "HackerRank"
              : lk === "atcoder"
              ? "AtCoder"
              : k;
          byPlatform[normKey] = Math.max(byPlatform[normKey] ?? 0, v);
        }
      }
    }
    delete byPlatform["GitHub"];
    delete byPlatform["github"];

    const heatmapSubmissionsTotal = heatmapData.reduce((acc, d) => acc + (d.solved > 0 ? d.solved : 0), 0);
    const trackerProblemsCount = completedProblems.filter((p) => p.platform?.toLowerCase() !== "github").length;
    const trackerTotal = Math.max(trackerProblemsCount, heatmapSubmissionsTotal);

    const platformsSum = Object.values(byPlatform).reduce((acc, count) => acc + count, 0);
    const grandTotal = Math.max(platformsSum, trackerTotal);

    if (platformsSum < trackerTotal) {
      byPlatform["DSA"] = (byPlatform["DSA"] ?? 0) + (trackerTotal - platformsSum);
    }

    return {
      total: grandTotal,
      trackerTotal,
      externalTotal: externalPlatformsTotal,
      byPlatform,
    };
  }, [completedProblems, platformStats, heatmapData, publicStats]);

  // Auto-extract GitHub username/handle and profile URL from all available sources
  const effectiveGithubRaw = useMemo(() => {
    if (github && github.trim()) return github.trim();
    const fromSocial = socialLinks.find((s) => s.platform.toLowerCase() === "github")?.url;
    if (fromSocial && fromSocial.trim()) return fromSocial.trim();
    if (codingProfiles.github && codingProfiles.github.trim()) return codingProfiles.github.trim();
    if (typeof window !== "undefined" && user?.uid) {
      try {
        const syncCfg = getLocalGitHubSyncConfig(user.uid);
        if (syncCfg?.owner && syncCfg.owner.trim()) return syncCfg.owner.trim();
      } catch { }
    }
    if (username && username.trim()) return username.trim();
    return "";
  }, [github, socialLinks, codingProfiles, user?.uid, username]);

  const effectiveGithubUsername = useMemo(() => {
    return extractGitHubUsername(effectiveGithubRaw) || effectiveGithubRaw.replace(/^@+/, "");
  }, [effectiveGithubRaw]);

  const githubProfileUrl = useMemo(() => {
    return resolveGitHubUrl(effectiveGithubRaw);
  }, [effectiveGithubRaw]);

  const githubUsername = effectiveGithubUsername;

  // — Handlers
  const handleAvatarChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingAvatar(true);
    try {
      const dataUrl = await compressImageToDataUrl(file);
      setPhotoURL(dataUrl);
      if (typeof window !== "undefined" && user?.uid) localStorage.setItem(`local_avatar_url_${user.uid}`, dataUrl);
      if (user) await saveAvatarBase64(user.uid, dataUrl).catch(() => { });
      toast.success("Profile picture updated!");
    } catch (err) { toast.error("Upload failed", { description: (err as Error).message }); }
    finally { setUploadingAvatar(false); e.target.value = ""; }
  }, [user]);

  const handleBannerChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingBanner(true);
    try {
      const dataUrl = await compressBannerToDataUrl(file);
      setBannerURL(dataUrl);
      if (typeof window !== "undefined" && user?.uid) localStorage.setItem(`local_banner_url_${user.uid}`, dataUrl);
      if (user) await saveBannerBase64(user.uid, dataUrl).catch(() => { });
      toast.success("Banner updated!");
    } catch (err) { toast.error("Banner upload failed", { description: (err as Error).message }); }
    finally { setUploadingBanner(false); e.target.value = ""; }
  }, [user]);

  const saveBasicInfo = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    try {
      let finalUsername = username;
      const normDraft = normalizeUsername(usernameDraft);
      if (normDraft && normDraft !== username) {
        if (!USERNAME_REGEX.test(normDraft)) {
          toast.error("Invalid username handle", { description: "Must be 3-20 characters: lowercase letters, numbers, - or _ only." });
          setSaving(false);
          return;
        }
        try {
          await claimUsername(user.uid, normDraft);
          finalUsername = normDraft;
          setUsername(normDraft);
          setUsernameDraft(normDraft);
          setUsernameStatus("idle");
        } catch (uErr) {
          if (uErr instanceof Error && uErr.message === "USERNAME_TAKEN") {
            setUsernameStatus("taken");
            toast.error("Username already taken", { description: "Please choose a different handle." });
            setSaving(false);
            return;
          } else {
            // Do NOT silently write the username onto the profile doc here.
            // That skips creating the usernames/{username} -> uid index doc
            // that public URL resolution depends on, which is exactly what
            // caused /profile/{username} links to 404 while looking
            // "saved". Stop the whole save and surface the real error.
            toast.error("Couldn't claim username", {
              description: (uErr as Error).message || "Please try again — nothing was saved.",
            });
            setSaving(false);
            return;
          }
        }
      }

      const cleanedDraftProfiles: CodingProfiles = { ...draftProfiles };
      for (const [key, val] of Object.entries(cleanedDraftProfiles)) {
        if (typeof val === "string" && val.trim()) {
          const cleanVal = extractHandleFromInput(key as any, val);
          (cleanedDraftProfiles as any)[key] = cleanVal || val.trim();
        }
      }

      const mergedCodingProfiles: CodingProfiles = {
        ...codingProfiles,
        ...cleanedDraftProfiles,
        customLinks: draftCustomLinks,
      };
      // Ensure github is not kept in codingProfiles (it has its own top-level field)
      delete (mergedCodingProfiles as any).github;

      await updateProfile(auth.currentUser!, { displayName });
      await saveUserProfile(user.uid, {
        displayName,
        bio,
        aboutMe,
        notes,
        linkedin: linkedin.trim(),
        github: github.trim(),
        portfolio: portfolio.trim(),
        socialLinks,
        codingProfiles: mergedCodingProfiles,
        username: finalUsername,
        email: currentEmail || undefined,
        publicStats: { totalSolved: stats.total, byPlatform: stats.byPlatform, lastUpdated: new Date().toISOString() },
        completedProblems,
      });

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("dsa_coding_profiles_v2", JSON.stringify(mergedCodingProfiles));
          localStorage.setItem(`dsa_coding_profiles_${user.uid}`, JSON.stringify(mergedCodingProfiles));
          window.dispatchEvent(
            new CustomEvent("ldt_coding_profiles_updated", {
              detail: { codingProfiles: mergedCodingProfiles },
            })
          );
        } catch {}
      }
      setCodingProfiles(mergedCodingProfiles);
      toast.success("Profile details & contest links saved! 🎉");
    } catch (err) {
      toast.error("Save failed", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }, [user, displayName, bio, aboutMe, notes, linkedin, github, portfolio, socialLinks, draftProfiles, draftCustomLinks, codingProfiles, usernameDraft, username, currentEmail, stats, completedProblems]);

  const handleSaveNotes = useCallback(async () => {
    if (!user) return;
    setSavingNotes(true);
    try {
      await saveUserProfile(user.uid, { notes });
      toast.success("Personal notes saved! 🔒", {
        description: "Stored securely in your private workspace.",
      });
    } catch (err) {
      toast.error("Failed to save notes", { description: (err as Error).message });
    } finally {
      setSavingNotes(false);
    }
  }, [user, notes]);

  const saveCodingProfiles = useCallback(async () => {
    if (!user) return; setSaving(true);
    try {
      const cleaned: CodingProfiles = { ...draftProfiles };
      for (const [key, val] of Object.entries(cleaned)) {
        if (typeof val === "string" && val.trim()) {
          const cleanVal = extractHandleFromInput(key as any, val);
          (cleaned as any)[key] = cleanVal || val.trim();
        }
      }
      delete (cleaned as any).github;
      const merged: CodingProfiles = { ...cleaned, customLinks: draftCustomLinks };
      await saveUserProfile(user.uid, { codingProfiles: merged });
      setCodingProfiles(merged); setEditingProfiles(false);
      toast.success("Coding profiles saved!");
    } catch (err) { toast.error("Save failed", { description: (err as Error).message }); }
    finally { setSaving(false); }
  }, [user, draftProfiles, draftCustomLinks]);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/profile/${username || user?.uid}` : "";
  const copyShareLink = useCallback(async () => {
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2500); toast.success("Link copied!"); }
    catch { toast.error("Could not copy link"); }
  }, [shareUrl]);

  const userNameDisplay = displayName || user?.displayName || user?.email?.split("@")[0] || "Coder";
  const initials = userNameDisplay[0]?.toUpperCase() ?? "C";

  // Check if we are in Edit Mode
  const isEditing = showEditDetails;

  if (loading || loadingProfile) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 space-y-8 animate-pulse">
        <div className="h-64 w-full rounded-2xl bg-muted/50 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div className="h-48 w-full rounded-2xl bg-muted/50 animate-pulse" />
            <div className="h-32 w-full rounded-2xl bg-muted/50 animate-pulse" />
          </div>
          <div className="lg:col-span-8 space-y-6">
            <div className="h-32 w-full rounded-2xl bg-muted/50 animate-pulse" />
            <div className="h-64 w-full rounded-2xl bg-muted/50 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto pb-24 pt-6 px-4 md:px-8 animate-fade-in space-y-8">
      
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
      <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />

      {/* ── EDIT PROFILE MODAL (STRUCTURAL SHIFT TO MODAL) ── */}
      <Dialog open={showEditDetails} onOpenChange={setShowEditDetails}>
        <DialogContent className="max-w-4xl border-border bg-card p-0 shadow-2xl overflow-hidden rounded-2xl flex flex-col max-h-[90vh]">
          <DialogHeader className="p-6 border-b border-border bg-muted/30">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Pencil className="size-5 text-primary" /> Edit Profile Settings
            </DialogTitle>
            <DialogDescription>
              Customize your public identity, connect platforms, and update your handle.
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto p-6 space-y-8 bg-background">
            
            {/* Visual Assets Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Camera className="size-4" /> Avatar
                </Label>
                <div className="flex items-center gap-4">
                  <div className="size-16 rounded-full overflow-hidden border border-border shrink-0 bg-muted flex items-center justify-center">
                    {photoURL ? <img src={photoURL} alt="avatar" className="size-full object-cover" /> : <span className="font-bold text-xl">{initials}</span>}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}>
                    {uploadingAvatar ? "Uploading..." : "Change Avatar"}
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ImageIcon className="size-4" /> Cover Banner
                </Label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-32 rounded-xl overflow-hidden border border-border shrink-0 relative bg-muted cursor-pointer" onClick={() => bannerInputRef.current?.click()}>
                    {bannerURL ? <img src={bannerURL} alt="banner" className="absolute inset-0 size-full object-cover" /> : <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20" />}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => bannerInputRef.current?.click()} disabled={uploadingBanner}>
                    {uploadingBanner ? "Uploading..." : "Change Banner"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-border pt-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Display Name</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-secondary/50 border-border" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Target Role / Short Bio</Label>
                <Input value={bio} onChange={(e) => setBio(e.target.value)} placeholder="SDE Aspirant" className="bg-secondary/50 border-border" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between">
                  <span>About Me (Public Showcase)</span>
                </Label>
                <Textarea value={aboutMe} onChange={(e) => setAboutMe(e.target.value)} rows={3} className="bg-secondary/50 border-border resize-none" />
              </div>
            </div>

            {/* Account & Handle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-border pt-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Mail className="size-3.5" /> Linked Email
                </Label>
                <div className="flex items-center gap-2">
                  <Input value={currentEmail || "No Email"} readOnly className="bg-secondary/50 border-border text-muted-foreground font-mono" />
                  <Button variant="outline" size="sm" onClick={() => { setIsEmailModalOpen(true); setShowEditDetails(false); }}>
                    Update
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Public Handle</span>
                  {usernameStatus === "available" && <span className="text-emerald-500 text-[10px] normal-case">Available</span>}
                  {usernameStatus === "taken" && <span className="text-red-500 text-[10px] normal-case">Taken</span>}
                </Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={usernameDraft} 
                    onChange={(e) => setUsernameDraft(e.target.value)} 
                    className={cn("bg-secondary/50 font-mono", usernameStatus === "taken" && "border-red-500")}
                  />
                  <Button 
                    variant={usernameStatus === "available" ? "default" : "secondary"}
                    size="sm"
                    onClick={saveUsername}
                    disabled={usernameSaving || normalizeUsername(usernameDraft) === username || usernameStatus === "taken"}
                  >
                    Claim
                  </Button>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="border-t border-border pt-6 space-y-4">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Social & Links</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="GitHub URL" className="bg-secondary/50" />
                <Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="LinkedIn URL" className="bg-secondary/50" />
                <Input value={portfolio} onChange={(e) => setPortfolio(e.target.value)} placeholder="Portfolio URL" className="bg-secondary/50" />
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {socialLinks.map((s, idx) => (
                  <Badge key={idx} variant="secondary" className="px-3 py-1 flex items-center gap-2">
                    {s.platform}: <span className="font-mono text-xs truncate max-w-[100px]">{s.url}</span>
                    <button onClick={() => setSocialLinks(p => p.filter(x => x !== s))} className="hover:text-red-400"><X className="size-3" /></button>
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input value={customSocialPlatform} onChange={(e) => setCustomSocialPlatform(e.target.value)} placeholder="Platform (e.g. YouTube)" className="w-48 bg-secondary/50" />
                <Input value={customSocialUrl} onChange={(e) => setCustomSocialUrl(e.target.value)} placeholder="URL" className="flex-1 bg-secondary/50" />
                <Button size="sm" variant="outline" onClick={() => {
                  if (customSocialPlatform && customSocialUrl) {
                    setSocialLinks(p => [...p, { platform: customSocialPlatform.trim(), url: customSocialUrl.trim() }]);
                    setCustomSocialPlatform(""); setCustomSocialUrl("");
                  }
                }}>Add</Button>
              </div>
            </div>

            {/* Platform Identifiers */}
            <div className="border-t border-border pt-6 space-y-4">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Contest Platform Integration</span>
                <span className="text-[10px] normal-case bg-amber-500/10 text-amber-500 px-2 rounded-full py-0.5">⚡ Auto-syncs</span>
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PLATFORMS.map((plat) => (
                  <div key={plat.key} className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold text-foreground/80">{plat.label}</span>
                    <Input 
                      value={draftProfiles[plat.key] || ""} 
                      onChange={(e) => setDraftProfiles(p => ({ ...p, [plat.key]: e.target.value }))}
                      placeholder={plat.placeholder}
                      className="bg-secondary/50 h-9 font-mono text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>

          </div>

          <DialogFooter className="p-4 border-t border-border bg-card">
            <Button variant="ghost" onClick={() => setShowEditDetails(false)}>Cancel</Button>
            <Button onClick={saveBasicInfo} disabled={saving} className="px-6 font-bold">
              {saving ? <RefreshCw className="size-4 animate-spin mr-2" /> : <Check className="size-4 mr-2" />}
              Save All Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* ── NEW HERO COMPOSITION (EDITORIAL) ── */}
      <section className="relative rounded-3xl overflow-hidden border border-border bg-card shadow-sm group">
        <div className="h-48 md:h-64 w-full relative bg-muted">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent" />
          {bannerURL && <img src={bannerURL} alt="banner" className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay" />}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
        </div>

        <div className="relative px-6 md:px-10 pb-8 -mt-20 md:-mt-24 flex flex-col md:flex-row items-end gap-6 md:gap-8">
          {/* Avatar */}
          <div className="size-32 md:size-40 rounded-[2rem] border-4 border-card shadow-xl overflow-hidden shrink-0 bg-secondary flex items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-300">
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
                  {userNameDisplay}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  {username && <span className="font-mono text-primary font-bold">@{username}</span>}
                  <span className="text-muted-foreground font-medium">{bio || "Software Engineer Aspirant"}</span>
                </div>
              </div>
              
              <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
                <Button variant="secondary" className="min-h-10 flex-1 gap-2 rounded-xl font-semibold whitespace-nowrap md:flex-none" onClick={() => setShowEditDetails(true)}>
                  <Pencil className="size-4" /> Edit Profile
                </Button>
                <Button variant="outline" className="min-h-10 flex-1 gap-2 rounded-xl whitespace-nowrap md:flex-none" onClick={copyShareLink}>
                  <Share2 className="size-4" /> Share
                </Button>
              </div>
            </div>
            
            {/* Link Rail */}
            <div className="flex flex-wrap items-center gap-3 mt-4">
              {githubProfileUrl && (
                <a href={githubProfileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors bg-secondary/50 px-3 py-1.5 rounded-lg border border-border">
                  <GitHubIcon className="size-3.5" /> GitHub <ExternalLink className="size-3 opacity-50" />
                </a>
              )}
              {linkedin && (
                <a href={linkedin.startsWith("http") ? linkedin : `https://linkedin.com/in/${linkedin}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors bg-secondary/50 px-3 py-1.5 rounded-lg border border-border">
                  <LinkedInIcon className="size-3.5" /> LinkedIn <ExternalLink className="size-3 opacity-50" />
                </a>
              )}
              {portfolio && (
                <a href={portfolio.startsWith("http") ? portfolio : `https://${portfolio}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors bg-secondary/50 px-3 py-1.5 rounded-lg border border-border">
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
          <main className="lg:col-span-8 space-y-8 min-w-0 order-2 lg:order-1">
            
            {/* Unified Platform Profiles (Full Width of Primary Column) */}
            <div className="rounded-3xl border border-border bg-card p-4 shadow-sm overflow-hidden sm:p-6 lg:p-8">
              <UnifiedProfileDashboard
                initialProfiles={codingProfiles as Record<string, string>}
                initialStats={platformStats}
                userId={user?.uid}
                onSaveProfiles={async (updated) => {
                  setCodingProfiles(updated);
                  setDraftProfiles((prev) => ({ ...prev, ...updated }));
                  if (typeof window !== "undefined") {
                    try {
                      localStorage.setItem("dsa_coding_profiles_v2", JSON.stringify(updated));
                      if (user?.uid) {
                        localStorage.setItem("dsa_coding_profiles_" + user.uid, JSON.stringify(updated));
                      }
                      window.dispatchEvent(
                        new CustomEvent("ldt_coding_profiles_updated", {
                          detail: { codingProfiles: updated },
                        })
                      );
                    } catch {}
                  }
                  if (user) {
                    saveUserProfile(user.uid, { codingProfiles: updated }).catch(console.error);
                  }
                }}
              />
            </div>

            {/* Solved Days Heatmap */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm overflow-hidden">
              <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
                Learning Consistency
              </h3>
              <p className="text-xs text-muted-foreground mb-6">Your daily problem-solving activity across the platform.</p>
              <div className="max-w-full overflow-x-auto pb-2">
                <SubmissionHeatmap data={heatmapData} detailMap={detailMap} />
              </div>
            </div>

            {/* GitHub Heatmap */}
            {githubUsername && (
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm overflow-hidden">
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
            <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
              <SolvedProblemsArchive completedProblems={completedProblems} isProfileTheme={true} />
            </div>

          </main>

          {/* SECONDARY COLUMN: Summary & Narrative */}
          <aside className="lg:col-span-4 space-y-6 order-1 lg:order-2">
            
            {/* Top Line Stats Stack */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-3xl border border-border bg-card p-5 shadow-sm flex flex-col justify-center">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Total Solved</span>
                <span className="text-3xl font-display font-black text-primary mt-1">{stats.total}</span>
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
                  {Object.entries(stats.byPlatform).sort((a,b) => b[1] - a[1]).map(([plat, num]) => (
                    <div key={plat} className="flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 rounded-lg">
                      <span className="size-1.5 rounded-full bg-primary/50" />
                      <span className="text-xs font-semibold">{plat}</span>
                      <span className="text-xs text-muted-foreground font-mono">{num}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* About Me */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <UserCircle2 className="size-4 text-primary" /> Story & Trajectory
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowEditDetails(true)} className="h-6 px-2 text-xs">
                  <Pencil className="size-3 mr-1" /> Edit
                </Button>
              </div>
              
              {aboutMe ? (
                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{aboutMe}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No public biography provided.</p>
              )}
              {socialLinks.length > 0 && (
                <div className="mt-6 pt-4 border-t border-border/50">
                  <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-3">Other Links</h4>
                  <div className="flex flex-wrap gap-2">
                    {socialLinks.map((s, i) => (
                      <a key={i} href={s.url} target="_blank" rel="noreferrer" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                        {s.platform} <ExternalLink className="size-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Personal Notes (Private) */}
            <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Lock className="size-24 text-amber-500" />
              </div>
              <div className="relative">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-2">
                  <Lock className="size-4" /> Private Notes
                </h3>
                <p className="text-[11px] text-muted-foreground mb-4">Visible only to you. Use for interview prep or reminders.</p>
                
                <Textarea 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Draft your thoughts here..."
                  rows={4}
                  className="bg-background/80 border-amber-500/20 resize-none font-mono text-xs mb-3 shadow-inner text-amber-900 dark:text-amber-100"
                />
                <Button size="sm" onClick={handleSaveNotes} disabled={savingNotes} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold">
                  {savingNotes ? "Saving..." : "Secure Save"}
                </Button>
              </div>
            </div>

            {/* Badges Mini-View */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Trophy className="size-4 text-emerald-500" /> Achievements
              </h3>
              <BadgesGrid badges={badges} />
            </div>

          </aside>
        </div>
      {/* Gmail Requirement Modal */}
      <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
        <DialogContent className="max-w-md border-border bg-card rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="size-5 text-primary" /> Valid Email Required
            </DialogTitle>
            <DialogDescription>
              Link your active Gmail account for notifications and secure recovery.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-primary/10 text-primary p-3 rounded-xl text-sm">
              Please enter an address ending in @gmail.com.
            </div>
            <Input 
              value={gmailInput} 
              onChange={e => setGmailInput(e.target.value)} 
              placeholder="you@gmail.com" 
              className="bg-background border-border"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEmailModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveGmail} disabled={savingEmail || !gmailInput.includes("@gmail.com")}>
              {savingEmail ? "Saving..." : "Save Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

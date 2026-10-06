import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "./useAuth";
import {
 loadProblemCompletions,
 loadCodeSubmissions,
 saveCodeSubmission,
 removeCodeSubmission,
 type CodeSubmission,
} from "@/lib/db";
import { getCanonicalProblemLink } from "@/lib/problems";
import { getLocalGitHubSyncConfig, pushProblemSolutionToGitHub } from "@/lib/github-sync";
import { createClient } from "@/integrations/supabase/client";

function getLocalSubmissionsKey(uid: string) {
 return `dsa_code_submissions_${uid}`;
}

function getLocalCompletionsKey(uid: string) {
 return `dsa_completed_problems_${uid}`;
}

function getLocalSubmissions(uid: string): Record<string, CodeSubmission> {
 if (typeof window === "undefined" || !uid) return {};
 try {
 const raw = localStorage.getItem(getLocalSubmissionsKey(uid));
 return raw ? JSON.parse(raw) : {};
 } catch {
 return {};
 }
}

function getLocalCompletions(uid: string): Set<string> {
 if (typeof window === "undefined" || !uid) return new Set();
 try {
 const raw = localStorage.getItem(getLocalCompletionsKey(uid));
 return raw ? new Set(JSON.parse(raw)) : new Set();
 } catch {
 return new Set();
 }
}

export function useProblemCompletions() {
 const { user } = useAuth();
 const uid = user?.uid ?? "";

 const [completed, setCompleted] = useState<Set<string>>(() => (uid ? getLocalCompletions(uid) : new Set()));
 const [submissions, setSubmissions] = useState<Record<string, CodeSubmission>>(() => (uid ? getLocalSubmissions(uid) : {}));
 const [loading, setLoading] = useState(true);

 // Load on mount / user change — strictly scoped to active user ID
 useEffect(() => {
 let isMounted = true;

 if (!user || !user.uid) {
 setSubmissions({});
 setCompleted(new Set());
 setLoading(false);
 return;
 }

 const currentUid = user.uid;
 setLoading(true);

 const localSubs = getLocalSubmissions(currentUid);
 const localComp = getLocalCompletions(currentUid);

 // Set user-scoped local state immediately
 setSubmissions(localSubs);
 setCompleted(localComp);

 const fetchCompletions = () => {
  Promise.all([loadProblemCompletions(currentUid), loadCodeSubmissions(currentUid)])
  .then(([set, subMap]) => {
  if (!isMounted) return;
  const mergedSubs = { ...localSubs, ...subMap };
  for (const [probName, subObj] of Object.entries(mergedSubs) as [string, CodeSubmission][]) {
  if (!subObj.link || !subObj.link.trim()) {
  const canonical = getCanonicalProblemLink(probName);
  if (canonical) subObj.link = canonical;
  }
  }
  const mergedComp = new Set([
  ...Array.from(localComp),
  ...Array.from(set).map(s => typeof s === 'string' ? s : (s as any).name),
  ...Object.keys(mergedSubs),
  ]);
  if (typeof window !== "undefined") {
  try {
  localStorage.setItem(getLocalCompletionsKey(currentUid), JSON.stringify(Array.from(mergedComp)));
  localStorage.setItem(getLocalSubmissionsKey(currentUid), JSON.stringify(mergedSubs));
  } catch {}
  }
  setCompleted(mergedComp);
  setSubmissions(mergedSubs);
  })
  .catch((e) => {
  console.warn("Failed to load problem completions from Firestore:", e);
  })
  .finally(() => {
  if (isMounted) setLoading(false);
  });
  };

  fetchCompletions();

  const onFocus = () => {
    if (document.visibilityState === 'visible') {
      fetchCompletions();
    }
  };
  window.addEventListener('visibilitychange', onFocus);
  window.addEventListener('focus', onFocus);

  const supabase = createClient();
  const channelId = `profiles_${currentUid}_${Math.random().toString(36).substring(7)}`;
  const channel = supabase
    .channel(channelId)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${currentUid}` },
      () => {
        fetchCompletions();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'code_submissions', filter: `user_id=eq.${currentUid}` },
      () => {
        fetchCompletions();
      }
    )
    .subscribe();

  return () => {
  isMounted = false;
  window.removeEventListener('visibilitychange', onFocus);
  window.removeEventListener('focus', onFocus);
  supabase.removeChannel(channel);
  };
  }, [user]);

 /** Submit code for a problem, marking it completed and persisting locally and in DB. */
 const submitCode = useCallback(
 async (
 name: string,
 code: string,
 link: string = "",
 keyPoints: string = "",
 topic?: string,
 dayNumber?: number,
 section?: string,
 difficulty?: string,
 platform?: string,
 ) => {
 if (!user) return;
 const currentUid = user.uid || user.id || null;
 if (!currentUid) return;

 const effectiveLink = link.trim() || getCanonicalProblemLink(name) || "";
 const effectivePlatform = platform?.trim() || "Unknown";

 const sub: CodeSubmission = {
 code,
 link: effectiveLink,
 platform: effectivePlatform,
 ...(keyPoints ? { keyPoints } : {}),
 submittedAt: new Date().toISOString(),
 };

 setSubmissions((prev) => {
 const next = { ...prev, [name]: sub };
 if (typeof window !== "undefined") {
 localStorage.setItem(getLocalSubmissionsKey(currentUid), JSON.stringify(next));
 }
 return next;
 });

 setCompleted((prev) => {
 const next = new Set(prev);
 next.add(name);
 if (typeof window !== "undefined") {
 localStorage.setItem(getLocalCompletionsKey(currentUid), JSON.stringify(Array.from(next)));
 }
 return next;
 });

 // Persist to Supabase — using the correct field names from the CodeSubmission shape.
 // sub.url / sub.date / sub.notes were wrong references that caused silent undefined saves.
 await saveCodeSubmission(
 currentUid,
 {
 name,
 platform: effectivePlatform,
 difficulty: difficulty || "Unknown",
 link: effectiveLink,
 code: sub.code,
 submissionLink: sub.link,
 keyPoints: sub.keyPoints,
 topic,
 section,
 },
 sub.submittedAt,
 ).catch(() => {
 toast.error("Saved on this device, but couldn't sync to your account. Check your connection.");
 });

 // Auto-push solution .txt to GitHub if configured
 const ghConfig = getLocalGitHubSyncConfig(currentUid);
 if (ghConfig?.enabled && ghConfig?.repo && code.trim()) {
 pushProblemSolutionToGitHub(ghConfig, {
 problemName: name,
 code,
 keyPoints,
 link: effectiveLink,
 topic,
 dayNumber,
 section,
 difficulty,
 })
 .then((res) => {
 if (res.success) {
 toast.success("Solution pushed to GitHub! 🐙", {
 description: `Created ${res.filePath} in ${ghConfig.owner}/${ghConfig.repo}`,
 action: res.fileUrl
 ? { label: "View on GitHub", onClick: () => window.open(res.fileUrl, "_blank") }
 : undefined,
 });
 } else {
 toast.warning("Saved code, but GitHub push failed", {
 description: res.error,
 });
 }
 })
 .catch((err) => {
 console.warn("GitHub auto-push error:", err);
 });
 }
 },
 [user, completed],
 );

 /** Remove code submission for a problem, unmarking it as completed. */
 const removeCode = useCallback(
 async (name: string) => {
 if (!user) return;
 const currentUid = user.uid || user.id || null;
 if (!currentUid) return;

 // Capture platform from local submission map before clearing it
 const storedPlatform = submissions[name]?.platform || "Unknown";

 setSubmissions((prev) => {
 const next = { ...prev };
 delete next[name];
 if (typeof window !== "undefined") {
 localStorage.setItem(getLocalSubmissionsKey(currentUid), JSON.stringify(next));
 }
 return next;
 });

 setCompleted((prev) => {
 const next = new Set(prev);
 next.delete(name);
 if (typeof window !== "undefined") {
 localStorage.setItem(getLocalCompletionsKey(currentUid), JSON.stringify(Array.from(next)));
 }
 return next;
 });

 await removeCodeSubmission(currentUid, { name, platform: storedPlatform }).catch(() => {
 toast.error("Removed on this device, but couldn't sync the change to your account.");
 });
 },
 [user, submissions, completed],
 );

 return { completed, submissions, loading, submitCode, removeCode };
}

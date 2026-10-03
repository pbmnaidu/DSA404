export interface TopicReminder {
  id: string;
  topic: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  note?: string;
  createdAt: number;
  triggered?: boolean;
}

const LOCAL_STORAGE_KEY = "dsa:topic_reminders";

export async function fetchTopicReminders(uid?: string | null): Promise<TopicReminder[]> {
  if (typeof window !== "undefined") {
    const rawLocal = localStorage.getItem(LOCAL_STORAGE_KEY);
    return rawLocal ? JSON.parse(rawLocal) : [];
  }
  return [];
}

export async function addTopicReminder(
  uid: string | undefined | null,
  reminder: Omit<TopicReminder, "id" | "createdAt" | "triggered">
): Promise<TopicReminder> {
  const newId = `rem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const item: TopicReminder = {
    ...reminder,
    id: newId,
    createdAt: Date.now(),
    triggered: false,
  };

  if (typeof window !== "undefined") {
    const rawLocal = localStorage.getItem(LOCAL_STORAGE_KEY);
    const list: TopicReminder[] = rawLocal ? JSON.parse(rawLocal) : [];
    const updated = [...list, item];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  }

  return item;
}

export async function removeTopicReminder(uid: string | undefined | null, id: string): Promise<void> {
  if (typeof window !== "undefined") {
    const rawLocal = localStorage.getItem(LOCAL_STORAGE_KEY);
    const list: TopicReminder[] = rawLocal ? JSON.parse(rawLocal) : [];
    const updated = list.filter((r) => r.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  }
}

export async function markTopicReminderTriggered(uid: string | undefined | null, id: string): Promise<void> {
  if (typeof window !== "undefined") {
    const rawLocal = localStorage.getItem(LOCAL_STORAGE_KEY);
    const list: TopicReminder[] = rawLocal ? JSON.parse(rawLocal) : [];
    const updated = list.map((r) => (r.id === id ? { ...r, triggered: true } : r));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  }
}

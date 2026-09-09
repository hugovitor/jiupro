const STORAGE_KEY = "jiupro.guide.v1";
const OPEN_EVENT = "jiupro:open-guide";

type GuideRecord = { done: boolean };

function readAll(): Record<string, GuideRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, GuideRecord>) : {};
  } catch {
    return {};
  }
}

function writeAll(next: Record<string, GuideRecord>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function firstLoginKey(academyId: string, userId: string) {
  return `${academyId}:${userId}`;
}

export function isFirstLoginDone(academyId: string, userId: string) {
  return Boolean(readAll()[firstLoginKey(academyId, userId)]?.done);
}

export function markFirstLoginDone(academyId: string, userId: string) {
  const all = readAll();
  all[firstLoginKey(academyId, userId)] = { done: true };
  writeAll(all);
}

export function shouldAutoOpenFirstLogin(input: {
  isDemo: boolean;
  role: string;
  studentCount: number;
  hasPix: boolean;
}) {
  if (input.isDemo) return false;
  if (input.role === "owner") return input.studentCount === 0 || !input.hasPix;
  return true;
}

export function openFirstLoginGuide() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function onOpenFirstLoginGuide(handler: () => void) {
  window.addEventListener(OPEN_EVENT, handler);
  return () => window.removeEventListener(OPEN_EVENT, handler);
}

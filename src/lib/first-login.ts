const STORAGE_KEY = "jiupro.guide.v1";
const OPEN_EVENT = "jiupro:open-guide";
const SKIP_VISIT_KEY = "jiupro.guide.skip.v1";

type GuideRecord = { done: boolean };

export type FirstLoginIdentity = {
  userId: string;
  email?: string;
  academyId?: string;
};

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
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* private mode / quota */
  }
}

function identityKeys(identity: FirstLoginIdentity) {
  const keys: string[] = [];
  const email = identity.email?.trim().toLowerCase();
  if (email) keys.push(`email:${email}`);
  if (identity.userId) keys.push(`user:${identity.userId}`);
  if (identity.academyId && identity.userId) {
    keys.push(firstLoginKey(identity.academyId, identity.userId));
  }
  return keys;
}

export function firstLoginKey(academyId: string, userId: string) {
  return `${academyId}:${userId}`;
}

export function isFirstLoginDone(identity: FirstLoginIdentity) {
  const all = readAll();
  return identityKeys(identity).some((key) => Boolean(all[key]?.done));
}

export function markFirstLoginDone(identity: FirstLoginIdentity) {
  const all = readAll();
  for (const key of identityKeys(identity)) {
    all[key] = { done: true };
  }
  writeAll(all);
}

export function skipFirstLoginThisVisit() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SKIP_VISIT_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function isFirstLoginSkippedThisVisit() {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(SKIP_VISIT_KEY) === "1";
  } catch {
    return false;
  }
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

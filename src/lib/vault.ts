import { createSeed, DEMO_ACADEMY_ID } from "./seed";
import type { AppState, Session } from "./types";

export const VAULT_KEY = "jiupro.vault.v1";
export const LEGACY_STATE_KEY = "jiupro.demo.v1";
export const SESSION_KEY = "jiupro.session.v1";

export type Vault = {
  version: 7;
  activeId: string;
  session: Session | null;
  credentials: Record<string, string>;
  academies: Record<string, AppState>;
};

let vault: Vault | null = null;

export function stripSession(state: AppState): AppState {
  return { ...state, session: null };
}

function migrateState(state: AppState): AppState {
  return {
    ...state,
    version: 7,
    academy: {
      ...state.academy,
      pixKey: state.academy.pixKey || "",
      pixName: state.academy.pixName || state.academy.name,
      dropInFee: state.academy.dropInFee || 40,
      joinCode: state.academy.joinCode || "",
    },
    evaluations: state.evaluations ?? [],
    events: state.events ?? [],
    sales: state.sales ?? [],
    dropIns: state.dropIns ?? [],
    students: (state.students ?? []).map((s) => ({
      ...s,
      cpf: s.cpf ?? "",
    })),
    attendance: (state.attendance ?? []).map((a) => ({
      ...a,
      status: a.status ?? "validated",
    })),
    payments: (state.payments ?? []).map((p) => ({
      ...p,
      asaasPaymentId: p.asaasPaymentId,
      asaasInvoiceUrl: p.asaasInvoiceUrl,
      asaasPixCopy: p.asaasPixCopy,
      asaasStatus: p.asaasStatus,
    })),
  };
}

function emptyVault(): Vault {
  return {
    version: 7,
    activeId: DEMO_ACADEMY_ID,
    session: createSeed().session,
    credentials: {},
    academies: { [DEMO_ACADEMY_ID]: stripSession(createSeed()) },
  };
}

function readVault(): Vault {
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Vault;
      if (!parsed.academies[DEMO_ACADEMY_ID]) {
        parsed.academies[DEMO_ACADEMY_ID] = stripSession(createSeed());
      }
      parsed.credentials = parsed.credentials ?? {};
      parsed.version = 7;
      return parsed;
    }
  } catch {
    /* fall through */
  }

  const next = emptyVault();
  try {
    const raw = localStorage.getItem(LEGACY_STATE_KEY);
    if (raw) {
      const parsed = migrateState(JSON.parse(raw) as AppState);
      const id = parsed.academy?.id || DEMO_ACADEMY_ID;
      next.academies[id] = stripSession(parsed);
      next.activeId = id;
      next.session = parsed.session ?? next.session;
    }
    const extra = localStorage.getItem(SESSION_KEY);
    if (extra) next.session = JSON.parse(extra) as Session;
  } catch {
    /* keep empty vault */
  }
  return next;
}

export function getVault(): Vault {
  if (!vault) vault = readVault();
  return vault;
}

export function saveVault() {
  if (!vault || typeof window === "undefined") return;
  try {
    localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
    if (vault.session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(vault.session));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    /* quota */
  }
}

export function activeState(): AppState {
  const v = getVault();
  const row =
    v.academies[v.activeId] ??
    v.academies[DEMO_ACADEMY_ID] ??
    stripSession(createSeed());
  return migrateState({ ...row, session: v.session });
}

export function writeActive(next: AppState) {
  const v = getVault();
  v.session = next.session;
  v.activeId = next.academy.id;
  v.academies[next.academy.id] = stripSession(migrateState(next));
  saveVault();
}

export function resetDemoAcademy() {
  const v = getVault();
  const seed = createSeed();
  v.academies[DEMO_ACADEMY_ID] = stripSession(seed);
  v.activeId = DEMO_ACADEMY_ID;
  v.session = seed.session;
  saveVault();
  return activeState();
}

export function switchAcademy(academyId: string, session: Session) {
  const v = getVault();
  if (!v.academies[academyId]) return null;
  v.activeId = academyId;
  v.session = session;
  saveVault();
  return activeState();
}

export function putAcademy(state: AppState, password?: string, previousId?: string) {
  const v = getVault();
  if (previousId && previousId !== state.academy.id) {
    delete v.academies[previousId];
  }
  v.academies[state.academy.id] = stripSession(state);
  v.activeId = state.academy.id;
  v.session = state.session;
  if (password) {
    const email = state.users
      .find((u) => u.id === state.session?.userId)
      ?.email.toLowerCase();
    if (email) v.credentials[email] = password;
  }
  saveVault();
}

export function passwordFor(email: string) {
  return getVault().credentials[email.trim().toLowerCase()];
}

export function findAcademyByJoinCode(code: string) {
  const needle = code.trim();
  if (!needle) return null;
  const upper = needle.toUpperCase();
  const lower = needle.toLowerCase();
  const v = getVault();
  for (const state of Object.values(v.academies)) {
    const join = (state.academy.joinCode ?? "").toUpperCase();
    const slug = state.academy.slug.toLowerCase();
    if (join === upper || slug === lower) return state;
  }
  return null;
}

export function findUserAcrossAcademies(email: string) {
  const v = getVault();
  const needle = email.trim().toLowerCase();
  for (const state of Object.values(v.academies)) {
    const user = state.users.find((u) => u.email.toLowerCase() === needle);
    if (user) return { state, user };
  }
  return null;
}

export function emailTaken(email: string) {
  return Boolean(findUserAcrossAcademies(email));
}

export function takenSlugs() {
  return Object.values(getVault().academies).map((s) => s.academy.slug);
}

export function checkPassword(email: string, password: string) {
  const v = getVault();
  return v.credentials[email.trim().toLowerCase()] === password;
}

export function hasLocalPassword(email: string) {
  return Boolean(getVault().credentials[email.trim().toLowerCase()]);
}

export function rememberPassword(email: string, password: string) {
  getVault().credentials[email.trim().toLowerCase()] = password;
  saveVault();
}

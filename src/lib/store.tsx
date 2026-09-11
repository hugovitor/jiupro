"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { nextGraduation } from "./belts";
import { createEmptyAcademy, uniqueSlug } from "./empty-academy";
import { currentMonth, isoDate, uid, weekdayToday } from "./format";
import { createSeed, DEMO_ACADEMY_ID, DEMO_ACCOUNTS } from "./seed";
import {
  attachLocalAcademy,
  createAcademyForCurrentUser,
  joinStudentRemote,
  pullAcademyState,
  pushAcademyState,
  registerRemoteAcademy,
  scheduleRemotePush,
  signInRemote,
} from "./supabase/sync";
import { createSupabaseBrowserClient } from "./supabase/client";
import { ensureBrowserAuthSession } from "./supabase/session";
import { isOperatorEmail } from "./operator";
import { ensureUuidState, rehomeAcademy } from "./supabase/mapper";
import { isSupabaseConfigured } from "./supabase/config";
import {
  activeState,
  checkPassword,
  emailTaken,
  eraseAcademy,
  findAcademyByJoinCode,
  findUserAcrossAcademies,
  hasLocalPassword,
  passwordFor,
  putAcademy,
  rememberPassword,
  resetDemoAcademy,
  switchAcademy,
  takenSlugs,
  writeActive,
} from "./vault";
import { attendanceStatus, classHeadcount, isOnRoster, isValidated, studentCanSelfCheckIn } from "./attendance";
import { academyPortability } from "./lgpd";
import { canAddStudent, studentCapMessage } from "./plan-access";
import {
  attendanceDay,
  canonicalStudent,
  classesShareSlot,
  mergeAcademyState,
  studentAliasIds,
} from "./roster-identity";
import type {
  AcademyEvent,
  AppState,
  Attendance,
  ClassSession,
  Evaluation,
  Expense,
  ExpenseCategory,
  InventoryItem,
  Payment,
  PlanId,
  Post,
  Role,
  Sale,
  DropIn,
  Student,
} from "./types";

export type LoginResult =
  | { ok: true; role: Role; academyId?: string; resumed?: boolean }
  | { ok: false; error: string };

export type SyncResult =
  | { ok: true }
  | { ok: false; error: string };

export type RegisterInput = {
  ownerName: string;
  academyName: string;
  city: string;
  state?: string;
  email: string;
  password: string;
  phone?: string;
  plan: PlanId;
};

type Store = AppState & {
  ready: boolean;
  hydrated: boolean;
  isDemo: boolean;
  login: (email: string, password?: string) => Promise<LoginResult>;
  logout: () => void;
  resetDemo: () => void;
  registerAcademy: (input: RegisterInput) => Promise<LoginResult>;
  registerStudent: (input: {
    code: string;
    slug?: string;
    houseName?: string;
    name: string;
    phone: string;
    email: string;
    password: string;
  }) => Promise<LoginResult>;
  syncNow: () => Promise<SyncResult>;
  pullNow: () => Promise<SyncResult>;
  addStudent: (input: Omit<Student, "id" | "academyId" | "userId" | "avatarHue">) => boolean;
  updateStudent: (id: string, patch: Partial<Student>) => void;
  recordPayment: (studentId: string, month: string, method: Payment["method"]) => void;
  checkIn: (studentId: string, classId: string, method?: Attendance["method"]) => boolean;
  checkInMany: (
    studentIds: string[],
    classId: string,
    method?: Attendance["method"],
  ) => number;
  checkOut: (studentId: string, classId: string) => void;
  validateCheckIn: (studentId: string, classId: string) => boolean;
  markNoShow: (studentId: string, classId: string) => boolean;
  validatePending: (classId: string) => number;
  cancelCheckIn: (studentId: string, classId: string) => Promise<{ ok: boolean; error?: string }>;
  promote: (studentId: string, notes: string) => void;
  addStripe: (studentId: string) => void;
  adjustStock: (id: string, delta: number) => void;
  addInventory: (item: Omit<InventoryItem, "id" | "academyId">) => void;
  addPost: (content: string) => void;
  toggleLike: (postId: string) => void;
  changePlan: (plan: PlanId) => void;
  lastAttendance: (studentId: string) => Attendance | undefined;
  attendanceCount: (studentId: string, days?: number) => number;
  overdueFor: (studentId: string) => Payment[];
  todayClasses: () => AppState["classes"];
  updateAcademy: (patch: Partial<AppState["academy"]>) => void;
  exportAcademyData: () => Record<string, unknown>;
  eraseAcademyLocally: () => void;
  removeStudent: (id: string) => void;
  addClass: (input: Omit<ClassSession, "id" | "academyId">) => void;
  updateClass: (id: string, patch: Partial<Omit<ClassSession, "id" | "academyId">>) => void;
  removeClass: (id: string) => void;
  addEvaluation: (input: Omit<Evaluation, "id" | "academyId">) => void;
  confirmClass: (studentId: string, classId: string) => Promise<{ ok: boolean; error?: string }>;
  republishPendingCheckIns: () => Promise<void>;
  generateMonthCharges: (month: string) => number;
  addExpense: (input: {
    description: string;
    category: ExpenseCategory;
    amount: number;
    date: string;
  }) => void;
  waivePayment: (id: string) => void;
  attachAsaasCharge: (
    paymentId: string,
    data: {
      studentId: string;
      asaasPaymentId: string;
      asaasInvoiceUrl?: string;
      asaasPixCopy?: string;
      asaasStatus?: string;
      asaasCustomerId?: string;
    },
  ) => void;
  applyAsaasPaid: (asaasPaymentId: string) => void;
  addEvent: (
    input: Omit<AcademyEvent, "id" | "academyId" | "goingIds"> & {
      goingIds?: string[];
    },
  ) => void;
  toggleRsvp: (eventId: string, studentId: string) => void;
  removeEvent: (id: string) => void;
  sellItem: (
    studentId: string,
    itemId: string,
    quantity: number,
    method: Sale["method"],
  ) => boolean;
  addDropIn: (input: Omit<DropIn, "id" | "academyId">) => void;
};

const StoreContext = createContext<Store | null>(null);

const listeners = new Set<() => void>();
let cached: AppState | null = null;
let clientReady = false;
let pushCancel: (() => void) | undefined;
let writeEpoch = 0;

function persist(state: AppState): AppState {
  const next =
    state.academy.id === DEMO_ACADEMY_ID ? state : ensureUuidState(state);
  writeActive(next);
  writeEpoch += 1;
  pushCancel?.();
  pushCancel = scheduleRemotePush(next);
  return next;
}

function flushRemotePush() {
  if (typeof window === "undefined") return;
  pushCancel?.();
  pushCancel = undefined;
  const state = cached;
  if (!state || state.academy.id === DEMO_ACADEMY_ID) return;
  void pushAcademyState(state);
}

async function retractStudentCheckIn(session: ClassSession): Promise<{ ok: boolean; error?: string }> {
  const client = createSupabaseBrowserClient();
  if (!client) {
    return { ok: false, error: "O banco da academia não está ligado." };
  }
  const token = await ensureBrowserAuthSession(client);
  if (!token) {
    return { ok: false, error: "Entre de novo para sair da lista." };
  }
  try {
    const res = await fetch("/api/aluno/presenca", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        classId: session.id,
        weekday: session.weekday,
        startTime: session.startTime,
        name: session.name,
        division: session.division,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!res.ok) {
      return { ok: false, error: data.error || "Não deu para sair da lista agora." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Sem conexão. Tente de novo." };
  }
}

async function publishOwnerAttendance(input: {
  studentId: string;
  classId: string;
  action: "validate" | "no_show";
}) {
  const client = createSupabaseBrowserClient();
  if (!client) return;
  const token = await ensureBrowserAuthSession(client);
  if (!token) return;
  await fetch("/api/academia/presenca", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  }).catch(() => undefined);
}

function classAliasIds(classes: ClassSession[], classId: string) {
  const cls = classes.find((item) => item.id === classId);
  const ids = new Set<string>([classId]);
  if (!cls) return ids;
  for (const item of classes) {
    if (classesShareSlot(item, cls)) ids.add(item.id);
  }
  return ids;
}

async function publishStudentCheckIn(session: ClassSession): Promise<{
  ok: boolean;
  error?: string;
  studentId?: string;
  classId?: string;
  attendanceId?: string;
}> {
  const client = createSupabaseBrowserClient();
  if (!client) {
    return { ok: false, error: "O banco da academia não está ligado." };
  }
  const token = await ensureBrowserAuthSession(client);
  if (!token) {
    return { ok: false, error: "Entre de novo para confirmar a aula." };
  }
  try {
    const res = await fetch("/api/aluno/presenca", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        classId: session.id,
        weekday: session.weekday,
        startTime: session.startTime,
        name: session.name,
        division: session.division,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      studentId?: string;
      classId?: string;
      attendanceId?: string;
    };
    if (!res.ok || data.ok === false) {
      return {
        ok: false,
        error: data.error || "Não deu para confirmar agora. Tente de novo.",
      };
    }
    return {
      ok: true,
      studentId: data.studentId,
      classId: data.classId,
      attendanceId: data.attendanceId,
    };
  } catch {
    return { ok: false, error: "Sem conexão. Tente de novo." };
  }
}

function load(): AppState {
  return activeState();
}

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): AppState {
  if (!clientReady) return getServerSnapshot();
  if (!cached) cached = load();
  return cached;
}

let serverCached: AppState | null = null;
function getServerSnapshot(): AppState {
  if (!serverCached) serverCached = createSeed();
  return serverCached;
}

function write(next: AppState) {
  const out = clientReady ? persist(next) : next;
  cached = out;
  emit();
}

function commit(updater: (prev: AppState) => AppState) {
  write(updater(getSnapshot()));
}

export function peekSession() {
  if (typeof window === "undefined") return null;
  return getSnapshot().session;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [hydrated, setHydrated] = useState(false);

  useLayoutEffect(() => {
    clientReady = true;
    cached = load();
    emit();
    setHydrated(true);
  }, []);

  const login = useCallback(async (email: string, password?: string): Promise<LoginResult> => {
    const needle = email.trim().toLowerCase();
    const demo = DEMO_ACCOUNTS.find((a) => a.email === needle);
    if (demo) {
      if (password && password !== demo.password) {
        return { ok: false, error: "Senha incorreta." };
      }
      const demoState = switchAcademy(DEMO_ACADEMY_ID, {
        userId:
          demo.role === "owner"
            ? "u_carla"
            : demo.role === "instructor"
              ? "u_rafael"
              : "u_joao",
        academyId: DEMO_ACADEMY_ID,
        role: demo.role,
      });
      if (!demoState) return { ok: false, error: "Demo indisponível." };
      write(demoState);
      return { ok: true, role: demo.role, academyId: demoState.academy.id };
    }

    const local = findUserAcrossAcademies(needle);

    if (password && isSupabaseConfigured()) {
      const remote = await signInRemote(needle, password);
      if (!("error" in remote && remote.error === "offline")) {
        if ("missingProfile" in remote && remote.missingProfile) {
          if (local && local.state.academy.id !== DEMO_ACADEMY_ID) {
            const attached = await attachLocalAcademy({
              email: needle,
              password,
              state: local.state,
            });
            if (!attached.error && attached.state) {
              rememberPassword(needle, password);
              putAcademy(attached.state, password);
              write(attached.state);
              return {
                ok: true,
                role: attached.state.session?.role ?? "owner",
                academyId: attached.state.academy.id,
              };
            }
          }

          if (isOperatorEmail(needle)) {
            const ownerName =
              local?.state.users.find((user) => user.role === "owner")?.name || "Hugo Vitor";
            const created = await createAcademyForCurrentUser({
              name: local?.state.academy.name || "Academia",
              slug: local?.state.academy.slug || "academia",
              city: local?.state.academy.city || "Brasil",
              state: local?.state.academy.state || "SP",
              plan: local?.state.academy.plan || "academia",
              ownerName,
            });
            if (created.academyId) {
              const pulled = await pullAcademyState({
                userId: remote.userId,
                academyId: created.academyId,
                role: "owner",
              });
              if (!("error" in pulled)) {
                rememberPassword(needle, password);
                putAcademy(pulled, password);
                write(pulled);
                return { ok: true, role: "owner", academyId: pulled.academy.id };
              }
            }
          }

          return {
            ok: false,
            error: "Conta confirmada, mas a academia ainda não foi criada. Cadastre de novo.",
          };
        }
        if ("session" in remote && remote.session) {
          const pulled = await pullAcademyState(remote.session);
          if (!("error" in pulled)) {
            rememberPassword(needle, password);
            putAcademy(pulled, password);
            write(pulled);
            return {
              ok: true,
              role: remote.session.role,
              academyId: pulled.academy.id,
            };
          }
          if (!local) {
            return { ok: false, error: pulled.error };
          }
        }
      }
    }

    if (local) {
      if (!password || !checkPassword(needle, password)) {
        return { ok: false, error: "E-mail ou senha incorretos." };
      }
      const next = switchAcademy(local.state.academy.id, {
        userId: local.user.id,
        academyId: local.user.academyId,
        role: local.user.role,
      });
      if (!next) return { ok: false, error: "Academia não encontrada." };
      write(next);
      return { ok: true, role: local.user.role, academyId: next.academy.id };
    }

    return { ok: false, error: "Conta não encontrada." };
  }, []);

  const logout = useCallback(() => {
    commit((prev) => ({ ...prev, session: null }));
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("jiupro.operator.jwt");
    }
    void createSupabaseBrowserClient()?.auth.signOut();
  }, []);

  const resetDemo = useCallback(() => {
    write(resetDemoAcademy());
  }, []);

  const registerAcademy = useCallback(async (input: RegisterInput): Promise<LoginResult> => {
    const email = input.email.trim().toLowerCase();
    if (!email.includes("@")) {
      return { ok: false, error: "Informe um e-mail válido." };
    }
    if (input.password.length < 6) {
      return { ok: false, error: "A senha precisa de pelo menos 6 caracteres." };
    }
    if (DEMO_ACCOUNTS.some((a) => a.email === email)) {
      return { ok: false, error: "Este e-mail é da demonstração." };
    }

    const resumeExisting = async (): Promise<LoginResult> => {
      const existing = await login(email, input.password);
      if (existing.ok) return { ...existing, resumed: true };
      return {
        ok: false,
        error:
          "Este e-mail já está cadastrado. Entre com a senha desta conta para concluir o pagamento.",
      };
    };

    if (emailTaken(email) || hasLocalPassword(email)) {
      return resumeExisting();
    }

    const slug = uniqueSlug(input.academyName, takenSlugs());
    const place = input.city.trim();
    const placeMatch = place.match(/^(.*?),\s*([A-Za-z]{2})$/);
    const city = placeMatch ? placeMatch[1] : place;
    const uf = input.state ?? (placeMatch ? placeMatch[2].toUpperCase() : "SP");
    let academy = createEmptyAcademy({
      name: input.academyName,
      city,
      state: uf,
      ownerName: input.ownerName,
      email,
      phone: input.phone,
      plan: input.plan,
    });
    academy = {
      ...academy,
      academy: { ...academy.academy, slug },
    };

    const originalId = academy.academy.id;
    const remote = await registerRemoteAcademy({
      email,
      password: input.password,
      name: academy.academy.name,
      slug,
      city: academy.academy.city,
      state: academy.academy.state,
      plan: academy.academy.plan,
      ownerName: input.ownerName.trim(),
      joinCode: academy.academy.joinCode,
    });

    if (remote.error && remote.error !== "offline") {
      if (/already|registered|exists/i.test(remote.error)) {
        return resumeExisting();
      }
    }

    if (remote.academyId) {
      academy = rehomeAcademy(academy, remote.academyId, {
        id: remote.ownerId ?? academy.session!.userId,
        email,
      });
    } else if (remote.pendingEmail && remote.ownerId) {
      academy = rehomeAcademy(academy, academy.academy.id, {
        id: remote.ownerId,
        email,
      });
    }

    putAcademy(academy, input.password, originalId);
    write(academy);
    if (remote.academyId) {
      const pushed = await pushAcademyState(academy);
      if (pushed.state) write(pushed.state);
    }
    return { ok: true, role: "owner", academyId: academy.academy.id };
  }, [login]);

  const registerStudent = useCallback(async (input: {
    code: string;
    slug?: string;
    houseName?: string;
    name: string;
    phone: string;
    email: string;
    password: string;
  }): Promise<LoginResult> => {
    const email = input.email.trim().toLowerCase();
    const code = input.code.trim();
    const slug = input.slug?.trim() ?? "";
    const houseName = input.houseName?.trim() ?? "";
    const name = input.name.trim();
    if ((!code && !slug && !houseName) || !name || !email.includes("@") || input.password.length < 6) {
      return { ok: false, error: "Preencha nome da academia, seu nome, e-mail e senha (mínimo 6)." };
    }

    if (isSupabaseConfigured()) {
      const remote = await joinStudentRemote({
        code,
        slug,
        houseName,
        name,
        phone: input.phone,
        email,
        password: input.password,
      });
      if (!("error" in remote && remote.error === "offline")) {
        if ("error" in remote && remote.error) return { ok: false, error: remote.error };
        if ("session" in remote && remote.session) {
          const pulled = await pullAcademyState(remote.session);
          if (!("error" in pulled)) {
            rememberPassword(email, input.password);
            putAcademy(pulled, input.password);
            write(pulled);
            return { ok: true, role: "student", academyId: pulled.academy.id };
          }
          return { ok: false, error: pulled.error };
        }
      }
    }

    const house =
      findAcademyByJoinCode(code) ||
      (slug ? findAcademyByJoinCode(slug) : null) ||
      (houseName ? findAcademyByJoinCode(houseName) : null);
    if (!house || house.academy.id === DEMO_ACADEMY_ID) {
      return { ok: false, error: "Academia não encontrada. Busque o nome da sua academia." };
    }
    const across = findUserAcrossAcademies(email);
    if (across && across.state.academy.id !== house.academy.id) {
      return {
        ok: false,
        error: "Este e-mail já pertence a outra academia. Use outro e-mail no app do aluno.",
      };
    }
    const existingUser = house.users.find((user) => user.email.toLowerCase() === email);
    if ((existingUser && existingUser.role !== "student") || (across && across.user.role !== "student")) {
      return { ok: false, error: "Este e-mail já é da equipe da academia. Use outro no app do aluno." };
    }
    if (existingUser && !checkPassword(email, input.password) && hasLocalPassword(email)) {
      return { ok: false, error: "Este e-mail já tem senha. Entre no login." };
    }

    const digits = input.phone.replace(/\D/g, "");
    const claimed = house.students.find((student) => {
      if (student.email.trim().toLowerCase() === email) return true;
      const phone = student.phone.replace(/\D/g, "");
      if (digits.length < 10 || phone.length < 10) return false;
      return phone === digits || phone === `55${digits}` || `55${phone}` === digits;
    });
    if (claimed?.userId && existingUser && claimed.userId !== existingUser.id) {
      return { ok: false, error: "Essa ficha já tem acesso. Entre com o e-mail e a senha." };
    }
    if (claimed?.userId && !existingUser) {
      return { ok: false, error: "Essa ficha já tem acesso. Entre com o e-mail e a senha." };
    }
    if (!claimed && !canAddStudent(house.academy, house.students.length)) {
      return { ok: false, error: studentCapMessage(house.academy) };
    }

    const userId = existingUser?.id ?? crypto.randomUUID();
    const user = {
      id: userId,
      academyId: house.academy.id,
      name,
      email,
      role: "student" as const,
      phone: input.phone.trim(),
      avatarHue: 210,
    };
    const students = claimed
      ? house.students.map((student) =>
          student.id === claimed.id
            ? {
                ...student,
                userId,
                email: student.email || email,
                phone: student.phone || input.phone.trim(),
              }
            : student,
        )
      : [
          {
            id: crypto.randomUUID(),
            academyId: house.academy.id,
            userId,
            name,
            email,
            phone: input.phone.trim(),
            birthDate: "2000-01-01",
            division: "adult" as const,
            belt: "white" as const,
            stripes: 0,
            joinDate: isoDate(0),
            lastPromotionDate: isoDate(0),
            status: "active" as const,
            monthlyFee: 0,
            notes: "",
            avatarHue: Math.floor(Math.random() * 360),
          },
          ...house.students,
        ];
    const users = existingUser
      ? house.users.map((item) => (item.id === userId ? user : item))
      : [...house.users, user];
    const next = {
      ...house,
      users,
      students,
      session: { userId, academyId: house.academy.id, role: "student" as const },
    };
    rememberPassword(email, input.password);
    putAcademy(next, input.password);
    write(next);
    return { ok: true, role: "student", academyId: next.academy.id };
  }, []);

  const syncNow = useCallback(async (): Promise<SyncResult> => {
    const current = getSnapshot();
    if (current.academy.id === DEMO_ACADEMY_ID) {
      return {
        ok: false,
        error: "A Equipe Origem é só demonstração. Abra a sua academia para gravar os dados.",
      };
    }
    if (!isSupabaseConfigured()) {
      return { ok: false, error: "Ainda não dá para gravar a academia. Tente de novo ou fale com o suporte." };
    }
    const readyLocal = ensureUuidState(current);
    let ready = readyLocal;
    if (current.session) {
      const pulled = await pullAcademyState(current.session);
      if (!("error" in pulled)) {
        ready = ensureUuidState(mergeAcademyState(readyLocal, pulled));
      }
    }
    write(ready);
    const epoch = writeEpoch;
    const owner = ready.users.find((u) => u.role === "owner");
    const password = owner ? passwordFor(owner.email) : undefined;
    const pushed = await pushAcademyState(ready, { refresh: true });
    if ("missingAcademy" in pushed && pushed.missingAcademy) {
      if (!owner?.email || !password) {
        return {
          ok: false,
          error:
            "Entre de novo com o e-mail do dono e tente gravar a academia.",
        };
      }
      const attached = await attachLocalAcademy({
        email: owner.email,
        password,
        state: ready,
      });
      if (attached.error) return { ok: false, error: attached.error };
      if (attached.state && writeEpoch === epoch) {
        putAcademy(attached.state, password, ready.academy.id);
        write(attached.state);
      }
      return { ok: true };
    }
    if (pushed.error) return { ok: false, error: pushed.error };
    if (pushed.state && writeEpoch === epoch) {
      write(mergeAcademyState(getSnapshot(), pushed.state));
    }
    return { ok: true };
  }, []);

  const pullNow = useCallback(async (): Promise<SyncResult> => {
    const current = getSnapshot();
    if (current.academy.id === DEMO_ACADEMY_ID) {
      return { ok: false, error: "A demonstração não baixa dados da sua academia." };
    }
    if (!current.session) {
      return { ok: false, error: "Entre na academia para baixar." };
    }
    const epoch = writeEpoch;
    const pulled = await pullAcademyState(current.session);
    if ("error" in pulled) return { ok: false, error: pulled.error };
    if (writeEpoch !== epoch) return { ok: true };
    const merged = mergeAcademyState(current, pulled);
    putAcademy(merged);
    write(merged);
    return { ok: true };
  }, []);

  const addStudent: Store["addStudent"] = useCallback((input) => {
    const prev = getSnapshot();
    if (!canAddStudent(prev.academy, prev.students.length)) return false;
    commit((prev) => {
      const id = uid("s");
      const student: Student = {
        ...input,
        id,
        academyId: prev.academy.id,
        userId: "",
        avatarHue: Math.floor(Math.random() * 360),
      };
      const payment: Payment = {
        id: uid("pay"),
        academyId: prev.academy.id,
        studentId: id,
        month: currentMonth(),
        amount: input.monthlyFee,
        status: input.monthlyFee === 0 ? "waived" : "pending",
      };
      return {
        ...prev,
        students: [student, ...prev.students],
        payments: [payment, ...prev.payments],
      };
    });
    return true;
  }, []);

  const updateStudent: Store["updateStudent"] = useCallback((id, patch) => {
    commit((prev) => ({
      ...prev,
      students: prev.students.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }, []);

  const recordPayment: Store["recordPayment"] = useCallback(
    (studentId, month, method) => {
      commit((prev) => {
        const student = prev.students.find((s) => s.id === studentId);
        const existing = prev.payments.find(
          (p) => p.studentId === studentId && p.month === month,
        );
        if (existing) {
          return {
            ...prev,
            payments: prev.payments.map((p) =>
              p.id === existing.id
                ? {
                    ...p,
                    status: "paid" as const,
                    paidAt: new Date().toISOString(),
                    method,
                  }
                : p,
            ),
          };
        }
        return {
          ...prev,
          payments: [
            {
              id: uid("pay"),
              academyId: prev.academy.id,
              studentId,
              month,
              amount: student?.monthlyFee ?? 0,
              status: "paid",
              paidAt: new Date().toISOString(),
              method,
            },
            ...prev.payments,
          ],
        };
      });
    },
    [],
  );

  const checkIn: Store["checkIn"] = useCallback((studentId, classId, method = "app") => {
    const today = isoDate(0);
    let ok = false;
    commit((prev) => {
      const existing = prev.attendance.find(
        (a) =>
          a.studentId === studentId && a.classId === classId && attendanceDay(a.date) === today,
      );
      const status = method === "manual" ? "validated" : "pending";
      const now = new Date().toISOString();
      const stamp =
        status === "validated"
          ? { validatedAt: now, validatedBy: prev.session?.userId }
          : { validatedAt: undefined, validatedBy: undefined };
      if (existing) {
        if (attendanceStatus(existing) !== "no_show") return prev;
        ok = true;
        return {
          ...prev,
          attendance: prev.attendance.map((a) =>
            a.id === existing.id
              ? { ...a, status, method, checkedInAt: now, ...stamp }
              : a,
          ),
        };
      }
      ok = true;
      return {
        ...prev,
        attendance: [
          {
            id: uid("at"),
            academyId: prev.academy.id,
            studentId,
            classId,
            date: today,
            checkedInAt: now,
            method,
            status,
            ...stamp,
          },
          ...prev.attendance,
        ],
      };
    });
    return ok;
  }, []);

  const checkInMany: Store["checkInMany"] = useCallback(
    (studentIds, classId, method = "manual") => {
      let added = 0;
      for (const id of studentIds) {
        if (checkIn(id, classId, method)) added += 1;
      }
      return added;
    },
    [checkIn],
  );

  const checkOut: Store["checkOut"] = useCallback((studentId, classId) => {
    const today = isoDate(0);
    const removed: string[] = [];
    commit((prev) => {
      const student = prev.students.find((item) => item.id === studentId);
      const aliases = student ? studentAliasIds(student, prev.students) : new Set([studentId]);
      const classIds = classAliasIds(prev.classes, classId);
      return {
        ...prev,
        attendance: prev.attendance.filter((a) => {
          const drop = aliases.has(a.studentId) && classIds.has(a.classId) && attendanceDay(a.date) === today;
          if (drop) removed.push(a.id);
          return !drop;
        }),
      };
    });
    const client = createSupabaseBrowserClient();
    if (client && removed.length) {
      void client.from("attendance").delete().in("id", removed);
    }
  }, []);

  const validateCheckIn: Store["validateCheckIn"] = useCallback((studentId, classId) => {
    const today = isoDate(0);
    let ok = false;
    commit((prev) => {
      const now = new Date().toISOString();
      const who = prev.session?.userId;
      const student = prev.students.find((item) => item.id === studentId);
      const aliases = student
        ? studentAliasIds(student, prev.students)
        : new Set([studentId]);
      const classIds = classAliasIds(prev.classes, classId);
      return {
        ...prev,
        attendance: prev.attendance.map((a) => {
          if (
            !aliases.has(a.studentId) ||
            !classIds.has(a.classId) ||
            attendanceDay(a.date) !== today ||
            attendanceStatus(a) !== "pending"
          ) {
            return a;
          }
          ok = true;
          return {
            ...a,
            status: "validated" as const,
            validatedAt: now,
            validatedBy: who,
          };
        }),
      };
    });
    if (ok) {
      void publishOwnerAttendance({ studentId, classId, action: "validate" });
      flushRemotePush();
    }
    return ok;
  }, []);

  const markNoShow: Store["markNoShow"] = useCallback((studentId, classId) => {
    const today = isoDate(0);
    let ok = false;
    commit((prev) => {
      const student = prev.students.find((item) => item.id === studentId);
      const aliases = student
        ? studentAliasIds(student, prev.students)
        : new Set([studentId]);
      const classIds = classAliasIds(prev.classes, classId);
      return {
        ...prev,
        attendance: prev.attendance.map((a) => {
          if (
            !aliases.has(a.studentId) ||
            !classIds.has(a.classId) ||
            attendanceDay(a.date) !== today ||
            !isOnRoster(a)
          ) {
            return a;
          }
          ok = true;
          return { ...a, status: "no_show" as const, validatedAt: undefined, validatedBy: undefined };
        }),
      };
    });
    if (ok) {
      void publishOwnerAttendance({ studentId, classId, action: "no_show" });
      flushRemotePush();
    }
    return ok;
  }, []);

  const validatePending: Store["validatePending"] = useCallback((classId) => {
    const today = isoDate(0);
    let n = 0;
    commit((prev) => {
      const now = new Date().toISOString();
      const who = prev.session?.userId;
      const classIds = classAliasIds(prev.classes, classId);
      return {
        ...prev,
        attendance: prev.attendance.map((a) => {
          if (
            !classIds.has(a.classId) ||
            attendanceDay(a.date) !== today ||
            attendanceStatus(a) !== "pending"
          ) {
            return a;
          }
          n += 1;
          return {
            ...a,
            status: "validated" as const,
            validatedAt: now,
            validatedBy: who,
          };
        }),
      };
    });
    if (n) {
      const snap = getSnapshot();
      const today = isoDate(0);
      const classIds = classAliasIds(snap.classes, classId);
      const seen = new Set<string>();
      for (const row of snap.attendance) {
        if (!classIds.has(row.classId) || attendanceDay(row.date) !== today) continue;
        if (attendanceStatus(row) !== "validated" || seen.has(row.studentId)) continue;
        seen.add(row.studentId);
        void publishOwnerAttendance({ studentId: row.studentId, classId, action: "validate" });
      }
      flushRemotePush();
    }
    return n;
  }, []);

  const cancelCheckIn: Store["cancelCheckIn"] = useCallback(
    async (studentId, classId) => {
      const current = getSnapshot();
      const session = current.classes.find((c) => c.id === classId);
      const who = current.students.find((item) => item.id === studentId);
      const aliases = who ? studentAliasIds(who, current.students) : new Set([studentId]);
      const classIds = classAliasIds(current.classes, classId);
      const today = isoDate(0);
      const row = current.attendance.find(
        (a) =>
          aliases.has(a.studentId) &&
          classIds.has(a.classId) &&
          attendanceDay(a.date) === today,
      );
      if (!row) return { ok: false, error: "Você não estava nesta lista." };
      if (attendanceStatus(row) !== "pending") {
        return { ok: false, error: "O professor já validou — peça na recepção." };
      }
      if (isSupabaseConfigured() && current.academy.id !== DEMO_ACADEMY_ID) {
        if (!session) return { ok: false, error: "Não achamos essa turma." };
        const retracted = await retractStudentCheckIn(session);
        if (!retracted.ok) {
          return { ok: false, error: retracted.error ?? "Não deu para sair da lista." };
        }
      }
      checkOut(studentId, classId);
      return { ok: true };
    },
    [checkOut],
  );

  const promote: Store["promote"] = useCallback((studentId, notes) => {
    commit((prev) => {
      const student = prev.students.find((s) => s.id === studentId);
      if (!student) return prev;
      const next = nextGraduation(student);
      return {
        ...prev,
        students: prev.students.map((s) =>
          s.id === studentId
            ? {
                ...s,
                belt: next.belt,
                stripes: next.stripes,
                division: next.division,
                lastPromotionDate: isoDate(0),
              }
            : s,
        ),
        graduations: [
          {
            id: uid("gr"),
            academyId: prev.academy.id,
            studentId,
            fromBelt: student.belt,
            toBelt: next.belt,
            stripes: next.stripes,
            date: isoDate(0),
            notes,
          },
          ...prev.graduations,
        ],
      };
    });
  }, []);

  const addStripe: Store["addStripe"] = useCallback((studentId) => {
    promote(studentId, "Grau concedido em aula.");
  }, [promote]);

  const adjustStock: Store["adjustStock"] = useCallback((id, delta) => {
    commit((prev) => ({
      ...prev,
      inventory: prev.inventory.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item,
      ),
    }));
  }, []);

  const addInventory: Store["addInventory"] = useCallback((item) => {
    commit((prev) => ({
      ...prev,
      inventory: [
        { ...item, id: uid("inv"), academyId: prev.academy.id },
        ...prev.inventory,
      ],
    }));
  }, []);

  const addPost: Store["addPost"] = useCallback((content) => {
    commit((prev) => {
      const user = prev.users.find((u) => u.id === prev.session?.userId);
      if (!user) return prev;
      const post: Post = {
        id: uid("po"),
        academyId: prev.academy.id,
        authorId: user.id,
        authorName: user.name,
        authorRole: user.role,
        content,
        createdAt: new Date().toISOString(),
        likedBy: [],
      };
      return { ...prev, posts: [post, ...prev.posts] };
    });
  }, []);

  const toggleLike: Store["toggleLike"] = useCallback((postId) => {
    commit((prev) => {
      const who = prev.session?.userId;
      if (!who) return prev;
      return {
        ...prev,
        posts: prev.posts.map((p) => {
          if (p.id !== postId) return p;
          const liked = p.likedBy.includes(who);
          return {
            ...p,
            likedBy: liked
              ? p.likedBy.filter((id) => id !== who)
              : [...p.likedBy, who],
          };
        }),
      };
    });
  }, []);

  const changePlan: Store["changePlan"] = useCallback((plan) => {
    commit((prev) => ({
      ...prev,
      academy: { ...prev.academy, plan },
    }));
  }, []);

  const lastAttendance = useCallback(
    (studentId: string) => {
      return state.attendance
        .filter((a) => a.studentId === studentId && isValidated(a))
        .sort((a, b) => b.date.localeCompare(a.date))[0];
    },
    [state],
  );

  const attendanceCount = useCallback(
    (studentId: string, days = 30) => {
      const cutoff = isoDate(-days);
      return state.attendance.filter(
        (a) => a.studentId === studentId && a.date >= cutoff && isValidated(a),
      ).length;
    },
    [state],
  );

  const overdueFor = useCallback(
    (studentId: string) => {
      return state.payments.filter(
        (p) => p.studentId === studentId && p.status === "overdue",
      );
    },
    [state],
  );

  const todayClasses = useCallback(() => {
    const day = weekdayToday();
    return state.classes.filter((c) => c.weekday === day);
  }, [state]);

  const updateAcademy: Store["updateAcademy"] = useCallback((patch) => {
    commit((prev) => ({
      ...prev,
      academy: { ...prev.academy, ...patch },
    }));
  }, []);

  const exportAcademyData: Store["exportAcademyData"] = useCallback(() => {
    return academyPortability(getSnapshot());
  }, []);

  const eraseAcademyLocally: Store["eraseAcademyLocally"] = useCallback(() => {
    const prev = getSnapshot();
    if (prev.academy.id === DEMO_ACADEMY_ID) {
      write(resetDemoAcademy());
      return;
    }
    write(eraseAcademy(prev.academy.id));
    void createSupabaseBrowserClient()?.auth.signOut();
  }, []);

  const removeStudent: Store["removeStudent"] = useCallback((id) => {
    commit((prev) => ({
      ...prev,
      students: prev.students.filter((s) => s.id !== id),
      payments: prev.payments.filter((p) => p.studentId !== id),
      attendance: prev.attendance.filter((a) => a.studentId !== id),
      graduations: prev.graduations.filter((g) => g.studentId !== id),
      evaluations: prev.evaluations.filter((e) => e.studentId !== id),
      sales: (prev.sales ?? []).filter((s) => s.studentId !== id),
    }));
  }, []);

  const addClass: Store["addClass"] = useCallback((input) => {
    commit((prev) => ({
      ...prev,
      classes: [
        ...prev.classes,
        { ...input, id: uid("c"), academyId: prev.academy.id },
      ],
    }));
    flushRemotePush();
  }, []);

  const updateClass: Store["updateClass"] = useCallback((id, patch) => {
    commit((prev) => ({
      ...prev,
      classes: prev.classes.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
    flushRemotePush();
  }, []);

  const removeClass: Store["removeClass"] = useCallback((id) => {
    commit((prev) => ({
      ...prev,
      classes: prev.classes.filter((c) => c.id !== id),
    }));
    flushRemotePush();
  }, []);

  const addEvaluation: Store["addEvaluation"] = useCallback((input) => {
    commit((prev) => ({
      ...prev,
        evaluations: [
          {
            ...input,
            id: uid("ev"),
            academyId: prev.academy.id,
          },
          ...(prev.evaluations ?? []),
        ],
    }));
  }, []);

  const confirmClass: Store["confirmClass"] = useCallback(
    async (studentId, classId) => {
      const current = getSnapshot();
      const session = current.classes.find((c) => c.id === classId);
      if (!session) return { ok: false, error: "Não achamos essa turma." };
      if (!studentCanSelfCheckIn(session)) {
        return { ok: false, error: "A chamada desta aula já fechou." };
      }
      const who = current.students.find((item) => item.id === studentId);
      const sid = (who ? canonicalStudent(current.students, who)?.id : null) ?? studentId;
      const today = isoDate(0);
      const aliases = who ? studentAliasIds(who, current.students) : new Set([sid]);
      const classIds = classAliasIds(current.classes, classId);
      const mine = current.attendance.find(
        (a) =>
          aliases.has(a.studentId) &&
          classIds.has(a.classId) &&
          attendanceDay(a.date) === today,
      );
      if (mine && isOnRoster(mine)) {
        return { ok: true };
      }
      const heads = classHeadcount(
        current.attendance,
        current.dropIns ?? [],
        classId,
        today,
      );
      if (session.capacity > 0 && heads >= session.capacity) {
        return { ok: false, error: "A turma lotou." };
      }

      if (isSupabaseConfigured() && current.academy.id !== DEMO_ACADEMY_ID) {
        const published = await publishStudentCheckIn(session);
        if (!published.ok) {
          return {
            ok: false,
            error: published.error ?? "Não deu para confirmar agora.",
          };
        }
        checkIn(published.studentId || sid, published.classId || classId, "app");
        if (published.studentId && published.studentId !== sid) {
          checkIn(sid, classId, "app");
        }
        const epoch = writeEpoch;
        if (current.session) {
          const pulled = await pullAcademyState(current.session);
          if (!("error" in pulled) && writeEpoch === epoch) {
            const merged = mergeAcademyState(getSnapshot(), pulled);
            putAcademy(merged);
            write(merged);
          }
        }
        return { ok: true };
      }

      const ok = checkIn(sid, classId, "app");
      if (!ok) return { ok: false, error: "Não deu para confirmar. A turma pode ter lotado." };
      return { ok: true };
    },
    [checkIn],
  );

  const republishPendingCheckIns: Store["republishPendingCheckIns"] = useCallback(async () => {
    const current = getSnapshot();
    if (current.academy.id === DEMO_ACADEMY_ID) return;
    if (!isSupabaseConfigured()) return;
    const today = isoDate(0);
    const seen = new Set<string>();
    for (const row of current.attendance) {
      if (attendanceDay(row.date) !== today || attendanceStatus(row) !== "pending") continue;
      const cls = current.classes.find((item) => item.id === row.classId);
      if (!cls || seen.has(cls.id)) continue;
      seen.add(cls.id);
      await publishStudentCheckIn(cls);
    }
  }, []);

  const generateMonthCharges: Store["generateMonthCharges"] = useCallback(
    (month) => {
      let created = 0;
      commit((prev) => {
        const already = new Set(
          prev.payments.filter((p) => p.month === month).map((p) => p.studentId),
        );
        const fresh: Payment[] = [];
        for (const s of prev.students) {
          if (s.status !== "active" || s.monthlyFee <= 0) continue;
          if (already.has(s.id)) continue;
          fresh.push({
            id: uid("pay"),
            academyId: prev.academy.id,
            studentId: s.id,
            month,
            amount: s.monthlyFee,
            status: "pending",
          });
        }
        created = fresh.length;
        return {
          ...prev,
          payments: [
            ...fresh,
            ...prev.payments.map((p) =>
              p.status === "pending" && p.month < month
                ? { ...p, status: "overdue" as const }
                : p,
            ),
          ],
        };
      });
      return created;
    },
    [],
  );

  const addExpense: Store["addExpense"] = useCallback((input) => {
    commit((prev) => {
      const row: Expense = {
        ...input,
        id: uid("ex"),
        academyId: prev.academy.id,
      };
      return { ...prev, expenses: [row, ...prev.expenses] };
    });
  }, []);

  const waivePayment: Store["waivePayment"] = useCallback((id) => {
    commit((prev) => ({
      ...prev,
      payments: prev.payments.map((p) =>
        p.id === id ? { ...p, status: "waived" as const } : p,
      ),
    }));
  }, []);

  const attachAsaasCharge: Store["attachAsaasCharge"] = useCallback((paymentId, data) => {
    commit((prev) => ({
      ...prev,
      students: data.asaasCustomerId
        ? prev.students.map((s) =>
            s.id === data.studentId ? { ...s, asaasCustomerId: data.asaasCustomerId } : s,
          )
        : prev.students,
      payments: prev.payments.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              asaasPaymentId: data.asaasPaymentId,
              asaasInvoiceUrl: data.asaasInvoiceUrl,
              asaasPixCopy: data.asaasPixCopy,
              asaasStatus: data.asaasStatus,
            }
          : p,
      ),
    }));
  }, []);

  const applyAsaasPaid: Store["applyAsaasPaid"] = useCallback((asaasPaymentId) => {
    commit((prev) => ({
      ...prev,
      payments: prev.payments.map((p) =>
        p.asaasPaymentId === asaasPaymentId && p.status !== "paid" && p.status !== "waived"
          ? {
              ...p,
              status: "paid" as const,
              paidAt: new Date().toISOString(),
              method: "pix" as const,
              asaasStatus: "RECEIVED",
            }
          : p,
      ),
    }));
  }, []);

  const addEvent: Store["addEvent"] = useCallback((input) => {
    commit((prev) => ({
      ...prev,
      events: [
        {
          ...input,
          id: uid("evt"),
          academyId: prev.academy.id,
          goingIds: input.goingIds ?? [],
        },
        ...(prev.events ?? []),
      ],
    }));
  }, []);

  const toggleRsvp: Store["toggleRsvp"] = useCallback((eventId, studentId) => {
    commit((prev) => ({
      ...prev,
      events: (prev.events ?? []).map((evt) => {
        if (evt.id !== eventId) return evt;
        const going = evt.goingIds.includes(studentId)
          ? evt.goingIds.filter((id) => id !== studentId)
          : [...evt.goingIds, studentId];
        return { ...evt, goingIds: going };
      }),
    }));
  }, []);

  const removeEvent: Store["removeEvent"] = useCallback((id) => {
    commit((prev) => ({
      ...prev,
      events: (prev.events ?? []).filter((evt) => evt.id !== id),
    }));
  }, []);

  const sellItem: Store["sellItem"] = useCallback(
    (studentId, itemId, quantity, method) => {
      const current = getSnapshot();
      const item = current.inventory.find((i) => i.id === itemId);
      if (!item || quantity < 1 || item.quantity < quantity) return false;
      commit((prev) => {
        const row = prev.inventory.find((i) => i.id === itemId);
        if (!row || row.quantity < quantity) return prev;
        const sale: Sale = {
          id: uid("sale"),
          academyId: prev.academy.id,
          studentId,
          itemId,
          itemName: `${row.name}${row.size ? ` ${row.size}` : ""}`,
          quantity,
          amount: row.price * quantity,
          date: isoDate(0),
          method,
        };
        return {
          ...prev,
          inventory: prev.inventory.map((i) =>
            i.id === itemId ? { ...i, quantity: i.quantity - quantity } : i,
          ),
          sales: [sale, ...(prev.sales ?? [])],
        };
      });
      return true;
    },
    [],
  );

  const addDropIn: Store["addDropIn"] = useCallback((input) => {
    commit((prev) => ({
      ...prev,
      dropIns: [
        {
          ...input,
          id: uid("di"),
          academyId: prev.academy.id,
        },
        ...(prev.dropIns ?? []),
      ],
    }));
  }, []);

  const value = useMemo<Store>(
    () => ({
      ...state,
      ready: hydrated,
      hydrated,
      isDemo: state.academy.id === DEMO_ACADEMY_ID,
      login,
      logout,
      resetDemo,
      registerAcademy,
      registerStudent,
      syncNow,
      pullNow,
      addStudent,
      updateStudent,
      recordPayment,
      checkIn,
      checkInMany,
      checkOut,
      validateCheckIn,
      markNoShow,
      validatePending,
      cancelCheckIn,
      promote,
      addStripe,
      adjustStock,
      addInventory,
      addPost,
      toggleLike,
      changePlan,
      lastAttendance,
      attendanceCount,
      overdueFor,
      todayClasses,
      updateAcademy,
      exportAcademyData,
      eraseAcademyLocally,
      removeStudent,
      addClass,
      updateClass,
      removeClass,
      addEvaluation,
      confirmClass,
      republishPendingCheckIns,
      generateMonthCharges,
      addExpense,
      waivePayment,
      attachAsaasCharge,
      applyAsaasPaid,
      addEvent,
      toggleRsvp,
      removeEvent,
      sellItem,
      addDropIn,
    }),
    [
      state,
      hydrated,
      login,
      logout,
      resetDemo,
      registerAcademy,
      registerStudent,
      syncNow,
      pullNow,
      addStudent,
      updateStudent,
      recordPayment,
      checkIn,
      checkInMany,
      checkOut,
      validateCheckIn,
      markNoShow,
      validatePending,
      cancelCheckIn,
      promote,
      addStripe,
      adjustStock,
      addInventory,
      addPost,
      toggleLike,
      changePlan,
      lastAttendance,
      attendanceCount,
      overdueFor,
      todayClasses,
      updateAcademy,
      exportAcademyData,
      eraseAcademyLocally,
      removeStudent,
      addClass,
      updateClass,
      removeClass,
      addEvaluation,
      confirmClass,
      republishPendingCheckIns,
      generateMonthCharges,
      addExpense,
      waivePayment,
      attachAsaasCharge,
      applyAsaasPaid,
      addEvent,
      toggleRsvp,
      removeEvent,
      sellItem,
      addDropIn,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function currentStudent(state: {
  academy: { id: string };
  students: Student[];
  users?: { id: string; email: string }[];
  session: AppState["session"];
}) {
  const byUser = state.students.find((s) => s.userId && s.userId === state.session?.userId);
  if (byUser) return byUser;
  const email = state.users
    ?.find((user) => user.id === state.session?.userId)
    ?.email.trim()
    .toLowerCase();
  if (email) {
    const byEmail = state.students.find((s) => s.email.trim().toLowerCase() === email);
    if (byEmail) return byEmail;
  }
  if (state.academy.id === DEMO_ACADEMY_ID) {
    return state.students.find((s) => s.id === "s_joao");
  }
  return undefined;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function useOptionalStore() {
  return useContext(StoreContext);
}

export function useRequireRole(roles: Role[]) {
  const store = useStore();
  return {
    ok: !!store.session && roles.includes(store.session.role),
    session: store.session,
  };
}

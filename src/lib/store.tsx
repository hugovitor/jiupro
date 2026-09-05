"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { nextGraduation } from "./belts";
import { createEmptyAcademy, uniqueSlug } from "./empty-academy";
import { currentMonth, isoDate, uid, weekdayToday } from "./format";
import { createSeed, DEMO_ACADEMY_ID, DEMO_ACCOUNTS } from "./seed";
import {
  attachLocalAcademy,
  pullAcademyState,
  pushAcademyState,
  registerRemoteAcademy,
  scheduleRemotePush,
  signInRemote,
} from "./supabase/sync";
import { ensureUuidState, rehomeAcademy } from "./supabase/mapper";
import { isSupabaseConfigured } from "./supabase/config";
import {
  activeState,
  checkPassword,
  emailTaken,
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
import { dayCode } from "./whatsapp";
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
  | { ok: true; role: Role }
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
  syncNow: () => Promise<SyncResult>;
  pullNow: () => Promise<SyncResult>;
  addStudent: (input: Omit<Student, "id" | "academyId" | "userId" | "avatarHue">) => void;
  updateStudent: (id: string, patch: Partial<Student>) => void;
  recordPayment: (studentId: string, month: string, method: Payment["method"]) => void;
  checkIn: (studentId: string, classId: string, method?: Attendance["method"]) => boolean;
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
  addClass: (input: Omit<ClassSession, "id" | "academyId">) => void;
  removeClass: (id: string) => void;
  addEvaluation: (input: Omit<Evaluation, "id" | "academyId">) => void;
  checkInWithCode: (studentId: string, classId: string, code: string) => boolean;
  generateMonthCharges: (month: string) => number;
  addExpense: (input: {
    description: string;
    category: ExpenseCategory;
    amount: number;
    date: string;
  }) => void;
  waivePayment: (id: string) => void;
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

function persist(state: AppState): AppState {
  const next =
    state.academy.id === DEMO_ACADEMY_ID ? state : ensureUuidState(state);
  writeActive(next);
  pushCancel?.();
  pushCancel = scheduleRemotePush(next);
  return next;
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
  const hydrated = true;

  useLayoutEffect(() => {
    clientReady = true;
    cached = load();
    emit();
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
      return { ok: true, role: demo.role };
    }

    const local = findUserAcrossAcademies(needle);

    if (password && isSupabaseConfigured()) {
      const remote = await signInRemote(needle, password);
      if (!("error" in remote && remote.error === "offline")) {
        if ("missingProfile" in remote && remote.missingProfile) {
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
            return { ok: true, role: remote.session.role };
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
      return { ok: true, role: local.user.role };
    }

    return { ok: false, error: "Conta não encontrada." };
  }, []);

  const logout = useCallback(() => {
    commit((prev) => ({ ...prev, session: null }));
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
    if (DEMO_ACCOUNTS.some((a) => a.email === email) || emailTaken(email) || hasLocalPassword(email)) {
      return { ok: false, error: "Este e-mail já tem uma academia." };
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
    });

    if (remote.error && remote.error !== "offline") {
      if (/already|registered|exists/i.test(remote.error)) {
        return { ok: false, error: "Este e-mail já está cadastrado." };
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
    return { ok: true, role: "owner" };
  }, []);

  const syncNow = useCallback(async (): Promise<SyncResult> => {
    const current = getSnapshot();
    if (current.academy.id === DEMO_ACADEMY_ID) {
      return {
        ok: false,
        error: "A Equipe Origem é só demonstração e não vai para o Supabase.",
      };
    }
    if (!isSupabaseConfigured()) {
      return { ok: false, error: "Cole a URL e a chave anon do projeto." };
    }
    const ready = ensureUuidState(current);
    write(ready);
    const owner = ready.users.find((u) => u.role === "owner");
    const password = owner ? passwordFor(owner.email) : undefined;
    const pushed = await pushAcademyState(ready);
    if ("missingAcademy" in pushed && pushed.missingAcademy) {
      if (!owner?.email || !password) {
        return {
          ok: false,
          error:
            "Não achei a senha do dono neste navegador. Entre de novo e tente enviar.",
        };
      }
      const attached = await attachLocalAcademy({
        email: owner.email,
        password,
        state: ready,
      });
      if (attached.error) return { ok: false, error: attached.error };
      if (attached.state) {
        putAcademy(attached.state, password, ready.academy.id);
        write(attached.state);
      }
      return { ok: true };
    }
    if (pushed.error) return { ok: false, error: pushed.error };
    if (pushed.state) write(pushed.state);
    return { ok: true };
  }, []);

  const pullNow = useCallback(async (): Promise<SyncResult> => {
    const current = getSnapshot();
    if (current.academy.id === DEMO_ACADEMY_ID) {
      return { ok: false, error: "A demo não baixa do Supabase." };
    }
    if (!current.session) {
      return { ok: false, error: "Entre na academia para baixar." };
    }
    const pulled = await pullAcademyState(current.session);
    if ("error" in pulled) return { ok: false, error: pulled.error };
    putAcademy(pulled);
    write(pulled);
    return { ok: true };
  }, []);

  const addStudent: Store["addStudent"] = useCallback((input) => {
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
    const current = getSnapshot();
    const already = current.attendance.some(
      (a) =>
        a.studentId === studentId && a.classId === classId && a.date === today,
    );
    if (already) return false;
    commit((prev) => ({
      ...prev,
      attendance: [
        {
          id: uid("at"),
          academyId: prev.academy.id,
          studentId,
          classId,
          date: today,
          checkedInAt: new Date().toISOString(),
          method,
        },
        ...prev.attendance,
      ],
    }));
    return true;
  }, []);

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
        .filter((a) => a.studentId === studentId)
        .sort((a, b) => b.date.localeCompare(a.date))[0];
    },
    [state],
  );

  const attendanceCount = useCallback(
    (studentId: string, days = 30) => {
      const cutoff = isoDate(-days);
      return state.attendance.filter(
        (a) => a.studentId === studentId && a.date >= cutoff,
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

  const addClass: Store["addClass"] = useCallback((input) => {
    commit((prev) => ({
      ...prev,
      classes: [
        ...prev.classes,
        { ...input, id: uid("c"), academyId: prev.academy.id },
      ],
    }));
  }, []);

  const removeClass: Store["removeClass"] = useCallback((id) => {
    commit((prev) => ({
      ...prev,
      classes: prev.classes.filter((c) => c.id !== id),
    }));
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

  const checkInWithCode: Store["checkInWithCode"] = useCallback(
    (studentId, classId, code) => {
      const current = getSnapshot();
      const expected = dayCode(isoDate(0), current.academy.slug);
      if (code.replace(/\s/g, "") !== expected) return false;
      return checkIn(studentId, classId, "code");
    },
    [checkIn],
  );

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
      syncNow,
      pullNow,
      addStudent,
      updateStudent,
      recordPayment,
      checkIn,
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
      addClass,
      removeClass,
      addEvaluation,
      checkInWithCode,
      generateMonthCharges,
      addExpense,
      waivePayment,
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
      syncNow,
      pullNow,
      addStudent,
      updateStudent,
      recordPayment,
      checkIn,
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
      addClass,
      removeClass,
      addEvaluation,
      checkInWithCode,
      generateMonthCharges,
      addExpense,
      waivePayment,
      addEvent,
      toggleRsvp,
      removeEvent,
      sellItem,
      addDropIn,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function currentStudent(state: { students: Student[]; session: AppState["session"] }) {
  const byUser = state.students.find((s) => s.userId === state.session?.userId);
  if (byUser) return byUser;
  return state.students.find((s) => s.id === "s_joao");
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

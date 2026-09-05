"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { nextAdultBelt } from "./belts";
import { currentMonth, isoDate, uid } from "./format";
import { createSeed } from "./seed";
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
  Student,
} from "./types";

const STORAGE_KEY = "tatame.demo.v3";
const SESSION_KEY = "tatame.session.v3";

type Store = AppState & {
  ready: boolean;
  hydrated: boolean;
  login: (email: string) => boolean;
  logout: () => void;
  resetDemo: () => void;
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
};

const StoreContext = createContext<Store | null>(null);

const listeners = new Set<() => void>();
let cached: AppState | null = null;

function persist(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (state.session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(state.session));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    /* ignore quota */
  }
}

function migrate(state: AppState): AppState {
  return {
    ...state,
    version: 5,
    academy: {
      ...state.academy,
      pixKey: state.academy.pixKey || "origemjj@pix.com.br",
      pixName: state.academy.pixName || state.academy.name,
    },
    evaluations: state.evaluations ?? [],
    events: state.events ?? [],
    sales: state.sales ?? [],
  };
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const seeded = raw ? (JSON.parse(raw) as AppState) : createSeed();
    const parsed = migrate(seeded.version >= 3 ? seeded : createSeed());
    let session = parsed.session ?? null;
    try {
      const extra = localStorage.getItem(SESSION_KEY);
      if (extra) session = JSON.parse(extra) as AppState["session"];
    } catch {
      /* keep parsed session */
    }
    return { ...parsed, session };
  } catch {
    return createSeed();
  }
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
  if (!cached) cached = load();
  return cached;
}

let serverCached: AppState | null = null;
function getServerSnapshot(): AppState {
  if (!serverCached) serverCached = createSeed();
  return serverCached;
}

function write(next: AppState) {
  cached = next;
  persist(next);
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

  const login = useCallback((email: string) => {
    const current = getSnapshot();
    const user = current.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );
    if (!user) return false;
    commit((prev) => ({
      ...prev,
      session: {
        userId: user.id,
        academyId: user.academyId,
        role: user.role,
      },
    }));
    return true;
  }, []);

  const logout = useCallback(() => {
    commit((prev) => ({ ...prev, session: null }));
  }, []);

  const resetDemo = useCallback(() => {
    write(createSeed());
  }, []);

  const addStudent: Store["addStudent"] = useCallback((input) => {
    commit((prev) => {
      const id = uid("s");
      const student: Student = {
        ...input,
        id,
        academyId: prev.academy.id,
        userId: uid("u"),
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
      let toBelt = student.belt;
      let stripes = student.stripes;
      if (student.division === "adult") {
        if (student.stripes < 4 && student.belt !== "black") {
          stripes = student.stripes + 1;
        } else {
          const next = nextAdultBelt(
            student.belt as "white" | "blue" | "purple" | "brown" | "black",
          );
          if (next) {
            toBelt = next;
            stripes = 0;
          } else {
            stripes = Math.min(student.stripes + 1, 6);
          }
        }
      } else {
        stripes = Math.min(student.stripes + 1, 4);
      }
      return {
        ...prev,
        students: prev.students.map((s) =>
          s.id === studentId
            ? {
                ...s,
                belt: toBelt,
                stripes,
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
            toBelt,
            stripes,
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
    const day = new Date().getDay();
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

  const value = useMemo<Store>(
    () => ({
      ...state,
      ready: hydrated,
      hydrated,
      login,
      logout,
      resetDemo,
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
    }),
    [
      state,
      hydrated,
      login,
      logout,
      resetDemo,
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
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function currentStudent(state: { students: Student[]; session: AppState["session"] }) {
  return (
    state.students.find((s) => s.userId === state.session?.userId) ??
    state.students.find((s) => s.id === "s_joao")
  );
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

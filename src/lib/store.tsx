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
import type {
  AppState,
  Attendance,
  InventoryItem,
  Payment,
  PlanId,
  Post,
  Role,
  Student,
} from "./types";

const STORAGE_KEY = "tatame.demo.v2";

type Store = AppState & {
  ready: boolean;
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
};

const StoreContext = createContext<Store | null>(null);

const listeners = new Set<() => void>();
let cached: AppState | null = null;

const SERVER_STATE: AppState = {
  version: 2,
  academy: {
    id: "ssr",
    name: "Tatame",
    slug: "tatame",
    city: "",
    state: "",
    address: "",
    phone: "",
    instagram: "",
    plan: "academia",
    monthlyGoal: 0,
    createdAt: "2021-01-01T00:00:00.000Z",
  },
  users: [],
  students: [],
  classes: [],
  attendance: [],
  payments: [],
  expenses: [],
  inventory: [],
  graduations: [],
  posts: [],
  session: null,
};

function persist(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSeed();
    const parsed = JSON.parse(raw) as AppState;
    if (parsed.version !== 2) return createSeed();
    return { ...parsed, session: parsed.session ?? null };
  } catch {
    return createSeed();
  }
}

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): AppState {
  if (!cached) cached = load();
  return cached;
}

function getServerSnapshot(): AppState {
  return SERVER_STATE;
}

function write(next: AppState) {
  cached = next;
  persist(next);
  emit();
}

function commit(updater: (prev: AppState) => AppState) {
  write(updater(getSnapshot()));
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

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

  const value = useMemo<Store>(
    () => ({
      ...state,
      ready: true,
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
    }),
    [
      state,
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
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
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

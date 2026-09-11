import { asUuid, isUuid, remapIds } from "./ids";
import type {
  Academy,
  AcademyEvent,
  AppState,
  Attendance,
  ClassSession,
  DropIn,
  Evaluation,
  Expense,
  Graduation,
  InventoryItem,
  Payment,
  PlanId,
  Post,
  Role,
  Sale,
  Session,
  Student,
  User,
} from "../types";

type Row = Record<string, unknown>;

export function ensureUuidState(state: AppState): AppState {
  const map = new Map<string, string>();
  const id = (old: string) => remapIds(old, map);

  const academyId = id(state.academy.id);
  const users: User[] = state.users.map((u) => ({
    ...u,
    id: id(u.id),
    academyId,
  }));
  const students: Student[] = state.students.map((s) => ({
    ...s,
    id: id(s.id),
    academyId,
    userId: s.userId ? id(s.userId) : "",
  }));
  const classes: ClassSession[] = state.classes.map((c) => ({
    ...c,
    id: id(c.id),
    academyId,
    instructorId: c.instructorId ? id(c.instructorId) : "",
  }));

  return {
    ...state,
    academy: { ...state.academy, id: academyId },
    users,
    students,
    classes,
    attendance: state.attendance.map((a) => ({
      ...a,
      id: id(a.id),
      academyId,
      studentId: id(a.studentId),
      classId: id(a.classId),
      validatedBy: a.validatedBy ? id(a.validatedBy) : a.validatedBy,
    })),
    payments: state.payments.map((p) => ({
      ...p,
      id: id(p.id),
      academyId,
      studentId: id(p.studentId),
    })),
    expenses: state.expenses.map((e) => ({
      ...e,
      id: id(e.id),
      academyId,
    })),
    inventory: state.inventory.map((i) => ({
      ...i,
      id: id(i.id),
      academyId,
    })),
    graduations: state.graduations.map((g) => ({
      ...g,
      id: id(g.id),
      academyId,
      studentId: id(g.studentId),
    })),
    evaluations: (state.evaluations ?? []).map((e) => ({
      ...e,
      id: id(e.id),
      academyId,
      studentId: id(e.studentId),
    })),
    posts: state.posts.map((p) => ({
      ...p,
      id: id(p.id),
      academyId,
      authorId: p.authorId ? id(p.authorId) : "",
      likedBy: p.likedBy.map((x) => id(x)),
    })),
    events: (state.events ?? []).map((e) => ({
      ...e,
      id: id(e.id),
      academyId,
      goingIds: e.goingIds.map((x) => id(x)),
    })),
    sales: (state.sales ?? []).map((s) => ({
      ...s,
      id: id(s.id),
      academyId,
      studentId: s.studentId ? id(s.studentId) : "",
      itemId: s.itemId ? id(s.itemId) : "",
    })),
    dropIns: (state.dropIns ?? []).map((d) => ({
      ...d,
      id: id(d.id),
      academyId,
      classId: d.classId ? id(d.classId) : "",
    })),
    session: state.session
      ? {
          ...state.session,
          userId: id(state.session.userId),
          academyId,
        }
      : null,
  };
}

export function rehomeAcademy(
  state: AppState,
  academyId: string,
  owner: { id: string; email?: string },
): AppState {
  const previousOwner =
    state.users.find((u) => u.role === "owner")?.id ?? state.session?.userId;
  const withAcademy = <T extends { academyId: string }>(row: T): T => ({
    ...row,
    academyId,
  });
  return ensureUuidState({
    ...state,
    academy: { ...state.academy, id: academyId },
    users: state.users.map((u) =>
      u.role === "owner"
        ? { ...u, id: owner.id, academyId, email: owner.email ?? u.email }
        : { ...u, academyId },
    ),
    students: state.students.map(withAcademy),
    classes: state.classes.map((c) => ({
      ...c,
      academyId,
      instructorId: c.instructorId === previousOwner ? owner.id : c.instructorId,
    })),
    attendance: state.attendance.map(withAcademy),
    payments: state.payments.map(withAcademy),
    expenses: state.expenses.map(withAcademy),
    inventory: state.inventory.map(withAcademy),
    graduations: state.graduations.map(withAcademy),
    evaluations: (state.evaluations ?? []).map(withAcademy),
    posts: state.posts.map((p) => ({
      ...p,
      academyId,
      authorId: p.authorId === previousOwner ? owner.id : p.authorId,
    })),
    events: (state.events ?? []).map(withAcademy),
    sales: (state.sales ?? []).map(withAcademy),
    dropIns: (state.dropIns ?? []).map(withAcademy),
    session: {
      userId: owner.id,
      academyId,
      role: "owner",
    },
  });
}

function num(v: unknown, fallback = 0) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function str(v: unknown, fallback = "") {
  return typeof v === "string" ? v : fallback;
}

function time(v: string) {
  const raw = String(v ?? "").trim();
  const hm = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!hm) return "19:30:00";
  return `${hm[1].padStart(2, "0")}:${hm[2]}:00`;
}

function dateCol(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const raw = String(value ?? "").trim();
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

function attendanceStatusFromRow(x: Row): Attendance["status"] {
  const raw = str(x.status);
  if (raw === "pending" || raw === "validated" || raw === "no_show") return raw;
  if (str(x.method, "app") === "app" && !str(x.validated_at)) return "pending";
  return "validated";
}

export function academyToRow(a: Academy): Row {
  return {
    id: a.id,
    name: a.name,
    slug: a.slug,
    city: a.city,
    state: a.state,
    address: a.address,
    phone: a.phone,
    instagram: a.instagram,
    pix_key: a.pixKey,
    pix_name: a.pixName,
    plan: a.plan,
    monthly_goal: a.monthlyGoal,
    drop_in_fee: a.dropInFee,
    join_code: a.joinCode || null,
  };
}

export function stateToTables(state: AppState, allowedProfiles?: Set<string>) {
  const academyId = state.academy.id;
  const profileIds =
    allowedProfiles ??
    new Set(
      state.users.filter((u) => isUuid(u.id) && u.role !== "student").map((u) => u.id),
    );

  return {
    academy: academyToRow(state.academy),
    students: state.students.filter((s) => isUuid(s.id)).map((s) => ({
      id: s.id,
      academy_id: academyId,
      user_id: asUuid(s.userId) && profileIds.has(s.userId) ? s.userId : null,
      name: s.name,
      email: s.email || null,
      phone: s.phone || null,
      birth_date: dateCol(s.birthDate),
      guardian_name: s.guardianName || null,
      division: s.division === "kids" ? "kids" : "adult",
      belt: s.belt || "white",
      stripes: s.stripes,
      join_date: dateCol(s.joinDate) || new Date().toISOString().slice(0, 10),
      last_promotion_date: dateCol(s.lastPromotionDate),
      status: s.status,
      monthly_fee: s.monthlyFee,
      notes: s.notes || null,
      avatar_hue: s.avatarHue,
      cpf: s.cpf || null,
      asaas_customer_id: s.asaasCustomerId || null,
    })),
    classes: state.classes.filter((c) => isUuid(c.id)).map((c) => ({
      id: c.id,
      academy_id: academyId,
      name: c.name,
      weekday: c.weekday,
      start_time: time(c.startTime),
      duration_min: c.durationMin,
      instructor_id: profileIds.has(c.instructorId) ? c.instructorId : null,
      division: c.division,
      gi: c.gi,
      capacity: c.capacity,
    })),
    attendance: state.attendance
      .filter((a) => isUuid(a.id) && isUuid(a.studentId) && isUuid(a.classId))
      .map((a) => ({
        id: a.id,
        academy_id: academyId,
        student_id: a.studentId,
        class_id: a.classId,
        date: a.date,
        checked_in_at: a.checkedInAt,
        method: a.method,
        status: a.status ?? "validated",
        validated_at: a.validatedAt ?? null,
        validated_by: a.validatedBy && isUuid(a.validatedBy) ? a.validatedBy : null,
      })),
    payments: state.payments.filter((p) => isUuid(p.id) && isUuid(p.studentId)).map((p) => ({
      id: p.id,
      academy_id: academyId,
      student_id: p.studentId,
      month: p.month,
      amount: p.amount,
      status: p.status,
      paid_at: p.paidAt ?? null,
      method: p.method ?? null,
      asaas_payment_id: p.asaasPaymentId ?? null,
      asaas_invoice_url: p.asaasInvoiceUrl ?? null,
      asaas_pix_copy: p.asaasPixCopy ?? null,
      asaas_status: p.asaasStatus ?? null,
    })),
    expenses: state.expenses.filter((e) => isUuid(e.id)).map((e) => ({
      id: e.id,
      academy_id: academyId,
      description: e.description,
      category: e.category,
      amount: e.amount,
      date: e.date,
    })),
    inventory: state.inventory.filter((i) => isUuid(i.id)).map((i) => ({
      id: i.id,
      academy_id: academyId,
      name: i.name,
      sku: i.sku,
      category: i.category,
      size: i.size ?? null,
      quantity: i.quantity,
      min_quantity: i.minQuantity,
      cost: i.cost,
      price: i.price,
    })),
    graduations: state.graduations
      .filter((g) => isUuid(g.id) && isUuid(g.studentId))
      .map((g) => ({
        id: g.id,
        academy_id: academyId,
        student_id: g.studentId,
        from_belt: g.fromBelt,
        to_belt: g.toBelt,
        stripes: g.stripes,
        date: g.date,
        notes: g.notes,
      })),
    evaluations: (state.evaluations ?? [])
      .filter((e) => isUuid(e.id) && isUuid(e.studentId))
      .map((e) => ({
        id: e.id,
        academy_id: academyId,
        student_id: e.studentId,
        date: e.date,
        instructor_name: e.instructorName,
        notes: e.notes,
        recommend_promotion: e.recommendPromotion,
      })),
    posts: state.posts.filter((p) => isUuid(p.id)).map((p) => ({
      id: p.id,
      academy_id: academyId,
      author_id: profileIds.has(p.authorId) ? p.authorId : null,
      author_name: p.authorName,
      author_role: p.authorRole,
      content: p.content,
      pinned: Boolean(p.pinned),
      created_at: p.createdAt,
    })),
    postLikes: state.posts.flatMap((p) =>
      p.likedBy
        .filter((uid) => isUuid(p.id) && profileIds.has(uid))
        .map((uid) => ({ post_id: p.id, profile_id: uid })),
    ),
    events: (state.events ?? []).filter((e) => isUuid(e.id)).map((e) => ({
      id: e.id,
      academy_id: academyId,
      title: e.title,
      kind: e.kind,
      date: e.date,
      time: e.time,
      place: e.place,
      notes: e.notes,
      fee: e.fee,
    })),
    eventRsvps: (state.events ?? []).flatMap((e) =>
      e.goingIds
        .filter((sid) => isUuid(e.id) && isUuid(sid))
        .map((sid) => ({ event_id: e.id, student_id: sid })),
    ),
    sales: (state.sales ?? [])
      .filter((s) => isUuid(s.id) && isUuid(s.studentId))
      .map((s) => ({
        id: s.id,
        academy_id: academyId,
        student_id: s.studentId,
        item_id: asUuid(s.itemId),
        item_name: s.itemName,
        quantity: s.quantity,
        amount: s.amount,
        date: s.date,
        method: s.method,
      })),
    dropIns: (state.dropIns ?? []).filter((d) => isUuid(d.id)).map((d) => ({
      id: d.id,
      academy_id: academyId,
      name: d.name,
      phone: d.phone,
      class_id: asUuid(d.classId),
      date: d.date,
      amount: d.amount,
      method: d.method,
    })),
  };
}

export function tablesToState(input: {
  academy: Row;
  profiles: Row[];
  students: Row[];
  classes: Row[];
  attendance: Row[];
  payments: Row[];
  expenses: Row[];
  inventory: Row[];
  graduations: Row[];
  evaluations: Row[];
  posts: Row[];
  postLikes: Row[];
  events: Row[];
  eventRsvps: Row[];
  sales: Row[];
  dropIns: Row[];
  session: Session | null;
}): AppState {
  const a = input.academy;
  const academyId = str(a.id);
  const likesByPost = new Map<string, string[]>();
  for (const like of input.postLikes) {
    const pid = str(like.post_id);
    const list = likesByPost.get(pid) ?? [];
    list.push(str(like.profile_id));
    likesByPost.set(pid, list);
  }
  const goingByEvent = new Map<string, string[]>();
  for (const r of input.eventRsvps) {
    const eid = str(r.event_id);
    const list = goingByEvent.get(eid) ?? [];
    list.push(str(r.student_id));
    goingByEvent.set(eid, list);
  }

  const start = (v: unknown) => {
    const t = str(v, "19:30");
    return t.slice(0, 5);
  };

  const academy: Academy = {
    id: academyId,
    name: str(a.name),
    slug: str(a.slug),
    city: str(a.city),
    state: str(a.state, "SP"),
    address: str(a.address),
    phone: str(a.phone),
    instagram: str(a.instagram),
    pixKey: str(a.pix_key),
    pixName: str(a.pix_name, str(a.name)),
    plan: (str(a.plan, "academia") as PlanId) || "academia",
    monthlyGoal: num(a.monthly_goal),
    dropInFee: num(a.drop_in_fee, 40),
    createdAt: str(a.created_at, new Date().toISOString()),
    joinCode: str(a.join_code).toUpperCase(),
  };

  const users: User[] = input.profiles.map((p) => ({
    id: str(p.id),
    academyId,
    name: str(p.name),
    email: str(p.email),
    role: (str(p.role, "owner") as Role) || "owner",
    phone: str(p.phone),
    avatarHue: num(p.avatar_hue, 12),
  }));

  const students: Student[] = input.students.map((s) => ({
    id: str(s.id),
    academyId,
    userId: str(s.user_id),
    name: str(s.name),
    email: str(s.email),
    phone: str(s.phone),
    birthDate: str(s.birth_date),
    guardianName: str(s.guardian_name) || undefined,
    division: str(s.division, "adult") === "kids" ? "kids" : "adult",
    belt: str(s.belt, "white") as Student["belt"],
    stripes: num(s.stripes),
    joinDate: dateCol(s.join_date) || new Date().toISOString().slice(0, 10),
    lastPromotionDate: dateCol(s.last_promotion_date) || dateCol(s.join_date) || new Date().toISOString().slice(0, 10),
    status: (str(s.status, "active") as Student["status"]) || "active",
    monthlyFee: num(s.monthly_fee),
    notes: str(s.notes),
    avatarHue: num(s.avatar_hue, 40),
    cpf: str(s.cpf) || undefined,
    asaasCustomerId: str(s.asaas_customer_id) || undefined,
  }));

  const seenUser = new Set(students.map((s) => s.userId).filter(Boolean));
  const seenEmail = new Set(students.map((s) => s.email.trim().toLowerCase()).filter(Boolean));
  for (const profile of input.profiles) {
    if (str(profile.role) !== "student") continue;
    const userId = str(profile.id);
    const email = str(profile.email).trim().toLowerCase();
    const existing =
      students.find((row) => row.userId && row.userId === userId) ??
      students.find((row) => email && row.email.trim().toLowerCase() === email);
    if (existing) {
      if (userId && !existing.userId) existing.userId = userId;
      if (userId) seenUser.add(userId);
      if (email) seenEmail.add(email);
      continue;
    }
    if (userId && seenUser.has(userId)) continue;
    if (email && seenEmail.has(email)) continue;
    students.push({
      id: userId || crypto.randomUUID(),
      academyId,
      userId,
      name: str(profile.name) || email.split("@")[0] || "Aluno",
      email: str(profile.email),
      phone: str(profile.phone),
      birthDate: "",
      division: "adult",
      belt: "white",
      stripes: 0,
      joinDate: dateCol(profile.created_at) || new Date().toISOString().slice(0, 10),
      lastPromotionDate: new Date().toISOString().slice(0, 10),
      status: "active",
      monthlyFee: 0,
      notes: "",
      avatarHue: num(profile.avatar_hue, 40),
    });
    if (userId) seenUser.add(userId);
    if (email) seenEmail.add(email);
  }

  return {
    version: 7,
    academy,
    users,
    students,
    classes: input.classes.map((c) => ({
      id: str(c.id),
      academyId,
      name: str(c.name),
      weekday: num(c.weekday),
      startTime: start(c.start_time),
      durationMin: num(c.duration_min, 60),
      instructorId: str(c.instructor_id),
      division: (str(c.division, "adult") as ClassSession["division"]) || "adult",
      gi: Boolean(c.gi),
      capacity: num(c.capacity, 24),
    })),
    attendance: input.attendance.map((x) => ({
      id: str(x.id),
      academyId,
      studentId: str(x.student_id),
      classId: str(x.class_id),
      date: dateCol(x.date) || str(x.date).slice(0, 10),
      checkedInAt: str(x.checked_in_at),
      method: (str(x.method, "manual") as Attendance["method"]) || "manual",
      status: attendanceStatusFromRow(x),
      validatedAt: str(x.validated_at) || undefined,
      validatedBy: str(x.validated_by) || undefined,
    })),
    payments: input.payments.map((p) => ({
      id: str(p.id),
      academyId,
      studentId: str(p.student_id),
      month: str(p.month),
      amount: num(p.amount),
      status: (str(p.status, "pending") as Payment["status"]) || "pending",
      paidAt: str(p.paid_at) || undefined,
      method: (p.method ? str(p.method) : undefined) as Payment["method"],
      asaasPaymentId: str(p.asaas_payment_id) || undefined,
      asaasInvoiceUrl: str(p.asaas_invoice_url) || undefined,
      asaasPixCopy: str(p.asaas_pix_copy) || undefined,
      asaasStatus: str(p.asaas_status) || undefined,
    })),
    expenses: input.expenses.map((e) => ({
      id: str(e.id),
      academyId,
      description: str(e.description),
      category: (str(e.category, "other") as Expense["category"]) || "other",
      amount: num(e.amount),
      date: str(e.date),
    })),
    inventory: input.inventory.map((i) => ({
      id: str(i.id),
      academyId,
      name: str(i.name),
      sku: str(i.sku),
      category: (str(i.category, "other") as InventoryItem["category"]) || "other",
      size: str(i.size) || undefined,
      quantity: num(i.quantity),
      minQuantity: num(i.min_quantity),
      cost: num(i.cost),
      price: num(i.price),
    })),
    graduations: input.graduations.map((g) => ({
      id: str(g.id),
      academyId,
      studentId: str(g.student_id),
      fromBelt: str(g.from_belt),
      toBelt: str(g.to_belt),
      stripes: num(g.stripes),
      date: str(g.date),
      notes: str(g.notes),
    })) as Graduation[],
    evaluations: input.evaluations.map((e) => ({
      id: str(e.id),
      academyId,
      studentId: str(e.student_id),
      date: str(e.date),
      instructorName: str(e.instructor_name),
      notes: str(e.notes),
      recommendPromotion: Boolean(e.recommend_promotion),
    })) as Evaluation[],
    posts: input.posts.map((p) => ({
      id: str(p.id),
      academyId,
      authorId: str(p.author_id),
      authorName: str(p.author_name),
      authorRole: (str(p.author_role, "owner") as Role) || "owner",
      content: str(p.content),
      pinned: Boolean(p.pinned),
      createdAt: str(p.created_at),
      likedBy: likesByPost.get(str(p.id)) ?? [],
    })) as Post[],
    events: input.events.map((e) => ({
      id: str(e.id),
      academyId,
      title: str(e.title),
      kind: (str(e.kind, "extra") as AcademyEvent["kind"]) || "extra",
      date: str(e.date),
      time: str(e.time),
      place: str(e.place),
      notes: str(e.notes),
      fee: num(e.fee),
      goingIds: goingByEvent.get(str(e.id)) ?? [],
    })),
    sales: input.sales.map((s) => ({
      id: str(s.id),
      academyId,
      studentId: str(s.student_id),
      itemId: str(s.item_id),
      itemName: str(s.item_name),
      quantity: num(s.quantity, 1),
      amount: num(s.amount),
      date: str(s.date),
      method: (str(s.method, "pix") as Sale["method"]) || "pix",
    })),
    dropIns: input.dropIns.map((d) => ({
      id: str(d.id),
      academyId,
      name: str(d.name),
      phone: str(d.phone),
      classId: str(d.class_id),
      date: str(d.date),
      amount: num(d.amount),
      method: (str(d.method, "pix") as DropIn["method"]) || "pix",
    })),
    session: input.session,
  };
}

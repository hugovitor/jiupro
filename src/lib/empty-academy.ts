import { uid, weekdayToday } from "./format";
import { generateJoinCode } from "./join-code";
import { DEMO_ACADEMY_ID } from "./seed";
import type { AppState, PlanId, User } from "./types";

export function slugify(name: string) {
  const base = name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "academia";
}

export function uniqueSlug(name: string, taken: string[]) {
  const base = slugify(name);
  if (!taken.includes(base)) return base;
  return `${base}-${uid("x").slice(-6)}`;
}

export function isDemoAcademy(id: string) {
  return id === DEMO_ACADEMY_ID;
}

export function createEmptyAcademy(input: {
  name: string;
  city: string;
  state?: string;
  ownerName: string;
  email: string;
  phone?: string;
  plan: PlanId;
  academyId?: string;
  ownerId?: string;
}): AppState {
  const academyId = input.academyId ?? crypto.randomUUID();
  const ownerId = input.ownerId ?? uid("u");
  const city = input.city.trim() || "Brasil";
  const uf = (input.state ?? "SP").trim().slice(0, 2).toUpperCase() || "SP";
  const today = weekdayToday();
  const owner: User = {
    id: ownerId,
    academyId,
    name: input.ownerName.trim(),
    email: input.email.trim().toLowerCase(),
    role: "owner",
    phone: input.phone?.trim() || "",
    avatarHue: 12,
  };

  return {
    version: 7,
    academy: {
      id: academyId,
      name: input.name.trim(),
      slug: slugify(input.name),
      city,
      state: uf,
      address: "",
      phone: owner.phone,
      instagram: "",
      pixKey: "",
      pixName: input.name.trim(),
      plan: input.plan,
      monthlyGoal: 8000,
      dropInFee: 40,
      createdAt: new Date().toISOString(),
      joinCode: generateJoinCode(),
      brandLogo: "",
      brandTagline: "",
    },
    users: [owner],
    students: [],
    classes: [
      {
        id: uid("c"),
        academyId,
        name: "Adultos Gi",
        weekday: today,
        startTime: "19:30",
        durationMin: 90,
        instructorId: ownerId,
        division: "adult",
        gi: true,
        capacity: 24,
      },
      {
        id: uid("c"),
        academyId,
        name: "Kids",
        weekday: (today + 2) % 7,
        startTime: "18:00",
        durationMin: 60,
        instructorId: ownerId,
        division: "kids",
        gi: true,
        capacity: 16,
      },
    ],
    attendance: [],
    payments: [],
    expenses: [],
    inventory: [],
    graduations: [],
    evaluations: [],
    posts: [],
    events: [],
    sales: [],
    dropIns: [],
    session: {
      userId: ownerId,
      academyId,
      role: "owner",
    },
  };
}

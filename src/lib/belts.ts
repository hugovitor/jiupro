import type { BeltId, Student } from "./types";

function ibjjfAge(birthDate: string) {
  if (!birthDate) return null;
  const y = Number(birthDate.slice(0, 4));
  if (!Number.isFinite(y) || y < 1920) return null;
  const year = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
    }).format(new Date()),
  );
  return year - y;
}

export type BeltMeta = {
  id: BeltId;
  label: string;
  group: "white" | "grey" | "yellow" | "orange" | "green" | "adult" | "master";
  body: string;
  center?: string;
  coral?: [string, string];
  tip: string;
  ink: string;
  maxDegrees: number;
  minAge?: number;
  maxAge?: number;
};

const BLACK = "#111111";
const WHITE = "#f4f1ea";
const RED = "#c41e3a";
const GREY = "#8b8680";
const YELLOW = "#eab308";
const ORANGE = "#ea580c";
const GREEN = "#3f7a4a";

export const KIDS_BELTS: BeltMeta[] = [
  { id: "white", label: "Branca", group: "white", body: WHITE, tip: BLACK, ink: "#1a1714", maxDegrees: 4 },
  { id: "grey_white", label: "Cinza e branca", group: "grey", body: GREY, center: WHITE, tip: BLACK, ink: "#f8fafc", maxDegrees: 4, minAge: 4, maxAge: 15 },
  { id: "grey", label: "Cinza", group: "grey", body: GREY, tip: BLACK, ink: "#f8fafc", maxDegrees: 4, minAge: 4, maxAge: 15 },
  { id: "grey_black", label: "Cinza e preta", group: "grey", body: GREY, center: BLACK, tip: BLACK, ink: "#f8fafc", maxDegrees: 4, minAge: 4, maxAge: 15 },
  { id: "yellow_white", label: "Amarela e branca", group: "yellow", body: YELLOW, center: WHITE, tip: BLACK, ink: "#1a1714", maxDegrees: 4, minAge: 7, maxAge: 15 },
  { id: "yellow", label: "Amarela", group: "yellow", body: YELLOW, tip: BLACK, ink: "#1a1714", maxDegrees: 4, minAge: 7, maxAge: 15 },
  { id: "yellow_black", label: "Amarela e preta", group: "yellow", body: YELLOW, center: BLACK, tip: BLACK, ink: "#1a1714", maxDegrees: 4, minAge: 7, maxAge: 15 },
  { id: "orange_white", label: "Laranja e branca", group: "orange", body: ORANGE, center: WHITE, tip: BLACK, ink: "#f8fafc", maxDegrees: 4, minAge: 10, maxAge: 15 },
  { id: "orange", label: "Laranja", group: "orange", body: ORANGE, tip: BLACK, ink: "#f8fafc", maxDegrees: 4, minAge: 10, maxAge: 15 },
  { id: "orange_black", label: "Laranja e preta", group: "orange", body: ORANGE, center: BLACK, tip: BLACK, ink: "#f8fafc", maxDegrees: 4, minAge: 10, maxAge: 15 },
  { id: "green_white", label: "Verde e branca", group: "green", body: GREEN, center: WHITE, tip: BLACK, ink: "#f8fafc", maxDegrees: 4, minAge: 13, maxAge: 15 },
  { id: "green", label: "Verde", group: "green", body: GREEN, tip: BLACK, ink: "#f8fafc", maxDegrees: 4, minAge: 13, maxAge: 15 },
  { id: "green_black", label: "Verde e preta", group: "green", body: GREEN, center: BLACK, tip: BLACK, ink: "#f8fafc", maxDegrees: 4, minAge: 13, maxAge: 15 },
];

export const ADULT_BELTS: BeltMeta[] = [
  { id: "white", label: "Branca", group: "adult", body: WHITE, tip: BLACK, ink: "#1a1714", maxDegrees: 4 },
  { id: "blue", label: "Azul", group: "adult", body: "#1e4fd7", tip: BLACK, ink: "#f8fafc", maxDegrees: 4, minAge: 16 },
  { id: "purple", label: "Roxa", group: "adult", body: "#6d28d9", tip: BLACK, ink: "#f8fafc", maxDegrees: 4, minAge: 16 },
  { id: "brown", label: "Marrom", group: "adult", body: "#7c3f16", tip: BLACK, ink: "#f8fafc", maxDegrees: 4, minAge: 18 },
  { id: "black", label: "Preta", group: "adult", body: BLACK, tip: RED, ink: "#f8fafc", maxDegrees: 6, minAge: 19 },
  { id: "coral_red_black", label: "Vermelha e preta", group: "master", body: RED, coral: [RED, BLACK], tip: WHITE, ink: "#f8fafc", maxDegrees: 0, minAge: 50 },
  { id: "coral_red_white", label: "Vermelha e branca", group: "master", body: RED, coral: [RED, WHITE], tip: WHITE, ink: "#1a1714", maxDegrees: 0, minAge: 57 },
  { id: "red", label: "Vermelha", group: "master", body: RED, tip: WHITE, ink: "#f8fafc", maxDegrees: 0, minAge: 67 },
];

const BY_ID = new Map<string, BeltMeta>(
  [...KIDS_BELTS, ...ADULT_BELTS].map((b) => [b.id, b]),
);

export const KIDS_ORDER: BeltId[] = KIDS_BELTS.map((b) => b.id);
export const ADULT_ORDER: BeltId[] = ADULT_BELTS.map((b) => b.id);

export const ALL_BELTS = ADULT_BELTS;

export function beltMeta(id: string): BeltMeta {
  return BY_ID.get(id) ?? ADULT_BELTS[0];
}

export function beltTipColor(id: string) {
  return beltMeta(id).tip;
}

export function maxDegrees(id: string) {
  return beltMeta(id).maxDegrees;
}

export function beltLabel(id: string, stripes: number) {
  const meta = beltMeta(id);
  if (meta.maxDegrees <= 0 || stripes <= 0) return `Faixa ${meta.label}`;
  const grau = stripes === 1 ? "1 grau" : `${stripes} graus`;
  return `Faixa ${meta.label} · ${grau}`;
}

export function beltsForDivision(division: "adult" | "kids") {
  return division === "kids" ? KIDS_BELTS : ADULT_BELTS;
}

export function nextAdultBelt(id: BeltId): BeltId | null {
  const i = ADULT_ORDER.indexOf(id);
  if (i < 0 || i >= ADULT_ORDER.length - 1) return null;
  return ADULT_ORDER[i + 1];
}

export function nextKidsBelt(id: BeltId): BeltId | null {
  const i = KIDS_ORDER.indexOf(id);
  if (i < 0 || i >= KIDS_ORDER.length - 1) return null;
  return KIDS_ORDER[i + 1];
}

/** Tempo mínimo IBJJF no grau atual para a próxima faixa (meses). Branca não tem mínimo oficial. */
export const MIN_MONTHS_IN_GRADE: Partial<Record<BeltId, number>> = {
  white: 8,
  blue: 24,
  purple: 18,
  brown: 12,
};

export function monthsForNextStep(student: Pick<Student, "belt" | "stripes" | "division">) {
  const max = maxDegrees(student.belt);
  if (student.division === "kids") return 4;
  if (student.belt === "black") {
    if (student.stripes < 3) return 36;
    if (student.stripes < 6) return 60;
    return 84;
  }
  if (student.belt === "coral_red_black") return 84;
  if (student.belt === "coral_red_white") return 120;
  if (max > 0 && student.stripes < max) return 3;
  return MIN_MONTHS_IN_GRADE[student.belt] ?? 8;
}

export function kidsToAdultBelt(belt: string): BeltId {
  if (belt === "white") return "white";
  if (belt.startsWith("green")) return "blue";
  return "blue";
}

export function nextGraduation(
  student: Pick<Student, "belt" | "stripes" | "division" | "birthDate">,
): { belt: BeltId; stripes: number; division: Student["division"] } {
  const max = maxDegrees(student.belt);

  if (student.division === "kids") {
    if (student.stripes < max) {
      return {
        belt: student.belt,
        stripes: student.stripes + 1,
        division: "kids",
      };
    }
    const next = nextKidsBelt(student.belt);
    if (next) {
      return { belt: next, stripes: 0, division: "kids" };
    }
    const age = ibjjfAge(student.birthDate);
    if (age != null && age >= 16) {
      return {
        belt: kidsToAdultBelt(student.belt),
        stripes: 0,
        division: "adult",
      };
    }
    return {
      belt: student.belt,
      stripes: max,
      division: "kids",
    };
  }

  if (max > 0 && student.stripes < max) {
    return {
      belt: student.belt,
      stripes: student.stripes + 1,
      division: "adult",
    };
  }
  const next = nextAdultBelt(student.belt);
  if (!next) {
    return {
      belt: student.belt,
      stripes: student.stripes,
      division: "adult",
    };
  }
  return { belt: next, stripes: 0, division: "adult" };
}

export function beltAgeHint(meta: BeltMeta) {
  if (meta.minAge && meta.maxAge) return `${meta.minAge}–${meta.maxAge} anos`;
  if (meta.minAge) return `${meta.minAge}+ anos`;
  return "qualquer idade";
}

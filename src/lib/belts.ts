import type { BeltId, KidsBeltId } from "./types";

export const ADULT_BELTS: {
  id: BeltId;
  label: string;
  swatch: string;
  ink: string;
}[] = [
  { id: "white", label: "Branca", swatch: "#f4f1ea", ink: "#1a1714" },
  { id: "blue", label: "Azul", swatch: "#1e4fd7", ink: "#f8fafc" },
  { id: "purple", label: "Roxa", swatch: "#6d28d9", ink: "#f8fafc" },
  { id: "brown", label: "Marrom", swatch: "#7c3f16", ink: "#f8fafc" },
  { id: "black", label: "Preta", swatch: "#14110e", ink: "#f8fafc" },
];

export const KIDS_BELTS: {
  id: KidsBeltId;
  label: string;
  swatch: string;
  ink: string;
}[] = [
  { id: "grey", label: "Cinza", swatch: "#8b8680", ink: "#f8fafc" },
  { id: "yellow", label: "Amarela", swatch: "#eab308", ink: "#1a1714" },
  { id: "orange", label: "Laranja", swatch: "#ea580c", ink: "#f8fafc" },
  { id: "green", label: "Verde", swatch: "#3f7a4a", ink: "#f8fafc" },
];

export const ALL_BELTS = [...ADULT_BELTS, ...KIDS_BELTS];

export function beltMeta(id: string) {
  return ALL_BELTS.find((b) => b.id === id) ?? ADULT_BELTS[0];
}

export function beltLabel(id: string, stripes: number) {
  const meta = beltMeta(id);
  if (stripes <= 0) return `Faixa ${meta.label}`;
  const grau = stripes === 1 ? "1 grau" : `${stripes} graus`;
  return `Faixa ${meta.label} · ${grau}`;
}

export const ADULT_ORDER: BeltId[] = [
  "white",
  "blue",
  "purple",
  "brown",
  "black",
];

export function nextAdultBelt(id: BeltId): BeltId | null {
  const i = ADULT_ORDER.indexOf(id);
  if (i < 0 || i >= ADULT_ORDER.length - 1) return null;
  return ADULT_ORDER[i + 1];
}

export const MIN_MONTHS_IN_GRADE: Record<BeltId, number> = {
  white: 8,
  blue: 18,
  purple: 18,
  brown: 12,
  black: 36,
};

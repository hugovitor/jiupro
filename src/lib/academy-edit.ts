import type { Academy, AcademyEvent, EventKind, InventoryCategory, InventoryItem } from "./types";

function parseMoney(raw: string | number | undefined) {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  const text = String(raw ?? "").trim();
  if (!text) return 0;
  const normalized = text.includes(",")
    ? text.replace(/\./g, "").replace(",", ".")
    : text;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : 0;
}

export type AcademyHousePatch = {
  name: string;
  city: string;
  state?: string;
  address?: string;
  phone?: string;
  instagram?: string;
  monthlyGoal?: string | number;
};

export function normalizeAcademyHouse(
  input: AcademyHousePatch,
): Partial<Pick<Academy, "name" | "city" | "state" | "address" | "phone" | "instagram" | "monthlyGoal">> | { error: string } {
  const name = input.name.trim();
  const place = input.city.trim();
  if (!name || !place) return { error: "Informe o nome e a cidade da academia." };
  const placeMatch = place.match(/^(.*?),\s*([A-Za-z]{2})$/);
  const city = placeMatch ? placeMatch[1].trim() : place;
  const state = (input.state ?? (placeMatch ? placeMatch[2] : "")).trim().toUpperCase().slice(0, 2);
  const instagram = (input.instagram ?? "").trim().replace(/^@/, "");
  const monthlyGoal = Math.max(0, Math.round(parseMoney(input.monthlyGoal)));
  return {
    name,
    city,
    state: state || "SP",
    address: (input.address ?? "").trim(),
    phone: (input.phone ?? "").trim(),
    instagram,
    monthlyGoal,
  };
}

const EVENT_KINDS: EventKind[] = [
  "seminar",
  "championship",
  "openmat",
  "extra",
  "graduation",
];

export type AcademyEventInput = {
  title: string;
  kind: string;
  date: string;
  time: string;
  place: string;
  notes?: string;
  fee?: string | number;
};

export function normalizeAcademyEvent(
  input: AcademyEventInput,
): Omit<AcademyEvent, "id" | "academyId" | "goingIds"> | { error: string } {
  const title = input.title.replace(/\s+/g, " ").trim().slice(0, 120);
  if (title.length < 2) return { error: "Informe o título do evento." };
  const date = (input.date ?? "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Informe a data do evento." };
  const kind = (EVENT_KINDS.includes(input.kind as EventKind) ? input.kind : "extra") as EventKind;
  const time = (input.time ?? "").trim().slice(0, 8) || "10:00";
  return {
    title,
    kind,
    date,
    time,
    place: (input.place ?? "").trim().slice(0, 120) || "Tatame principal",
    notes: (input.notes ?? "").trim().slice(0, 500),
    fee: Math.max(0, Math.round(parseMoney(input.fee) * 100) / 100),
  };
}

const INVENTORY_CATEGORIES: InventoryCategory[] = [
  "kimono",
  "belt",
  "apparel",
  "gear",
  "other",
];

export type InventoryItemInput = {
  name: string;
  sku?: string;
  category?: string;
  size?: string;
  quantity?: string | number;
  minQuantity?: string | number;
  cost?: string | number;
  price?: string | number;
};

export function normalizeInventoryItem(
  input: InventoryItemInput,
): Omit<InventoryItem, "id" | "academyId"> | { error: string } {
  const name = input.name.replace(/\s+/g, " ").trim().slice(0, 80);
  if (!name) return { error: "Informe o nome do item." };
  const category = (
    INVENTORY_CATEGORIES.includes(input.category as InventoryCategory)
      ? input.category
      : "other"
  ) as InventoryCategory;
  const sku =
    (input.sku ?? "").trim().slice(0, 24) || name.slice(0, 6).toUpperCase();
  return {
    name,
    sku,
    category,
    size: (input.size ?? "").trim().slice(0, 16) || undefined,
    quantity: Math.max(0, Math.round(parseMoney(input.quantity))),
    minQuantity: Math.max(0, Math.round(parseMoney(input.minQuantity) || 2)),
    cost: Math.max(0, Math.round(parseMoney(input.cost) * 100) / 100),
    price: Math.max(0, Math.round(parseMoney(input.price) * 100) / 100),
  };
}

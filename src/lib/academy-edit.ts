import type { Academy } from "./types";

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

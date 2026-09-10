import { slugify } from "@/lib/empty-academy";
import { collapseAcademyKey, looksLikeHouseCode } from "@/lib/join-code";

export type HouseRow = {
  id: string;
  name: string | null;
  slug: string | null;
  city: string | null;
  state?: string | null;
  join_code: string | null;
  created_at?: string | null;
};

export type HouseNeedle = {
  joinCode?: string;
  slug?: string;
  name?: string;
  city?: string;
};

export function cityKey(value: string | null | undefined) {
  return collapseAcademyKey(value ?? "");
}

export function houseNameKey(value: string | null | undefined) {
  return collapseAcademyKey(value ?? "");
}

export function slugBase(slug: string | null | undefined) {
  const raw = (slug ?? "").trim().toLowerCase();
  return raw.replace(/-[a-f0-9]{6}$/i, "") || raw;
}

export function isSuffixedSlug(slug: string | null | undefined, name?: string | null) {
  const raw = (slug ?? "").trim().toLowerCase();
  if (!/-[a-f0-9]{6}$/i.test(raw)) return false;
  if (!name) return true;
  return slugBase(raw) === slugify(name);
}

export function housesSharePlace(a: HouseRow, b: HouseNeedle) {
  const code = (a.join_code ?? "").trim().toUpperCase();
  const needleCode = (b.joinCode ?? "").trim().toUpperCase();
  if (looksLikeHouseCode(needleCode) && code && code === needleCode) return true;

  const slug = (a.slug ?? "").trim().toLowerCase();
  const needleSlug = (b.slug ?? "").trim().toLowerCase();
  if (slug && needleSlug && slug === needleSlug) return true;
  if (slug && needleSlug && slugBase(slug) === slugBase(needleSlug) && slugBase(slug).length >= 4) {
    return true;
  }

  const nameA = houseNameKey(a.name);
  const nameB = houseNameKey(b.name);
  if (!nameA || !nameB || nameA !== nameB) return false;
  const cityA = cityKey(a.city);
  const cityB = cityKey(b.city);
  return !cityA || !cityB || cityA === cityB;
}

function createdMs(row: HouseRow) {
  const raw = row.created_at ? Date.parse(row.created_at) : NaN;
  return Number.isFinite(raw) ? raw : Number.MAX_SAFE_INTEGER;
}

/** Academia original: a mais antiga, slug sem sufixo aleatório. */
export function pickCanonicalHouse(houses: HouseRow[]): HouseRow | null {
  if (!houses.length) return null;
  return [...houses].sort((a, b) => {
    const time = createdMs(a) - createdMs(b);
    if (time !== 0) return time;
    const suffix = Number(isSuffixedSlug(a.slug, a.name)) - Number(isSuffixedSlug(b.slug, b.name));
    if (suffix !== 0) return suffix;
    return (a.slug ?? "").length - (b.slug ?? "").length;
  })[0] ?? null;
}

export function findMatchingHouses(houses: HouseRow[], needle: HouseNeedle) {
  return houses.filter((row) => housesSharePlace(row, needle));
}

export function resolveCanonicalHouse(houses: HouseRow[], needle: HouseNeedle) {
  return pickCanonicalHouse(findMatchingHouses(houses, needle));
}

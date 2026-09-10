import { publicAppUrl } from "@/lib/app-url";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateJoinCode() {
  const bytes = new Uint8Array(6);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 6; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let out = "";
  for (const byte of bytes) out += ALPHABET[byte % ALPHABET.length];
  return out;
}

export function looksLikeHouseCode(value: string) {
  return /^[A-HJ-NP-Z2-9]{6}$/i.test(value.trim());
}

/** Nome/slug/código comparáveis: sem acento, espaço ou hífen. */
export function collapseAcademyKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function normalizeJoinInput(value: string) {
  const trimmed = value.trim();
  if (looksLikeHouseCode(trimmed)) return trimmed.toUpperCase();
  return trimmed.replace(/\s+/g, " ");
}

export function studentJoinPath(code: string) {
  return `/entrar/${encodeURIComponent(normalizeJoinInput(code))}`;
}

export function studentJoinUrl(code: string, origin?: string) {
  const base = (origin ?? publicAppUrl()).replace(/\/$/, "");
  return `${base}${studentJoinPath(code)}`;
}

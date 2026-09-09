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

export function normalizeJoinInput(value: string) {
  return value.trim().replace(/\s+/g, "");
}

export function studentJoinPath(code: string) {
  return `/entrar/${encodeURIComponent(normalizeJoinInput(code))}`;
}

export function studentJoinUrl(code: string, origin?: string) {
  const base = (origin ?? (typeof window !== "undefined" ? window.location.origin : "")).replace(
    /\/$/,
    "",
  );
  return `${base}${studentJoinPath(code)}`;
}

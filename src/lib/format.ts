const TZ = "America/Sao_Paulo";
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDate(date: Date) {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

/** Date-only values are calendar days, not UTC midnights. */
export function parseDate(iso: string) {
  const raw = String(iso ?? "").trim();
  if (!raw) return new Date();
  if (DATE_ONLY.test(raw.slice(0, 10))) {
    const d = new Date(`${raw.slice(0, 10)}T12:00:00.000Z`);
    if (isValidDate(d)) return d;
  }
  const d = new Date(raw);
  return isValidDate(d) ? d : new Date();
}

function civilParts(date: Date) {
  const safe = isValidDate(date) ? date : new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(safe);
  const n = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  return { year: n("year"), month: n("month"), day: n("day") };
}

export function brl(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(iso: string) {
  const d = parseDate(iso);
  if (!iso?.trim() || !isValidDate(d)) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: TZ,
  }).format(d);
}

export function formatDay(iso: string) {
  const d = parseDate(iso);
  if (!iso?.trim()) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: TZ,
  }).format(d);
}

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(parseDate(iso));
}

export function weekdayName(day: number) {
  return ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"][day] ?? "";
}

export function weekdayFull(day: number) {
  return [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ][day];
}

export function weekdayToday() {
  const { year, month, day } = civilParts(new Date());
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function currentMonth() {
  const { year, month } = civilParts(new Date());
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: TZ,
  }).format(new Date(Date.UTC(y, (m ?? 1) - 1, 1, 12)));
}

export function monthsBetween(fromIso: string, to = new Date()) {
  const from = civilParts(parseDate(fromIso));
  const now = civilParts(to);
  return (now.year - from.year) * 12 + (now.month - from.month);
}

export function daysSince(iso: string) {
  const from = civilParts(parseDate(iso));
  const now = civilParts(new Date());
  const a = Date.UTC(from.year, from.month - 1, from.day);
  const b = Date.UTC(now.year, now.month - 1, now.day);
  return Math.round((b - a) / 86_400_000);
}

export function isoDate(offsetDays = 0) {
  const { year, month, day } = civilParts(new Date());
  return new Date(Date.UTC(year, month - 1, day + offsetDays))
    .toISOString()
    .slice(0, 10);
}

/** Minutos desde meia-noite em America/Sao_Paulo, ou a partir de "HH:MM". */
export function minutes(input: Date | string) {
  if (typeof input === "string") {
    const hm = input.trim().match(/^(\d{1,2}):(\d{2})/);
    if (hm) return Number(hm[1]) * 60 + Number(hm[2]);
  }
  const d = typeof input === "string" ? new Date(input) : input;
  if (!isValidDate(d)) return 0;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(d);
  const n = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  return n("hour") * 60 + n("minute");
}

export function clockLabel(date = new Date()) {
  const t = minutes(date);
  const h = Math.floor(t / 60);
  const m = t % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function uid(_prefix = "id") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${_prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, (m ?? 1) - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const body = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(";"),
    )
    .join("\n");
  const blob = new Blob([`\ufeff${body}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

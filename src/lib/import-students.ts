import { ADULT_BELTS, KIDS_BELTS } from "./belts";
import type { BeltId, Student } from "./types";

export type ImportedStudent = Omit<Student, "id" | "academyId" | "userId" | "avatarHue">;

const BELT_ALIAS: Record<string, BeltId> = Object.fromEntries(
  [...ADULT_BELTS, ...KIDS_BELTS].flatMap((belt) => [
    [normalizeKey(belt.id), belt.id],
    [normalizeKey(belt.label), belt.id],
  ]),
);

function normalizeKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function cell(row: Record<string, string>, ...keys: string[]) {
  for (const key of keys) {
    const want = normalizeKey(key);
    const direct = row[want];
    if (direct?.trim()) return direct.trim();
    const hit = Object.entries(row).find(
      ([header, value]) => header.includes(want) && Boolean(value?.trim()),
    );
    if (hit) return hit[1].trim();
  }
  return "";
}

function parseBelt(raw: string, division: Student["division"]): BeltId {
  const key = normalizeKey(raw);
  if (!key) return "white";
  const direct = BELT_ALIAS[key];
  if (direct) return direct;
  if (key.includes("azul")) return "blue";
  if (key.includes("rox")) return "purple";
  if (key.includes("marrom") || key.includes("brown")) return "brown";
  if (key.includes("pret") || key.includes("black")) return "black";
  if (division === "kids" && key.includes("cinza")) return "grey";
  return "white";
}

function parseFee(raw: string) {
  if (!raw.trim()) return 0;
  const n = Number(raw.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function parseStatus(raw: string): Student["status"] {
  const key = normalizeKey(raw);
  if (!key) return "active";
  if (key === "i" || key === "n") return "inactive";
  if (
    key.includes("inativ") ||
    key.includes("paus") ||
    key.includes("tranc") ||
    key.includes("cancel") ||
    key.includes("exaluno")
  ) {
    return "inactive";
  }
  if (key.includes("exp") || key.includes("trial") || key.includes("aula")) return "trial";
  return "active";
}

function parseDivision(raw: string, belt: BeltId): Student["division"] {
  const key = normalizeKey(raw);
  if (key.includes("kid") || key.includes("infan") || key.includes("crianc")) return "kids";
  if (belt.includes("grey") || belt.includes("yellow") || belt.includes("orange") || belt.includes("green_")) {
    return "kids";
  }
  return "adult";
}

function parseCsv(text: string): Record<string, string>[] {
  const raw = text.replace(/^\uFEFF/, "").trim();
  if (!raw) return [];
  const lines = raw.split(/\r?\n/).filter((line) => line.trim());
  const delim = (lines[0]?.split(";").length ?? 0) > (lines[0]?.split(",").length ?? 0) ? ";" : ",";
  const headers = splitLine(lines[0] ?? "", delim).map((h) => normalizeKey(h));
  return lines.slice(1).map((line) => {
    const cols = splitLine(line, delim);
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = cols[i] ?? "";
    });
    return row;
  });
}

function splitLine(line: string, delim: string) {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (ch === delim && !quoted) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((v) => v.trim());
}

export function parseStudentCsv(text: string): { rows: ImportedStudent[]; errors: string[] } {
  const table = parseCsv(text);
  const errors: string[] = [];
  const rows: ImportedStudent[] = [];
  table.forEach((row, index) => {
    const name = cell(row, "nome", "name", "aluno");
    if (!name) {
      errors.push(`Linha ${index + 2}: falta o nome.`);
      return;
    }
    const beltRaw = cell(row, "faixa", "belt");
    const divisionRaw = cell(row, "divisao", "division", "turma");
    const belt = parseBelt(beltRaw, divisionRaw.toLowerCase().includes("kid") ? "kids" : "adult");
    const division = parseDivision(divisionRaw, belt);
    const guardianName = cell(row, "responsavel", "guardian", "mae", "pai") || undefined;
    if (division === "kids" && !guardianName) {
      errors.push(`Linha ${index + 2}: kids precisa do responsável (LGPD).`);
      return;
    }
    rows.push({
      name,
      email: cell(row, "email", "e-mail", "mail"),
      phone: cell(row, "whatsapp", "telefone", "phone", "celular"),
      birthDate: cell(row, "nascimento", "birthdate", "datanascimento"),
      guardianName,
      division,
      belt,
      stripes: Number(cell(row, "graus", "stripes")) || 0,
      joinDate: cell(row, "entrada", "joindate", "desde") || new Date().toISOString().slice(0, 10),
      lastPromotionDate: cell(row, "graduacao", "lastpromotion") || new Date().toISOString().slice(0, 10),
      status: parseStatus(cell(row, "status", "situacao")),
      monthlyFee: parseFee(cell(row, "mensalidade", "valor", "fee", "mensal")),
      notes: cell(row, "obs", "notas", "notes"),
      cpf: cell(row, "cpf") || undefined,
    });
  });
  return { rows, errors };
}

export const STUDENT_CSV_TEMPLATE = `nome,whatsapp,email,faixa,mensalidade,status,divisao,responsavel
Pedro Lima,11988887777,pedro@email.com,branca,180,ativo,adulto,
Ana Kids,11977776666,,cinza,150,experimental,kids,Carla Lima
`;

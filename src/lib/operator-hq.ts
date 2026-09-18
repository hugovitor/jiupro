import { waHref } from "@/lib/whatsapp";
import { planById } from "@/lib/plans";
import type { BillingStatus, PlanId } from "@/lib/types";

export const OPERATOR_SECTIONS = [
  { id: "visao", label: "Visão" },
  { id: "academias", label: "Academias" },
  { id: "planilha", label: "Planilha" },
  { id: "cupons", label: "Cupons" },
  { id: "sistema", label: "Sistema" },
] as const;

export type OperatorSection = (typeof OPERATOR_SECTIONS)[number]["id"];

export const BILLING_LABELS: Record<BillingStatus, string> = {
  none: "Sem cobrança",
  incomplete: "Cartão incompleto",
  trialing: "Trial",
  active: "Ativa",
  past_due: "Atrasada",
  unpaid: "Não paga",
  canceled: "Encerrada",
};

export type OperatorAcademy = {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  phone: string;
  instagram: string;
  joinCode: string;
  plan: PlanId;
  planLabel: string;
  planPrice: number;
  billingStatus: BillingStatus;
  subscribed: boolean;
  ownerEmail: string;
  ownerName: string;
  ownerPhone: string;
  students: number;
  activeStudents: number;
  staff: number;
  createdAt: string;
  updatedAt: string;
};

export type OperatorPromo = {
  id: string;
  code: string;
  email: string;
  note: string;
  kind: string;
  summary: string;
  timesRedeemed: number;
  maxRedemptions: number | null;
};

export type OperatorHealth = {
  supabase: boolean;
  serviceRole: boolean;
  stripe: boolean;
  redis: boolean;
  env: string;
};

export type OperatorLeadDigest = {
  total: number;
  byStatus: Record<string, number>;
  followUpsDue: Array<{
    id: string;
    academyName: string;
    city: string;
    phone: string;
    status: string;
    followUpOn: string;
  }>;
};

export type OperatorStats = {
  academies: number;
  students: number;
  mrr: number;
  granted: number;
  trialing: number;
  pastDue: number;
  byPlan: Record<PlanId, number>;
};

export type OperatorOverview = {
  operator: string;
  trialDays: number;
  trialLabel: string | null;
  stripe: boolean;
  codes: OperatorPromo[];
  academies: OperatorAcademy[];
  stats: OperatorStats;
  health: OperatorHealth;
  leads: OperatorLeadDigest;
};

export function isPlanId(value: string): value is PlanId {
  return value === "essencial" || value === "academia" || value === "equipe";
}

export function todayISODate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(now);
}

export function isFollowUpDue(followUpOn: string, today = todayISODate()) {
  const day = followUpOn.trim().slice(0, 10);
  return Boolean(day) && day <= today;
}

export function summarizeOperatorAcademies(
  rows: Array<Pick<OperatorAcademy, "plan" | "planPrice" | "billingStatus" | "subscribed" | "students">>,
): OperatorStats {
  const byPlan: Record<PlanId, number> = { essencial: 0, academia: 0, equipe: 0 };
  let mrr = 0;
  let granted = 0;
  let trialing = 0;
  let pastDue = 0;
  let students = 0;

  for (const row of rows) {
    byPlan[row.plan] += 1;
    students += row.students;
    if (row.billingStatus === "trialing") trialing += 1;
    if (row.billingStatus === "past_due" || row.billingStatus === "unpaid") pastDue += 1;
    if (row.billingStatus === "active" && !row.subscribed) granted += 1;
    if (row.billingStatus === "active") mrr += row.planPrice;
  }

  return {
    academies: rows.length,
    students,
    mrr,
    granted,
    trialing,
    pastDue,
    byPlan,
  };
}

export function academyPlanMeta(plan: string) {
  const id = isPlanId(plan) ? plan : "academia";
  const item = planById(id);
  return { id, planLabel: item.name, planPrice: item.price };
}

export function operatorOwnerWhatsApp(phone: string, academyName: string, ownerName: string) {
  const who = ownerName.trim().split(" ")[0] ?? "";
  const greeting = who ? `Fala, ${who}` : "Fala, professor";
  return waHref(
    phone,
    `${greeting}. Aqui é o Hugo, do TatameX. Tudo certo com a ${academyName}?`,
  );
}

export function healthGaps(health: OperatorHealth) {
  const gaps: string[] = [];
  if (!health.supabase) gaps.push("URL e chave anon do banco");
  if (!health.serviceRole) gaps.push("service role para ver academias");
  if (!health.stripe) gaps.push("Stripe para cobrança do plano");
  if (!health.redis) gaps.push("Redis para o limite de cadastro");
  return gaps;
}

import { planById } from "./plans";
import type { Academy, PlanId } from "./types";

const DEMO_ACADEMY_ID = "ac_origem";

export type PlanFeature =
  | "finance"
  | "inventory"
  | "promotions"
  | "board"
  | "pwa"
  | "evolutionReports"
  | "prioritySupport"
  | "academyBrand";

export const PLAN_STUDENT_LIMIT: Record<PlanId, number | null> = {
  essencial: 50,
  academia: 200,
  equipe: null,
};

const ACADEMIA_FEATURES: PlanFeature[] = [
  "finance",
  "inventory",
  "promotions",
  "board",
  "pwa",
];

const EQUIPE_FEATURES: PlanFeature[] = [
  ...ACADEMIA_FEATURES,
  "evolutionReports",
  "prioritySupport",
  "academyBrand",
];

export const PLAN_FEATURES: Record<PlanId, PlanFeature[]> = {
  essencial: [],
  academia: ACADEMIA_FEATURES,
  equipe: EQUIPE_FEATURES,
};

export const FEATURE_UPSELL: Record<
  PlanFeature,
  { title: string; body: string; plan: PlanId }
> = {
  finance: {
    title: "Financeiro completo",
    body: "Lançamentos, fechamento do mês e caixa da academia entram no plano Academia.",
    plan: "academia",
  },
  inventory: {
    title: "Estoque de kimonos e faixas",
    body: "Controle de peças, tamanho e venda no nome do aluno. Incluso no Academia.",
    plan: "academia",
  },
  promotions: {
    title: "Candidatos a graduação",
    body: "A fila com tempo + presença e o seminário de faixas ficam no plano Academia. O histórico de cada aluno continua na ficha.",
    plan: "academia",
  },
  board: {
    title: "Mural da academia",
    body: "Avisos, recados e a timeline que o aluno vê no app. Incluso no Academia.",
    plan: "academia",
  },
  pwa: {
    title: "PWA dos alunos",
    body: "O aluno instala o app da academia na tela inicial. Incluso no Academia.",
    plan: "academia",
  },
  evolutionReports: {
    title: "Relatórios de evolução",
    body: "Presença, risco de evasão e fila de graduação da equipe inteira. Só no Equipe.",
    plan: "equipe",
  },
  prioritySupport: {
    title: "Prioridade no suporte",
    body: "WhatsApp com fila prioritária para dono de academia no plano Equipe.",
    plan: "equipe",
  },
  academyBrand: {
    title: "Marca da academia no app",
    body: "O app do aluno abre com o nome da sua academia, não só o TatameX. Só no Equipe.",
    plan: "equipe",
  },
};

export function isDemoAcademy(academy: Pick<Academy, "id">) {
  return academy.id === DEMO_ACADEMY_ID;
}

export function effectivePlan(academy: Pick<Academy, "id" | "plan">): PlanId {
  if (isDemoAcademy(academy)) return "equipe";
  return academy.plan;
}

export function studentLimit(academy: Pick<Academy, "id" | "plan">): number | null {
  if (isDemoAcademy(academy)) return null;
  return PLAN_STUDENT_LIMIT[academy.plan] ?? PLAN_STUDENT_LIMIT.academia;
}

export function studentLimitForPlan(plan: string | null | undefined): number | null {
  if (plan === "essencial") return 50;
  if (plan === "equipe") return null;
  return 200;
}

export function hasFeature(
  academy: Pick<Academy, "id" | "plan">,
  feature: PlanFeature,
): boolean {
  return PLAN_FEATURES[effectivePlan(academy)].includes(feature);
}

export function canAddStudent(
  academy: Pick<Academy, "id" | "plan">,
  currentCount: number,
): boolean {
  const limit = studentLimit(academy);
  return limit == null || currentCount < limit;
}

export function studentCapMessage(academy: Pick<Academy, "id" | "plan">) {
  const limit = studentLimit(academy);
  if (limit == null) return "Não dá para cadastrar mais alunos agora.";
  if (academy.plan === "essencial") {
    return `O Essencial comporta até ${limit} alunos. Passe para o Academia (200) ou Equipe (ilimitado) para cadastrar mais.`;
  }
  return `O Academia comporta até ${limit} alunos. Passe para o Equipe para cadastro ilimitado.`;
}

export function joinStudentCapMessage(limit: number) {
  return `Esta academia chegou ao limite de ${limit} alunos do plano atual. Fale com a secretaria.`;
}

export function planUsageLabel(
  academy: Pick<Academy, "id" | "plan">,
  currentCount: number,
) {
  const plan = planById(effectivePlan(academy));
  const limit = studentLimit(academy);
  if (limit == null) return `${currentCount} alunos · ${plan.name} ilimitado`;
  return `${currentCount}/${limit} alunos · plano ${plan.name}`;
}

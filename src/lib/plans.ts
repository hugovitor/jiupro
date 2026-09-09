import type { PlanId } from "./types";

export type Plan = {
  id: PlanId;
  name: string;
  price: number;
  students: number | "Ilimitado";
  blurb: string;
  popular?: boolean;
  features: string[];
};

export const PLANS: Plan[] = [
  {
    id: "essencial",
    name: "Essencial",
    price: 97,
    students: 50,
    blurb: "Para quem está saindo do caderno e do WhatsApp.",
    features: [
      "Até 50 alunos",
      "Cadastro e mensalidades",
      "Presença nas turmas",
      "Histórico de faixas",
      "1 unidade",
    ],
  },
  {
    id: "academia",
    name: "Academia",
    price: 197,
    students: 200,
    blurb: "O plano da maioria das academias que crescem.",
    popular: true,
    features: [
      "Até 200 alunos",
      "Financeiro completo",
      "Estoque de kimonos e faixas",
      "Candidatos a graduação",
      "Mural da academia",
      "PWA dos alunos",
    ],
  },
  {
    id: "equipe",
    name: "Equipe",
    price: 347,
    students: "Ilimitado",
    blurb: "Para equipes com competição e várias turmas.",
    features: [
      "Alunos ilimitados",
      "Tudo do plano Academia",
      "Relatórios de evolução",
      "Prioridade no suporte",
      "Marca da academia no app",
    ],
  },
];

export function planById(id: PlanId) {
  return PLANS.find((p) => p.id === id) ?? PLANS[1];
}

export function planCapacityLabel(plan: Plan) {
  return plan.students === "Ilimitado"
    ? "Alunos ilimitados"
    : `Até ${plan.students} alunos`;
}

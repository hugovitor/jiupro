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
      "Cadastro, experimentais e turmas",
      "Mensalidade no WhatsApp + Pix",
      "Presença nas turmas",
      "Histórico de faixas",
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
      "Financeiro, cobranças e fechamento",
      "Estoque e venda no nome do aluno",
      "Agenda, mural e candidatos a faixa",
      "Aplicativo do aluno (PWA)",
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
      "Relatórios de evolução e retenção",
      "Marca da academia no app do aluno",
      "Prioridade no WhatsApp",
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

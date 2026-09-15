import { DEMO_ACADEMY_ID } from "./seed";
import type { Academy, BillingStatus } from "./types";

const BLOCKED: BillingStatus[] = ["past_due", "unpaid", "canceled", "incomplete"];

export function normalizeDueDay(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 10;
  return Math.min(28, Math.max(1, Math.round(n)));
}

export function normalizeBillingStatus(value: unknown): BillingStatus {
  if (
    value === "none" ||
    value === "incomplete" ||
    value === "trialing" ||
    value === "active" ||
    value === "past_due" ||
    value === "unpaid" ||
    value === "canceled"
  ) {
    return value;
  }
  return "none";
}

export function billingFromStripe(status: string | null | undefined): BillingStatus {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "unpaid":
      return "unpaid";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    case "incomplete":
    case "paused":
      return "incomplete";
    default:
      return "none";
  }
}

export function academyNeedsPayment(academy: Pick<Academy, "id" | "billingStatus" | "stripeSubscriptionId">, stripeLive: boolean) {
  if (!stripeLive) return false;
  if (academy.id === DEMO_ACADEMY_ID) return false;
  if (BLOCKED.includes(academy.billingStatus)) return true;
  if (academy.billingStatus === "trialing" || academy.billingStatus === "active") return false;
  if (academy.stripeSubscriptionId.trim()) return false;
  return true;
}

export function billingLockCopy(status: BillingStatus) {
  if (status === "past_due" || status === "unpaid") {
    return {
      title: "Assinatura em atraso",
      body: "O cartão da academia não passou. Atualize o pagamento para voltar a operar o painel. Os alunos continuam no Pix da casa.",
      action: "Atualizar cartão",
    };
  }
  if (status === "canceled") {
    return {
      title: "Assinatura encerrada",
      body: "Escolha de novo o plano do TatameX para reabrir o painel. Dados da academia continuam guardados.",
      action: "Assinar de novo",
    };
  }
  return {
    title: "Conclua a assinatura",
    body: "A academia já existe. Falta o cartão do TatameX — a mensalidade do aluno continua no seu Pix.",
    action: "Pagar e entrar",
  };
}

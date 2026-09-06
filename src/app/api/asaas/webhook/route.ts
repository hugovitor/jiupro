import { createClient } from "@supabase/supabase-js";
import { asaasPaid } from "@/lib/asaas/client";
import { asaasEnvironment, asaasWebhookToken } from "@/lib/asaas/env";

export const runtime = "nodejs";

type AsaasWebhookBody = {
  event?: string;
  payment?: {
    id?: string;
    status?: string;
    externalReference?: string | null;
    billingType?: string;
    paymentDate?: string;
    confirmedDate?: string;
  };
};

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET() {
  return Response.json({
    ok: true,
    service: "jiupro-asaas-webhook",
    hint: "O Asaas deve enviar POST neste endereço.",
  });
}

export async function POST(req: Request) {
  const expected = asaasWebhookToken();
  const sent = req.headers.get("asaas-access-token") ?? "";
  if (asaasEnvironment() === "production" && !expected) {
    return Response.json({ error: "ASAAS_WEBHOOK_TOKEN ausente." }, { status: 500 });
  }
  if (expected && sent !== expected) {
    return Response.json({ error: "Token do webhook inválido." }, { status: 401 });
  }

  let body: AsaasWebhookBody;
  try {
    body = (await req.json()) as AsaasWebhookBody;
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const event = body.event ?? "";
  const payment = body.payment;
  const paidEvent =
    event === "PAYMENT_RECEIVED" ||
    event === "PAYMENT_CONFIRMED" ||
    (payment?.status ? asaasPaid(payment.status) : false);

  if (!paidEvent || !payment?.id) {
    return Response.json({ received: true, ignored: true, event });
  }

  const admin = supabaseAdmin();
  if (admin) {
    const paidAt = payment.paymentDate || payment.confirmedDate || new Date().toISOString();
    const patch = {
      status: "paid",
      method: "pix",
      paid_at: paidAt,
      asaas_payment_id: payment.id,
    };
    if (payment.externalReference) {
      await admin.from("payments").update(patch).eq("id", payment.externalReference);
    } else {
      await admin.from("payments").update(patch).eq("asaas_payment_id", payment.id);
    }
  }

  return Response.json({ received: true, event, paymentId: payment.id });
}

import { isoDate, monthLabel } from "@/lib/format";
import { isCpf } from "@/lib/cpf";
import { AsaasApiError, asaasPaid, createAsaasClient } from "@/lib/asaas/client";
import { asaasApiKeyFromEnv, resolveAsaasKey } from "@/lib/asaas/env";
import { requireAcademyStaff } from "@/lib/api-auth";
import { normalizeDueDay } from "@/lib/billing-status";

export const runtime = "nodejs";

type ChargeBody = {
  apiKey?: string;
  paymentId?: string;
  asaasPaymentId?: string;
  academyName?: string;
  student?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    cpf?: string;
    asaasCustomerId?: string;
  };
  amount?: number;
  month?: string;
};

function dueDate(dueDay: number) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = Math.min(normalizeDueDay(dueDay), 28);
  const target = new Date(year, month, day);
  if (target.getTime() <= now.getTime()) {
    return isoDate(5);
  }
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export async function POST(req: Request) {
  const auth = await requireAcademyStaff(req);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  let body: ChargeBody;
  try {
    body = (await req.json()) as ChargeBody;
  } catch {
    return Response.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const serverKey = asaasApiKeyFromEnv();
  const key = serverKey || resolveAsaasKey(body.apiKey);
  if (!key) {
    return Response.json(
      { error: "Asaas não configurado. Cole a API key sandbox em Configurações." },
      { status: 400 },
    );
  }

  const student = body.student;
  const amount = Number(body.amount);
  const paymentId = String(body.paymentId ?? "").trim();
  if (!student?.id || !student.name || !paymentId || !Number.isFinite(amount) || amount <= 0) {
    return Response.json({ error: "Dados da cobrança incompletos." }, { status: 400 });
  }
  if (!isCpf(student.cpf ?? "")) {
    return Response.json(
      {
        error:
          "O Asaas exige CPF do pagador. Informe o CPF do aluno (ou do responsável, no kids) e gere de novo.",
        needsCpf: true,
      },
      { status: 400 },
    );
  }

  const house = await auth.admin
    .from("academies")
    .select("name, due_day")
    .eq("id", auth.academyId)
    .maybeSingle();
  const academyName = String(house.data?.name ?? body.academyName ?? "TatameX");
  const due = dueDate(Number(house.data?.due_day ?? 10));

  const client = createAsaasClient(key);
  try {
    let customerId = student.asaasCustomerId?.trim() || "";
    if (!customerId) {
      const existing = await client.findCustomer(student.id);
      if (existing) customerId = existing.id;
    }
    if (!customerId) {
      const created = await client.createCustomer({
        name: student.name,
        cpfCnpj: student.cpf!,
        email: student.email,
        mobilePhone: student.phone,
        externalReference: student.id,
      });
      customerId = created.id;
    }

    const month = body.month || "";
    const charge = await client.createPixCharge({
      customer: customerId,
      value: Math.round(amount * 100) / 100,
      dueDate: due,
      description: `Mensalidade ${month ? monthLabel(month) : ""} — ${student.name} — ${academyName}`.trim(),
      externalReference: paymentId,
    });
    const pix = await client.pixQrCode(charge.id);

    return Response.json({
      ok: true,
      environment: client.env,
      asaasCustomerId: customerId,
      asaasPaymentId: charge.id,
      invoiceUrl: charge.invoiceUrl,
      pixCopy: pix.payload,
      pixImage: pix.encodedImage,
      status: charge.status,
      paid: asaasPaid(charge.status),
    });
  } catch (err) {
    const message = err instanceof AsaasApiError ? err.message : "Não criou a cobrança no Asaas.";
    const status = err instanceof AsaasApiError && err.status < 500 ? err.status : 502;
    return Response.json({ error: message }, { status });
  }
}

export async function GET(req: Request) {
  const auth = await requireAcademyStaff(req);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }
  const url = new URL(req.url);
  const id = url.searchParams.get("id")?.trim() ?? "";
  const serverKey = asaasApiKeyFromEnv();
  const key = serverKey || resolveAsaasKey(req.headers.get("x-asaas-key") ?? undefined);
  if (!id) return Response.json({ error: "Informe o id da cobrança." }, { status: 400 });
  if (!key) {
    return Response.json({ error: "Asaas não configurado." }, { status: 400 });
  }
  try {
    const client = createAsaasClient(key);
    const payment = await client.getPayment(id);
    let pix: { payload?: string; encodedImage?: string } = {};
    if (!asaasPaid(payment.status)) {
      try {
        pix = await client.pixQrCode(id);
      } catch {
        pix = {};
      }
    }
    return Response.json({
      ok: true,
      asaasPaymentId: payment.id,
      status: payment.status,
      paid: asaasPaid(payment.status),
      invoiceUrl: payment.invoiceUrl,
      pixCopy: pix.payload,
      pixImage: pix.encodedImage,
      externalReference: payment.externalReference,
    });
  } catch (err) {
    const message = err instanceof AsaasApiError ? err.message : "Não consultou o Asaas.";
    return Response.json({ error: message }, { status: 502 });
  }
}

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FormDialog } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAsaasBrowserConfig } from "@/lib/asaas/config";
import { formatCpf, isCpf } from "@/lib/cpf";
import { brl, monthLabel } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Payment, Student } from "@/lib/types";
import { overdueMessage, waHref } from "@/lib/whatsapp";

type ChargeResult = {
  ok?: boolean;
  error?: string;
  needsCpf?: boolean;
  asaasCustomerId?: string;
  asaasPaymentId?: string;
  invoiceUrl?: string;
  pixCopy?: string;
  pixImage?: string;
  status?: string;
  paid?: boolean;
  environment?: string;
};

function apiKeyHeader() {
  return getAsaasBrowserConfig()?.apiKey;
}

export function AsaasChargeButton({
  payment,
  student,
}: {
  payment: Payment;
  student: Student;
}) {
  const store = useStore();
  const [open, setOpen] = useState(false);
  const [cpf, setCpf] = useState(student.cpf ?? "");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ChargeResult | null>(null);
  const [configured, setConfigured] = useState(() =>
    Boolean(getAsaasBrowserConfig()?.apiKey),
  );

  useEffect(() => {
    if (configured) return;
    void fetch("/api/asaas/account")
      .then((r) => r.json())
      .then((data: { configured?: boolean }) => setConfigured(Boolean(data.configured)))
      .catch(() => undefined);
  }, [configured]);

  useEffect(() => {
    if (!open || !result?.asaasPaymentId || result.paid) return;
    const id = result.asaasPaymentId;
    const tick = window.setInterval(() => {
      void refresh(id);
    }, 6000);
    return () => window.clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, result?.asaasPaymentId, result?.paid]);

  async function refresh(asaasPaymentId: string) {
    const res = await fetch(
      `/api/asaas/charge?id=${encodeURIComponent(asaasPaymentId)}`,
      { headers: { "x-asaas-key": apiKeyHeader() ?? "" } },
    );
    const data = (await res.json()) as ChargeResult;
    if (!res.ok) return;
    setResult((prev) => ({ ...prev, ...data }));
    if (data.paid) {
      store.applyAsaasPaid(asaasPaymentId);
      toast.success("Pix recebido no Asaas.");
    }
  }

  async function generate(nextCpf = cpf) {
    setBusy(true);
    try {
      if (nextCpf && isCpf(nextCpf) && nextCpf !== student.cpf) {
        store.updateStudent(student.id, { cpf: nextCpf.replace(/\D/g, "") });
      }
      const res = await fetch("/api/asaas/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKeyHeader() || undefined,
          paymentId: payment.id,
          academyName: store.academy.name,
          amount: payment.amount,
          month: payment.month,
          student: {
            id: student.id,
            name: student.name,
            email: student.email,
            phone: student.phone,
            cpf: nextCpf,
            asaasCustomerId: student.asaasCustomerId,
          },
        }),
      });
      const data = (await res.json()) as ChargeResult;
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Não gerou o Pix.");
        setResult(data);
        return;
      }
      store.attachAsaasCharge(payment.id, {
        studentId: student.id,
        asaasPaymentId: data.asaasPaymentId!,
        asaasInvoiceUrl: data.invoiceUrl,
        asaasPixCopy: data.pixCopy,
        asaasStatus: data.status,
        asaasCustomerId: data.asaasCustomerId,
      });
      setResult(data);
      if (data.paid) store.applyAsaasPaid(data.asaasPaymentId!);
      toast.success(
        data.environment === "production"
          ? "Pix gerado."
          : "Pix de teste gerado.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!configured && !payment.asaasPaymentId) return null;

  const pixCopy = result?.pixCopy || payment.asaasPixCopy;
  const invoiceUrl = result?.invoiceUrl || payment.asaasInvoiceUrl;
  const pixImage = result?.pixImage;
  const paid = result?.paid || payment.status === "paid";
  const text = overdueMessage(store.academy, student, {
    ...payment,
    asaasInvoiceUrl: invoiceUrl,
    asaasPixCopy: pixCopy,
  });

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          setOpen(true);
          setCpf(student.cpf ?? "");
          if (payment.asaasPaymentId && !result) {
            setResult({
              ok: true,
              asaasPaymentId: payment.asaasPaymentId,
              invoiceUrl: payment.asaasInvoiceUrl,
              pixCopy: payment.asaasPixCopy,
              status: payment.asaasStatus,
            });
            void refresh(payment.asaasPaymentId);
          }
        }}
      >
        {payment.asaasPaymentId ? "Pix Asaas" : "Gerar Pix Asaas"}
      </Button>
      <FormDialog
        open={open}
        onClose={() => setOpen(false)}
        title={`Pix · ${student.name}`}
        className="max-w-md"
      >
        <p className="text-muted-foreground">
          {monthLabel(payment.month)} · {brl(payment.amount)}
        </p>
        {paid ? (
          <p className="mt-3 text-sm">Recebido. Mensalidade baixada.</p>
        ) : (
          <div className="mt-3 grid gap-3">
            {(!student.cpf || result?.needsCpf) && (
              <div className="space-y-1.5">
                <Label>CPF do pagador</Label>
                <Input
                  value={formatCpf(cpf)}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="000.000.000-00"
                />
              </div>
            )}
            {pixImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt="QR Code Pix"
                className="mx-auto h-44 w-44 bg-white p-2"
                src={`data:image/png;base64,${pixImage}`}
              />
            )}
            {pixCopy && (
              <p className="break-all font-mono text-[10px] leading-relaxed text-muted-foreground">
                {pixCopy}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={busy}
                onClick={() => void generate(cpf)}
              >
                {busy ? "Gerando…" : pixCopy ? "Gerar de novo" : "Gerar Pix"}
              </Button>
              {pixCopy && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    await navigator.clipboard.writeText(pixCopy);
                    toast.success("Copia e cola copiado.");
                  }}
                >
                  Copiar Pix
                </Button>
              )}
              {invoiceUrl && (
                <Button
                  type="button"
                  variant="outline"
                  render={<a href={invoiceUrl} target="_blank" rel="noreferrer" />}
                >
                  Fatura
                </Button>
              )}
              {result?.asaasPaymentId && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void refresh(result.asaasPaymentId!)}
                >
                  Conferir
                </Button>
              )}
              <Button
                type="button"
                render={<a href={waHref(student.phone, text)} target="_blank" rel="noreferrer" />}
              >
                WhatsApp
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Depois que o aluno pagar, use Conferir para baixar a mensalidade.
            </p>
          </div>
        )}
      </FormDialog>
    </>
  );
}

"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { AsaasChargeButton } from "@/components/asaas-pix-dialog";
import { toast } from "sonner";
import { ChargeWhatsAppQueue } from "@/components/academia/charge-whatsapp-queue";
import { EmptyState } from "@/components/academia/empty-state";
import { PersonAvatar } from "@/components/belt-badge";
import { Button } from "@/components/ui/button";
import { chargeQueueToday } from "@/lib/charge-reminder";
import { brl, currentMonth, monthLabel } from "@/lib/format";
import { overdueTotal } from "@/lib/insights";
import { useStore } from "@/lib/store";
import { canWhatsApp, housePixMessage, waHref } from "@/lib/whatsapp";

export default function CobrancasPage() {
  const store = useStore();
  const month = currentMonth();
  const generated = useRef(false);
  const openPays = store.payments.filter(
    (p) => p.status === "overdue" || p.status === "pending",
  );
  const overdue = overdueTotal(store);
  const pix = store.academy.pixKey.trim();
  const todayQueue = chargeQueueToday(store.payments, store.students);

  useEffect(() => {
    if (!store.hydrated || generated.current) return;
    generated.current = true;
    const n = store.generateMonthCharges(month);
    if (n > 0) {
      toast.success(`${n} mensalidade(s) de ${monthLabel(month)} geradas para cobrar no Zap.`);
    }
  }, [month, store]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Cobranças</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            O mês gera sozinho. A fila manda o Pix da academia no WhatsApp, um aluno
            por vez, sem repetir no mesmo dia.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            const n = store.generateMonthCharges(month);
            if (n === 0) toast.message(`Mensalidades de ${monthLabel(month)} já existem.`);
            else toast.success(`${n} cobrança(s) de ${monthLabel(month)} geradas.`);
          }}
        >
          Gerar mensalidades
        </Button>
      </div>

      {pix ? (
        <div className="border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Pix da academia</p>
          <p className="mt-1 font-mono text-lg">{pix}</p>
          <p className="text-sm text-muted-foreground">{store.academy.pixName}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await navigator.clipboard.writeText(pix);
                toast.success("Chave Pix copiada.");
              }}
            >
              Copiar chave
            </Button>
            {todayQueue.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                {todayQueue.length} para cobrar hoje no Zap
              </p>
            ) : null}
          </div>
          <div className="mt-4">
            <ChargeWhatsAppQueue />
          </div>
        </div>
      ) : (
        <EmptyState
          title="Falta a chave Pix"
          body="A cobrança vai no WhatsApp com a chave da academia. Cole em Configurações e volte para mandar a mensagem."
          action={
            <Button render={<Link href="/academia/configuracoes" />}>Colocar Pix</Button>
          }
        />
      )}

      <p className="text-sm">
        {openPays.length} em aberto · {brl(overdue)} em atraso
      </p>

      <div className="space-y-2">
        {openPays.length === 0 ? (
          <EmptyState
            title="Nada para cobrar hoje"
            body={
              store.students.filter((s) => s.status === "active" && s.monthlyFee > 0).length === 0
                ? "Cadastre um aluno com mensalidade, depois gere as cobranças do mês."
                : "As mensalidades do mês entram na lista sozinhas. Se faltar alguém, gere de novo."
            }
            action={
              store.students.filter((s) => s.status === "active" && s.monthlyFee > 0).length === 0 ? (
                <Button render={<Link href="/academia/alunos?novo=1" />}>Cadastrar aluno</Button>
              ) : (
                <Button
                  onClick={() => {
                    const n = store.generateMonthCharges(month);
                    if (n === 0) toast.message("Já existem cobranças deste mês.");
                    else toast.success(`${n} cobrança(s) geradas.`);
                  }}
                >
                  Gerar mensalidades
                </Button>
              )
            }
          />
        ) : null}
        {openPays.map((p) => {
          const s = store.students.find((st) => st.id === p.studentId);
          if (!s) return null;
          const text = housePixMessage(store.academy, s, p);
          const notified = Boolean(p.chargeNotifiedAt);
          return (
            <article
              key={p.id}
              className="flex flex-col gap-3 border border-border bg-card p-4 sm:flex-row sm:items-center"
            >
              <PersonAvatar name={s.name} hue={s.avatarHue} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  {monthLabel(p.month)} · {brl(p.amount)} ·{" "}
                  {p.status === "overdue" ? "atraso" : "aberto"}
                  {notified ? " · Zap hoje" : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <AsaasChargeButton payment={p} student={s} />
                {canWhatsApp(s.phone) ? (
                  <Button
                    size="sm"
                    render={<a href={waHref(s.phone, text)} target="_blank" rel="noreferrer" />}
                    onClick={() => store.markChargeNotified(p.id)}
                  >
                    WhatsApp
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  onClick={() => {
                    store.recordPayment(s.id, p.month, "pix");
                    toast.success("Baixado.");
                  }}
                >
                  Baixar Pix
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    store.waivePayment(p.id);
                    toast.message("Isentado.");
                  }}
                >
                  Isentar
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

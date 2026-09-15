"use client";

import Link from "next/link";
import { AsaasChargeButton } from "@/components/asaas-pix-dialog";
import { toast } from "sonner";
import { ChargeWhatsAppQueue } from "@/components/academia/charge-whatsapp-queue";
import { EmptyState } from "@/components/academia/empty-state";
import { PersonAvatar } from "@/components/belt-badge";
import { Button } from "@/components/ui/button";
import { brl, currentMonth, monthLabel } from "@/lib/format";
import { overdueTotal } from "@/lib/insights";
import { useStore } from "@/lib/store";
import { overdueMessage, waHref } from "@/lib/whatsapp";

export default function CobrancasPage() {
  const store = useStore();
  const month = currentMonth();
  const openPays = store.payments.filter(
    (p) => p.status === "overdue" || p.status === "pending",
  );
  const overdue = overdueTotal(store);
  const pix = store.academy.pixKey.trim();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Cobranças</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cobra no WhatsApp com a chave Pix da academia. Baixa na mão quando o
            aluno pagar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ChargeWhatsAppQueue />
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
      </div>

      {pix ? (
        <div className="border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Pix da academia</p>
          <p className="mt-1 font-mono text-lg">{pix}</p>
          <p className="text-sm text-muted-foreground">{store.academy.pixName}</p>
          <Button
            className="mt-3"
            variant="outline"
            size="sm"
            onClick={async () => {
              await navigator.clipboard.writeText(pix);
              toast.success("Chave Pix copiada.");
            }}
          >
            Copiar chave
          </Button>
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
                : "Gere as mensalidades do mês. Cada ficha ativa com valor entra na lista."
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
          const text = overdueMessage(store.academy, s, p);
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
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <AsaasChargeButton payment={p} student={s} />
                <Button size="sm" render={<a href={waHref(s.phone, text)} target="_blank" rel="noreferrer" />}>
                  WhatsApp
                </Button>
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

"use client";

import { AsaasChargeButton } from "@/components/asaas-pix-dialog";
import { toast } from "sonner";
import { PersonAvatar } from "@/components/belt-badge";
import { Button } from "@/components/ui/button";
import { brl, monthLabel } from "@/lib/format";
import { overdueTotal } from "@/lib/insights";
import { useStore } from "@/lib/store";
import { overdueMessage, waHref } from "@/lib/whatsapp";

export default function CobrancasPage() {
  const store = useStore();
  const openPays = store.payments.filter(
    (p) => p.status === "overdue" || p.status === "pending",
  );
  const overdue = overdueTotal(store);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl">Cobranças</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cobra no WhatsApp com a chave Pix da academia. Baixa na mão quando o
          aluno pagar.
        </p>
      </div>

      <div className="border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">Pix da academia</p>
        <p className="mt-1 font-mono text-lg">{store.academy.pixKey}</p>
        <p className="text-sm text-muted-foreground">{store.academy.pixName}</p>
        <Button
          className="mt-3"
          variant="outline"
          size="sm"
          onClick={async () => {
            await navigator.clipboard.writeText(store.academy.pixKey);
            toast.success("Chave Pix copiada.");
          }}
        >
          Copiar chave
        </Button>
      </div>

      <p className="text-sm">
        {openPays.length} em aberto · {brl(overdue)} em atraso
      </p>

      <div className="space-y-2">
        {openPays.length === 0 && (
          <p className="text-sm text-muted-foreground">Nada para cobrar hoje.</p>
        )}
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

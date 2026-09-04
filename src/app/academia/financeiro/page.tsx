"use client";

import { toast } from "sonner";
import { PersonAvatar } from "@/components/belt-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { brl, currentMonth, monthLabel } from "@/lib/format";
import { monthExpenses, monthRevenue, overdueTotal } from "@/lib/insights";
import { useStore } from "@/lib/store";

const EXPENSE_LABEL: Record<string, string> = {
  rent: "Aluguel",
  utilities: "Contas",
  instructor: "Professor",
  supplies: "Material",
  marketing: "Divulgação",
  other: "Outros",
};

export default function FinanceiroPage() {
  const store = useStore();
  const month = currentMonth();
  const revenue = monthRevenue(store, month);
  const expenses = monthExpenses(store, month);
  const overdue = overdueTotal(store);
  const openPays = store.payments.filter(
    (p) => p.status === "overdue" || p.status === "pending",
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-3xl">Financeiro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {monthLabel(month)} · o que entrou, o que saiu, o que está parado.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Tile k="Recebido" v={brl(revenue)} />
        <Tile k="Despesas" v={brl(expenses)} />
        <Tile k="Saldo do mês" v={brl(revenue - expenses)} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Tile k="Atrasados" v={brl(overdue)} warn />
        <Tile
          k="Meta"
          v={`${Math.round((revenue / store.academy.monthlyGoal) * 100)}% de ${brl(store.academy.monthlyGoal)}`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mensalidades em aberto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {openPays.length === 0 && (
            <p className="text-sm text-muted-foreground">Nada em aberto neste recorte.</p>
          )}
          {openPays.map((p) => {
            const s = store.students.find((st) => st.id === p.studentId);
            if (!s) return null;
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-lg border border-border p-3"
              >
                <PersonAvatar name={s.name} hue={s.avatarHue} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.month} · {p.status === "overdue" ? "atraso" : "experimental / aberto"}
                  </p>
                </div>
                <span className="text-sm">{brl(p.amount)}</span>
                <Button
                  size="sm"
                  onClick={() => {
                    store.recordPayment(s.id, p.month, "pix");
                    toast.success("Baixado via Pix.");
                  }}
                >
                  Baixar Pix
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Despesas do mês</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {store.expenses
            .filter((e) => e.date.startsWith(month))
            .map((e) => (
              <div key={e.id} className="flex justify-between">
                <span>
                  {e.description}
                  <span className="text-muted-foreground">
                    {" "}
                    · {EXPENSE_LABEL[e.category] ?? e.category}
                  </span>
                </span>
                <span>{brl(e.amount)}</span>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Tile({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{k}</p>
      <p className={`mt-1 font-display text-2xl ${warn ? "text-destructive" : ""}`}>
        {v}
      </p>
    </div>
  );
}

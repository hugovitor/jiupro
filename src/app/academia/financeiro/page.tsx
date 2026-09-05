"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { PersonAvatar } from "@/components/belt-badge";
import { FormDialog } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brl, currentMonth, isoDate, monthLabel } from "@/lib/format";
import { monthDropInRevenue, monthExpenses, monthRevenue, monthStoreSales, overdueTotal } from "@/lib/insights";
import { useStore } from "@/lib/store";
import type { ExpenseCategory } from "@/lib/types";
import { overdueMessage, waHref } from "@/lib/whatsapp";

const EXPENSE_LABEL: Record<ExpenseCategory, string> = {
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
  const shop = monthStoreSales(store, month);
  const dropIns = monthDropInRevenue(store, month);
  const overdue = overdueTotal(store);
  const openPays = store.payments.filter(
    (p) => p.status === "overdue" || p.status === "pending",
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Financeiro</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {monthLabel(month)} · o que entrou, o que saiu, o que está parado.
          </p>
        </div>
        <div className="flex gap-2">
          <NovaDespesa />
          <Button variant="outline" render={<Link href="/academia/fechamento" />}>
            Fechamento
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile k="Recebido" v={brl(revenue)} />
        <Tile k="Loja + avulsas" v={brl(shop + dropIns)} />
        <Tile k="Despesas" v={brl(expenses)} />
        <Tile k="Saldo do mês" v={brl(revenue + shop + dropIns - expenses)} />
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
                  variant="outline"
                  render={
                    <a
                      href={waHref(s.phone, overdueMessage(store.academy, s, p))}
                      target="_blank"
                      rel="noreferrer"
                    />
                  }
                >
                  WhatsApp
                </Button>
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
          {store.expenses.filter((e) => e.date.startsWith(month)).length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma despesa neste mês.</p>
          )}
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

function NovaDespesa() {
  const store = useStore();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("other");

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Lançar despesa
      </Button>
      <FormDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Nova despesa"
      >
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const value = Number(amount.replace(",", "."));
            if (!description.trim() || !value) return;
            store.addExpense({
              description: description.trim(),
              category,
              amount: value,
              date: isoDate(0),
            });
            toast.success("Despesa lançada.");
            setOpen(false);
            setDescription("");
            setAmount("");
          }}
        >
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Conta de luz, kimono para estoque…"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Valor</Label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <select
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              >
                {(Object.keys(EXPENSE_LABEL) as ExpenseCategory[]).map((k) => (
                  <option key={k} value={k}>
                    {EXPENSE_LABEL[k]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button type="submit">Salvar</Button>
        </form>
      </FormDialog>
    </>
  );
}

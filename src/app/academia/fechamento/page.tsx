"use client";

import Link from "next/link";
import { toast } from "sonner";
import { PersonAvatar } from "@/components/belt-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  brl,
  currentMonth,
  daysSince,
  downloadCsv,
  formatDay,
  monthLabel,
  shiftMonth,
} from "@/lib/format";
import {
  isAtRisk,
  monthAttendanceCount,
  monthChargeStats,
  monthExpenses,
  monthRevenue,
  newStudentsInMonth,
} from "@/lib/insights";
import { useStore } from "@/lib/store";
import { comebackMessage, overdueMessage, waHref } from "@/lib/whatsapp";
import { useState } from "react";

const STATUS: Record<string, string> = {
  paid: "pago",
  pending: "aberto",
  overdue: "atraso",
  waived: "isento",
};

export default function FechamentoPage() {
  const store = useStore();
  const [month, setMonth] = useState(currentMonth());
  const next = shiftMonth(month, 1);
  const revenue = monthRevenue(store, month);
  const expenses = monthExpenses(store, month);
  const charges = monthChargeStats(store, month);
  const checkins = monthAttendanceCount(store, month);
  const newcomers = newStudentsInMonth(store, month);
  const risk = store.students.filter((s) => isAtRisk(store, s));
  const monthPays = store.payments
    .filter((p) => p.month === month)
    .sort((a, b) => {
      const order = { overdue: 0, pending: 1, paid: 2, waived: 3 };
      return (order[a.status] ?? 9) - (order[b.status] ?? 9);
    });
  const ranking = store.students
    .filter((s) => s.status === "active")
    .map((s) => ({
      s,
      n: store.attendance.filter(
        (a) => a.studentId === s.id && a.date.startsWith(month),
      ).length,
    }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 8);

  function exportCsv() {
    const rows: (string | number)[][] = [
      ["Aluno", "Mês", "Valor", "Status", "Método", "Pago em"],
      ...monthPays.map((p) => {
        const s = store.students.find((st) => st.id === p.studentId);
        return [
          s?.name ?? p.studentId,
          p.month,
          p.amount.toFixed(2).replace(".", ","),
          STATUS[p.status] ?? p.status,
          p.method ?? "",
          p.paidAt ? formatDay(p.paidAt) : "",
        ];
      }),
    ];
    downloadCsv(`tatamex-${store.academy.slug}-${month}.csv`, rows);
    toast.success("Planilha baixada.");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Fechamento</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {monthLabel(month)} · o ritual de fim de mês: quem pagou, quem some,
            o que exportar.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMonth(shiftMonth(month, -1))}
          >
            Mês anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={month >= currentMonth()}
            onClick={() => setMonth(shiftMonth(month, 1))}
          >
            Próximo
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile k="Recebido" v={brl(revenue)} />
        <Tile k="Despesas" v={brl(expenses)} />
        <Tile k="Saldo" v={brl(revenue - expenses)} />
        <Tile
          k="Inadimplência"
          v={brl(charges.open)}
          warn={charges.open > 0}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Tile
          k="Mensalidades"
          v={`${charges.paidCount}/${charges.totalCount}`}
          hint={`${brl(charges.collected)} de ${brl(charges.billed)}`}
        />
        <Tile k="Presenças" v={String(checkins)} hint="check-ins no mês" />
        <Tile
          k="Novos alunos"
          v={String(newcomers.length)}
          hint={newcomers.map((s) => s.name.split(" ")[0]).join(", ") || "ninguém"}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            const n = store.generateMonthCharges(next);
            if (n === 0) {
              toast.message(`Mensalidades de ${monthLabel(next)} já existem.`);
            } else {
              toast.success(`${n} cobrança(s) de ${monthLabel(next)} geradas.`);
            }
          }}
        >
          Gerar mensalidades de {monthLabel(next)}
        </Button>
        <Button variant="outline" onClick={exportCsv}>
          Baixar CSV
        </Button>
        <Button variant="outline" render={<Link href="/academia/cobrancas" />}>
          Cobrar atrasados
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mensalidades de {monthLabel(month)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {monthPays.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhuma cobrança neste mês. Gere as mensalidades para começar.
            </p>
          )}
          {monthPays.map((p) => {
            const s = store.students.find((st) => st.id === p.studentId);
            if (!s) return null;
            return (
              <div
                key={p.id}
                className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center"
              >
                <PersonAvatar name={s.name} hue={s.avatarHue} size="sm" />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/academia/alunos/${s.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {s.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {brl(p.amount)} · {STATUS[p.status]}
                  </p>
                </div>
                {p.status !== "paid" && p.status !== "waived" && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      render={
                        <a
                          href={waHref(
                            s.phone,
                            overdueMessage(store.academy, s, p),
                          )}
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
                        toast.success("Baixado.");
                      }}
                    >
                      Baixar
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quem parou de treinar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {risk.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Ninguém sumiu nas últimas duas semanas.
              </p>
            )}
            {risk.map((s) => {
              const last = store.lastAttendance(s.id);
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {last
                        ? `${formatDay(last.date)} · ${daysSince(last.date)} dias`
                        : "sem presença"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    render={
                      <a
                        href={waHref(s.phone, comebackMessage(store.academy, s))}
                        target="_blank"
                        rel="noreferrer"
                      />
                    }
                  >
                    Chamar
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Mais presentes no mês</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {ranking.map(({ s, n }) => (
              <div key={s.id} className="flex justify-between">
                <span>{s.name}</span>
                <span className="text-muted-foreground">{n} treinos</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Tile({
  k,
  v,
  hint,
  warn,
}: {
  k: string;
  v: string;
  hint?: string;
  warn?: boolean;
}) {
  return (
    <div className="border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{k}</p>
      <p className={`mt-1 font-display text-2xl ${warn ? "text-destructive" : ""}`}>
        {v}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

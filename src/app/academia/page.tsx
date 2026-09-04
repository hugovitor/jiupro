"use client";

import Link from "next/link";
import { BeltBadge, PersonAvatar } from "@/components/belt-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { brl, currentMonth, daysSince, formatDay, monthLabel } from "@/lib/format";
import {
  attendanceInDays,
  isAtRisk,
  isPromotionCandidate,
  monthExpenses,
  monthRevenue,
  overdueTotal,
} from "@/lib/insights";
import { useStore } from "@/lib/store";
import { isoDate } from "@/lib/format";

export default function AcademiaDashboard() {
  const store = useStore();
  const month = currentMonth();
  const active = store.students.filter((s) => s.status === "active");
  const trials = store.students.filter((s) => s.status === "trial");
  const revenue = monthRevenue(store, month);
  const expenses = monthExpenses(store, month);
  const overdue = overdueTotal(store);
  const today = isoDate(0);
  const todayCount = store.attendance.filter((a) => a.date === today).length;
  const candidates = store.students.filter((s) => isPromotionCandidate(store, s));
  const risk = store.students.filter((s) => isAtRisk(store, s));
  const lowStock = store.inventory.filter((i) => i.quantity <= i.minQuantity);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-xs tracking-[0.18em] text-primary uppercase">
          {store.academy.city} · {monthLabel(month)}
        </p>
        <h1 className="font-display text-3xl">{store.academy.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          O que precisa da sua atenção hoje, não um gráfico bonito.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Alunos ativos" value={String(active.length)} hint={`${trials.length} em experimental`} />
        <Kpi
          label="Recebido no mês"
          value={brl(revenue)}
          hint={`Meta ${brl(store.academy.monthlyGoal)}`}
        />
        <Kpi
          label="Em atraso"
          value={brl(overdue)}
          hint="mensalidades abertas"
          warn={overdue > 0}
        />
        <Kpi
          label="Presenças hoje"
          value={String(todayCount)}
          hint={`Despesas ${brl(expenses)}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pararam de aparecer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {risk.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Ninguém sumiu nas últimas duas semanas.
              </p>
            )}
            {risk.map((s) => {
              const last = store.lastAttendance(s.id);
              return (
                <Link
                  key={s.id}
                  href={`/academia/alunos/${s.id}`}
                  className="flex items-center gap-3 rounded-lg p-1 hover:bg-muted/40"
                >
                  <PersonAvatar name={s.name} hue={s.avatarHue} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {last
                        ? `último treino ${formatDay(last.date)} · ${daysSince(last.date)} dias`
                        : "sem presença registrada"}
                    </p>
                  </div>
                  <BeltBadge belt={s.belt} stripes={s.stripes} compact />
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prontos para graduação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {candidates.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Ninguém atingiu tempo + presença ainda.
              </p>
            )}
            {candidates.map((s) => (
              <Link
                key={s.id}
                href="/academia/graduacoes"
                className="flex items-center gap-3 rounded-lg p-1 hover:bg-muted/40"
              >
                <PersonAvatar name={s.name} hue={s.avatarHue} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {attendanceInDays(store, s.id, 90)} treinos em 90 dias
                  </p>
                </div>
                <BeltBadge belt={s.belt} stripes={s.stripes} compact />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Estoque baixo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {lowStock.length === 0 && (
              <p className="text-muted-foreground">Nada abaixo do mínimo.</p>
            )}
            {lowStock.map((i) => (
              <div key={i.id} className="flex justify-between">
                <span>
                  {i.name} {i.size ? `· ${i.size}` : ""}
                </span>
                <span className="text-destructive">
                  {i.quantity} un. (mín. {i.minQuantity})
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Atalhos</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm">
            <Link className="rounded-lg border border-border p-3 hover:bg-muted/40" href="/academia/presenca">
              Fazer chamada
            </Link>
            <Link className="rounded-lg border border-border p-3 hover:bg-muted/40" href="/academia/financeiro">
              Baixar mensalidade
            </Link>
            <Link className="rounded-lg border border-border p-3 hover:bg-muted/40" href="/academia/alunos">
              Novo aluno
            </Link>
            <Link className="rounded-lg border border-border p-3 hover:bg-muted/40" href="/academia/mural">
              Aviso no mural
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  warn,
}: {
  label: string;
  value: string;
  hint?: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-2xl ${warn ? "text-destructive" : ""}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

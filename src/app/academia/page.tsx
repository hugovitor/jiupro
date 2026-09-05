"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { BeltBadge, PersonAvatar } from "@/components/belt-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { brl, currentMonth, daysSince, formatDay, monthLabel } from "@/lib/format";
import {
  attendanceInDays,
  birthdaysSoon,
  EVENT_KIND_LABEL,
  isAtRisk,
  isPromotionCandidate,
  monthExpenses,
  monthRevenue,
  overdueTotal,
} from "@/lib/insights";
import { isSupabaseConfigured, subscribeSupabaseConfig } from "@/lib/supabase/config";
import { useStore } from "@/lib/store";
import { isoDate } from "@/lib/format";
import { birthdayMessage, comebackMessage, dayCode, waHref } from "@/lib/whatsapp";

export default function AcademiaDashboard() {
  const store = useStore();
  const cloudReady = useSyncExternalStore(
    subscribeSupabaseConfig,
    isSupabaseConfigured,
    () => false,
  );
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
  const birthdays = birthdaysSoon(store.students);
  const code = dayCode(today, store.academy.slug);
  const upcoming = [...(store.events ?? [])]
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          {store.academy.city} · {monthLabel(month)}
        </p>
        <h1 className="font-display text-3xl">{store.academy.name}</h1>
        {store.isDemo ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Esta é a Equipe Origem (demonstração).{" "}
            <Link href="/cadastro" className="text-foreground underline">
              Abra a sua academia
            </Link>{" "}
            para começar do zero.
          </p>
        ) : store.students.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Casa nova. Cadastre o primeiro aluno — a demo continua em Entrar.
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            O que precisa da sua atenção hoje, não um gráfico bonito.
          </p>
        )}
      </div>

      {!store.isDemo && !cloudReady && (
        <div className="border border-border bg-card p-4 text-sm">
          <p className="font-medium">Projeto Supabase ainda vazio</p>
          <p className="mt-1 text-muted-foreground">
            Não tem tabela no Dashboard — o JiuPro cria. Abra Configurações,
            cole a URL e a anon key, e aplique o schema.
          </p>
          <Button className="mt-3" size="sm" render={<Link href="/academia/configuracoes" />}>
            Configurar nuvem
          </Button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Alunos ativos" value={String(active.length)} hint={`${trials.length} em experimental`} />
        <Kpi
          label="Recebido no mês"
          value={brl(revenue)}
          hint={`Despesas ${brl(expenses)} · meta ${brl(store.academy.monthlyGoal)}`}
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
          hint={`Código ${code}`}
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
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-lg p-1"
                >
                  <Link
                    href={`/academia/alunos/${s.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3 hover:bg-muted/40"
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
                  <Button
                    size="sm"
                    variant="outline"
                    render={
                      <a
                        href={waHref(s.phone, comebackMessage(store.academy, s))}
                        target="_blank"
                        rel="noreferrer"
                      />
                    }
                  >
                    WhatsApp
                  </Button>
                </div>
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
        <Card>
          <CardHeader>
            <CardTitle>Aniversários na semana</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {birthdays.length === 0 && (
              <p className="text-muted-foreground">Ninguém nesta janela de 7 dias.</p>
            )}
            {birthdays.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2">
                <span>{s.name}</span>
                <span className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {formatDay(s.birthDate)}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    render={
                      <a
                        href={waHref(
                          s.phone,
                          birthdayMessage(store.academy, s),
                        )}
                        target="_blank"
                        rel="noreferrer"
                      />
                    }
                  >
                    Zap
                  </Button>
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Agenda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {upcoming.length === 0 && (
              <p className="text-muted-foreground">Nada marcado. Abre a agenda.</p>
            )}
            {upcoming.map((e) => (
              <Link
                key={e.id}
                href="/academia/agenda"
                className="flex justify-between gap-2 hover:underline"
              >
                <span>
                  {EVENT_KIND_LABEL[e.kind]} · {e.title}
                </span>
                <span className="text-muted-foreground">{formatDay(e.date)}</span>
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
            <Link className="rounded-lg border border-border p-3 hover:bg-muted/40" href="/academia/cobrancas">
              Cobrar no WhatsApp
            </Link>
            <Link className="rounded-lg border border-border p-3 hover:bg-muted/40" href="/academia/experimentais">
              Experimentais
            </Link>
            <Link className="rounded-lg border border-border p-3 hover:bg-muted/40" href="/academia/fechamento">
              Fechamento do mês
            </Link>
            <Link className="rounded-lg border border-border p-3 hover:bg-muted/40" href="/academia/agenda">
              Agenda da casa
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
    <div className="border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-2xl ${warn ? "text-destructive" : ""}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

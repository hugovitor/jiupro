"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { BeltBadge, PersonAvatar } from "@/components/belt-badge";
import { Button } from "@/components/ui/button";
import {
  brl,
  currentMonth,
  daysSince,
  formatDay,
  isoDate,
  monthLabel,
  weekdayFull,
  weekdayToday,
} from "@/lib/format";
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
  const classes = store.todayClasses();
  const upcoming = [...(store.events ?? [])]
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
            {weekdayFull(weekdayToday())} · {monthLabel(month)}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Visão do dia</h1>
          {store.isDemo ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Equipe Origem (demonstração).{" "}
              <Link href="/cadastro" className="text-foreground underline">
                Abra a sua academia
              </Link>
              .
            </p>
          ) : store.students.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Casa nova. Cadastre o primeiro aluno — a demo continua em Entrar.
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              O que precisa de você hoje, não um gráfico.
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Stat k="No tatame" v={String(todayCount)} />
          <Stat k="Ativos" v={String(active.length)} hint={`${trials.length} experimental`} />
          <Stat k="Atraso" v={brl(overdue)} warn={overdue > 0} />
        </div>
      </div>

      {!store.isDemo && !cloudReady && (
        <div className="mt-6 surface p-4 text-sm">
          <p className="font-medium">Projeto Supabase ainda vazio</p>
          <p className="mt-1 text-muted-foreground">
            Não tem tabela no Dashboard — o JiuPro cria. Cole a URL e a anon key
            em Configurações.
          </p>
          <Button className="mt-3" size="sm" render={<Link href="/academia/configuracoes" />}>
            Configurar nuvem
          </Button>
        </div>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className="surface p-5">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-base font-semibold tracking-tight">Turmas de hoje</h2>
            <Link href="/academia/presenca" className="text-xs text-primary hover:underline">
              Fazer chamada
            </Link>
          </div>
          {classes.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Sem turma na grade hoje.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {classes.map((c) => {
                const count = store.attendance.filter(
                  (a) => a.classId === c.id && a.date === today,
                ).length;
                return (
                  <li key={c.id} className="flex items-baseline justify-between gap-3 py-3">
                    <div>
                      <p className="font-display text-3xl leading-none">{c.startTime}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {c.name} · {c.gi ? "Gi" : "No-Gi"} · {c.durationMin} min
                      </p>
                    </div>
                    <p className="text-sm">
                      {count}/{c.capacity}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-6 flex items-center justify-between surface px-4 py-4">
            <div>
              <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
                Código da recepção
              </p>
              <p className="font-display text-3xl tracking-[0.2em]">{code}</p>
            </div>
            <Button size="sm" variant="outline" render={<Link href="/academia/presenca" />}>
              Chamada
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            <Link className="surface px-3 py-3 text-sm hover:bg-muted" href="/academia/cobrancas">
              Cobrar no Zap
            </Link>
            <Link className="surface px-3 py-3 text-sm hover:bg-muted" href="/academia/experimentais">
              Experimentais
            </Link>
            <Link className="surface px-3 py-3 text-sm hover:bg-muted" href="/academia/fechamento">
              Fechamento
            </Link>
          </div>
        </section>

        <section className="surface p-5">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-base font-semibold tracking-tight">Pararam de aparecer</h2>
            <p className="text-xs text-muted-foreground">
              {brl(revenue)} no mês · despesas {brl(expenses)}
            </p>
          </div>
          <div className="mt-4 space-y-3">
            {risk.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Ninguém sumiu nas últimas duas semanas.
              </p>
            )}
            {risk.map((s) => {
              const last = store.lastAttendance(s.id);
              return (
                <div key={s.id} className="flex items-center gap-3">
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
                    Zap
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <BoardCol
          title="Prontos para graduação"
          href="/academia/graduacoes"
        >
          {candidates.length === 0 && (
            <p className="text-sm text-muted-foreground">Ninguém atingiu tempo + presença ainda.</p>
          )}
          {candidates.map((s) => (
            <Link
              key={s.id}
              href="/academia/graduacoes"
              className="flex items-center gap-3 py-1.5 hover:bg-muted/40"
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
        </BoardCol>
        <BoardCol title="Agenda" href="/academia/agenda">
          {upcoming.length === 0 && (
            <p className="text-sm text-muted-foreground">Nada marcado.</p>
          )}
          {upcoming.map((e) => (
            <Link
              key={e.id}
              href="/academia/agenda"
              className="flex justify-between gap-2 py-1.5 text-sm hover:underline"
            >
              <span>
                {EVENT_KIND_LABEL[e.kind]} · {e.title}
              </span>
              <span className="text-muted-foreground">{formatDay(e.date)}</span>
            </Link>
          ))}
          {birthdays.length > 0 && (
            <div className="mt-4 border-t border-border pt-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Aniversário
              </p>
              {birthdays.map((s) => (
                <div key={s.id} className="mt-1 flex items-center justify-between text-sm">
                  <span>{s.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    render={
                      <a
                        href={waHref(s.phone, birthdayMessage(store.academy, s))}
                        target="_blank"
                        rel="noreferrer"
                      />
                    }
                  >
                    Zap
                  </Button>
                </div>
              ))}
            </div>
          )}
        </BoardCol>
        <BoardCol title="Estoque baixo" href="/academia/estoque">
          {lowStock.length === 0 && (
            <p className="text-sm text-muted-foreground">Nada abaixo do mínimo.</p>
          )}
          {lowStock.map((i) => (
            <div key={i.id} className="flex justify-between py-1 text-sm">
              <span>
                {i.name} {i.size ? `· ${i.size}` : ""}
              </span>
              <span className="text-destructive">
                {i.quantity} un.
              </span>
            </div>
          ))}
        </BoardCol>
      </div>
    </div>
  );
}

function Stat({
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
    <div className="surface min-w-[5.5rem] px-3 py-2.5 text-right">
      <p className="text-[11px] tracking-wide text-muted-foreground uppercase">{k}</p>
      <p className={`font-display text-2xl leading-none ${warn ? "text-destructive" : ""}`}>
        {v}
      </p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function BoardCol({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface p-5">
      <div className="flex items-end justify-between">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <Link href={href} className="text-xs text-muted-foreground hover:text-foreground">
          Ver
        </Link>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { CalendarDays, Clock3, UserPlus, Users } from "lucide-react";
import { BeltBadge, PersonAvatar } from "@/components/belt-badge";
import { Button } from "@/components/ui/button";
import {
  classPhase,
  isOnRoster,
  isValidated,
  phaseHint,
  phaseLabel,
  recommendClass,
} from "@/lib/attendance";
import {
  brl,
  clockLabel,
  currentMonth,
  daysSince,
  formatDay,
  isoDate,
  minutes,
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
import { FirstHouseCard } from "@/components/academia/first-house-card";
import { useStore } from "@/lib/store";
import { useNow } from "@/lib/use-now";
import { birthdayMessage, comebackMessage, waHref } from "@/lib/whatsapp";

export default function AcademiaDashboard() {
  const store = useStore();
  const now = useNow();
  const month = currentMonth();
  const active = store.students.filter((s) => s.status === "active");
  const trials = store.students.filter((s) => s.status === "trial");
  const revenue = monthRevenue(store, month);
  const expenses = monthExpenses(store, month);
  const overdue = overdueTotal(store);
  const today = isoDate(0);
  const todayCount = store.attendance.filter(
    (a) => a.date === today && isValidated(a),
  ).length;
  const newThisMonth = store.students.filter((s) => s.joinDate.startsWith(month)).length;
  const overduePays = store.payments.filter((p) => p.status === "overdue").length;
  const candidates = store.students.filter((s) => isPromotionCandidate(store, s));
  const risk = store.students.filter((s) => isAtRisk(store, s));
  const lowStock = store.inventory.filter((i) => i.quantity <= i.minQuantity);
  const birthdays = birthdaysSoon(store.students);
  const classes = [...store.todayClasses()].sort(
    (a, b) => minutes(a.startTime) - minutes(b.startTime),
  );
  const live = recommendClass(classes, now);
  const waitingNow = live
    ? store.attendance.filter(
        (a) =>
          a.classId === live.id && a.date === today && isOnRoster(a) && !isValidated(a),
      ).length
    : 0;
  const upcoming = [...(store.events ?? [])]
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-black tracking-[0.2em] text-red-500 uppercase">
            {weekdayFull(weekdayToday())} · {monthLabel(month)}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">Início</h1>
          {store.isDemo ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Equipe Origem (demonstração).{" "}
              <Link href="/cadastro" className="text-foreground underline underline-offset-4">
                Abra a sua academia
              </Link>
              .
            </p>
          ) : store.students.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Academia nova. Cadastre o primeiro aluno ou mande o link do app.
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Confirmados na aula, atraso no caixa.
            </p>
          )}
        </div>
      </div>

      {!store.isDemo && store.students.length === 0 ? <FirstHouseCard /> : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} k="Alunos ativos" v={String(active.length)} hint={`${trials.length} experimental`} />
        <StatCard icon={UserPlus} k="Alunos novos" v={String(newThisMonth)} hint={monthLabel(month)} />
        <StatCard icon={Clock3} k="Pagamentos atrasados" v={String(overduePays)} hint={brl(overdue)} warn={overduePays > 0} />
        <StatCard icon={CalendarDays} k="Aulas hoje" v={String(classes.length)} hint={`${todayCount} validados no tatame`} />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className="surface p-5">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-sm font-black tracking-tight">Próximas aulas</h2>
            <Link href="/academia/presenca" className="text-xs font-bold text-red-500 hover:text-red-400">
              Fazer chamada
            </Link>
          </div>
          {classes.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Sem turma na grade hoje.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {classes.map((c) => {
                const confirmed = store.attendance.filter(
                  (a) => a.classId === c.id && a.date === today && isOnRoster(a),
                ).length;
                const waiting = store.attendance.filter(
                  (a) =>
                    a.classId === c.id &&
                    a.date === today &&
                    isOnRoster(a) &&
                    !isValidated(a),
                ).length;
                const instructor =
                  store.users.find((u) => u.id === c.instructorId)?.name.split(" ")[0] ??
                  "—";
                const phase = classPhase(c, now);
                const suggested = live?.id === c.id;
                const pct = c.capacity ? Math.min(100, (confirmed / c.capacity) * 100) : 0;
                return (
                  <li key={c.id}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div>
                        <p>
                          <span className="font-mono tabular-nums">{c.startTime}</span>
                          <span className="text-muted-foreground">
                            {" "}
                            · {c.name}
                            {suggested ? " · agora" : ""}
                          </span>
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {instructor} · {phaseLabel(phase)} · {phaseHint(c, now)}
                        </p>
                      </div>
                      <p className="text-right text-[12px] text-muted-foreground">
                        {confirmed} confirmados
                        {waiting ? (
                          <span className="block text-[11px]">
                            {waiting} aguardando aceite
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-red-600"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {live ? (
            <div className="mt-6 flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-4">
              <div>
                <p className="text-[11px] font-black tracking-[0.16em] text-red-400 uppercase">
                  Aceite · {live.name}
                </p>
                <p className="mt-1 text-[18px] font-black">
                  {waitingNow === 0
                    ? "Ninguém aguardando"
                    : waitingNow === 1
                      ? "1 confirmação para aceitar"
                      : `${waitingNow} confirmações para aceitar`}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {clockLabel(now)} · {phaseHint(live, now)}
                </p>
              </div>
              <Button size="sm" variant="outline" render={<Link href="/academia/presenca" />}>
                Chamada
              </Button>
            </div>
          ) : (
            <div className="mt-6 flex items-center justify-between rounded-xl border border-white/10 px-4 py-4">
              <p className="text-sm text-muted-foreground">Sem turma hoje.</p>
              <Button size="sm" variant="outline" render={<Link href="/academia/presenca" />}>
                Chamada
              </Button>
            </div>
          )}
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
            <h2 className="text-sm font-black tracking-tight">Pararam de aparecer</h2>
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

function StatCard({
  icon: Icon,
  k,
  v,
  hint,
  warn,
}: {
  icon: typeof Users;
  k: string;
  v: string;
  hint?: string;
  warn?: boolean;
}) {
  return (
    <div
      className={`surface flex items-start gap-3 p-4 ${warn ? "border-red-500/35 bg-red-500/10" : ""}`}
    >
      <span
        className={`flex size-10 items-center justify-center rounded-xl ${warn ? "bg-red-600 text-white" : "bg-white/5 text-white/50"}`}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-black tracking-[0.16em] text-white/40 uppercase">{k}</p>
        <p className={`mt-1 text-2xl font-black tabular-nums ${warn ? "text-red-400" : ""}`}>
          {v}
        </p>
        {hint ? <p className="mt-0.5 text-[11px] text-white/40">{hint}</p> : null}
      </div>
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
        <h2 className="text-sm font-black tracking-tight">{title}</h2>
        <Link href={href} className="text-xs font-bold text-red-500 hover:text-red-400">
          Ver
        </Link>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

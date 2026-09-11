"use client";

import Link from "next/link";
import { BeltBadge, PersonAvatar } from "@/components/belt-badge";
import { PlanGate } from "@/components/academia/plan-gate";
import { beltLabel } from "@/lib/belts";
import { daysSince, formatDay } from "@/lib/format";
import {
  attendanceInDays,
  isAtRisk,
  isPromotionCandidate,
} from "@/lib/insights";
import { useStore } from "@/lib/store";

export default function EvolucaoAcademiaPage() {
  return (
    <PlanGate feature="evolutionReports">
      <EvolucaoBody />
    </PlanGate>
  );
}

function EvolucaoBody() {
  const store = useStore();
  const active = store.students.filter((s) => s.status === "active");
  const candidates = active.filter((s) => isPromotionCandidate(store, s));
  const risk = active.filter((s) => isAtRisk(store, s));
  const ranking = [...active]
    .map((s) => ({
      student: s,
      classes: attendanceInDays(store, s.id, 30),
    }))
    .sort((a, b) => b.classes - a.classes);
  const belts = new Map<string, number>();
  for (const student of active) {
    belts.set(student.belt, (belts.get(student.belt) ?? 0) + 1);
  }
  const beltRows = [...belts.entries()].sort((a, b) => b[1] - a[1]);
  const maxBelt = beltRows[0]?.[1] ?? 1;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <p className="text-[10px] font-black tracking-[0.18em] text-red-500 uppercase">
          Plano Equipe
        </p>
        <h1 className="mt-2 font-display text-3xl">Relatórios de evolução</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Presença dos últimos 30 dias, quem sumiu e quem está na fila de faixa.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat k="Ativos" v={String(active.length)} />
        <Stat k="Na fila de graduação" v={String(candidates.length)} />
        <Stat k="Pararam de aparecer" v={String(risk.length)} />
      </div>

      <section className="surface p-5">
        <h2 className="text-sm font-black tracking-tight">Faixas na academia</h2>
        {beltRows.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nenhum aluno ativo.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {beltRows.map(([belt, count]) => (
              <li key={belt}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <BeltBadge belt={belt} stripes={0} compact />
                  <span className="tabular-nums text-muted-foreground">{count}</span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-red-600"
                    style={{ width: `${Math.round((count / maxBelt) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="surface p-5">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-sm font-black tracking-tight">Presença · 30 dias</h2>
            <Link href="/academia/presenca" className="text-xs font-bold text-red-500">
              Chamada
            </Link>
          </div>
          {ranking.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Sem alunos ativos.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {ranking.slice(0, 12).map(({ student, classes }) => (
                <li key={student.id}>
                  <Link
                    href={`/academia/alunos/${student.id}`}
                    className="flex items-center gap-3 rounded-lg py-1.5 hover:bg-white/5"
                  >
                    <PersonAvatar name={student.name} hue={student.avatarHue} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{student.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {beltLabel(student.belt, student.stripes)}
                      </p>
                    </div>
                    <span className="text-sm font-bold tabular-nums">{classes}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface p-5">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-sm font-black tracking-tight">Risco de evasão</h2>
            <p className="text-xs text-muted-foreground">14 dias sem treino validado</p>
          </div>
          {risk.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Ninguém sumiu nas últimas duas semanas.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {risk.map((student) => {
                const last = store.lastAttendance(student.id);
                return (
                  <li key={student.id}>
                    <Link
                      href={`/academia/alunos/${student.id}`}
                      className="flex items-center gap-3 rounded-lg py-1.5 hover:bg-white/5"
                    >
                      <PersonAvatar name={student.name} hue={student.avatarHue} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {last
                            ? `${formatDay(last.date)} · ${daysSince(last.date)} dias`
                            : "sem presença"}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="surface p-5">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-sm font-black tracking-tight">Candidatos a graduação</h2>
          <Link href="/academia/graduacoes" className="text-xs font-bold text-red-500">
            Graduações
          </Link>
        </div>
        {candidates.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Ninguém atingiu tempo + presença ainda.
          </p>
        ) : (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {candidates.map((student) => (
              <li key={student.id}>
                <Link
                  href="/academia/graduacoes"
                  className="flex items-center gap-3 rounded-lg py-1.5 hover:bg-white/5"
                >
                  <PersonAvatar name={student.name} hue={student.avatarHue} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{student.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {attendanceInDays(store, student.id, 90)} treinos em 90 dias
                    </p>
                  </div>
                  <BeltBadge belt={student.belt} stripes={student.stripes} compact />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="surface p-4">
      <p className="text-[10px] font-black tracking-[0.16em] text-white/40 uppercase">{k}</p>
      <p className="mt-1 text-2xl font-black tabular-nums">{v}</p>
    </div>
  );
}

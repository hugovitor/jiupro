"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { BeltBadge, BeltStrip, PersonAvatar } from "@/components/belt-badge";
import { Button } from "@/components/ui/button";
import {
  attendanceStatus,
  classHeadcount,
  classPhase,
  isOnRoster,
  isValidated,
  phaseHint,
  phaseLabel,
  recommendClass,
  selfCheckInHint,
  studentCanSelfCheckIn,
  type ClassPhase,
} from "@/lib/attendance";
import { formatDay, isoDate, minutes, weekdayFull, weekdayToday, currentMonth } from "@/lib/format";
import { attendanceInDays } from "@/lib/insights";
import { ADULT_ORDER, beltMeta } from "@/lib/belts";
import { attendanceDay, attendanceForStudent, classesShareSlot } from "@/lib/roster-identity";
import { currentStudent, useStore } from "@/lib/store";
import { hasFeature } from "@/lib/plan-access";
import type { Attendance, ClassSession, Student } from "@/lib/types";
import { useNow } from "@/lib/use-now";
import { cn } from "@/lib/utils";
import { firstName } from "@/lib/whatsapp";

export default function AlunoHome() {
  const store = useStore();
  const now = useNow();
  const student = currentStudent(store);
  const branded = hasFeature(store.academy, "academyBrand");
  const today = isoDate(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const classes = [...store.todayClasses()]
    .filter((c) => {
      if (!student) return true;
      if (c.division === "kids") return student.division === "kids";
      if (c.division === "adult") return student.division === "adult";
      return true;
    })
    .sort((a, b) => minutes(a.startTime) - minutes(b.startTime));
  const featured = recommendClass(classes, now);
  const att = student ? attendanceInDays(store, student.id, 30) : 0;

  const classIdsFor = (classId: string) => {
    const cls = store.classes.find((c) => c.id === classId);
    const ids = new Set<string>([classId]);
    if (!cls) return ids;
    for (const item of store.classes) {
      if (classesShareSlot(item, cls)) ids.add(item.id);
    }
    return ids;
  };

  const mineRow = (classId: string) => {
    if (!student) return undefined;
    return attendanceForStudent(
      student,
      store.attendance.filter(
        (a) => classIdsFor(classId).has(a.classId) && attendanceDay(a.date) === today,
      ),
      store.students,
    );
  };

  const onList = (classId: string) => {
    const row = mineRow(classId);
    return !!row && isOnRoster(row);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-1">
        <div>
          <p className="text-[10px] font-black tracking-[0.18em] text-red-500 uppercase">
            {branded ? store.academy.name : weekdayFull(weekdayToday())}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">
            {student?.name.split(" ")[0] ?? "aluno"}
          </h1>
          {branded ? (
            <p className="mt-1 text-xs text-white/45">{weekdayFull(weekdayToday())}</p>
          ) : null}
        </div>
        {student && <BeltBadge belt={student.belt} stripes={student.stripes} />}
      </div>

      <section className="surface p-4">
        <p className="text-[11px] font-black tracking-[0.16em] text-red-500 uppercase">
          Próxima aula
        </p>
        {classes.length === 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            Sem turma na grade hoje. Volte no próximo treino.
          </p>
        )}
        {featured && (
          <FeaturedClass
            session={featured}
            phase={classPhase(featured, now)}
            hint={
              onList(featured.id)
                ? attendanceStatus(mineRow(featured.id)!) === "validated"
                  ? "O professor já validou você. Bom treino."
                  : "Você confirmou. Os colegas já veem. O professor aceita no tatame."
                : phaseHint(featured, now)
            }
            mine={mineRow(featured.id)}
            canCheck={!!student && studentCanSelfCheckIn(featured, now) && !onList(featured.id)}
            lockHint={selfCheckInHint(featured, now)}
            full={
              featured.capacity > 0 &&
              classHeadcount(
                store.attendance,
                store.dropIns ?? [],
                featured.id,
                today,
              ) >= featured.capacity &&
              !onList(featured.id)
            }
            classmates={rosterFor(store.students, store.attendance, featured.id, today)}
            onConfirm={async () => {
              if (!student || busyId) return;
              if (onList(featured.id)) return;
              if (!studentCanSelfCheckIn(featured, now)) {
                toast.error(selfCheckInHint(featured, now));
                return;
              }
              setBusyId(featured.id);
              try {
                const result = await store.confirmClass(student.id, featured.id);
                if (result.ok) {
                  toast.success(
                    "Confirmado. A turma já te vê na lista. O professor valida no tatame.",
                  );
                } else {
                  toast.error(result.error ?? "Não deu para confirmar. A turma pode ter lotado.");
                }
              } finally {
                setBusyId(null);
              }
            }}
            onCancel={async () => {
              if (!student || busyId) return;
              setBusyId(featured.id);
              try {
                const result = await store.cancelCheckIn(student.id, featured.id);
                if (result.ok) toast.message("Você saiu da lista desta aula.");
                else toast.error(result.error ?? "O professor já validou — peça na recepção.");
              } finally {
                setBusyId(null);
              }
            }}
          />
        )}
        {classes.filter((c) => c.id !== featured?.id).length > 0 && (
          <div className="mt-4 space-y-2 border-t border-border pt-3">
            {classes
              .filter((c) => c.id !== featured?.id)
              .map((c) => {
                const already = onList(c.id);
                const open = studentCanSelfCheckIn(c, now);
                const n = store.attendance.filter(
                  (a) => classIdsFor(c.id).has(a.classId) && attendanceDay(a.date) === today && isOnRoster(a),
                ).length;
                return (
                  <div key={c.id} className="flex items-center justify-between gap-3 text-sm">
                    <div>
                      <p>
                        <span className="font-mono tabular-nums">{c.startTime}</span>
                        <span className="text-muted-foreground"> · {c.name}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {phaseLabel(classPhase(c, now))} · {n} confirmado{n === 1 ? "" : "s"}
                        {already ? " · você está na lista" : ""}
                      </p>
                    </div>
                    {already ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busyId === c.id}
                        onClick={async () => {
                          if (!student || busyId) return;
                          setBusyId(c.id);
                          try {
                            const result = await store.cancelCheckIn(student.id, c.id);
                            if (result.ok) toast.message("Você saiu da lista desta aula.");
                            else toast.error(result.error ?? "Não deu para sair da lista.");
                          } finally {
                            setBusyId(null);
                          }
                        }}
                      >
                        Desistir
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!student || !open || busyId === c.id}
                        onClick={async () => {
                          if (!student || busyId) return;
                          setBusyId(c.id);
                          try {
                            const result = await store.confirmClass(student.id, c.id);
                            if (result.ok) {
                              toast.success("Confirmado. A turma já te vê.");
                            } else if (!open) {
                              toast.error(selfCheckInHint(c, now));
                            } else {
                              toast.error(result.error ?? "Não deu para confirmar.");
                            }
                          } finally {
                            setBusyId(null);
                          }
                        }}
                      >
                        {open ? "Confirmar" : "Encerrada"}
                      </Button>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </section>

      <FrequencyMonth studentId={student?.id} count={att} />
      {student ? <BeltTrack belt={student.belt} /> : null}

      <GradeSemana />
      <ProximoEvento />
    </div>
  );
}

function rosterFor(
  students: Student[],
  attendance: Attendance[],
  classId: string,
  date: string,
) {
  return attendance
    .filter((a) => a.classId === classId && a.date === date && isOnRoster(a))
    .map((row) => {
      const student = students.find((s) => s.id === row.studentId);
      return student ? { student, row } : null;
    })
    .filter((x): x is { student: Student; row: Attendance } => Boolean(x))
    .sort((a, b) => {
      const av = isValidated(a.row) === isValidated(b.row) ? 0 : isValidated(a.row) ? -1 : 1;
      if (av) return av;
      return a.student.name.localeCompare(b.student.name, "pt-BR");
    });
}

function FeaturedClass({
  session,
  phase,
  hint,
  mine,
  canCheck,
  lockHint,
  full,
  onConfirm,
  onCancel,
  classmates,
}: {
  session: ClassSession;
  phase: ClassPhase;
  hint: string;
  mine?: Attendance;
  canCheck: boolean;
  lockHint: string;
  full: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void | Promise<void>;
  classmates: { student: Student; row: Attendance }[];
}) {
  const pending = mine ? attendanceStatus(mine) === "pending" : false;
  const validated = mine ? isValidated(mine) : false;

  return (
    <div className="mt-3">
      <p className="font-mono text-[40px] leading-none font-black tracking-[-0.06em]">
        {session.startTime}
      </p>
      <p className="mt-2 text-sm font-bold">
        {session.name} · {session.gi ? "Gi" : "No-Gi"} · {session.durationMin} min
      </p>
      <p className="mt-1 text-[12px] text-white/40">
        {phaseLabel(phase)} · {hint}
      </p>
      {validated ? (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-3 text-sm">
          Presença validada pelo professor.
        </div>
      ) : pending ? (
        <div className="mt-4 space-y-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3">
          <p className="text-sm">Você confirmou. Esperando o aceite no tatame.</p>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Desistir desta aula
          </Button>
        </div>
      ) : full ? (
        <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white/45">
          Turma lotada. Fale com o professor na recepção.
        </p>
      ) : canCheck ? (
        <>
          <Button
            className="mt-4 h-12 w-full rounded-xl text-base font-black"
            size="lg"
            disabled={!canCheck}
            onClick={onConfirm}
          >
            Confirmar que vou
          </Button>
          <p className="mt-2 text-center text-xs text-white/40">{lockHint}</p>
        </>
      ) : (
        <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white/45">
          {lockHint}
        </p>
      )}

      <Classmates mineId={mine?.studentId} people={classmates} />
    </div>
  );
}

function Classmates({
  mineId,
  people,
}: {
  mineId?: string;
  people: { student: Student; row: Attendance }[];
}) {
  return (
    <div className="mt-5 border-t border-border pt-4">
      <div className="flex items-baseline justify-between">
        <p className="text-[12px] font-medium">Quem confirmou</p>
        <p className="text-[11px] text-muted-foreground tabular-nums">
          {people.length === 0
            ? "ninguém ainda"
            : `${people.length} na lista`}
        </p>
      </div>
      {people.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Seja o primeiro. Os colegas vão ver o seu nome aqui.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {people.map(({ student, row }) => (
            <li
              key={student.id}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
            >
              <PersonAvatar name={student.name} hue={student.avatarHue} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {firstName(student.name)}
                  {student.id === mineId ? " · você" : ""}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {isValidated(row) ? "No tatame" : "Confirmou"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FrequencyMonth({ studentId, count }: { studentId?: string; count: number }) {
  const store = useStore();
  const month = currentMonth();
  const [y, m] = month.split("-").map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const start = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const trained = new Set(
    store.attendance
      .filter(
        (a) =>
          studentId &&
          a.studentId === studentId &&
          a.date.startsWith(month) &&
          isValidated(a),
      )
      .map((a) => Number(a.date.slice(8, 10))),
  );
  const todayN = isoDate(0).startsWith(month) ? Number(isoDate(0).slice(8, 10)) : 0;

  return (
    <section className="surface p-4">
      <div className="flex items-baseline justify-between">
        <p className="text-xs text-muted-foreground">Frequência mensal</p>
        <p className="text-xs tabular-nums text-muted-foreground">{count} treinos</p>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
          <span key={`${d}${i}`}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: start }, (_, i) => (
          <span key={`e${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const day = i + 1;
          const on = trained.has(day);
          const isToday = day === todayN;
          return (
            <span
              key={day}
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-[11px]",
                on && "bg-primary text-primary-foreground",
                !on && isToday && "ring-1 ring-primary text-primary",
                !on && !isToday && "text-muted-foreground",
              )}
            >
              {day}
            </span>
          );
        })}
      </div>
    </section>
  );
}

function BeltTrack({ belt }: { belt: string }) {
  const path = ADULT_ORDER.filter((id) =>
    ["white", "blue", "purple", "brown", "black"].includes(id),
  );
  const idx = path.indexOf(belt as (typeof path)[number]);
  return (
    <section className="surface p-4">
      <p className="text-xs text-muted-foreground">Graduação</p>
      <div className="mt-3 flex items-end justify-between gap-1">
        {path.map((id, i) => (
          <div key={id} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <BeltStrip
              belt={id}
              stripes={0}
              className={cn("w-full max-w-[3.2rem]", idx >= 0 && i <= idx ? "opacity-100" : "opacity-25")}
            />
            <span
              className={cn(
                "text-[10px]",
                i === idx ? "font-medium text-primary" : "text-muted-foreground",
              )}
            >
              {beltMeta(id).label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function GradeSemana() {
  const store = useStore();
  const student = currentStudent(store);
  const week = store.classes
    .filter((c) => {
      if (!student) return true;
      if (c.division === "kids") return student.division === "kids";
      if (c.division === "adult") return student.division === "adult";
      return true;
    })
    .slice()
    .sort((a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime));
  const today = weekdayToday();

  return (
    <section className="surface p-4">
      <p className="text-xs text-muted-foreground">Sua grade</p>
      <div className="mt-3 space-y-2">
        {week.map((c) => (
          <div
            key={c.id}
            className={cn(
              "flex justify-between text-sm",
              c.weekday === today ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <span>
              {weekdayFull(c.weekday)} · {c.startTime}
            </span>
            <span>
              {c.name} · {c.gi ? "Gi" : "No-Gi"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProximoEvento() {
  const store = useStore();
  const today = isoDate(0);
  const next = [...(store.events ?? [])]
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  if (!next) return null;
  return (
    <Link href="/aluno/agenda" className="surface block p-4">
      <p className="text-xs text-muted-foreground">Próximo da academia</p>
      <p className="mt-1 font-medium">{next.title}</p>
      <p className="text-xs text-muted-foreground">
        {formatDay(next.date)} · {next.time} · {next.place}
      </p>
    </Link>
  );
}

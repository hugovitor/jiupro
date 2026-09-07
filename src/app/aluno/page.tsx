"use client";

import Link from "next/link";
import { toast } from "sonner";
import { BeltBadge, PersonAvatar } from "@/components/belt-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { formatDay, isoDate, minutes, weekdayFull, weekdayToday } from "@/lib/format";
import { attendanceInDays } from "@/lib/insights";
import { currentStudent, useStore } from "@/lib/store";
import type { Attendance, ClassSession, Student } from "@/lib/types";
import { useNow } from "@/lib/use-now";
import { cn } from "@/lib/utils";
import { firstName } from "@/lib/whatsapp";
import { useState } from "react";

export default function AlunoHome() {
  const store = useStore();
  const now = useNow();
  const student = currentStudent(store);
  const today = isoDate(0);
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
  const [code, setCode] = useState("");

  const mineRow = (classId: string) =>
    store.attendance.find(
      (a) =>
        a.studentId === student?.id && a.classId === classId && a.date === today,
    );

  const onList = (classId: string) => {
    const row = mineRow(classId);
    return !!row && isOnRoster(row);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-1">
        <div>
          <p className="text-sm text-muted-foreground">{weekdayFull(weekdayToday())}</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {student?.name.split(" ")[0] ?? "aluno"}
          </h1>
        </div>
        {student && <BeltBadge belt={student.belt} stripes={student.stripes} />}
      </div>

      <section className="surface p-4">
        <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          Sua aula agora
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
            code={code}
            onCode={setCode}
            classmates={rosterFor(store.students, store.attendance, featured.id, today)}
            onConfirm={() => {
              if (!student) return;
              if (onList(featured.id)) return;
              if (!studentCanSelfCheckIn(featured, now)) {
                toast.error(selfCheckInHint(featured, now));
                return;
              }
              if (code.length !== 4) {
                toast.error("Digite o código de 4 dígitos no quadro.");
                return;
              }
              const ok = store.checkInWithCode(student.id, featured.id, code);
              if (ok) {
                toast.success(
                  "Confirmado. A turma já te vê na lista. O professor valida no tatame.",
                );
                setCode("");
              } else {
                toast.error("Código desta aula não confere, ou a turma lotou.");
              }
            }}
            onCancel={() => {
              if (!student) return;
              const ok = store.cancelCheckIn(student.id, featured.id);
              if (ok) toast.message("Você saiu da lista desta aula.");
              else toast.error("O professor já validou — peça na recepção.");
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
                  (a) => a.classId === c.id && a.date === today && isOnRoster(a),
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
                      <span className="text-[11px] text-muted-foreground">Na lista</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!student || !open || code.length !== 4}
                        onClick={() => {
                          if (!student) return;
                          const ok = store.checkInWithCode(student.id, c.id, code);
                          if (ok) {
                            toast.success("Confirmado. A turma já te vê.");
                            setCode("");
                          } else if (!open) {
                            toast.error(selfCheckInHint(c, now));
                          } else {
                            toast.error("Código desta aula não confere.");
                          }
                        }}
                      >
                        {open ? "Usar código" : "Fora da janela"}
                      </Button>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3">
        <div className="surface p-4">
          <p className="text-xs text-muted-foreground">Treinos no mês</p>
          <p className="mt-1 text-3xl font-medium tabular-nums">{att}</p>
        </div>
        <div className="surface p-4">
          <p className="text-xs text-muted-foreground">Plano da casa</p>
          <p className="mt-1 text-xl capitalize">{store.academy.plan}</p>
        </div>
      </div>

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
  code,
  onCode,
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
  code: string;
  onCode: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  classmates: { student: Student; row: Attendance }[];
}) {
  const pending = mine ? attendanceStatus(mine) === "pending" : false;
  const validated = mine ? isValidated(mine) : false;

  return (
    <div className="mt-3">
      <p className="font-mono text-[32px] leading-none tracking-tight">{session.startTime}</p>
      <p className="mt-2 text-sm">
        {session.name} · {session.gi ? "Gi" : "No-Gi"} · {session.durationMin} min
      </p>
      <p className="mt-1 text-[12px] text-muted-foreground">
        {phaseLabel(phase)} · {hint}
      </p>
      {validated ? (
        <div className="mt-4 border border-border bg-[#f3f2f1] px-3 py-3 text-sm">
          Presença validada pelo professor.
        </div>
      ) : pending ? (
        <div className="mt-4 space-y-2 border border-border bg-[#f3f2f1] px-3 py-3">
          <p className="text-sm">Você confirmou. Esperando o aceite no tatame.</p>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Desistir desta aula
          </Button>
        </div>
      ) : full ? (
        <p className="mt-4 border border-border bg-[#f3f2f1] px-3 py-3 text-sm text-muted-foreground">
          Turma lotada. Fale com o professor na recepção.
        </p>
      ) : canCheck ? (
        <>
          <Input
            className="mt-4 text-center font-mono tracking-[0.4em]"
            inputMode="numeric"
            maxLength={4}
            placeholder="0000"
            value={code}
            onChange={(e) => onCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
          />
          <Button className="mt-3 w-full" size="lg" onClick={onConfirm}>
            Confirmar que vou
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">{lockHint}</p>
        </>
      ) : (
        <p className="mt-4 border border-border bg-[#f3f2f1] px-3 py-3 text-sm text-muted-foreground">
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
        <ul className="mt-3 divide-y divide-border border border-border">
          {people.map(({ student, row }) => (
            <li key={student.id} className="flex items-center gap-3 px-3 py-2">
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
      <p className="text-xs text-muted-foreground">Próximo da casa</p>
      <p className="mt-1 font-medium">{next.title}</p>
      <p className="text-xs text-muted-foreground">
        {formatDay(next.date)} · {next.time} · {next.place}
      </p>
    </Link>
  );
}

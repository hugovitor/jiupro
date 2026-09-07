"use client";

import Link from "next/link";
import { toast } from "sonner";
import { BeltBadge } from "@/components/belt-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  classPhase,
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
import { useNow } from "@/lib/use-now";
import { cn } from "@/lib/utils";
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

  const alreadyIn = (classId: string) =>
    store.attendance.some(
      (a) =>
        a.studentId === student?.id && a.classId === classId && a.date === today,
    );

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
            name={featured.name}
            startTime={featured.startTime}
            durationMin={featured.durationMin}
            gi={featured.gi}
            phase={classPhase(featured, now)}
            hint={
              alreadyIn(featured.id)
                ? "Você já está na lista. Bom treino."
                : phaseHint(featured, now)
            }
            already={alreadyIn(featured.id)}
            canCheck={!!student && studentCanSelfCheckIn(featured, now)}
            lockHint={selfCheckInHint(featured, now)}
            code={code}
            onCode={setCode}
            onConfirm={() => {
              if (!student) return;
              if (alreadyIn(featured.id)) return;
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
                toast.success("Presença confirmada. Bom treino.");
                setCode("");
              } else {
                toast.error("Código desta aula não confere. Olhe o quadro.");
              }
            }}
          />
        )}
        {classes.filter((c) => c.id !== featured?.id).length > 0 && (
          <div className="mt-4 space-y-2 border-t border-border pt-3">
            {classes
              .filter((c) => c.id !== featured?.id)
              .map((c) => {
                const already = alreadyIn(c.id);
                const open = studentCanSelfCheckIn(c, now);
                return (
                  <div key={c.id} className="flex items-center justify-between gap-3 text-sm">
                    <div>
                      <p>
                        <span className="font-mono tabular-nums">{c.startTime}</span>
                        <span className="text-muted-foreground"> · {c.name}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {phaseLabel(classPhase(c, now))}
                        {already ? " · na lista" : ""}
                      </p>
                    </div>
                    {already ? (
                      <span className="text-[11px] text-muted-foreground">Confirmado</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!student || !open || code.length !== 4}
                        onClick={() => {
                          if (!student) return;
                          const ok = store.checkInWithCode(student.id, c.id, code);
                          if (ok) {
                            toast.success("Presença confirmada.");
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

function FeaturedClass({
  name,
  startTime,
  durationMin,
  gi,
  phase,
  hint,
  already,
  canCheck,
  lockHint,
  code,
  onCode,
  onConfirm,
}: {
  name: string;
  startTime: string;
  durationMin: number;
  gi: boolean;
  phase: ClassPhase;
  hint: string;
  already: boolean;
  canCheck: boolean;
  lockHint: string;
  code: string;
  onCode: (v: string) => void;
  onConfirm: () => void;
}) {
  return (
    <div className="mt-3">
      <p className="font-mono text-[32px] leading-none tracking-tight">{startTime}</p>
      <p className="mt-2 text-sm">
        {name} · {gi ? "Gi" : "No-Gi"} · {durationMin} min
      </p>
      <p className="mt-1 text-[12px] text-muted-foreground">
        {phaseLabel(phase)} · {hint}
      </p>
      {already ? (
        <div className="mt-4 border border-border bg-[#f3f2f1] px-3 py-3 text-sm">
          Você já está na lista desta aula.
        </div>
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
            Confirmar presença
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">{lockHint}</p>
        </>
      ) : (
        <p className="mt-4 border border-border bg-[#f3f2f1] px-3 py-3 text-sm text-muted-foreground">
          {lockHint}
        </p>
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

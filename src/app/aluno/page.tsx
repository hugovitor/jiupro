"use client";

import Link from "next/link";
import { toast } from "sonner";
import { BeltBadge } from "@/components/belt-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDay, isoDate, weekdayFull, weekdayToday } from "@/lib/format";
import { attendanceInDays } from "@/lib/insights";
import { currentStudent, useStore } from "@/lib/store";
import { useState } from "react";

export default function AlunoHome() {
  const store = useStore();
  const student = currentStudent(store);
  const classes = store.todayClasses().filter((c) => {
    if (!student) return true;
    if (c.division === "kids") return student.division === "kids";
    if (c.division === "adult") return student.division === "adult";
    return true;
  });
  const att = student ? attendanceInDays(store, student.id, 30) : 0;
  const [code, setCode] = useState("");

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between pb-1">
          <div>
            <p className="text-sm text-muted-foreground">
              {weekdayFull(weekdayToday())}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {student?.name.split(" ")[0] ?? "aluno"}
            </h1>
          </div>
          {student && <BeltBadge belt={student.belt} stripes={student.stripes} />}
        </div>

      <section className="surface p-4">
        <p className="text-xs text-muted-foreground">Hoje no tatame</p>
        {classes.length === 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            Sem turma na grade hoje. Volte no próximo treino.
          </p>
        )}
        <div className="mt-3 space-y-3">
          {classes.map((c) => {
            const already = store.attendance.some(
              (a) =>
                a.studentId === student?.id &&
                a.classId === c.id &&
                a.date === isoDate(0),
            );
            return (
              <div key={c.id} className="rounded-xl bg-background/80 p-4 ring-1 ring-white/6">
                <p className="font-display text-2xl">{c.startTime}</p>
                <p className="text-sm text-muted-foreground">
                  {c.name} · {c.durationMin} min · {c.gi ? "Gi" : "No-Gi"}
                </p>
                {!already && (
                  <Input
                    className="mt-3 text-center tracking-[0.4em]"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="Código do dia"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  />
                )}
                <Button
                  className="mt-3 w-full"
                  size="lg"
                  variant={already ? "secondary" : "default"}
                  disabled={!student}
                  onClick={() => {
                    if (!student) return;
                    if (already) return;
                    if (code.length === 4) {
                      const ok = store.checkInWithCode(student.id, c.id, code);
                      if (ok) toast.success("Presença confirmada. Bom treino.");
                      else toast.error("Código de hoje não confere. Olhe o quadro.");
                      return;
                    }
                    const ok = store.checkIn(student.id, c.id, "app");
                    if (ok) toast.success("Presença marcada. Bom treino.");
                    else toast.message("Você já marcou esta aula.");
                  }}
                >
                  {already ? "Você já está na lista" : "Estou no tatame"}
                </Button>
                {!already && (
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    Com o código da recepção, ou um toque se o professor liberar.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <div className="surface p-4">
          <p className="text-xs text-muted-foreground">Treinos no mês</p>
          <p className="font-display text-3xl">{att}</p>
        </div>
        <div className="surface p-4">
          <p className="text-xs text-muted-foreground">Plano da casa</p>
          <p className="font-display text-xl capitalize">{store.academy.plan}</p>
        </div>
      </div>

      <GradeSemana />
      <ProximoEvento />
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
            className={`flex justify-between text-sm ${
              c.weekday === today ? "text-primary" : ""
            }`}
          >
            <span>
              {weekdayFull(c.weekday)} · {c.startTime}
            </span>
            <span className="text-muted-foreground">
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
    <Link
      href="/aluno/agenda"
      className="surface block p-4"
    >
      <p className="text-xs text-muted-foreground">Próximo da casa</p>
      <p className="mt-1 font-medium">{next.title}</p>
      <p className="text-xs text-muted-foreground">
        {formatDay(next.date)} · {next.time} · {next.place}
      </p>
    </Link>
  );
}

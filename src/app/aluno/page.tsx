"use client";

import { toast } from "sonner";
import { BeltBadge } from "@/components/belt-badge";
import { Button } from "@/components/ui/button";
import { isoDate } from "@/lib/format";
import { attendanceInDays } from "@/lib/insights";
import { currentStudent, useStore } from "@/lib/store";

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

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-[0.18em] text-primary uppercase">
          {store.academy.name}
        </p>
        <h1 className="font-display text-3xl">
          Olá, {student?.name.split(" ")[0] ?? "aluno"}
        </h1>
        {student && (
          <div className="mt-2">
            <BeltBadge belt={student.belt} stripes={student.stripes} />
          </div>
        )}
      </div>

      <section className="rounded-2xl border border-border bg-card p-4">
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
              <div key={c.id} className="rounded-xl bg-background p-4">
                <p className="font-display text-2xl">{c.startTime}</p>
                <p className="text-sm text-muted-foreground">
                  {c.name} · {c.durationMin} min · {c.gi ? "Gi" : "No-Gi"}
                </p>
                <Button
                  className="mt-3 w-full"
                  size="lg"
                  variant={already ? "secondary" : "default"}
                  disabled={!student}
                  onClick={() => {
                    if (!student) return;
                    const ok = store.checkIn(student.id, c.id, "app");
                    if (ok) toast.success("Presença marcada. Bom treino.");
                    else toast.message("Você já marcou esta aula.");
                  }}
                >
                  {already ? "Você já está na lista" : "Estou no tatame"}
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Treinos no mês</p>
          <p className="font-display text-3xl">{att}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Plano da casa</p>
          <p className="font-display text-xl capitalize">{store.academy.plan}</p>
        </div>
      </div>
    </div>
  );
}

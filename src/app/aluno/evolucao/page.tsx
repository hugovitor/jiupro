"use client";

import { BeltBadge } from "@/components/belt-badge";
import { Progress } from "@/components/ui/progress";
import { beltLabel } from "@/lib/belts";
import { formatDate, monthsBetween } from "@/lib/format";
import { attendanceInDays } from "@/lib/insights";
import { currentStudent, useStore } from "@/lib/store";

export default function EvolucaoPage() {
  const store = useStore();
  const student = currentStudent(store);
  if (!student) {
    return <p className="text-sm text-muted-foreground">Perfil de aluno não ligado.</p>;
  }

  const months = monthsBetween(student.lastPromotionDate);
  const att = attendanceInDays(store, student.id, 90);
  const history = store.graduations.filter((g) => g.studentId === student.id);
  const timeProgress = Math.min(100, Math.round((months / 8) * 100));
  const attProgress = Math.min(100, Math.round((att / 24) * 100));

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Evolução</h1>
      <div className="rounded-2xl border border-border bg-card p-5">
        <BeltBadge belt={student.belt} stripes={student.stripes} />
        <p className="mt-3 font-display text-2xl">
          {beltLabel(student.belt, student.stripes)}
        </p>
        <p className="text-sm text-muted-foreground">
          No grau desde {formatDate(student.lastPromotionDate)}
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span>Tempo no grau</span>
            <span>{months} / 8 meses</span>
          </div>
          <Progress value={timeProgress} />
        </div>
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span>Presença (90 dias)</span>
            <span>{att} treinos</span>
          </div>
          <Progress value={attProgress} />
        </div>
        <p className="text-xs text-muted-foreground">
          A promoção continua na mão do professor. Isso só mostra se você está
          no caminho.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm tracking-[0.16em] text-muted-foreground uppercase">
          Histórico
        </h2>
        <div className="space-y-3">
          {history.length === 0 && (
            <p className="text-sm text-muted-foreground">Sua primeira faixa ainda vai entrar aqui.</p>
          )}
          {history.map((g) => (
            <div key={g.id} className="border-l-2 border-primary/50 pl-3">
              <p className="text-sm font-medium">
                {beltLabel(g.toBelt, g.stripes)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(g.date)} · {g.notes}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

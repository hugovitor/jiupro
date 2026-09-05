"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PersonAvatar } from "@/components/belt-badge";
import { Button } from "@/components/ui/button";
import { isoDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import { dayCode } from "@/lib/whatsapp";

export default function PresencaPage() {
  const store = useStore();
  const today = isoDate(0);
  const classes = store.todayClasses();
  const [classId, setClassId] = useState(classes[0]?.id ?? store.classes[0]?.id);

  const cls = store.classes.find((c) => c.id === classId);
  const students = useMemo(() => {
    return store.students.filter((s) => {
      if (s.status === "inactive") return false;
      if (!cls) return true;
      if (cls.division === "kids") return s.division === "kids";
      if (cls.division === "adult") return s.division === "adult";
      return true;
    });
  }, [store.students, cls]);

  const presentIds = new Set(
    store.attendance
      .filter((a) => a.classId === classId && a.date === today)
      .map((a) => a.studentId),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl">Presença</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chamada de hoje. O aluno também marca pelo PWA.
        </p>
      </div>

      <div className="rounded-2xl border border-primary/40 bg-card p-5 text-center">
        <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
          Código do dia
        </p>
        <p className="mt-1 font-display text-5xl tracking-[0.2em] text-primary">
          {dayCode(today, store.academy.slug)}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Anote no quadro. O aluno confirma no PWA com este número.
        </p>
      </div>

      {classes.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          Não há turma na grade para hoje. Você ainda pode lançar em qualquer
          horário da semana.
        </p>
      ) : (
        <p className="text-sm text-primary">
          {classes.length} turma(s) hoje na grade.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {(classes.length ? classes : store.classes).map((c) => (
          <Button
            key={c.id}
            size="sm"
            variant={classId === c.id ? "default" : "outline"}
            onClick={() => setClassId(c.id)}
          >
            {c.name} {c.startTime}
          </Button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        {presentIds.size} presentes de {students.length}
      </p>

      <div className="space-y-2">
        {students.map((s) => {
          const here = presentIds.has(s.id);
          return (
            <div
              key={s.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              <PersonAvatar name={s.name} hue={s.avatarHue} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.phone}</p>
              </div>
              <Button
                size="sm"
                variant={here ? "secondary" : "default"}
                onClick={() => {
                  if (here) {
                    toast.message("Já está na lista de hoje.");
                    return;
                  }
                  store.checkIn(s.id, classId, "manual");
                  toast.success(`${s.name} presente.`);
                }}
              >
                {here ? "Presente" : "Marcar"}
              </Button>
            </div>
          );
        })}
      </div>

      <FrequenciaMes />
    </div>
  );
}

function FrequenciaMes() {
  const store = useStore();
  const month = new Date().toISOString().slice(0, 7);
  const rows = store.students
    .filter((s) => s.status !== "inactive")
    .map((s) => ({
      s,
      n: store.attendance.filter((a) => a.studentId === s.id && a.date.startsWith(month))
        .length,
    }))
    .sort((a, b) => b.n - a.n);

  return (
    <section className="space-y-2">
      <h2 className="font-display text-xl">Frequência do mês</h2>
      {rows.map(({ s, n }) => (
        <div key={s.id} className="flex items-center justify-between text-sm">
          <span>{s.name}</span>
          <span className={n === 0 ? "text-destructive" : "text-muted-foreground"}>
            {n} treino{n === 1 ? "" : "s"}
          </span>
        </div>
      ))}
    </section>
  );
}

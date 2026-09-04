"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PersonAvatar } from "@/components/belt-badge";
import { Button } from "@/components/ui/button";
import { isoDate } from "@/lib/format";
import { useStore } from "@/lib/store";

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
    </div>
  );
}

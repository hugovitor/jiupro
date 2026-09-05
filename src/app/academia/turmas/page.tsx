"use client";

import { useState } from "react";
import { toast } from "sonner";
import { BeltBadge } from "@/components/belt-badge";
import { FormDialog } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { weekdayFull, weekdayName, isoDate } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function TurmasPage() {
  const store = useStore();
  const today = isoDate(0);
  const grouped = [0, 1, 2, 3, 4, 5, 6]
    .map((day) => ({
      day,
      classes: store.classes.filter((c) => c.weekday === day),
    }))
    .filter((g) => g.classes.length > 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Turmas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Grade da semana. A chamada e o PWA usam esta lista.
          </p>
        </div>
        <NovaTurma />
      </div>
      <div className="space-y-6">
        {grouped.map((g) => (
          <section key={g.day}>
            <h2 className="mb-2 font-display text-xl">{weekdayFull(g.day)}</h2>
            <div className="space-y-2">
              {g.classes.map((c) => {
                const instructor = store.users.find((u) => u.id === c.instructorId);
                const todayCount =
                  store.attendance.filter((a) => a.classId === c.id && a.date === today)
                    .length +
                  (store.dropIns ?? []).filter(
                    (d) => d.classId === c.id && d.date === today,
                  ).length;
                return (
                  <article
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-3 border border-border bg-card p-4"
                  >
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {c.startTime} · {c.durationMin} min · {c.gi ? "Gi" : "No-Gi"} ·{" "}
                        {instructor?.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-right text-sm text-muted-foreground">
                      <div>
                        <p>
                          {weekdayName(c.weekday).toUpperCase()} · até {c.capacity}
                          {c.weekday === new Date().getDay() ? ` · ${todayCount} hoje` : ""}
                        </p>
                        <BeltBadge
                          belt={c.division === "kids" ? "yellow" : "blue"}
                          stripes={0}
                          compact
                          className="mt-1"
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          store.removeClass(c.id);
                          toast.message("Turma removida da grade.");
                        }}
                      >
                        Tirar
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function NovaTurma() {
  const store = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Adultos Gi");
  const [weekday, setWeekday] = useState("1");
  const [time, setTime] = useState("19:30");

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Nova turma
      </Button>
      <FormDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Incluir na grade"
      >
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            store.addClass({
              name,
              weekday: Number(weekday),
              startTime: time,
              durationMin: 75,
              instructorId: store.users.find((u) => u.role === "owner")?.id ?? "u_carla",
              division: "adult",
              gi: true,
              capacity: 28,
            });
            toast.success("Turma na grade.");
            setOpen(false);
          }}
        >
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Dia</Label>
              <select
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                value={weekday}
                onChange={(e) => setWeekday(e.target.value)}
              >
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Horário</Label>
              <Input value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <Button type="submit">Salvar</Button>
        </form>
      </FormDialog>
    </>
  );
}

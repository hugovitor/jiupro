"use client";

import { useState } from "react";
import { toast } from "sonner";
import { BeltBadge } from "@/components/belt-badge";
import { FormDialog } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { weekdayFull, weekdayName, isoDate, weekdayToday } from "@/lib/format";
import { attendanceDay } from "@/lib/roster-identity";
import { useStore } from "@/lib/store";
import type { ClassSession } from "@/lib/types";

const WEEKDAYS = [
  { value: "0", label: "Domingo" },
  { value: "1", label: "Segunda" },
  { value: "2", label: "Terça" },
  { value: "3", label: "Quarta" },
  { value: "4", label: "Quinta" },
  { value: "5", label: "Sexta" },
  { value: "6", label: "Sábado" },
];

const DIVISIONS = [
  { value: "adult", label: "Adultos" },
  { value: "kids", label: "Kids" },
  { value: "mixed", label: "Mista" },
];

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
            Grade da semana. Ajuste nome, horário e quantos cabem na aula.
          </p>
        </div>
        <TurmaDialog />
      </div>
      <div className="space-y-6">
        {grouped.map((g) => (
          <section key={g.day}>
            <h2 className="mb-2 font-display text-xl">{weekdayFull(g.day)}</h2>
            <div className="space-y-2">
              {g.classes.map((c) => {
                const instructor = store.users.find((u) => u.id === c.instructorId);
                const todayCount =
                  store.attendance.filter((a) => a.classId === c.id && attendanceDay(a.date) === today)
                    .length +
                  (store.dropIns ?? []).filter(
                    (d) => d.classId === c.id && attendanceDay(d.date) === today,
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
                          {weekdayName(c.weekday).toUpperCase()} ·{" "}
                          {c.capacity > 0 ? `até ${c.capacity}` : "sem limite"}
                          {c.weekday === weekdayToday() ? ` · ${todayCount} hoje` : ""}
                        </p>
                        <BeltBadge
                          belt={c.division === "kids" ? "yellow" : "blue"}
                          stripes={0}
                          compact
                          className="mt-1"
                        />
                      </div>
                      <TurmaDialog existing={c} />
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

function TurmaDialog({ existing }: { existing?: ClassSession }) {
  const store = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(existing?.name ?? "Adultos Gi");
  const [weekday, setWeekday] = useState(String(existing?.weekday ?? weekdayToday()));
  const [time, setTime] = useState(existing?.startTime ?? "19:30");
  const [duration, setDuration] = useState(String(existing?.durationMin ?? 75));
  const [capacity, setCapacity] = useState(String(existing?.capacity ?? 24));
  const [gi, setGi] = useState(existing?.gi ?? true);
  const [division, setDivision] = useState(existing?.division ?? "adult");

  function syncFromExisting() {
    if (!existing) return;
    setName(existing.name);
    setWeekday(String(existing.weekday));
    setTime(existing.startTime);
    setDuration(String(existing.durationMin));
    setCapacity(String(existing.capacity));
    setGi(existing.gi);
    setDivision(existing.division);
  }

  return (
    <>
      <Button
        type="button"
        size={existing ? "sm" : "default"}
        variant={existing ? "outline" : "default"}
        onClick={() => {
          syncFromExisting();
          setOpen(true);
        }}
      >
        {existing ? "Editar" : "Nova turma"}
      </Button>
      <FormDialog
        open={open}
        onClose={() => setOpen(false)}
        title={existing ? "Editar turma" : "Incluir na grade"}
        className="max-w-md"
      >
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const seats = Math.max(0, Number(capacity) || 0);
            const mins = Math.max(15, Number(duration) || 75);
            const payload = {
              name: name.trim() || "Turma",
              weekday: Number(weekday),
              startTime: time,
              durationMin: mins,
              instructorId:
                existing?.instructorId ||
                store.users.find((u) => u.role === "owner")?.id ||
                "",
              division: division as ClassSession["division"],
              gi,
              capacity: seats,
            };
            if (existing) {
              store.updateClass(existing.id, payload);
              toast.success(
                seats > 0
                  ? `Turma atualizada · até ${seats} alunos.`
                  : "Turma atualizada · sem limite de vagas.",
              );
            } else {
              store.addClass(payload);
              toast.success(`Turma na ${weekdayFull(Number(weekday))}.`);
            }
            setOpen(false);
            if (!existing) setWeekday(String(weekdayToday()));
          }}
        >
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Dia</Label>
              <Select
                value={weekday}
                onValueChange={(value) => {
                  if (value != null) setWeekday(String(value));
                }}
                items={WEEKDAYS}
              >
                <SelectTrigger className="h-9 w-full min-w-0 rounded-lg border-white/15 bg-[#111] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} align="start">
                  {WEEKDAYS.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Horário</Label>
              <Input value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Duração (min)</Label>
              <Input
                inputMode="numeric"
                value={duration}
                onChange={(e) => setDuration(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Vagas</Label>
              <Input
                inputMode="numeric"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value.replace(/\D/g, ""))}
              />
              <p className="text-[11px] text-muted-foreground">0 = sem limite</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Divisão</Label>
              <Select
                value={division}
                onValueChange={(value) => {
                  if (value != null) setDivision(value as ClassSession["division"]);
                }}
                items={DIVISIONS}
              >
                <SelectTrigger className="h-9 w-full min-w-0 rounded-lg border-white/15 bg-[#111] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} align="start">
                  {DIVISIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Kimono</Label>
              <button
                type="button"
                className="flex h-9 w-full items-center justify-between rounded-lg border border-white/15 bg-[#111] px-3 text-sm text-white"
                onClick={() => setGi((v) => !v)}
              >
                {gi ? "Gi" : "No-Gi"}
              </button>
            </div>
          </div>
          <Button type="submit">{existing ? "Salvar alterações" : "Salvar"}</Button>
        </form>
      </FormDialog>
    </>
  );
}

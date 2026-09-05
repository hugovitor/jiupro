"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatDay } from "@/lib/format";
import { EVENT_KIND_LABEL } from "@/lib/insights";
import { currentStudent, useStore } from "@/lib/store";
import { isoDate, brl } from "@/lib/format";

export default function AlunoAgendaPage() {
  const store = useStore();
  const student = currentStudent(store);
  const today = isoDate(0);
  const events = [...(store.events ?? [])]
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Agenda</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          O que a casa marcou. Confirma se você vai.
        </p>
      </div>

      {events.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nada na frente. Olha o mural se surgir um seminário.
        </p>
      )}

      {events.map((evt) => {
        const going = student ? evt.goingIds.includes(student.id) : false;
        return (
          <article
            key={evt.id}
            className="border border-border bg-card p-4"
          >
            <p className="text-xs text-primary">
              {EVENT_KIND_LABEL[evt.kind] ?? evt.kind}
            </p>
            <h2 className="mt-1 font-display text-2xl">{evt.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDay(evt.date)} · {evt.time}
              <br />
              {evt.place}
              {evt.fee ? ` · ${brl(evt.fee)}` : ""}
            </p>
            {evt.notes && (
              <p className="mt-2 text-sm text-muted-foreground">{evt.notes}</p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              {evt.goingIds.length} da equipe já confirmaram
            </p>
            <Button
              className="mt-3 w-full"
              size="lg"
              variant={going ? "secondary" : "default"}
              disabled={!student}
              onClick={() => {
                if (!student) return;
                store.toggleRsvp(evt.id, student.id);
                toast.success(
                  going ? "Beleza, te tiramos da lista." : "Confirmado. Oss.",
                );
              }}
            >
              {going ? "Você vai · desmarcar" : "Eu vou"}
            </Button>
          </article>
        );
      })}
    </div>
  );
}

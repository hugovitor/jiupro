"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PersonAvatar } from "@/components/belt-badge";
import { FormDialog } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brl, formatDay, isoDate } from "@/lib/format";
import { EVENT_KIND_LABEL } from "@/lib/insights";
import { useStore } from "@/lib/store";
import type { EventKind } from "@/lib/types";
import { eventInviteMessage, waHref } from "@/lib/whatsapp";

export default function AgendaPage() {
  const store = useStore();
  const today = isoDate(0);
  const events = [...(store.events ?? [])].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const upcoming = events.filter((e) => e.date >= today);
  const past = events.filter((e) => e.date < today);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Agenda</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Seminário, campeonato, open mat. Quem confirmou, quem ainda não.
          </p>
        </div>
        <NovoEvento />
      </div>

      {upcoming.length === 0 && (
        <p className="text-sm text-muted-foreground">Nada marcado à frente.</p>
      )}
      {upcoming.map((evt) => (
        <EventCard key={evt.id} eventId={evt.id} />
      ))}

      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-xl">Já rolou</h2>
          {past.map((evt) => (
            <EventCard key={evt.id} eventId={evt.id} />
          ))}
        </section>
      )}
    </div>
  );
}

function EventCard({ eventId }: { eventId: string }) {
  const store = useStore();
  const evt = store.events.find((e) => e.id === eventId);
  if (!evt) return null;
  const going = store.students.filter((s) => evt.goingIds.includes(s.id));
  const missing = store.students.filter(
    (s) => s.status === "active" && !evt.goingIds.includes(s.id),
  );

  return (
    <article className="border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-primary">
            {EVENT_KIND_LABEL[evt.kind] ?? evt.kind}
          </p>
          <h2 className="font-display text-2xl">{evt.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDay(evt.date)} · {evt.time} · {evt.place}
            {evt.fee ? ` · ${brl(evt.fee)}` : ""}
          </p>
          {evt.notes && (
            <p className="mt-2 text-sm text-muted-foreground">{evt.notes}</p>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            store.removeEvent(evt.id);
            toast.message("Evento tirado da agenda.");
          }}
        >
          Tirar
        </Button>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        {going.length} confirmado{going.length === 1 ? "" : "s"}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {going.map((s) => (
          <button
            key={s.id}
            type="button"
            className="flex items-center gap-2 rounded-full border border-border bg-background px-2 py-1 text-xs"
            onClick={() => store.toggleRsvp(evt.id, s.id)}
          >
            <PersonAvatar name={s.name} hue={s.avatarHue} size="sm" />
            {s.name.split(" ")[0]}
          </button>
        ))}
      </div>

      {missing.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-muted-foreground">Ainda não confirmaram</p>
          {missing.slice(0, 6).map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-2 rounded-lg border border-border p-2"
            >
              <PersonAvatar name={s.name} hue={s.avatarHue} size="sm" />
              <span className="min-w-0 flex-1 truncate text-sm">{s.name}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  store.toggleRsvp(evt.id, s.id);
                  toast.success(`${s.name.split(" ")[0]} confirmado.`);
                }}
              >
                Vai
              </Button>
              <Button
                size="sm"
                variant="ghost"
                render={
                  <a
                    href={waHref(
                      s.phone,
                      eventInviteMessage(store.academy, s, evt),
                    )}
                    target="_blank"
                    rel="noreferrer"
                  />
                }
              >
                Zap
              </Button>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function NovoEvento() {
  const store = useStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<EventKind>("seminar");
  const [date, setDate] = useState(isoDate(7));
  const [time, setTime] = useState("10:00");
  const [place, setPlace] = useState("Tatame principal");
  const [fee, setFee] = useState("0");

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Novo evento
      </Button>
      <FormDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Marcar na agenda"
      >
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            store.addEvent({
              title: title.trim(),
              kind,
              date,
              time,
              place,
              notes: "",
              fee: Number(fee.replace(",", ".")) || 0,
            });
            toast.success("Evento na agenda.");
            setOpen(false);
            setTitle("");
          }}
        >
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Open mat de sábado, estadual…"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <select
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                value={kind}
                onChange={(e) => setKind(e.target.value as EventKind)}
              >
                {(Object.keys(EVENT_KIND_LABEL) as EventKind[]).map((k) => (
                  <option key={k} value={k}>
                    {EVENT_KIND_LABEL[k]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Inscrição (R$)</Label>
              <Input value={fee} onChange={(e) => setFee(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Horário</Label>
              <Input value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Local</Label>
            <Input value={place} onChange={(e) => setPlace(e.target.value)} />
          </div>
          <Button type="submit">Salvar</Button>
        </form>
      </FormDialog>
    </>
  );
}

"use client";

import { toast } from "sonner";
import { BeltBadge, PersonAvatar } from "@/components/belt-badge";
import { Button } from "@/components/ui/button";
import { beltLabel } from "@/lib/belts";
import { monthsBetween, isoDate } from "@/lib/format";
import { attendanceInDays, isPromotionCandidate } from "@/lib/insights";
import { useStore } from "@/lib/store";

export default function GraduacoesPage() {
  const store = useStore();
  const ready = store.students.filter((s) => isPromotionCandidate(store, s));
  const rest = store.students.filter(
    (s) => s.status === "active" && !ready.some((r) => r.id === s.id),
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="font-display text-3xl">Graduações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Critério da casa: tempo no grau + frequência. Você confirma no tatame.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm tracking-[0.16em] text-primary uppercase">
          Prontos agora
        </h2>
        {ready.length > 0 && (
          <Button
            className="mb-3"
            variant="outline"
            onClick={() => {
              store.addEvent({
                title: "Seminário de faixas",
                kind: "graduation",
                date: isoDate(14),
                time: "11:00",
                place: "Tatame principal",
                notes: `Fila: ${ready.map((s) => s.name.split(" ")[0]).join(", ")}.`,
                fee: 0,
                goingIds: ready.map((s) => s.id),
              });
              toast.success("Seminário de faixas na agenda.");
            }}
          >
            Marcar seminário de faixas
          </Button>
        )}
        <div className="space-y-2">
          {ready.length === 0 && (
            <p className="text-sm text-muted-foreground">Ninguém na fila hoje.</p>
          )}
          {ready.map((s) => (
            <article
              key={s.id}
              className="flex flex-col gap-3 rounded-xl border border-primary/40 bg-card p-4 sm:flex-row sm:items-center"
            >
              <PersonAvatar name={s.name} hue={s.avatarHue} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  {monthsBetween(s.lastPromotionDate)} meses no grau ·{" "}
                  {attendanceInDays(store, s.id, 90)} treinos em 90 dias
                </p>
                <div className="mt-1">
                  <BeltBadge belt={s.belt} stripes={s.stripes} />
                </div>
              </div>
              <Button
                onClick={() => {
                  store.promote(s.id, "Promovido pela lista de graduação.");
                  toast.success(`${s.name}: ${beltLabel(s.belt, s.stripes)} atualizado.`);
                }}
              >
                Promover
              </Button>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm tracking-[0.16em] text-muted-foreground uppercase">
          Demais ativos
        </h2>
        <div className="space-y-2">
          {rest.map((s) => (
            <article
              key={s.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              <PersonAvatar name={s.name} hue={s.avatarHue} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  {monthsBetween(s.lastPromotionDate)} meses ·{" "}
                  {attendanceInDays(store, s.id, 90)} treinos / 90d
                </p>
              </div>
              <BeltBadge belt={s.belt} stripes={s.stripes} compact />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  store.addStripe(s.id);
                  toast.success("Grau registrado.");
                }}
              >
                Grau
              </Button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

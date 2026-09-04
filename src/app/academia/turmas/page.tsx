"use client";

import { BeltBadge } from "@/components/belt-badge";
import { weekdayFull, weekdayName } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function TurmasPage() {
  const store = useStore();
  const grouped = [0, 1, 2, 3, 4, 5, 6]
    .map((day) => ({
      day,
      classes: store.classes.filter((c) => c.weekday === day),
    }))
    .filter((g) => g.classes.length > 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-3xl">Turmas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Grade da semana. A chamada usa esta lista.
        </p>
      </div>
      <div className="space-y-6">
        {grouped.map((g) => (
          <section key={g.day}>
            <h2 className="mb-2 font-display text-xl">{weekdayFull(g.day)}</h2>
            <div className="space-y-2">
              {g.classes.map((c) => {
                const instructor = store.users.find((u) => u.id === c.instructorId);
                return (
                  <article
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
                  >
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {c.startTime} · {c.durationMin} min · {c.gi ? "Gi" : "No-Gi"} ·{" "}
                        {instructor?.name}
                      </p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>
                        {weekdayName(c.weekday).toUpperCase()} · até {c.capacity} no tatame
                      </p>
                      <BeltBadge
                        belt={c.division === "kids" ? "yellow" : "blue"}
                        stripes={0}
                        compact
                        className="mt-1"
                      />
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

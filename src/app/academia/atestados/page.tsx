"use client";

import Link from "next/link";
import { toast } from "sonner";
import { EmptyState } from "@/components/academia/empty-state";
import { PersonAvatar } from "@/components/belt-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDay, isoDate } from "@/lib/format";
import {
  medicalLabel,
  medicalNeedsAttention,
  medicalSortRank,
  medicalStatus,
} from "@/lib/medical-certificate";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function AtestadosPage() {
  const store = useStore();
  const today = isoDate(0);
  const rows = store.students
    .filter((student) => student.status !== "inactive")
    .slice()
    .sort((a, b) => {
      const rank =
        medicalSortRank(a.medicalCertificateUntil, today) -
        medicalSortRank(b.medicalCertificateUntil, today);
      if (rank) return rank;
      return a.name.localeCompare(b.name, "pt-BR");
    });
  const attention = rows.filter((student) =>
    medicalNeedsAttention(student.medicalCertificateUntil, today),
  );

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <h1 className="font-display text-3xl">Atestados</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Validade na ficha do aluno. Quem está vencido ou sem atestado aparece na
          chamada — o professor ainda pode dar presença.
        </p>
      </div>

      <p className="text-sm">
        {attention.length} para olhar · {rows.length} na academia
      </p>

      {rows.length === 0 ? (
        <EmptyState
          title="Nenhum aluno na lista"
          body="Cadastre a ficha para registrar o atestado médico."
          action={
            <Button render={<Link href="/academia/alunos?novo=1" />}>Cadastrar aluno</Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {rows.map((student) => {
            const status = medicalStatus(student.medicalCertificateUntil, today);
            return (
              <article
                key={student.id}
                className="flex flex-col gap-3 border border-border bg-card p-4 sm:flex-row sm:items-center"
              >
                <PersonAvatar name={student.name} hue={student.avatarHue} />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/academia/alunos/${student.id}`}
                    className="font-medium hover:underline"
                  >
                    {student.name}
                  </Link>
                  <p
                    className={cn(
                      "text-xs",
                      status === "expired" || status === "missing"
                        ? "text-destructive"
                        : status === "expiring"
                          ? "text-amber-400"
                          : "text-muted-foreground",
                    )}
                  >
                    {medicalLabel(student.medicalCertificateUntil, today)}
                    {student.medicalCertificateUntil
                      ? ` · ${formatDay(student.medicalCertificateUntil)}`
                      : ""}
                  </p>
                </div>
                <form
                  className="flex flex-wrap items-center gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const data = new FormData(event.currentTarget);
                    const until = String(data.get("until") ?? "").slice(0, 10);
                    store.updateStudent(student.id, {
                      medicalCertificateUntil: until,
                    });
                    toast.success(
                      until
                        ? `Atestado de ${student.name.split(" ")[0]} até ${formatDay(until)}.`
                        : `Atestado de ${student.name.split(" ")[0]} limpo.`,
                    );
                  }}
                >
                  <Input
                    type="date"
                    name="until"
                    defaultValue={student.medicalCertificateUntil?.slice(0, 10) ?? ""}
                    className="w-[10.5rem]"
                    aria-label={`Validade do atestado de ${student.name}`}
                  />
                  <Button type="submit" size="sm" variant="outline">
                    Salvar
                  </Button>
                </form>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

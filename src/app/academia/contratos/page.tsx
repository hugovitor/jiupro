"use client";

import Link from "next/link";
import { toast } from "sonner";
import { EmptyState } from "@/components/academia/empty-state";
import { PersonAvatar } from "@/components/belt-badge";
import { Button } from "@/components/ui/button";
import {
  contractLabel,
  contractStatus,
  hasPublishedContract,
  studentNeedsContractSignature,
} from "@/lib/enrollment-contract";
import { formatDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function ContratosPage() {
  const store = useStore();
  const published = hasPublishedContract(store.academy);
  const rows = store.students
    .filter((student) => student.status !== "inactive")
    .slice()
    .sort((a, b) => {
      const needA = studentNeedsContractSignature(a, store.academy) ? 0 : 1;
      const needB = studentNeedsContractSignature(b, store.academy) ? 0 : 1;
      if (needA !== needB) return needA - needB;
      return a.name.localeCompare(b.name, "pt-BR");
    });
  const pending = rows.filter((student) =>
    studentNeedsContractSignature(student, store.academy),
  );

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <h1 className="font-display text-3xl">Contratos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Contrato da academia, não o termo do TatameX. O aluno (ou o responsável
          no kids) assina no perfil. Quem falta não confirma aula sozinho — o
          professor ainda pode dar presença. Experimental treina uma vez sem
          assinar.
        </p>
      </div>

      {published ? (
        <p className="text-sm">
          Versão {store.academy.contractVersion} publicada
          {store.academy.contractUpdatedAt
            ? ` em ${formatDate(store.academy.contractUpdatedAt)}`
            : ""}
          . {pending.length} falta{pending.length === 1 ? "" : "m"} assinar · {rows.length} na
          academia.
        </p>
      ) : (
        <EmptyState
          title="Nenhum contrato publicado"
          body="Escreva o texto da casa em Configurações. Sem isso o aluno não precisa assinar."
          action={
            <Button render={<Link href="/academia/configuracoes" />}>
              Abrir configurações
            </Button>
          }
        />
      )}

      {published && rows.length === 0 ? (
        <EmptyState
          title="Nenhum aluno na lista"
          body="Cadastre a ficha para registrar o aceite."
          action={
            <Button render={<Link href="/academia/alunos?novo=1" />}>Cadastrar aluno</Button>
          }
        />
      ) : null}

      {published && rows.length > 0 ? (
        <div className="space-y-2">
          {rows.map((student) => {
            const status = contractStatus(student, store.academy);
            const needs = studentNeedsContractSignature(student, store.academy);
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
                      needs ? "text-destructive" : "text-muted-foreground",
                    )}
                  >
                    {contractLabel(student, store.academy)}
                    {student.division === "kids" ? " · kids" : ""}
                    {student.status === "trial" ? " · experimental" : ""}
                    {student.contractSignedBy
                      ? ` · ${student.contractSignedBy}`
                      : ""}
                  </p>
                </div>
                {needs ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const result = store.recordEnrollmentContract(student.id);
                      if (!result.ok) {
                        toast.error(result.error);
                        return;
                      }
                      toast.success(
                        status === "stale"
                          ? `Aceite da versão ${store.academy.contractVersion} registrado.`
                          : `Aceite de ${student.name.split(" ")[0]} registrado.`,
                      );
                    }}
                  >
                    Registrar aceite
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">Ok</span>
                )}
              </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

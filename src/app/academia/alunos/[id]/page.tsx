"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { AsaasChargeButton } from "@/components/asaas-pix-dialog";
import { BeltBadge, PersonAvatar } from "@/components/belt-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { beltLabel } from "@/lib/belts";
import {
  brl,
  currentMonth,
  formatDate,
  formatDay,
  isoDate,
  monthsBetween,
} from "@/lib/format";
import { formatCpf } from "@/lib/cpf";
import { attendanceInDays } from "@/lib/insights";
import { useStore } from "@/lib/store";
import { studentAppInviteHref } from "@/lib/student-join";
import { overdueMessage, waHref } from "@/lib/whatsapp";
import { useState } from "react";

export default function AlunoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const store = useStore();
  const student = store.students.find((s) => s.id === id);
  if (!student) {
    return <p className="text-sm text-muted-foreground">Aluno não encontrado.</p>;
  }

  const month = currentMonth();
  const pays = store.payments.filter((p) => p.studentId === student.id);
  const history = store.graduations.filter((g) => g.studentId === student.id);
  const last = store.lastAttendance(student.id);
  const att30 = attendanceInDays(store, student.id, 30);
  const att90 = attendanceInDays(store, student.id, 90);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/academia/alunos" className="text-sm text-muted-foreground hover:text-foreground">
        ← Alunos
      </Link>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <PersonAvatar name={student.name} hue={student.avatarHue} size="lg" />
          <div>
            <h1 className="font-display text-3xl">{student.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <BeltBadge belt={student.belt} stripes={student.stripes} />
              <span className="text-sm text-muted-foreground">
                {student.division === "kids" ? "Kids" : "Adulto"} · desde{" "}
                {formatDate(student.joinDate)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {student.phone ? (
            <Button
              variant="outline"
              render={
                <a
                  href={studentAppInviteHref(store.academy, student.phone, student)}
                  target="_blank"
                  rel="noreferrer"
                />
              }
            >
              {student.userId ? "Mandar login do app" : "Enviar app"}
            </Button>
          ) : null}
          <Button
            variant="outline"
            render={
              <a
                href={waHref(
                  student.phone,
                  pays.find((p) => p.status === "overdue" || p.status === "pending")
                    ? overdueMessage(
                        store.academy,
                        student,
                        pays.find((p) => p.status === "overdue" || p.status === "pending")!,
                      )
                    : `Oi, aqui é a ${store.academy.name}. Oss.`,
                )}
                target="_blank"
                rel="noreferrer"
              />
            }
          >
            WhatsApp
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              store.recordPayment(student.id, month, "pix");
              toast.success("Mensalidade baixada.");
            }}
          >
            Baixar mensalidade
          </Button>
          {pays.find((p) => p.status === "overdue" || p.status === "pending") && (
            <AsaasChargeButton
              payment={pays.find((p) => p.status === "overdue" || p.status === "pending")!}
              student={student}
            />
          )}
          <Button
            onClick={() => {
              store.promote(student.id, "Promoção pela ficha do aluno.");
              toast.success("Graduação registrada.");
            }}
          >
            Dar grau / promover
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Mini k="Treinos / 30d" v={String(att30)} />
        <Mini k="Treinos / 90d" v={String(att90)} />
        <Mini
          k="Tempo no grau"
          v={`${monthsBetween(student.lastPromotionDate)} meses`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ficha</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row k="WhatsApp" v={student.phone} />
            <Row k="E-mail" v={student.email} />
            <Row k="CPF" v={student.cpf ? formatCpf(student.cpf) : "—"} />
            {student.guardianName && <Row k="Responsável" v={student.guardianName} />}
            <Row k="Mensalidade" v={student.monthlyFee ? brl(student.monthlyFee) : "Isento"} />
            <Row k="Último treino" v={last ? formatDay(last.date) : "—"} />
            <Row k="Status" v={student.status} />
            {student.notes && (
              <p className="rounded-lg bg-muted/50 p-3 text-muted-foreground">
                {student.notes}
              </p>
            )}
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  store.updateStudent(student.id, {
                    status: student.status === "inactive" ? "active" : "inactive",
                  });
                  toast.message(
                    student.status === "inactive" ? "Reativado." : "Marcado como inativo.",
                  );
                }}
              >
                {student.status === "inactive" ? "Reativar" : "Inativar"}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (
                    !window.confirm(
                      `Apagar a ficha de ${student.name}? Nome, WhatsApp, CPF e presença desta pessoa saem da casa. Isso atende o pedido de exclusão (LGPD).`,
                    )
                  ) {
                    return;
                  }
                  store.removeStudent(student.id);
                  toast.success("Ficha apagada.");
                  router.push("/academia/alunos");
                }}
              >
                Apagar ficha
              </Button>
              {student.status === "trial" && (
                <Button
                  size="sm"
                  onClick={() => {
                    store.updateStudent(student.id, { status: "active" });
                    toast.success("Convertido em mensalista.");
                  }}
                >
                  Converter experimental
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {pays.length === 0 && (
              <p className="text-muted-foreground">Nenhum lançamento.</p>
            )}
            {pays.map((p) => (
              <div key={p.id} className="flex justify-between">
                <span>{p.month}</span>
                <span>
                  {brl(p.amount)} ·{" "}
                  {p.status === "paid"
                    ? "pago"
                    : p.status === "overdue"
                      ? "atraso"
                      : p.status === "waived"
                        ? "isento"
                        : "aberto"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de faixa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {history.length === 0 && (
            <p className="text-sm text-muted-foreground">Sem registros ainda.</p>
          )}
          {history.map((g) => (
            <div key={g.id} className="border-l-2 border-primary/40 pl-3 text-sm">
              <p className="font-medium">
                {beltLabel(g.fromBelt, 0)} → {beltLabel(g.toBelt, g.stripes)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(g.date)} · {g.notes}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Avaliacao studentId={student.id} />
      <Compras studentId={student.id} />
    </div>
  );
}

function Avaliacao({ studentId }: { studentId: string }) {
  const store = useStore();
  const [notes, setNotes] = useState("");
  const [promo, setPromo] = useState(false);
  const rows = (store.evaluations ?? []).filter((e) => e.studentId === studentId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avaliações no tatame</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!notes.trim()) return;
            store.addEvaluation({
              studentId,
              date: isoDate(0),
              instructorName:
                store.users.find((u) => u.id === store.session?.userId)?.name ??
                "Professor",
              notes: notes.trim(),
              recommendPromotion: promo,
            });
            setNotes("");
            setPromo(false);
            toast.success("Avaliação lançada.");
          }}
        >
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Guarda, passagem, atitude, o que falta para o próximo grau…"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={promo}
              onChange={(e) => setPromo(e.target.checked)}
            />
            Recomendar promoção
          </label>
          <Button type="submit">Salvar avaliação</Button>
        </form>
        {rows.map((e) => (
          <div key={e.id} className="border-l-2 border-primary/40 pl-3 text-sm">
            <p className="font-medium">
              {e.instructorName}
              {e.recommendPromotion ? " · indicar graduação" : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              {e.date} · {e.notes}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function Compras({ studentId }: { studentId: string }) {
  const store = useStore();
  const rows = (store.sales ?? []).filter((s) => s.studentId === studentId);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Compras na loja</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {rows.length === 0 && (
          <p className="text-muted-foreground">Nada vendido neste aluno.</p>
        )}
        {rows.map((s) => (
          <div key={s.id} className="flex justify-between">
            <span>
              {s.itemName} · {s.quantity} un.
            </span>
            <span>{brl(s.amount)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function Mini({ k, v }: { k: string; v: string }) {
  return (
    <div className="border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{k}</p>
      <p className="mt-1 font-display text-2xl">{v}</p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right">{v}</span>
    </div>
  );
}

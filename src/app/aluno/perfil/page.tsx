"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BeltBadge, PersonAvatar } from "@/components/belt-badge";
import { Button } from "@/components/ui/button";
import { brl, currentMonth, formatDate } from "@/lib/format";
import { currentStudent, useStore } from "@/lib/store";

export default function PerfilAluno() {
  const store = useStore();
  const router = useRouter();
  const student = currentStudent(store);
  const month = currentMonth();
  const pay = student
    ? store.payments.find((p) => p.studentId === student.id && p.month === month)
    : undefined;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Perfil</h1>
      {student && (
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <PersonAvatar name={student.name} hue={student.avatarHue} size="lg" />
          <div>
            <p className="font-medium">{student.name}</p>
            <BeltBadge belt={student.belt} stripes={student.stripes} compact />
            <p className="mt-1 text-xs text-muted-foreground">
              Na casa desde {formatDate(student.joinDate)}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-4 text-sm">
        <p className="text-muted-foreground">Mensalidade deste mês</p>
        <p className="mt-1 font-display text-2xl">
          {student?.monthlyFee ? brl(student.monthlyFee) : "Isento"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Status:{" "}
          {pay?.status === "paid"
            ? "pago"
            : pay?.status === "overdue"
              ? "em atraso"
              : pay?.status === "waived"
                ? "isento"
                : "em aberto"}
        </p>
        {pay?.status !== "paid" && pay?.status !== "waived" && (
          <p className="mt-2 text-xs text-destructive">
            Pague no Pix abaixo e avise a secretaria.
          </p>
        )}
        <div className="mt-4 rounded-xl bg-background p-3">
          <p className="text-xs text-muted-foreground">Pix da academia</p>
          <p className="mt-1 font-mono text-sm">{store.academy.pixKey}</p>
          <p className="text-xs text-muted-foreground">{store.academy.pixName}</p>
          <Button
            className="mt-2"
            size="sm"
            variant="outline"
            onClick={async () => {
              await navigator.clipboard.writeText(store.academy.pixKey);
              toast.success("Chave Pix copiada.");
            }}
          >
            Copiar Pix
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 text-sm">
        <p className="font-medium">{store.academy.name}</p>
        <p className="text-muted-foreground">
          {store.academy.address}
          <br />
          {store.academy.phone} · {store.academy.instagram}
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        Adicione este app à tela inicial do celular: no Safari, Compartilhar →
        Adicionar à Tela de Início. No Chrome, Instalar aplicativo.
      </p>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          store.logout();
          router.push("/");
        }}
      >
        Sair
      </Button>
    </div>
  );
}

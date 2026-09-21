"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { chargeQueueToday } from "@/lib/charge-reminder";
import { useStore } from "@/lib/store";
import { housePixMessage, waHref } from "@/lib/whatsapp";

export function ChargeWhatsAppQueue() {
  const store = useStore();
  const queue = useMemo(
    () => chargeQueueToday(store.payments, store.students),
    [store.payments, store.students],
  );

  if (queue.length === 0) {
    const open = store.payments.filter(
      (payment) => payment.status === "overdue" || payment.status === "pending",
    ).length;
    if (open === 0) return null;
    return (
      <p className="text-xs text-muted-foreground">
        Já cobrados no Zap hoje. A lista volta amanhã para quem ainda estiver em aberto.
      </p>
    );
  }

  const current = queue[0];
  const student = store.students.find((item) => item.id === current.studentId);
  const payment = store.payments.find((item) => item.id === current.paymentId);
  const href =
    student && payment
      ? waHref(student.phone, housePixMessage(store.academy, student, payment))
      : "";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        disabled={!href}
        render={<a href={href || "#"} target="_blank" rel="noreferrer" />}
        onClick={() => store.markChargeNotified(current.paymentId)}
      >
        Zap o próximo (1/{queue.length})
      </Button>
      <Button
        variant="ghost"
        onClick={() => {
          store.markChargeNotified(current.paymentId);
          toast.message(`${current.name} sai da fila de hoje.`);
        }}
      >
        Já cobrei
      </Button>
      <Button
        variant="ghost"
        onClick={async () => {
          const block = queue.map((row) => row.name).join("\n");
          await navigator.clipboard.writeText(
            `Cobrar no WhatsApp hoje (${queue.length}):\n${block}\nPix: ${store.academy.pixKey}`,
          );
          toast.success("Lista copiada. Abre um por um no botão ao lado.");
        }}
      >
        Copiar lista
      </Button>
    </div>
  );
}

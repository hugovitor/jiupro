"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { overdueMessage, waHref } from "@/lib/whatsapp";
import { useStore } from "@/lib/store";

export function ChargeWhatsAppQueue() {
  const store = useStore();
  const [index, setIndex] = useState(0);
  const queue = useMemo(() => {
    return store.payments
      .filter((p) => p.status === "overdue" || p.status === "pending")
      .map((p) => {
        const student = store.students.find((s) => s.id === p.studentId);
        if (!student?.phone.trim()) return null;
        return {
          id: p.id,
          href: waHref(student.phone, overdueMessage(store.academy, student, p)),
          name: student.name,
        };
      })
      .filter((row): row is { id: string; href: string; name: string } => Boolean(row));
  }, [store.academy, store.payments, store.students]);

  if (queue.length === 0) return null;

  const current = queue[Math.min(index, queue.length - 1)];

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        render={<a href={current.href} target="_blank" rel="noreferrer" />}
        onClick={() => {
          setIndex((n) => Math.min(n + 1, queue.length - 1));
        }}
      >
        Zap o próximo ({Math.min(index + 1, queue.length)}/{queue.length})
      </Button>
      <Button
        variant="ghost"
        onClick={async () => {
          const block = queue
            .map((row) => row.name)
            .join("\n");
          await navigator.clipboard.writeText(
            `Cobrar no WhatsApp (${queue.length}):\n${block}`,
          );
          toast.success("Lista copiada. Abre um por um no botão ao lado.");
        }}
      >
        Copiar lista
      </Button>
    </div>
  );
}
